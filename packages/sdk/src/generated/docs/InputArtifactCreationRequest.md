# InputArtifactCreationRequest

Input artifact containing the slide image and associated metadata.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Name of the input artifact, as declared by the application version. The valid names for a version are the &#x60;input_artifacts[].name&#x60; values returned by &#x60;GET /v1/applications/{application_id}/versions/{version}&#x60;. For Atlas H&amp;E-TME this is &#x60;\&quot;whole_slide_image\&quot;&#x60;. | [default to undefined]
**download_url** | **string** | [Signed URL](https://cloud.google.com/cdn/docs/using-signed-urls) to the input artifact file. The URL should be valid for at least 6 days from the payload submission time. | [default to undefined]
**metadata** | **{ [key: string]: any; }** | The metadata of the artifact, as required by the application version. The authoritative JSON schema is &#x60;input_artifacts[].metadata_schema&#x60; from &#x60;GET /v1/applications/{application_id}/versions/{version}&#x60;; it rejects unknown properties. The example shown is an Atlas H&amp;E-TME snapshot and may lag behind the version you are running — always validate against the schema endpoint. | [default to undefined]

## Example

```typescript
import { InputArtifactCreationRequest } from './api';

const instance: InputArtifactCreationRequest = {
    name,
    download_url,
    metadata,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
