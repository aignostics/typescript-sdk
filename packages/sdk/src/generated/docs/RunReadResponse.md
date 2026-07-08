# RunReadResponse

Response schema for `Get run details` endpoint

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**run_id** | **string** | UUID of the application | [default to undefined]
**application_id** | **string** | Application id | [default to undefined]
**version_number** | **string** | Application version number | [default to undefined]
**state** | [**RunState**](RunState.md) | When the run request is received by the Platform, the &#x60;state&#x60; of it is set to &#x60;PENDING&#x60;. The state changes to &#x60;PROCESSING&#x60; when at least one item is being processed. After &#x60;PROCESSING&#x60;, the state of the run can switch back to &#x60;PENDING&#x60; if there are no processing items, or to &#x60;TERMINATED&#x60; when the run finished processing. | [default to undefined]
**output** | [**RunOutput**](RunOutput.md) | The status of the output of the run. When 0 items are successfully processed the output is &#x60;NONE&#x60;, after one item is successfully processed, the value is set to &#x60;PARTIAL&#x60;. When all items of the run are successfully processed, the output is set to &#x60;FULL&#x60;. | [default to undefined]
**termination_reason** | [**RunTerminationReason**](RunTerminationReason.md) |  | [default to undefined]
**error_code** | **string** |  | [default to undefined]
**error_message** | **string** |  | [default to undefined]
**statistics** | [**RunItemStatistics**](RunItemStatistics.md) | Aggregated statistics of the run execution | [default to undefined]
**custom_metadata** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**custom_metadata_checksum** | **string** |  | [optional] [default to undefined]
**submitted_at** | **string** | Timestamp showing when the run was triggered | [default to undefined]
**submitted_by** | **string** | Id of the user who triggered the run | [default to undefined]
**organization_id** | **string** |  | [optional] [default to undefined]
**terminated_at** | **string** |  | [optional] [default to undefined]
**num_preceding_items_org** | **number** |  | [optional] [default to undefined]
**num_preceding_items_platform** | **number** |  | [optional] [default to undefined]
**scheduling** | [**SchedulingResponse**](SchedulingResponse.md) |  | [optional] [default to undefined]

## Example

```typescript
import { RunReadResponse } from './api';

const instance: RunReadResponse = {
    run_id,
    application_id,
    version_number,
    state,
    output,
    termination_reason,
    error_code,
    error_message,
    statistics,
    custom_metadata,
    custom_metadata_checksum,
    submitted_at,
    submitted_by,
    organization_id,
    terminated_at,
    num_preceding_items_org,
    num_preceding_items_platform,
    scheduling,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
