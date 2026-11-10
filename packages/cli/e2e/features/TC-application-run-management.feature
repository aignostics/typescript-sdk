Feature: Application Run Management
  As an authenticated user
  I want to manage application runs
  So that I can monitor and control application execution

  Background:
    Given I am authenticated as an admin
    And <newest_version> is the first version listed by "applications versions list test-app"
    And I created a run of "test-app" version "<newest_version>" with 2 valid input items

  @id:TC-RUN-LIST
  @tests:SWR-APP-RUN-MGMT-LIST
  Scenario: List application runs with filtering
    When I run the CLI command "runs list --applicationId test-app --applicationVersion <newest_version>"
    Then the exit code should be 0
    And I should see "Application runs:" in the output
    And the output should contain a non-empty JSON array of runs
    And each run should have property "application_id" with value "test-app"
    And each run should have property "version_number" with value "<newest_version>"

  @id:TC-RUN-DETAILS
  @tests:SWR-APP-RUN-MGMT-DETAILS
  Scenario: Retrieve detailed information for a specific run
    When I run the CLI command "runs get <run_id>"
    Then the exit code should be 0
    And I should see "Run details for <run_id>:" in the output
    And the output should contain a JSON object with "run_id" equal to "<run_id>"
    And the output should contain property "application_id" with value "test-app"

  @id:TC-RUN-CANCEL
  @tests:SWR-APP-RUN-MGMT-CANCEL
  Scenario: Cancel a pending application run
    When I run the CLI command "runs cancel <run_id>"
    Then the exit code should be 0
    And I should see "Successfully cancelled application run: <run_id>" in the output
