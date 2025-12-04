Feature: Application Execution
  As an authenticated user
  I want to execute applications with input artifacts
  So that I can process data using platform applications

  Background:
    Given I am authenticated as an admin
    And application "test-app" exists with version "0.99.0"

  @id:TC-RUN-CREATE
  @tests:SWR-APP-EXEC-RUN-CREATION
  @tests:SWR-APP-EXEC-INPUT-ARTIFACT
  Scenario: Create application run with valid input items
    Given I have 2 valid input artifacts for "test-app" version "0.99.0"
    When I run the CLI command "create-run test-app 0.99.0 --items <items_json>"
    Then the exit code should be 0
    And I should see "Application run created successfully:" in the output
    And the output should contain a JSON object with property "run_id"

  @id:TC-RUN-CREATE-INVALID-VERSION
  @tests:SWR-ERROR-COMM-DIAGNOSTIC-CONTEXT
  @tests:SWR-ERROR-COMM-CLI-OUTPUT
  Scenario: Handle error when creating run with non-existent version
    Given I have 2 valid input artifacts for "test-app" version "0.99.0"
    When I run the CLI command "create-run test-app 2.0.0 --items <items_json>"
    Then I should see "API_ERROR" in stderr
    And I should see "application version not found" in stderr
    And the exit code should not be 0

  @id:TC-RUN-CREATE-MISSING-ARGS
  @tests:SWR-ERROR-COMM-MESSAGES
  Scenario: Handle error when creating run with missing arguments
    When I run the CLI command "create-run"
    Then I should see "Not enough non-option arguments: got 0, need at least 2" in stderr
    And the exit code should not be 0

  @id:TC-RUN-CREATE-INVALID-JSON
  @tests:SWR-APP-EXEC-REQUEST-VALIDATION
  @tests:SWR-ERROR-COMM-MESSAGES
  Scenario: Validate items JSON before submission
    When I run the CLI command "create-run test-app 0.99.0 --items invalid-json"
    Then I should see "Invalid items JSON:" in stderr
    And the exit code should not be 0
