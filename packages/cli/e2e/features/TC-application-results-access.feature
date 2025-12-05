Feature: Application Results Access
  As an authenticated user
  I want to access application run results
  So that I can retrieve output artifacts and execution details

  Background:
    Given I am authenticated as an admin
    And application "test-app" exists with version "0.99.0"

  @id:TC-RESULTS-RETRIEVE
  @tests:SWR-APP-RESULTS-RETRIEVE-ITEMS
  Scenario: Retrieve items and output artifacts for a run
    Given I have a list of runs for "test-app" version "0.99.0"
    And I select the latest run ID from the list
    When I run the CLI command "list-run-results <run_id>"
    Then the exit code should be 0
    And I should see "Run results for <run_id>:" in the output
    And the output should contain a valid JSON array of run results

  @id:TC-RESULTS-STATUS
  @tests:SWR-APP-RESULTS-ITEM-STATUS
  @tests:SWR-APP-RESULTS-ARTIFACT-STATUS
  Scenario: View execution state and status details for items
    Given I have a list of runs for "test-app" version "0.99.0"
    And I select the latest run ID from the list
    When I run the CLI command "list-run-results <run_id>"
    Then the exit code should be 0
    And each result should have property "state"
    And each result should have property "termination_reason"
    And each result should have property "error_message"
    And each result should have property "error_code"
    And each output artifact should have property "state"
    And each output artifact should have property "termination_reason"
    And each output artifact should have property "download_url"

  @id:TC-RESULTS-INVALID-UUID
  @tests:SWR-ERROR-COMM-MESSAGES
  @tests:SWR-ERROR-COMM-CLI-OUTPUT
  Scenario: Handle error when requesting results with invalid run ID
    When I run the CLI command "list-run-results non-existent-run-id"
    Then I should see "API_ERROR" in stderr
    And I should see "Validation error" in stderr
    And the exit code should not be 0
