# ShareTokenReadResponse

Returned on GET endpoints — omits share_token.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**share_token_id** | **string** |  | [default to undefined]
**created_at** | **string** |  | [default to undefined]
**expires_at** | **string** |  | [default to undefined]
**revoked** | **boolean** |  | [default to undefined]

## Example

```typescript
import { ShareTokenReadResponse } from './api';

const instance: ShareTokenReadResponse = {
    share_token_id,
    created_at,
    expires_at,
    revoked,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
