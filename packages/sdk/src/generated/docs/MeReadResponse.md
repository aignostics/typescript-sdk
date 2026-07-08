# MeReadResponse

Response schema for `Get current user` endpoint

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**user** | [**UserReadResponse**](UserReadResponse.md) |  | [default to undefined]
**organization** | [**OrganizationReadResponse**](OrganizationReadResponse.md) |  | [default to undefined]

## Example

```typescript
import { MeReadResponse } from './api';

const instance: MeReadResponse = {
    user,
    organization,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
