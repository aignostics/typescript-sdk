# GrantReadResponse


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**grant_id** | **string** |  | [default to undefined]
**resource_type** | [**ResourceType**](ResourceType.md) |  | [default to undefined]
**resource_id** | **string** |  | [default to undefined]
**subject_type** | [**SubjectType**](SubjectType.md) |  | [default to undefined]
**subject_id** | **string** |  | [default to undefined]
**relation** | [**GrantRelation**](GrantRelation.md) |  | [default to undefined]
**created_by** | **string** |  | [default to undefined]
**created_at** | **string** |  | [default to undefined]
**revoked** | **boolean** |  | [default to undefined]

## Example

```typescript
import { GrantReadResponse } from './api';

const instance: GrantReadResponse = {
    grant_id,
    resource_type,
    resource_id,
    subject_type,
    subject_id,
    relation,
    created_by,
    created_at,
    revoked,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
