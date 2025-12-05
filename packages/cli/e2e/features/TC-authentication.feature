# Test Implementation: packages/cli/e2e/specs/1-Authentication.e2e.test.ts

Feature: Authentication
  As a user
  I want to authenticate with the platform
  So that I can access protected resources

  Background:
    Given the CLI is installed
    And I have valid credentials

  @id:TC-AUTH-PKCE
  @tests:SWR-AUTH-CODE-FLOW
  @tests:SWR-AUTH-CUSTOM-PROVIDER
  Scenario: Complete PKCE authentication login flow with browser automation
    When I run the CLI command "login"
    Then I should see an authentication URL in the output
    When I navigate to the authentication URL in a browser
    And I enter my email "<admin_email>"
    And I enter my password "<admin_password>"
    And I click the "Continue" button
    Then I should be redirected to a success page
    And the CLI should complete authentication
    And I should see "You are now authenticated and can use the SDK"
    And the exit code should be 0

  @id:TC-AUTH-TOKEN
  @tests:SWR-AUTH-TOKEN-BASED
  @tests:SWR-AUTH-SECURE-STORAGE
  Scenario: Authenticate with refresh token
    When I run the CLI command "login --refreshToken <refresh_token>"
    Then I should see "Login with refresh token successful! Token saved securely"
    When I run the CLI command "test-api"
    Then I should see "API connection successful"
    And the exit code should be 0

  @id:TC-AUTH-REFRESH
  @tests:SWR-AUTH-AUTO-REFRESH
  Scenario: Automatically refresh expired access token
    Given I am authenticated with a valid refresh token
    And my access token is expired
    When I run the CLI command "test-api"
    Then I should see "Access token expired, attempting to refresh..."
    And I should see "Token refreshed successfully"
    And I should see "API connection successful"
    And the exit code should be 0

  @id:TC-AUTH-REFRESH-FAIL
  @tests:SWR-AUTH-AUTO-REFRESH
  Scenario: Fail to refresh token with invalid refresh token
    Given I am authenticated
    And my access token is expired
    And my refresh token is invalid
    When I run the CLI command "test-api"
    Then I should see "Warning: Token refresh failed" in stderr
    And the exit code should not be 0

  @id:TC-AUTH-NO-AUTH
  @tests:SWR-AUTH-VALIDATION
  @tests:SWR-AUTH-TOKEN-REMOVAL
  Scenario: Reject API calls without authentication
    Given I am not authenticated
    When I run the CLI command "test-api"
    Then I should see "API connection failed: AuthenticationError:" in stderr
    And the exit code should not be 0