# MePolicyResponse

One entitlement policy of the caller, with its value, subject and usage.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**policy_type_id** | **string** |  | [default to undefined]
**description** | **string** |  | [default to undefined]
**value** | [**Value**](Value.md) |  | [default to undefined]
**subject** | **string** |  | [default to undefined]
**application_id** | **string** |  | [optional] [default to undefined]
**used** | **number** |  | [optional] [default to undefined]
**remaining** | **number** |  | [optional] [default to undefined]

## Example

```typescript
import { MePolicyResponse } from './api';

const instance: MePolicyResponse = {
    policy_type_id,
    description,
    value,
    subject,
    application_id,
    used,
    remaining,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
