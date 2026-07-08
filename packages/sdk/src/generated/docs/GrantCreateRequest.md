# GrantCreateRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**resource_type** | [**ResourceType**](ResourceType.md) |  | [default to undefined]
**resource_id** | **string** |  | [default to undefined]
**subject_type** | [**SubjectType**](SubjectType.md) |  | [default to undefined]
**subject_id** | **string** |  | [optional] [default to undefined]
**subject_email** | **string** |  | [optional] [default to undefined]
**relation** | [**GrantRelation**](GrantRelation.md) |  | [default to undefined]

## Example

```typescript
import { GrantCreateRequest } from './api';

const instance: GrantCreateRequest = {
    resource_type,
    resource_id,
    subject_type,
    subject_id,
    subject_email,
    relation,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
