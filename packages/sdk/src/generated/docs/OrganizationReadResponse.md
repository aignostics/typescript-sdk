# OrganizationReadResponse

Part of response schema for Organization object in `Get current user` endpoint. This model corresponds to the response schema returned from Auth0 GET /v2/organizations/{id} endpoint, flattens out the metadata out and doesn\'t return branding or token_quota objects. For details, see: https://auth0.com/docs/api/management/v2/organizations/get-organizations-by-id  #### Configuration for integrating with Aignostics Platform services.  The Aignostics Platform API requires signed URLs for input artifacts (slide images). To simplify this process, Aignostics provides a dedicated storage bucket. The HMAC credentials below grant read and write access to this bucket, allowing you to upload files and generate the signed URLs needed for API calls.  Additionally, logging and error reporting tokens enable Aignostics to provide better support and monitor system performance for your integration.

## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** | Unique organization identifier | [default to undefined]
**name** | **string** |  | [optional] [default to undefined]
**display_name** | **string** |  | [optional] [default to undefined]
**aignostics_bucket_hmac_access_key_id** | **string** | HMAC access key ID for the Aignostics-provided storage bucket. Used to authenticate requests for uploading files and generating signed URLs | [default to undefined]
**aignostics_bucket_hmac_secret_access_key** | **string** | HMAC secret access key paired with the access key ID. Keep this credential secure. | [default to undefined]
**aignostics_bucket_name** | **string** | Name of the bucket provided by Aignostics for storing input artifacts (slide images) | [default to undefined]
**aignostics_bucket_protocol** | **string** | Protocol to use for bucket access. Defines the URL scheme for connecting to the storage service | [default to undefined]
**aignostics_logfire_token** | **string** | Authentication token for Logfire observability service. Enables sending application logs and performance metrics to Aignostics for monitoring and support | [default to undefined]
**aignostics_sentry_dsn** | **string** | Data Source Name (DSN) for Sentry error tracking service. Allows automatic reporting of errors and exceptions to Aignostics support team | [default to undefined]

## Example

```typescript
import { OrganizationReadResponse } from './api';

const instance: OrganizationReadResponse = {
    id,
    name,
    display_name,
    aignostics_bucket_hmac_access_key_id,
    aignostics_bucket_hmac_secret_access_key,
    aignostics_bucket_name,
    aignostics_bucket_protocol,
    aignostics_logfire_token,
    aignostics_sentry_dsn,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
