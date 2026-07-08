# UserReadResponse

Part of response schema for User object in `Get current user` endpoint. This model corresponds to the response schema returned from Auth0 GET /v2/users/{id} endpoint. For details, see: https://auth0.com/docs/api/management/v2/users/get-users-by-id

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Unique user identifier | [default to undefined]
**email** | **string** |  | [optional] [default to undefined]
**email_verified** | **boolean** |  | [optional] [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**given_name** | **string** |  | [optional] [default to undefined]
**family_name** | **string** |  | [optional] [default to undefined]
**nickname** | **string** |  | [optional] [default to undefined]
**picture** | **string** |  | [optional] [default to undefined]
**updated_at** | **string** |  | [optional] [default to undefined]

## Example

```typescript
import { UserReadResponse } from './api';

const instance: UserReadResponse = {
    id,
    email,
    email_verified,
    name,
    given_name,
    family_name,
    nickname,
    picture,
    updated_at,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
