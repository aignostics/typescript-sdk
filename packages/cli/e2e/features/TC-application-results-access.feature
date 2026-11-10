Feature: Application Results Access
  As an authenticated user
  I want to access application run results
  So that I can retrieve output artifacts and execution details

  Background:
    Given I am authenticated as an admin
    And <newest_version> is the first version listed by "applications versions list test-app"
    And I created a run of "test-app" version "<newest_version>" with 2 valid input items

  @id:TC-RESULTS-RETRIEVE
  @tests:SWR-APP-RESULTS-RETRIEVE-ITEMS
  Scenario: Retrieve items and output artifacts for a run
    When I run the CLI command "runs results list <run_id>"
    Then the exit code should be 0
    And I should see "Run results for <run_id>:" in the output
    And the output should contain a valid JSON array of run results

  @id:TC-RESULTS-STATUS
  @tests:SWR-APP-RESULTS-ITEM-STATUS
  @tests:SWR-APP-RESULTS-ARTIFACT-STATUS
  Scenario: View execution state and status details for items
    When I run the CLI command "runs results list <run_id>"
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
    When I run the CLI command "runs results list non-existent-run-id"
    Then I should see "API_ERROR" in stderr
    And I should see "Validation error" in stderr
    And the exit code should not be 0
