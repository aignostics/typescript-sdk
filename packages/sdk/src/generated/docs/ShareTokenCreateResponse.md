# ShareTokenCreateResponse

Returned only on POST — includes the one-time share_token.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_token_id** | **string** |  | [default to undefined]
**share_token** | **string** |  | [default to undefined]
**created_at** | **string** |  | [default to undefined]
**expires_at** | **string** |  | [default to undefined]
**revoked** | **boolean** |  | [default to undefined]

## Example

```typescript
import { ShareTokenCreateResponse } from './api';

const instance: ShareTokenCreateResponse = {
    share_token_id,
    share_token,
    created_at,
    expires_at,
    revoked,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
