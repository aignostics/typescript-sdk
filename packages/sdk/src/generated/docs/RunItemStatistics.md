# RunItemStatistics


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**item_count** | **number** | Total number of the items in the run | [default to undefined]
**item_pending_count** | **number** | The number of items in &#x60;PENDING&#x60; state | [default to undefined]
**item_processing_count** | **number** | The number of items in &#x60;PROCESSING&#x60; state | [default to undefined]
**item_user_error_count** | **number** | The number of items in &#x60;TERMINATED&#x60; state, and the item termination reason is &#x60;USER_ERROR&#x60; | [default to undefined]
**item_system_error_count** | **number** | The number of items in &#x60;TERMINATED&#x60; state, and the item termination reason is &#x60;SYSTEM_ERROR&#x60; | [default to undefined]
**item_skipped_count** | **number** | The number of items in &#x60;TERMINATED&#x60; state, and the item termination reason is &#x60;SKIPPED&#x60; | [default to undefined]
**item_succeeded_count** | **number** | The number of items in &#x60;TERMINATED&#x60; state, and the item termination reason is &#x60;SUCCEEDED&#x60; | [default to undefined]

## Example

```typescript
import { RunItemStatistics } from './api';

const instance: RunItemStatistics = {
    item_count,
    item_pending_count,
    item_processing_count,
    item_user_error_count,
    item_system_error_count,
    item_skipped_count,
    item_succeeded_count,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
