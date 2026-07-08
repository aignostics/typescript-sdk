# InputArtifactCreationRequest

Input artifact containing the slide image and associated metadata.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**name** | **string** | Type of artifact. For Atlas H&amp;E-TME, use \&quot;input_slide\&quot; | [default to undefined]
**download_url** | **string** | [Signed URL](https://cloud.google.com/cdn/docs/using-signed-urls) to the input artifact file. The URL should be valid for at least 6 days from the payload submission time. | [default to undefined]
**metadata** | **{ [key: string]: any; }** | The metadata of the artifact, required by the application version. The JSON schema of the metadata can be requested by &#x60;/v1/versions/{application_version_id}&#x60;. The schema is located in &#x60;input_artifacts.[].metadata_schema&#x60; | [default to undefined]

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
