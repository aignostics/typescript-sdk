# ApplicationReadResponse

Response schema for `List available applications` and `Read Application by Id` endpoints

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**application_id** | **string** | Application ID | [default to undefined]
**name** | **string** | Application display name | [default to undefined]
**regulatory_classes** | **Array&lt;string&gt;** | Regulatory classes, to which the applications comply with. Possible values include: RUO, IVDR, FDA. | [default to undefined]
**description** | **string** | Describing what the application can do  | [default to undefined]
**versions** | [**Array&lt;ApplicationVersion&gt;**](ApplicationVersion.md) | All version numbers available to the user | [default to undefined]

## Example

```typescript
import { ApplicationReadResponse } from './api';

const instance: ApplicationReadResponse = {
    application_id,
    name,
    regulatory_classes,
    description,
    versions,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
