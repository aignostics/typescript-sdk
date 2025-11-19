Typescript SDK - Requirements
Author	Omid Kokabi
Date	Oct 14, 2025

Color coding
Black = Requirements that are already implemented 
Red = Requirements that are not yet implemented

Requirements
SHR: TSSDK-1 - Authenticated Platform Access
Requirement Type: Stakeholder requirement (security)
Description: Access to the Aignostics Platform shall require valid user authentication credentials.

SWR-TSSDK-1.1: Token-Based Authentication
Requirement Type: Software requirement (security)
Description: System shall authenticate API requests using access tokens.

SWR-TSSDK-1.2: Authentication Validation
Requirement Type: Software requirement (security)
Description: CLI shall reject API requests that do not include a valid access token.

SWR-TSSDK-1.3: Secure authorisation code authentication
Requirement Type: Software requirement (security)
Description: CLI shall support secure authorization code-based authentication flow with cryptographic protection against authorization code interception attacks.

SWR-TSSDK-1.4: Custom Token Provider
Requirement Type: Software requirement (security)
Description: SDK shall accept user-provided token functions for obtaining access tokens.

SWR-TSSDK-1.5: Secure Token Storage
Requirement Type: Software requirement (security)
Description: CLI shall store authentication tokens with protection against unauthorized access.

SWR-TSSDK-1.6: Automatic Token Refresh 
Requirement Type: Software requirement (security)
Description: CLI shall automatically refresh access tokens and retry failed API requests when authentication fails and valid refresh tokens are available 

SWR-TSSDK-1.7: Token Removal
Requirement Type: Software requirement (security)
Description: CLI shall enable users to remove stored authentication tokens.


SHR: TSSDK-2 - Application Discovery
Requirement Type: Stakeholder requirement (user)
Description: Users shall be able to discover available AI applications and their versions.

SWR-TSSDK-2.1: Application List Retrieval
Requirement Type: Software requirement (user)
Description: System shall retrieve all available AI applications accessible to the authenticated user.

SWR-TSSDK-2.2: Application Details
Requirement Type: Software requirement (user)
Description: System shall provide application identification, description, and regulatory compliance information for each retrieved application.

SWR-TSSDK-2.3: Version List Retrieval
Requirement Type: Software requirement (user)
Description: System shall retrieve all versions for a specified application.

SWR-TSSDK-2.4: Version Details
Requirement Type: Software requirement (user)
Description: System shall provide version identification, change history, input requirements, and output specifications for each retrieved version.


SHR: TSSDK-3 - Application Execution Access
Requirement Type: Stakeholder requirement (user)
Description: Users shall be able to execute AI applications on slide data to generate analytical insights.

SWR-TSSDK-3.1: Application Run Creation
Requirement Type: Software requirement (user)
Description: System shall create application runs with specified application version, input items, and item- and run metadata and return a unique run identifier upon successful creation.

SWR-TSSDK-3.2: Input Artifact Specification
Requirement Type: Software requirement (user)
Description: System shall accept input artifacts containing artifact name, download URL, and metadata for each item in the run request.

SWR-TSSDK-3.3: Request Validation
Requirement Type: Software requirement (user)
Description: System shall validate run request format before submission to the platform.

SHR: TSSDK-4 - Application Run Management
Requirement Type: Stakeholder requirement (user)
Description: Users shall be able to monitor status and manage the lifecycle of their AI application runs.

SWR-TSSDK-4.1: List Application Runs
Requirement Type: Software requirement (user)
Description: System shall retrieve a list of application runs with optional filtering by application ID and application version.

SWR-TSSDK-4.2: Retrieve Run Details
Requirement Type: Software requirement (user)
Description: System shall retrieve detailed information for a specific application run by run ID.

SWR-TSSDK-4.3: Cancel Application Run
Requirement Type: Software requirement (user)
Description: System shall enable users to cancel a running or queued application run by run ID.

SWR-TSSDK-4.4: Run Due Date Specification
Requirement Type: Software requirement (user)
Description: System shall accept optional due date timestamp when creating application runs to specify the expected completion time.

SWR-TSSDK-4.5:Run Deadline Specification
Requirement Type: Software requirement (user)
Description: System shall accept optional deadline timestamp when creating application runs to specify when the 
Platform API should automatically cancel the run if not completed.
SHR: TSSDK-5 - Application Results Access
Requirement Type: Stakeholder requirement (user)
Description: Users shall be able to access and retrieve results generated from AI application runs.

SWR-TSSDK-5.1: Retrieve run items
Requirement Type: Software requirement (user)
Description: System shall retrieve items and their associated output artifacts for a specified application run by run ID.

SWR-TSSDK-5.2: Item status information
Requirement Type: Software requirement (user)
Description: System shall provide execution state, output availability, termination status, and error details for each item.

SWR-TSSDK-5.3: Artifact status information
Requirement Type: Software requirement (user)
Description: System shall provide execution state, download availability, termination status, and error details for each output artifact.


SHR: TSSDK-6 - Error Communication
Requirement Type: Stakeholder requirement (user)
Description: Users shall receive clear information when operations fail.

SWR-TSSDK-6.1: Error Classification
Requirement Type: Software requirement (user)
Description: System shall assign a unique error code to each error to enable programmatic error handling and differentiation between error types.

SWR-TSSDK-6.2: Error Messages
Requirement Type: Software requirement (user)
Description: System shall provide error messages that describe the failure cause and corrective action where applicable.

SWR-TSSDK-6.3: Error Diagnostic Context
Requirement Type: Software requirement (user)
Description: System shall include diagnostic context in errors including protocol-specific status information for API failures and original error details for debugging.

SWR-TSSDK-6.4: CLI Error Output
Requirement Type: Software requirement (user)
Description: CLI shall write error messages to standard error stream and provide machine-readable operation status through standard exit mechanisms.










