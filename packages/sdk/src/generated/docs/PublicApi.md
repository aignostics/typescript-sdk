# PublicApi

All URIs are relative to */api*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**applicationVersionDetailsV1ApplicationsApplicationIdVersionsVersionGet**](#applicationversiondetailsv1applicationsapplicationidversionsversionget) | **GET** /v1/applications/{application_id}/versions/{version} | Application Version Details|
|[**cancelRunV1RunsRunIdCancelPost**](#cancelrunv1runsrunidcancelpost) | **POST** /v1/runs/{run_id}/cancel | Cancel Run|
|[**createGrantV1AccessGrantsPost**](#creategrantv1accessgrantspost) | **POST** /v1/access/grants | Create Grant|
|[**createRunV1RunsPost**](#createrunv1runspost) | **POST** /v1/runs | Initiate Run|
|[**createShareTokenV1AccessShareTokensPost**](#createsharetokenv1accesssharetokenspost) | **POST** /v1/access/share-tokens | Create Share Token|
|[**deleteRunItemsV1RunsRunIdArtifactsDelete**](#deleterunitemsv1runsrunidartifactsdelete) | **DELETE** /v1/runs/{run_id}/artifacts | Delete Run Items|
|[**getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet**](#getartifacturlv1runsrunidartifactsartifactidfileget) | **GET** /v1/runs/{run_id}/artifacts/{artifact_id}/file | Get Artifact Url|
|[**getGrantV1AccessGrantsGrantIdGet**](#getgrantv1accessgrantsgrantidget) | **GET** /v1/access/grants/{grant_id} | Get Grant|
|[**getItemByRunV1RunsRunIdItemsExternalIdGet**](#getitembyrunv1runsruniditemsexternalidget) | **GET** /v1/runs/{run_id}/items/{external_id} | Get Item By Run|
|[**getMeV1MeGet**](#getmev1meget) | **GET** /v1/me | Get current user|
|[**getRunV1RunsRunIdGet**](#getrunv1runsrunidget) | **GET** /v1/runs/{run_id} | Get run details|
|[**getShareTokenV1AccessShareTokensShareTokenIdGet**](#getsharetokenv1accesssharetokenssharetokenidget) | **GET** /v1/access/share-tokens/{share_token_id} | Get Share Token|
|[**getVersionDocument**](#getversiondocument) | **GET** /v1/applications/{application_id}/versions/{version}/documents/{name} | Get version document metadata|
|[**getVersionDocumentContent**](#getversiondocumentcontent) | **GET** /v1/applications/{application_id}/versions/{version}/documents/{name}/content | Stream version document content (programmatic)|
|[**getVersionDocumentFile**](#getversiondocumentfile) | **GET** /v1/applications/{application_id}/versions/{version}/documents/{name}/file | Download version document (browser)|
|[**listApplicationsV1ApplicationsGet**](#listapplicationsv1applicationsget) | **GET** /v1/applications | List available applications|
|[**listGrantsV1AccessGrantsGet**](#listgrantsv1accessgrantsget) | **GET** /v1/access/grants | List Grants|
|[**listRunItemsV1RunsRunIdItemsGet**](#listrunitemsv1runsruniditemsget) | **GET** /v1/runs/{run_id}/items | List Run Items|
|[**listRunsV1RunsGet**](#listrunsv1runsget) | **GET** /v1/runs | List Runs|
|[**listShareTokensV1AccessShareTokensGet**](#listsharetokensv1accesssharetokensget) | **GET** /v1/access/share-tokens | List Share Tokens|
|[**listVersionDocuments**](#listversiondocuments) | **GET** /v1/applications/{application_id}/versions/{version}/documents | List version documents|
|[**putItemCustomMetadataByRunV1RunsRunIdItemsExternalIdCustomMetadataPut**](#putitemcustommetadatabyrunv1runsruniditemsexternalidcustommetadataput) | **PUT** /v1/runs/{run_id}/items/{external_id}/custom-metadata | Put Item Custom Metadata By Run|
|[**putRunCustomMetadataV1RunsRunIdCustomMetadataPut**](#putruncustommetadatav1runsrunidcustommetadataput) | **PUT** /v1/runs/{run_id}/custom-metadata | Put Run Custom Metadata|
|[**readApplicationByIdV1ApplicationsApplicationIdGet**](#readapplicationbyidv1applicationsapplicationidget) | **GET** /v1/applications/{application_id} | Read Application By Id|
|[**revokeGrantV1AccessGrantsGrantIdDelete**](#revokegrantv1accessgrantsgrantiddelete) | **DELETE** /v1/access/grants/{grant_id} | Revoke Grant|
|[**revokeShareTokenV1AccessShareTokensShareTokenIdDelete**](#revokesharetokenv1accesssharetokenssharetokeniddelete) | **DELETE** /v1/access/share-tokens/{share_token_id} | Revoke Share Token|

# **applicationVersionDetailsV1ApplicationsApplicationIdVersionsVersionGet**
> VersionReadResponse applicationVersionDetailsV1ApplicationsApplicationIdVersionsVersionGet()

Get the application version details.  Allows caller to retrieve information about application version based on provided application version ID.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)
let version: string; // (default to undefined)

const { status, data } = await apiInstance.applicationVersionDetailsV1ApplicationsApplicationIdVersionsVersionGet(
    applicationId,
    version
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|
| **version** | [**string**] |  | defaults to undefined|


### Return type

**VersionReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to see this version |  -  |
|**404** | Not Found - Application version with given ID is not available to you or does not exist |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **cancelRunV1RunsRunIdCancelPost**
> any cancelRunV1RunsRunIdCancelPost()

The run can be canceled by the user who created the run.  The execution can be canceled any time while the run is not in the terminated state. The pending items of a canceled run will not be processed and will not add to the cost.  When the run is canceled, the already completed items remain available for download.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /runs/` endpoint (default to undefined)

const { status, data } = await apiInstance.cancelRunV1RunsRunIdCancelPost(
    runId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|


### Return type

**any**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**202** | Successful Response |  -  |
|**404** | Run not found |  -  |
|**403** | Forbidden - You don\&#39;t have permission to cancel this run |  -  |
|**409** | Conflict - The Run is already cancelled |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createGrantV1AccessGrantsPost**
> GrantReadResponse createGrantV1AccessGrantsPost(grantCreateRequest)

Create a grant to share access to a resource with a subject (user or organization).

### Example

```typescript
import {
    PublicApi,
    Configuration,
    GrantCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let grantCreateRequest: GrantCreateRequest; //

const { status, data } = await apiInstance.createGrantV1AccessGrantsPost(
    grantCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **grantCreateRequest** | **GrantCreateRequest**|  | |


### Return type

**GrantReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to grant access to this resource |  -  |
|**404** | Resource not found |  -  |
|**422** | Unprocessable Entity - Only viewer grants can be created |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createRunV1RunsPost**
> RunCreationResponse createRunV1RunsPost(runCreationRequest)

This endpoint initiates a processing run for a selected application and version, and returns a `run_id` for tracking purposes.  Slide processing occurs asynchronously, allowing you to retrieve results for individual slides as soon as they complete processing. The system typically processes slides in batches. Below is an example of the required payload for initiating an Atlas H&E TME processing run.   ### Payload  The payload includes `application_id`, optional `version_number`, and `items` base fields.  `application_id` is the unique identifier for the application. `version_number` is the semantic version to use. If not provided, the latest available version will be used.  `items` includes the list of the items to process (slides, in case of HETA application). Every item has a set of standard fields defined by the API, plus the custom_metadata, specific to the chosen application.  Example payload structure with the comments: ``` {     application_id: \"he-tme\",     version_number: \"1.0.0-beta\",     items: [{         \"external_id\": \"slide_1\",         \"custom_metadata\": {\"project\": \"sample-study\"},         \"input_artifacts\": [{             \"name\": \"user_slide\",             \"download_url\": \"https://...\",             \"metadata\": {                 \"specimen\": {                   \"disease\": \"LUNG_CANCER\",                   \"tissue\": \"LUNG\"                 },                 \"staining_method\": \"H&E\",                 \"width_px\": 136223,                 \"height_px\": 87761,                 \"resolution_mpp\": 0.2628238,                 \"media-type\":\"image/tiff\",                 \"checksum_base64_crc32c\": \"64RKKA==\"             }         }]     }] } ```  | Parameter  | Description | | :---- | :---- | | `application_id` required | Unique ID for the application | | `version_number` optional | Semantic version of the application. If not provided, the latest available version will be used | | `items` required | List of submitted items i.e. whole slide images (WSIs) with parameters described below. | | `external_id` required | Unique WSI name or ID for easy reference to items, provided by the caller. The `external_id` should be unique across all items of the run.  | | `input_artifacts` required | List of provided artifacts for a WSI; at the moment Atlas H&E-TME receives only 1 artifact per slide (the slide itself), but for some other applications this can be a slide and a segmentation map  | | `name` required | Type of artifact; Atlas H&E-TME supports only `\"input_slide\"` | | `download_url` required | Signed URL to the input file in the S3 or GCS; Should be valid for at least 6 days | | `specimen: disease` required | Supported cancer types for Atlas H&E-TME (see full list in Atlas H&E-TME manual) | | `specimen: tissue` required | Supported tissue types for Atlas H&E-TME (see full list in Atlas H&E-TME manual) | | `staining_method` required | WSI stain bio-marker; Atlas H&E-TME supports only `\"H&E\"` | | `width_px` required | Integer value. Number of pixels of the WSI in the X dimension. | | `height_px` required | Integer value. Number of pixels of the WSI in the Y dimension. | | `resolution_mpp` required | Resolution of WSI in micrometers per pixel; check allowed range in Atlas H&E-TME manual | | `media-type` required | Supported media formats; available values are: image/tiff  (for .tiff or .tif WSI), application/dicom (for DICOM ), application/zip (for zipped DICOM), and application/octet-stream  (for .svs WSI) | | `checksum_base64_crc32c` required | Base64-encoded big-endian CRC32C checksum of the WSI image |    ### Response  The endpoint returns the run UUID. After that, the job is scheduled for the execution in the background.  To check the status of the run, call `GET v1/runs/{run_id}` endpoint with the returned run UUID.  ### Rejection  Apart from the authentication, authorization, and malformed input error, the request can be rejected when specific quota limit is exceeded. More details on quotas is described in the documentation

### Example

```typescript
import {
    PublicApi,
    Configuration,
    RunCreationRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runCreationRequest: RunCreationRequest; //

const { status, data } = await apiInstance.createRunV1RunsPost(
    runCreationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runCreationRequest** | **RunCreationRequest**|  | |


### Return type

**RunCreationResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Successful Response |  -  |
|**404** | Application version not found |  -  |
|**403** | Forbidden - You don\&#39;t have permission to create this run |  -  |
|**400** | Bad Request - Input validation failed |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **createShareTokenV1AccessShareTokensPost**
> ShareTokenCreateResponse createShareTokenV1AccessShareTokensPost(shareTokenCreateRequest)

Create a share token. The returned share_token value is shown only once and is never stored. Use POST /access/grants with subject_type=share_token to grant access to a resource.

### Example

```typescript
import {
    PublicApi,
    Configuration,
    ShareTokenCreateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let shareTokenCreateRequest: ShareTokenCreateRequest; //

const { status, data } = await apiInstance.createShareTokenV1AccessShareTokensPost(
    shareTokenCreateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shareTokenCreateRequest** | **ShareTokenCreateRequest**|  | |


### Return type

**ShareTokenCreateResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**201** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteRunItemsV1RunsRunIdArtifactsDelete**
> any deleteRunItemsV1RunsRunIdArtifactsDelete()

This endpoint allows the caller to explicitly delete artifacts generated by a run. It can only be invoked when the run has reached a final state, i.e. `PROCESSED`, `CANCELED_SYSTEM`, or `CANCELED_USER`. Note that by default, all artifacts are automatically deleted 30 days after the run finishes, regardless of whether the caller explicitly requests such deletion.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /runs/` endpoint (default to undefined)

const { status, data } = await apiInstance.deleteRunItemsV1RunsRunIdArtifactsDelete(
    runId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|


### Return type

**any**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Run artifacts deleted |  -  |
|**404** | Run not found |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet**
> any getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet()

Download the artifact file with the specified artifact_id, belonging to the specified run. The artifact_is is returned by the `GET /v1/runs/{run_id}/items` endpoint as part of the item results, and can also be retrieved via `GET /v1/runs/{run_id}/items/{external_id}`.  The endpoint may return a redirect response with a presigned URL to download the artifact file from the storage bucket. The presigned URL is valid for a limited time, so it should be used immediately after receiving the response.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /runs/` endpoint (default to undefined)
let artifactId: string; //The artifact id to download (default to undefined)
let shareToken: string; //Share token for accessing shared runs (optional) (default to undefined)

const { status, data } = await apiInstance.getArtifactUrlV1RunsRunIdArtifactsArtifactIdFileGet(
    runId,
    artifactId,
    shareToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|
| **artifactId** | [**string**] | The artifact id to download | defaults to undefined|
| **shareToken** | [**string**] | Share token for accessing shared runs | (optional) defaults to undefined|


### Return type

**any**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Not Found - Artifact not found for the specified run |  -  |
|**307** | Temporary Redirect - Redirect to the artifact file URL |  -  |
|**403** | Forbidden - You don\&#39;t have permission to download this artifact |  -  |
|**410** | Gone - Artifact has been deleted |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getGrantV1AccessGrantsGrantIdGet**
> GrantReadResponse getGrantV1AccessGrantsGrantIdGet()

Get a grant by its ID.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let grantId: string; //Grant ID (default to undefined)

const { status, data } = await apiInstance.getGrantV1AccessGrantsGrantIdGet(
    grantId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **grantId** | [**string**] | Grant ID | defaults to undefined|


### Return type

**GrantReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to view this grant |  -  |
|**404** | Grant not found |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getItemByRunV1RunsRunIdItemsExternalIdGet**
> ItemResultReadResponse getItemByRunV1RunsRunIdItemsExternalIdGet()

Retrieve details of a specific item (slide) by its external ID and the run ID.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //The run id, returned by `POST /runs/` endpoint (default to undefined)
let externalId: string; //The `external_id` that was defined for the item by the customer that triggered the run. (default to undefined)
let shareToken: string; //Share token for accessing shared runs (optional) (default to undefined)

const { status, data } = await apiInstance.getItemByRunV1RunsRunIdItemsExternalIdGet(
    runId,
    externalId,
    shareToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | The run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|
| **externalId** | [**string**] | The &#x60;external_id&#x60; that was defined for the item by the customer that triggered the run. | defaults to undefined|
| **shareToken** | [**string**] | Share token for accessing shared runs | (optional) defaults to undefined|


### Return type

**ItemResultReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Not Found - Item with given ID does not exist |  -  |
|**403** | Forbidden - You don\&#39;t have permission to see this item |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getMeV1MeGet**
> MeReadResponse getMeV1MeGet()

Retrieves your identity details, including name, email, and organization. This is useful for verifying that the request is being made under the correct user profile and organization context, as well as confirming that the expected environment variables are correctly set (in case you are using Python SDK)

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

const { status, data } = await apiInstance.getMeV1MeGet();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**MeReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getRunV1RunsRunIdGet**
> RunReadResponse getRunV1RunsRunIdGet()

This endpoint allows the caller to retrieve the current status of a run along with other relevant run details.  A run becomes available immediately after it is created through the `POST /v1/runs/` endpoint.   To download the output results, use `GET /v1/runs/{run_id}/` items to get outputs for all slides. Access to a run is restricted to the user who created it, or users with an active grant or valid share token.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /v1/runs/` endpoint (default to undefined)
let shareToken: string; //Share token for accessing shared runs (optional) (default to undefined)

const { status, data } = await apiInstance.getRunV1RunsRunIdGet(
    runId,
    shareToken
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Run id, returned by &#x60;POST /v1/runs/&#x60; endpoint | defaults to undefined|
| **shareToken** | [**string**] | Share token for accessing shared runs | (optional) defaults to undefined|


### Return type

**RunReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Run not found because it was deleted. |  -  |
|**403** | Forbidden - You don\&#39;t have permission to see this run |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getShareTokenV1AccessShareTokensShareTokenIdGet**
> ShareTokenReadResponse getShareTokenV1AccessShareTokensShareTokenIdGet()

Get a share token by its ID.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let shareTokenId: string; //Share token ID (default to undefined)

const { status, data } = await apiInstance.getShareTokenV1AccessShareTokensShareTokenIdGet(
    shareTokenId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shareTokenId** | [**string**] | Share token ID | defaults to undefined|


### Return type

**ShareTokenReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to view this share token |  -  |
|**404** | Share token not found |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVersionDocument**
> VersionDocumentResponse getVersionDocument()

Return metadata for a single public document attached to an application version.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)
let version: string; // (default to undefined)
let name: string; // (default to undefined)

const { status, data } = await apiInstance.getVersionDocument(
    applicationId,
    version,
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|
| **version** | [**string**] |  | defaults to undefined|
| **name** | [**string**] |  | defaults to undefined|


### Return type

**VersionDocumentResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Document not found, not public, or version not accessible |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVersionDocumentContent**
> getVersionDocumentContent()

307 redirect to a short-lived GCS signed URL for streaming document content.  Unlike ``/file``, no ``Content-Disposition`` override is set — GCS serves the object body with its stored ``Content-Type``. Intended for programmatic clients that follow redirects and consume the content directly. Response carries ``Cache-Control: no-store``.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)
let version: string; // (default to undefined)
let name: string; // (default to undefined)

const { status, data } = await apiInstance.getVersionDocumentContent(
    applicationId,
    version,
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|
| **version** | [**string**] |  | defaults to undefined|
| **name** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**307** | Temporary redirect to signed GCS URL; GCS serves the object with its stored Content-Type |  -  |
|**404** | Document not found, not public, or version not accessible |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getVersionDocumentFile**
> getVersionDocumentFile()

307 redirect to a short-lived GCS signed URL for downloading a document.  The signed URL includes ``response-content-disposition=attachment; filename=\"<name>\"`` so browsers prompt a save-as dialog rather than rendering inline. Response carries ``Cache-Control: no-store``.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)
let version: string; // (default to undefined)
let name: string; // (default to undefined)

const { status, data } = await apiInstance.getVersionDocumentFile(
    applicationId,
    version,
    name
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|
| **version** | [**string**] |  | defaults to undefined|
| **name** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**307** | Temporary redirect to signed GCS URL with Content-Disposition: attachment |  -  |
|**404** | Document not found, not public, or version not accessible |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listApplicationsV1ApplicationsGet**
> Array<ApplicationReadShortResponse> listApplicationsV1ApplicationsGet()

Returns the list of the applications, available to the caller.  The application is available if any of the versions of the application is assigned to the caller\'s organization. The response is paginated and sorted according to the provided parameters.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 50)
let sort: Array<string>; //Sort the results by one or more fields. Use `+` for ascending and `-` for descending order.  **Available fields:** - `application_id` - `name` - `description` - `regulatory_classes`  **Examples:** - `?sort=application_id` - Sort by application_id ascending - `?sort=-name` - Sort by name descending - `?sort=+description&sort=name` - Sort by description ascending, then name descending (optional) (default to undefined)

const { status, data } = await apiInstance.listApplicationsV1ApplicationsGet(
    page,
    pageSize,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 50|
| **sort** | **Array&lt;string&gt;** | Sort the results by one or more fields. Use &#x60;+&#x60; for ascending and &#x60;-&#x60; for descending order.  **Available fields:** - &#x60;application_id&#x60; - &#x60;name&#x60; - &#x60;description&#x60; - &#x60;regulatory_classes&#x60;  **Examples:** - &#x60;?sort&#x3D;application_id&#x60; - Sort by application_id ascending - &#x60;?sort&#x3D;-name&#x60; - Sort by name descending - &#x60;?sort&#x3D;+description&amp;sort&#x3D;name&#x60; - Sort by description ascending, then name descending | (optional) defaults to undefined|


### Return type

**Array<ApplicationReadShortResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | A list of applications available to the caller |  -  |
|**401** | Unauthorized - Invalid or missing authentication |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listGrantsV1AccessGrantsGet**
> Array<GrantReadResponse> listGrantsV1AccessGrantsGet()

List grants.  Org admins see all grants for all resources in their organization. Regular users see grants for all resources they submitted.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let resourceType: ResourceType; // (optional) (default to undefined)
let resourceId: string; // (optional) (default to undefined)
let subjectType: SubjectType; // (optional) (default to undefined)
let subjectId: string; // (optional) (default to undefined)
let relation: Array<GrantRelation>; //Filter grants by relation type. Can be specified multiple times. (optional) (default to undefined)
let revoked: boolean; // (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 50)
let sort: Array<string>; //Sort the results by one or more fields. Use `+` for ascending and `-` for descending order. (optional) (default to undefined)

const { status, data } = await apiInstance.listGrantsV1AccessGrantsGet(
    resourceType,
    resourceId,
    subjectType,
    subjectId,
    relation,
    revoked,
    page,
    pageSize,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **resourceType** | **ResourceType** |  | (optional) defaults to undefined|
| **resourceId** | [**string**] |  | (optional) defaults to undefined|
| **subjectType** | **SubjectType** |  | (optional) defaults to undefined|
| **subjectId** | [**string**] |  | (optional) defaults to undefined|
| **relation** | **Array&lt;GrantRelation&gt;** | Filter grants by relation type. Can be specified multiple times. | (optional) defaults to undefined|
| **revoked** | [**boolean**] |  | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 50|
| **sort** | **Array&lt;string&gt;** | Sort the results by one or more fields. Use &#x60;+&#x60; for ascending and &#x60;-&#x60; for descending order. | (optional) defaults to undefined|


### Return type

**Array<GrantReadResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listRunItemsV1RunsRunIdItemsGet**
> Array<ItemResultReadResponse> listRunItemsV1RunsRunIdItemsGet()

List items in a run with filtering, sorting, and pagination capabilities.  Returns paginated items within a specific run. Results can be filtered by `item_id`, `external_ids`, `custom_metadata`, `terminated_at`, and `termination_reason` using JSONPath expressions.  ## JSONPath Metadata Filtering Use PostgreSQL JSONPath expressions to filter items using their custom_metadata.  ### Examples: - **Field existence**: `$.case_id` - Results that have a case_id field defined - **Exact value match**: `$.priority ? (@ == \"high\")` - Results with high priority - **Numeric comparison**: `$.confidence_score ? (@ > 0.95)` - Results with high confidence - **Array operations**: `$.flags[*] ? (@ == \"reviewed\")` - Results flagged as reviewed - **Complex conditions**: `$.metrics ? (@.accuracy > 0.9 && @.recall > 0.8)` - Results meeting performance thresholds  ## Notes - JSONPath expressions are evaluated using PostgreSQL\'s `@?` operator - The `$.` prefix is automatically added to root-level field references if missing - String values in conditions must be enclosed in double quotes - Use `&&` for AND operations and `||` for OR operations

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /v1/runs/` endpoint (default to undefined)
let shareToken: string; //Share token for accessing shared runs (optional) (default to undefined)
let itemIdIn: Array<string>; //Filter for item ids (optional) (default to undefined)
let externalIdIn: Array<string>; //Filter for items by their external_id from the input payload (optional) (default to undefined)
let state: ItemState; //Filter items by their state (optional) (default to undefined)
let terminationReason: ItemTerminationReason; //Filter items by their termination reason. Only applies to TERMINATED items. (optional) (default to undefined)
let customMetadata: string; //JSONPath expression to filter items by their custom_metadata (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 50)
let sort: Array<string>; //Sort the items by one or more fields. Use `+` for ascending and `-` for descending order.                 **Available fields:** - `item_id` - `external_id` - `custom_metadata` - `terminated_at` - `termination_reason`  **Examples:** - `?sort=item_id` - Sort by id of the item (ascending) - `?sort=-external_id` - Sort by external ID (descending) - `?sort=custom_metadata&sort=-external_id` - Sort by metadata, then by external ID (descending) (optional) (default to undefined)

const { status, data } = await apiInstance.listRunItemsV1RunsRunIdItemsGet(
    runId,
    shareToken,
    itemIdIn,
    externalIdIn,
    state,
    terminationReason,
    customMetadata,
    page,
    pageSize,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Run id, returned by &#x60;POST /v1/runs/&#x60; endpoint | defaults to undefined|
| **shareToken** | [**string**] | Share token for accessing shared runs | (optional) defaults to undefined|
| **itemIdIn** | **Array&lt;string&gt;** | Filter for item ids | (optional) defaults to undefined|
| **externalIdIn** | **Array&lt;string&gt;** | Filter for items by their external_id from the input payload | (optional) defaults to undefined|
| **state** | **ItemState** | Filter items by their state | (optional) defaults to undefined|
| **terminationReason** | **ItemTerminationReason** | Filter items by their termination reason. Only applies to TERMINATED items. | (optional) defaults to undefined|
| **customMetadata** | [**string**] | JSONPath expression to filter items by their custom_metadata | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 50|
| **sort** | **Array&lt;string&gt;** | Sort the items by one or more fields. Use &#x60;+&#x60; for ascending and &#x60;-&#x60; for descending order.                 **Available fields:** - &#x60;item_id&#x60; - &#x60;external_id&#x60; - &#x60;custom_metadata&#x60; - &#x60;terminated_at&#x60; - &#x60;termination_reason&#x60;  **Examples:** - &#x60;?sort&#x3D;item_id&#x60; - Sort by id of the item (ascending) - &#x60;?sort&#x3D;-external_id&#x60; - Sort by external ID (descending) - &#x60;?sort&#x3D;custom_metadata&amp;sort&#x3D;-external_id&#x60; - Sort by metadata, then by external ID (descending) | (optional) defaults to undefined|


### Return type

**Array<ItemResultReadResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Run not found |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listRunsV1RunsGet**
> Array<RunReadResponse> listRunsV1RunsGet()

List runs with filtering, sorting, and pagination capabilities.  Returns paginated runs that were submitted by the user.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; //Optional application ID filter (optional) (default to undefined)
let applicationVersion: string; //Optional Version Name (optional) (default to undefined)
let externalId: string; //Optionally filter runs by items with this external ID (optional) (default to undefined)
let customMetadata: string; //Use PostgreSQL JSONPath expressions to filter runs by their custom_metadata. #### URL Encoding Required **Important**: JSONPath expressions contain special characters that must be URL-encoded when used in query parameters. Most HTTP clients handle this automatically, but when constructing URLs manually, please ensure proper encoding.  #### Examples (Clear Format): - **Field existence**: `$.study` - Runs that have a study field defined - **Exact value match**: `$.study ? (@ == \"high\")` - Runs with specific study value - **Numeric comparison**: `$.confidence_score ? (@ > 0.75)` - Runs with confidence score greater than 0.75 - **Array operations**: `$.tags[*] ? (@ == \"draft\")` - Runs with tags array containing \"draft\" - **Complex conditions**: `$.resources ? (@.gpu_count > 2 && @.memory_gb >= 16)` - Runs with high resource requirements  #### Examples (URL-Encoded Format): - **Field existence**: `%24.study` - **Exact value match**: `%24.study%20%3F%20(%40%20%3D%3D%20%22high%22)` - **Numeric comparison**: `%24.confidence_score%20%3F%20(%40%20%3E%200.75)` - **Array operations**: `%24.tags%5B*%5D%20%3F%20(%40%20%3D%3D%20%22draft%22)` - **Complex conditions**: `%24.resources%20%3F%20(%40.gpu_count%20%3E%202%20%26%26%20%40.memory_gb%20%3E%3D%2016)`  #### Notes - JSONPath expressions are evaluated using PostgreSQL\'s `@?` operator - The `$.` prefix is automatically added to root-level field references if missing - String values in conditions must be enclosed in double quotes - Use `&&` for AND operations and `||` for OR operations - Regular expressions use `like_regex` with standard regex syntax - **Please remember to URL-encode the entire JSONPath expression when making HTTP requests**               (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 50)
let submittedBy: string; //Filter runs by the user who submitted them. Use the special value `me` to return only runs submitted by the current user. (optional) (default to undefined)
let organizationId: string; //Filter runs by the organization of the submitter. Use the special value `my_org` to filter by the current user\'s organization. (optional) (default to undefined)
let forOrganization: string; //Filter runs by organization ID. Available for superadmins (any org) and admins (own org only). When provided, returns all runs for the specified organization instead of only the caller\'s own runs. (optional) (default to undefined)
let sort: Array<string>; //Sort the results by one or more fields. Use `+` for ascending and `-` for descending order.  **Available fields:** - `run_id` - `application_id` - `version_number` - `custom_metadata` - `submitted_at` - `submitted_by` - `terminated_at` - `termination_reason`  **Examples:** - `?sort=submitted_at` - Sort by creation time (ascending) - `?sort=-submitted_at` - Sort by creation time (descending) - `?sort=state&sort=-submitted_at` - Sort by state, then by time (descending)  (optional) (default to undefined)

const { status, data } = await apiInstance.listRunsV1RunsGet(
    applicationId,
    applicationVersion,
    externalId,
    customMetadata,
    page,
    pageSize,
    submittedBy,
    organizationId,
    forOrganization,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] | Optional application ID filter | (optional) defaults to undefined|
| **applicationVersion** | [**string**] | Optional Version Name | (optional) defaults to undefined|
| **externalId** | [**string**] | Optionally filter runs by items with this external ID | (optional) defaults to undefined|
| **customMetadata** | [**string**] | Use PostgreSQL JSONPath expressions to filter runs by their custom_metadata. #### URL Encoding Required **Important**: JSONPath expressions contain special characters that must be URL-encoded when used in query parameters. Most HTTP clients handle this automatically, but when constructing URLs manually, please ensure proper encoding.  #### Examples (Clear Format): - **Field existence**: &#x60;$.study&#x60; - Runs that have a study field defined - **Exact value match**: &#x60;$.study ? (@ &#x3D;&#x3D; \&quot;high\&quot;)&#x60; - Runs with specific study value - **Numeric comparison**: &#x60;$.confidence_score ? (@ &gt; 0.75)&#x60; - Runs with confidence score greater than 0.75 - **Array operations**: &#x60;$.tags[*] ? (@ &#x3D;&#x3D; \&quot;draft\&quot;)&#x60; - Runs with tags array containing \&quot;draft\&quot; - **Complex conditions**: &#x60;$.resources ? (@.gpu_count &gt; 2 &amp;&amp; @.memory_gb &gt;&#x3D; 16)&#x60; - Runs with high resource requirements  #### Examples (URL-Encoded Format): - **Field existence**: &#x60;%24.study&#x60; - **Exact value match**: &#x60;%24.study%20%3F%20(%40%20%3D%3D%20%22high%22)&#x60; - **Numeric comparison**: &#x60;%24.confidence_score%20%3F%20(%40%20%3E%200.75)&#x60; - **Array operations**: &#x60;%24.tags%5B*%5D%20%3F%20(%40%20%3D%3D%20%22draft%22)&#x60; - **Complex conditions**: &#x60;%24.resources%20%3F%20(%40.gpu_count%20%3E%202%20%26%26%20%40.memory_gb%20%3E%3D%2016)&#x60;  #### Notes - JSONPath expressions are evaluated using PostgreSQL\&#39;s &#x60;@?&#x60; operator - The &#x60;$.&#x60; prefix is automatically added to root-level field references if missing - String values in conditions must be enclosed in double quotes - Use &#x60;&amp;&amp;&#x60; for AND operations and &#x60;||&#x60; for OR operations - Regular expressions use &#x60;like_regex&#x60; with standard regex syntax - **Please remember to URL-encode the entire JSONPath expression when making HTTP requests**               | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 50|
| **submittedBy** | [**string**] | Filter runs by the user who submitted them. Use the special value &#x60;me&#x60; to return only runs submitted by the current user. | (optional) defaults to undefined|
| **organizationId** | [**string**] | Filter runs by the organization of the submitter. Use the special value &#x60;my_org&#x60; to filter by the current user\&#39;s organization. | (optional) defaults to undefined|
| **forOrganization** | [**string**] | Filter runs by organization ID. Available for superadmins (any org) and admins (own org only). When provided, returns all runs for the specified organization instead of only the caller\&#39;s own runs. | (optional) defaults to undefined|
| **sort** | **Array&lt;string&gt;** | Sort the results by one or more fields. Use &#x60;+&#x60; for ascending and &#x60;-&#x60; for descending order.  **Available fields:** - &#x60;run_id&#x60; - &#x60;application_id&#x60; - &#x60;version_number&#x60; - &#x60;custom_metadata&#x60; - &#x60;submitted_at&#x60; - &#x60;submitted_by&#x60; - &#x60;terminated_at&#x60; - &#x60;termination_reason&#x60;  **Examples:** - &#x60;?sort&#x3D;submitted_at&#x60; - Sort by creation time (ascending) - &#x60;?sort&#x3D;-submitted_at&#x60; - Sort by creation time (descending) - &#x60;?sort&#x3D;state&amp;sort&#x3D;-submitted_at&#x60; - Sort by state, then by time (descending)  | (optional) defaults to undefined|


### Return type

**Array<RunReadResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Run not found |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listShareTokensV1AccessShareTokensGet**
> Array<ShareTokenReadResponse> listShareTokensV1AccessShareTokensGet()

List share tokens. Service and Superadmin see all tokens; other users see only their own.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Filter by run ID (optional) (default to undefined)
let createdBy: string; //Filter by share token creator (optional) (default to undefined)
let revoked: boolean; // (optional) (default to undefined)
let page: number; // (optional) (default to 1)
let pageSize: number; // (optional) (default to 50)
let sort: Array<string>; //Sort the results by one or more fields. Use `+` for ascending and `-` for descending order. (optional) (default to undefined)

const { status, data } = await apiInstance.listShareTokensV1AccessShareTokensGet(
    runId,
    createdBy,
    revoked,
    page,
    pageSize,
    sort
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **runId** | [**string**] | Filter by run ID | (optional) defaults to undefined|
| **createdBy** | [**string**] | Filter by share token creator | (optional) defaults to undefined|
| **revoked** | [**boolean**] |  | (optional) defaults to undefined|
| **page** | [**number**] |  | (optional) defaults to 1|
| **pageSize** | [**number**] |  | (optional) defaults to 50|
| **sort** | **Array&lt;string&gt;** | Sort the results by one or more fields. Use &#x60;+&#x60; for ascending and &#x60;-&#x60; for descending order. | (optional) defaults to undefined|


### Return type

**Array<ShareTokenReadResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **listVersionDocuments**
> Array<VersionDocumentResponse> listVersionDocuments()

List public documents attached to an application version.  Returns only documents with ``visibility=public`` and ``status=uploaded``.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)
let version: string; // (default to undefined)

const { status, data } = await apiInstance.listVersionDocuments(
    applicationId,
    version
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|
| **version** | [**string**] |  | defaults to undefined|


### Return type

**Array<VersionDocumentResponse>**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**404** | Application version not found or not accessible |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **putItemCustomMetadataByRunV1RunsRunIdItemsExternalIdCustomMetadataPut**
> CustomMetadataUpdateResponse putItemCustomMetadataByRunV1RunsRunIdItemsExternalIdCustomMetadataPut(customMetadataUpdateRequest)

Update the custom metadata of the item with the specified `external_id`, belonging to the specified run.  Optionally, a checksum may be provided along the custom metadata JSON. It can be used to verify if the custom metadata was updated since the last time it was accessed. If the checksum is provided, it must match the existing custom metadata in the system, ensuring that the current custom metadata value to be overwritten is acknowledged by the user. If no checksum is provided, submitted metadata directly overwrites the existing metadata, without any checks.  The latest custom metadata and checksum can be retrieved     for individual items via `GET /v1/runs/{run_id}/items/{external_id}`,     and for all items of a run via `GET /v1/runs/{run_id}/items`.

### Example

```typescript
import {
    PublicApi,
    Configuration,
    CustomMetadataUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //The run id, returned by `POST /runs/` endpoint (default to undefined)
let externalId: string; //The `external_id` that was defined for the item by the customer that triggered the run. (default to undefined)
let customMetadataUpdateRequest: CustomMetadataUpdateRequest; //

const { status, data } = await apiInstance.putItemCustomMetadataByRunV1RunsRunIdItemsExternalIdCustomMetadataPut(
    runId,
    externalId,
    customMetadataUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **customMetadataUpdateRequest** | **CustomMetadataUpdateRequest**|  | |
| **runId** | [**string**] | The run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|
| **externalId** | [**string**] | The &#x60;external_id&#x60; that was defined for the item by the customer that triggered the run. | defaults to undefined|


### Return type

**CustomMetadataUpdateResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Custom metadata successfully updated |  -  |
|**403** | Forbidden - You don\&#39;t have permission to update this item |  -  |
|**404** | Item not found |  -  |
|**412** | Precondition Failed - Checksum mismatch |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **putRunCustomMetadataV1RunsRunIdCustomMetadataPut**
> CustomMetadataUpdateResponse putRunCustomMetadataV1RunsRunIdCustomMetadataPut(customMetadataUpdateRequest)

Update the custom metadata of a run with the specified `run_id`.  Optionally, a checksum may be provided along the custom metadata JSON. It can be used to verify if the custom metadata was updated since the last time it was accessed. If the checksum is provided, it must match the existing custom metadata in the system, ensuring that the current custom metadata value to be overwritten is acknowledged by the user. If no checksum is provided, submitted metadata directly overwrites the existing metadata, without any checks.  The latest custom metadata and checksum can be retrieved for the run via the `GET /v1/runs/{run_id}` endpoint.  **Note on deadlines:** Run deadlines must be set during run creation and cannot be modified afterward. Any deadline changes in custom metadata will be ignored by the system.

### Example

```typescript
import {
    PublicApi,
    Configuration,
    CustomMetadataUpdateRequest
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let runId: string; //Run id, returned by `POST /runs/` endpoint (default to undefined)
let customMetadataUpdateRequest: CustomMetadataUpdateRequest; //

const { status, data } = await apiInstance.putRunCustomMetadataV1RunsRunIdCustomMetadataPut(
    runId,
    customMetadataUpdateRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **customMetadataUpdateRequest** | **CustomMetadataUpdateRequest**|  | |
| **runId** | [**string**] | Run id, returned by &#x60;POST /runs/&#x60; endpoint | defaults to undefined|


### Return type

**CustomMetadataUpdateResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Custom metadata successfully updated |  -  |
|**404** | Run not found |  -  |
|**403** | Forbidden - You don\&#39;t have permission to update this run |  -  |
|**412** | Precondition Failed - Checksum mismatch, resource has been modified |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **readApplicationByIdV1ApplicationsApplicationIdGet**
> ApplicationReadResponse readApplicationByIdV1ApplicationsApplicationIdGet()

Retrieve details of a specific application by its ID.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let applicationId: string; // (default to undefined)

const { status, data } = await apiInstance.readApplicationByIdV1ApplicationsApplicationIdGet(
    applicationId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **applicationId** | [**string**] |  | defaults to undefined|


### Return type

**ApplicationReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to see this application |  -  |
|**404** | Not Found - Application with the given ID does not exist |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **revokeGrantV1AccessGrantsGrantIdDelete**
> GrantReadResponse revokeGrantV1AccessGrantsGrantIdDelete()

Revoke a grant by its ID. Sets the revoked_at timestamp on the grant.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let grantId: string; //Grant ID (default to undefined)

const { status, data } = await apiInstance.revokeGrantV1AccessGrantsGrantIdDelete(
    grantId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **grantId** | [**string**] | Grant ID | defaults to undefined|


### Return type

**GrantReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to revoke this grant |  -  |
|**404** | Grant not found |  -  |
|**409** | Conflict - Grant is already revoked |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **revokeShareTokenV1AccessShareTokensShareTokenIdDelete**
> ShareTokenReadResponse revokeShareTokenV1AccessShareTokensShareTokenIdDelete()

Revoke a share token by its ID. Invalidates the credential regardless of any active grants.

### Example

```typescript
import {
    PublicApi,
    Configuration
} from './api';

const configuration = new Configuration();
const apiInstance = new PublicApi(configuration);

let shareTokenId: string; //Share token ID (default to undefined)

const { status, data } = await apiInstance.revokeShareTokenV1AccessShareTokensShareTokenIdDelete(
    shareTokenId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shareTokenId** | [**string**] | Share token ID | defaults to undefined|


### Return type

**ShareTokenReadResponse**

### Authorization

[OAuth2AuthorizationCodeBearer](../README.md#OAuth2AuthorizationCodeBearer)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: application/json


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | Successful Response |  -  |
|**403** | Forbidden - You don\&#39;t have permission to revoke this share token |  -  |
|**404** | Share token not found |  -  |
|**409** | Conflict - Share token is already revoked |  -  |
|**422** | Validation Error |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

