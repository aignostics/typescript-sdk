# ApplicationReadShortResponse

Response schema for `List available applications` and `Read Application by Id` endpoints

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**application_id** | **string** | Application ID | [default to undefined]
**name** | **string** | Application display name | [default to undefined]
**regulatory_classes** | **Array&lt;string&gt;** | Regulatory classes, to which the applications comply with. Possible values include: RUO, IVDR, FDA. | [default to undefined]
**description** | **string** | Describing what the application can do  | [default to undefined]
**latest_version** | [**ApplicationVersion**](ApplicationVersion.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ApplicationReadShortResponse } from './api';

const instance: ApplicationReadShortResponse = {
    application_id,
    name,
    regulatory_classes,
    description,
    latest_version,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
