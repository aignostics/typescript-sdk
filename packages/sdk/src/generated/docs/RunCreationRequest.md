# RunCreationRequest

Request schema for `Initiate Run` endpoint. It describes which application version is chosen, and which user data should be processed.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**application_id** | **string** | Unique ID for the application to use for processing | [default to undefined]
**version_number** | **string** |  | [optional] [default to undefined]
**custom_metadata** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**scheduling** | [**SchedulingRequest**](SchedulingRequest.md) |  | [optional] [default to undefined]
**callback_context** | **{ [key: string]: any; }** |  | [optional] [default to undefined]
**items** | [**Array&lt;ItemCreationRequest&gt;**](ItemCreationRequest.md) | List of items (slides) to process. Each item represents a whole slide image (WSI) with its associated metadata and artifacts | [default to undefined]

## Example

```typescript
import { RunCreationRequest } from './api';

const instance: RunCreationRequest = {
    application_id,
    version_number,
    custom_metadata,
    scheduling,
    callback_context,
    items,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
