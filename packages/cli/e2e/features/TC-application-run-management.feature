Feature: Application Run Management
  As an authenticated user
  I want to manage application runs
  So that I can monitor and control application execution

  Background:
    Given I am authenticated as an admin
    And application "test-app" exists with version "0.99.0"

  @id:TC-RUN-LIST
  @tests:SWR-APP-RUN-MGMT-LIST
  Scenario: List application runs with filtering
    When I run the CLI command "list-application-runs --applicationId test-app --applicationVersion 0.99.0"
    Then the exit code should be 0
    And I should see "Application runs:" in the output
    And the output should contain a valid JSON array of runs
    And each run should have property "application_id" with value "test-app"

  @id:TC-RUN-DETAILS
  @tests:SWR-APP-RUN-MGMT-DETAILS
  Scenario: Retrieve detailed information for a specific run
    Given I have a list of runs for "test-app" version "0.99.0"
    And I select the latest run ID from the list
    When I run the CLI command "get-run <run_id>"
    Then the exit code should be 0
    And I should see "Run details for <run_id>:" in the output
    And the output should contain a JSON object with "run_id" equal to "<run_id>"
    And the output should contain property "application_id" with value "test-app"

  @id:TC-RUN-CANCEL
  @tests:SWR-APP-RUN-MGMT-CANCEL
  Scenario: Cancel a pending application run
    Given I have a list of runs for "test-app" version "0.99.0"
    And there is a run with state "PENDING"
    When I run the CLI command "cancel-run <pending_run_id>"
    Then the exit code should be 0
    And I should see "Successfully cancelled application run: <pending_run_id>" in the output
