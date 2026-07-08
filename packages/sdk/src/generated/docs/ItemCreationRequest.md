# ItemCreationRequest

Individual item (slide) to be processed in a run.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**external_id** | **string** | Unique identifier for this item within the run. Used for referencing items. Must be unique across all items in the same run | [default to undefined]
**custom_metadata** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**input_artifacts** | [**Array&lt;InputArtifactCreationRequest&gt;**](InputArtifactCreationRequest.md) | List of input artifacts for this item. For Atlas H&amp;E-TME, typically contains one artifact (the slide image) | [default to undefined]

## Example

```typescript
import { ItemCreationRequest } from './api';

const instance: ItemCreationRequest = {
    external_id,
    custom_metadata,
    input_artifacts,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
