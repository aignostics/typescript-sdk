# InputArtifactResultReadResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**input_artifact_id** | **string** | The Id of the artifact. Used internally | [default to undefined]
**name** | **string** | Name of the input from the schema from the &#x60;/v1/versions/{version_id}&#x60; endpoint. | [default to undefined]
**metadata** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**download_url** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { InputArtifactResultReadResponse } from './api';

const instance: InputArtifactResultReadResponse = {
    input_artifact_id,
    name,
    metadata,
    download_url,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
