# OutputArtifactResultReadResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**output_artifact_id** | **string** | The Id of the artifact. Used internally | [default to undefined]
**name** | **string** |  Name of the output from the output schema from the &#x60;/v1/versions/{version_id}&#x60; endpoint.      | [default to undefined]
**metadata** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**state** | [**ArtifactState**](ArtifactState.md) | The current state of the artifact (PENDING, PROCESSING, TERMINATED) | [default to undefined]
**termination_reason** | [**ArtifactTerminationReason**](ArtifactTerminationReason.md) |  | [optional] [default to undefined]
**output** | [**ArtifactOutput**](ArtifactOutput.md) | The output status of the artifact (NONE, FULL) | [default to undefined]
**error_code** | **string** |  | [optional] [default to undefined]
**error_message** | **string** |  | [optional] [default to undefined]
**download_url** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { OutputArtifactResultReadResponse } from './api';

const instance: OutputArtifactResultReadResponse = {
    output_artifact_id,
    name,
    metadata,
    state,
    termination_reason,
    output,
    error_code,
    error_message,
    download_url,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
