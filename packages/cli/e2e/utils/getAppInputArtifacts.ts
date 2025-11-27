import { VersionReadResponse } from '@aignostics/sdk';
import { executeCLI } from './command.js';

interface JsonSchema {
  $ref?: string;
  anyOf?: JsonSchema[];
  allOf?: JsonSchema[];
  type?: string;
  const?: unknown;
  enum?: unknown[];
  format?: string;
  example?: unknown;
  default?: unknown;
  minimum?: number;
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  $defs?: Record<string, JsonSchema>;
}

interface SchemaDefinitions {
  [key: string]: JsonSchema;
}

/**
 * Generate a value based on JSON Schema property definition
 */
const generateValueFromProperty = (propName: string, propSchema: JsonSchema): unknown => {
  // Handle $ref references
  if (propSchema.$ref) {
    return { $ref: propSchema.$ref }; // Will be resolved later
  }

  // Handle anyOf - pick the first non-null option
  if (propSchema.anyOf) {
    const nonNullOption = propSchema.anyOf.find(option => option.type !== 'null' && option.$ref);
    if (nonNullOption) {
      return generateValueFromProperty(propName, nonNullOption);
    }
    // If no $ref, pick first non-null option
    const firstValidOption = propSchema.anyOf.find(option => option.type !== 'null');
    if (firstValidOption) {
      return generateValueFromProperty(propName, firstValidOption);
    }
  }

  // Handle allOf (merge schemas)
  if (propSchema.allOf) {
    const merged: Record<string, unknown> = {};
    propSchema.allOf.forEach(schema => {
      if (schema.$ref) {
        merged.$ref = schema.$ref;
      } else if (schema.type === 'object' && schema.properties) {
        Object.entries(schema.properties).forEach(([key, val]) => {
          merged[key] = generateValueFromProperty(key, val);
        });
      }
    });
    return merged;
  }

  const type = propSchema.type;

  switch (type) {
    case 'string':
      // Use const if available (fixed value)
      if (propSchema.const !== undefined) {
        return propSchema.const;
      }
      // Use enum if available
      if (propSchema.enum && propSchema.enum.length > 0) {
        return propSchema.enum[0];
      }
      // Use format hints
      if (propSchema.format === 'uri' || propName.includes('url')) {
        return 'https://example.com/sample-file.tiff';
      }
      if (propName.includes('checksum') || propName === 'checksum_base64_crc32c') {
        return '64RKKA==';
      }
      // Use examples or defaults
      if (propSchema.example !== undefined) return propSchema.example;
      if (propSchema.default !== undefined) return propSchema.default;
      return 'sample_value';

    case 'integer':
    case 'number':
      // Use examples or defaults
      if (propSchema.example !== undefined) return propSchema.example;
      if (propSchema.default !== undefined) return propSchema.default;
      // Use minimum if provided
      if (propSchema.minimum !== undefined) return propSchema.minimum;
      // Generate sensible defaults based on property name
      if (propName.includes('width') || propName === 'width_px') return 136223;
      if (propName.includes('height') || propName === 'height_px') return 87761;
      if (propName.includes('resolution') || propName === 'resolution_mpp') return 0.2628238;
      return type === 'integer' ? 100000 : 0.5;

    case 'boolean':
      if (propSchema.default !== undefined) return propSchema.default;
      return true;

    case 'array':
      if (propSchema.items) {
        return [generateValueFromProperty(propName, propSchema.items)];
      }
      return [];

    case 'object': {
      const obj: Record<string, unknown> = {};
      if (propSchema.properties) {
        Object.entries(propSchema.properties).forEach(([key, schema]) => {
          obj[key] = generateValueFromProperty(key, schema);
        });
      }
      return obj;
    }

    default:
      return null;
  }
};

/**
 * Resolve $ref references in generated data
 */
const resolveRefs = (data: unknown, defs: SchemaDefinitions): unknown => {
  if (data === null || data === undefined) return data;

  if (typeof data !== 'object') return data;

  // Handle $ref
  if (typeof data === 'object' && data !== null && '$ref' in data) {
    const refValue = (data as { $ref: string }).$ref;
    const refPath = refValue.replace('#/$defs/', '').replace('#/definitions/', '');
    if (defs[refPath]) {
      return generateMetadataFromSchema(defs[refPath], defs);
    }
    console.warn(`Warning: Could not resolve $ref: ${refValue}`);
    return {};
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => resolveRefs(item, defs));
  }

  // Handle objects
  const resolved: Record<string, unknown> = {};
  Object.entries(data).forEach(([key, value]) => {
    resolved[key] = resolveRefs(value, defs);
  });
  return resolved;
};

/**
 * Generate metadata object from JSON Schema
 */
const generateMetadataFromSchema = (
  schema: JsonSchema,
  defs?: SchemaDefinitions
): Record<string, unknown> => {
  if (!schema || typeof schema !== 'object') return {};

  // Handle $ref at root level
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/$defs/', '').replace('#/definitions/', '');
    if (defs && defs[refPath]) {
      return generateMetadataFromSchema(defs[refPath], defs);
    }
  }

  const metadata: Record<string, unknown> = {};

  // Process properties
  if (schema.properties) {
    Object.entries(schema.properties).forEach(([propName, propSchema]) => {
      // Include all required fields and common optional fields
      const isRequired = schema.required?.includes(propName);
      if (isRequired) {
        metadata[propName] = generateValueFromProperty(propName, propSchema);
      }
    });
  }

  // Resolve any $ref in the generated metadata
  return defs ? (resolveRefs(metadata, defs) as Record<string, unknown>) : metadata;
};

export const getAppInputArtifacts = async (applicationId: string, version: string) => {
  const { stdout } = await executeCLI(['get-application-version-details', applicationId, version]);

  // Match the JSON object after the prefix
  const detailsMatch = String(stdout).match(
    new RegExp(`Application version details for ${applicationId} v${version}: (\\{[\\s\\S]*\\})`)
  );

  if (!detailsMatch) {
    throw new Error('Failed to retrieve application version details.');
  }

  const versionDetails = JSON.parse(detailsMatch[1] || '') as VersionReadResponse;

  if (!versionDetails.input_artifacts || versionDetails.input_artifacts.length === 0) {
    throw new Error('No input artifacts found in application version details.');
  }

  return versionDetails.input_artifacts;
};

/**
 * Generate complete input artifacts for testing based on the metadata schema
 */
export const generateInputArtifactsForTest = async (
  applicationId: string,
  version: string,
  itemCount = 2
) => {
  const inputArtifacts = await getAppInputArtifacts(applicationId, version);
  const firstArtifact = inputArtifacts[0];

  if (!firstArtifact) {
    throw new Error('No input artifacts found for this application version.');
  }

  const metadataSchema = firstArtifact.metadata_schema as JsonSchema | undefined;

  if (!metadataSchema) {
    throw new Error('No metadata schema found in input artifacts.');
  }

  // Generate metadata from schema
  const sampleMetadata = generateMetadataFromSchema(metadataSchema, metadataSchema.$defs);

  // Generate test items
  const items = [];
  for (let i = 1; i <= itemCount; i++) {
    items.push({
      external_id: `slide_${i}`,
      input_artifacts: [
        {
          name: firstArtifact.name || 'whole_slide_image',
          download_url: `https://example.com/slides/slide_${i}.tiff`,
          metadata: sampleMetadata,
        },
      ],
    });
  }

  return items;
};
