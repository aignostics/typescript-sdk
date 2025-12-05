Feature: Application Discovery
  As an authenticated user
  I want to discover available applications and their versions
  So that I can select the appropriate application and version to run

  Background:
    Given I am authenticated as an admin

  @id:TC-APP-LIST
  @tests:SWR-APP-DISCOVERY-LIST
  Scenario: Retrieve all available applications
    When I run the CLI command "list-applications"
    Then the exit code should be 0
    And I should see "Applications:" in the output
    And the output should contain a valid JSON array of applications
    And each application should have an "application_id"
    And each application should have a "name"

  @id:TC-APP-DETAILS
  @tests:SWR-APP-DISCOVERY-VERSION-DETAILS
  Scenario: View application details including regulatory information
    When I run the CLI command "list-applications"
    Then the exit code should be 0
    And the output should contain application "test-app"
    And application "test-app" should have property "application_id" with value "test-app"
    And application "test-app" should have property "name" with value "test-app"
    And application "test-app" should have property "regulatory_classes" as an array
    And application "test-app" should have property "description"

  @id:TC-VERSION-LIST
  @tests:SWR-APP-DISCOVERY-VERSION-LIST
  @tests:SWR-APP-DISCOVERY-DETAILS
  Scenario: Retrieve all versions for a specific application
    When I run the CLI command "list-application-versions test-app"
    Then the exit code should be 0
    And I should see "Application versions for test-app:" in the output
    And the output should contain a valid JSON array of versions
    And each version should have property "number" matching semver format
    And each version should have property "released_at" in ISO 8601 format

  @id:TC-VERSION-LIST-NOT-FOUND
  @tests:SWR-APP-DISCOVERY-VERSION-LIST
  Scenario: Handle error when listing versions for non-existent application
    When I run the CLI command "list-application-versions non-existent-app"
    Then I should see "API_ERROR" in stderr
    And I should see "application not found" in stderr
    And the exit code should not be 0

  @id:TC-VERSION-DETAILS
  @tests:SWR-APP-DISCOVERY-VERSION-DETAILS
  Scenario: View specific application version details
    When I run the CLI command "get-application-version-details test-app 0.99.0"
    Then the exit code should be 0
    And I should see "Application version details for test-app v0.99.0:" in the output
    And the output should contain a JSON object with "version_number" equal to "0.99.0"
    And the output should contain property "changelog"
    And the output should contain property "input_artifacts" as an array

  @id:TC-VERSION-DETAILS-NOT-FOUND
  @tests:SWR-ERROR-COMM-DIAGNOSTIC-CONTEXT
  @tests:SWR-ERROR-COMM-CLASSIFICATION
  Scenario: Handle error when requesting non-existent version details
    When I run the CLI command "get-application-version-details test-app 2.0.0"
    Then I should see "API_ERROR" in stderr
    And I should see "Application version not found" in stderr
    And the exit code should not be 0
