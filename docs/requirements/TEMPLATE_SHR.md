# SHR Template - Stakeholder Requirement

**Purpose**: Use this template to create Stakeholder Requirements (SHR) - high-level requirements that describe what stakeholders need from the system.

## Template Structure

```markdown
---
itemId: SHR-[DESCRIPTIVE-NAME]
itemTitle: [Brief Descriptive Title]
itemType: Requirement
Requirement type: [FUNCTIONAL|REGULATORY|PERFORMANCE|SECURITY|USABILITY]
---

## Description

[Detailed description of the stakeholder requirement. This should clearly state what users/stakeholders need to be able to do or what the system needs to provide. Write in complete sentences describing the capability or need from the stakeholder's perspective.]
```

## Field Definitions

### YAML Frontmatter (Required)

- **itemId**: Unique identifier following pattern `SHR-[DESCRIPTIVE-NAME]`
  - `[DESCRIPTIVE-NAME]`: Hyphenated descriptive identifier using module prefix and feature name
  - Should be clear, concise, and self-documenting
  - Use uppercase with hyphens (kebab-case in uppercase)
  - Common module prefixes: APP, AUTH, SYSTEM, BUCKET, DATASET, ERROR, API
  - Example: `SHR-APP-DISCOVERY`, `SHR-AUTH`, `SHR-ERROR-COMM`, `SHR-APP-RUN-MGMT`

- **itemTitle**: Short, descriptive title (3-8 words recommended)
  - Should be clear and specific
  - Use title case
  - Example: "Application Run Management", "System Health Monitoring and Observability"

- **itemType**: Always set to `Requirement` for requirements documents

- **Requirement type**: Choose one based on the nature of the requirement:
  - `FUNCTIONAL`: Requirements describing specific system functions or capabilities (most common)
  - `REGULATORY`: Requirements derived from regulations, standards, or compliance needs
  - `PERFORMANCE`: Requirements about system performance, speed, or efficiency
  - `SECURITY`: Requirements about system security, access control, or data protection
  - `USABILITY`: Requirements about user experience, accessibility, or ease of use

  Note: ENVIRONMENT type has been removed - use FUNCTIONAL for user workflows and system context requirements

### Description Section (Required)

- **Format**: Markdown heading level 2 (`## Description`)
- **Content**: 1-3 paragraphs describing the stakeholder requirement
- **Style**:
  - Write from stakeholder/user perspective
  - Use "Users shall be able to..." or "The system shall provide..."
  - Be clear and specific about the capability or need
  - Focus on WHAT is needed, not HOW it will be implemented
  - Avoid technical implementation details

## Examples

### Example 1: User-Facing Capability

```markdown
---
itemId: SHR-APP-DISCOVERY
itemTitle: Application Discovery
itemType: Requirement
Requirement type: FUNCTIONAL
---

## Description

Users shall be able to discover available AI applications and their versions.
```

### Example 2: Security Requirement

```markdown
---
itemId: SHR-AUTH
itemTitle: Authenticated Platform Access
itemType: Requirement
Requirement type: FUNCTIONAL
---

## Description

Access to the Aignostics Platform shall require valid user authentication credentials.
```

### Example 3: Error Handling Requirement

```markdown
---
itemId: SHR-ERROR-COMM
itemTitle: Error Communication
itemType: Requirement
Requirement type: FUNCTIONAL
---

## Description

Users shall receive clear information when operations fail.
```

## Naming Conventions

### Module Prefixes

Use clear, consistent module prefixes that reflect your system architecture:

- APP (for application-related features)
- AUTH (for authentication/authorization)
- SYSTEM (for system-wide capabilities)
- BUCKET (for storage management)
- DATASET (for data operations)
- ERROR (for error handling and communication)
- API (for API-specific requirements)
- USER (for user management)
- etc.

### Descriptive Names

- Use hyphenated uppercase names (e.g., `SHR-APP-DISCOVERY`, `SHR-APP-RUN-MGMT`)
- Combine module prefix with feature name
- Keep names concise but descriptive
- Use common abbreviations where clear (MGMT for Management, EXEC for Execution, COMM for Communication)
- Example: `SHR-APP-DISCOVERY`, `SHR-AUTH`, `SHR-ERROR-COMM`, `SHR-APP-RESULTS`

## Best Practices

1. **Keep it High-Level**: SHRs describe stakeholder needs, not technical solutions
2. **User-Centric**: Write from the perspective of what users need to accomplish
3. **Complete**: Each SHR should be a complete, standalone capability description
4. **Verifiable**: Write requirements that can be verified through testing or demonstration
5. **Clear Scope**: Define the boundaries of what the requirement covers
6. **Parent-Child**: SHRs will have child SWR requirements that detail HOW to implement them

## Validation Checklist

Before finalizing an SHR, verify:

- [ ] itemId follows SHR-[DESCRIPTIVE-NAME] pattern (e.g., SHR-APP-DISCOVERY)
- [ ] itemTitle is clear and descriptive
- [ ] itemType is set to "Requirement"
- [ ] Requirement type is one of the valid values (FUNCTIONAL, SECURITY, etc.)
- [ ] Description section exists with ## heading
- [ ] Description explains WHAT stakeholders need (not HOW)
- [ ] Language is clear and unambiguous
- [ ] Requirement is testable/verifiable
- [ ] YAML frontmatter is properly formatted
- [ ] Optional comment included for original reference if migrating

## Notes for AI Agents

When generating SHR files:

1. Read the project documentation to understand modules and architecture
2. Identify high-level stakeholder needs and capabilities
3. Group related requirements under appropriate modules
4. Create one SHR file per stakeholder requirement
5. Ensure each SHR can be decomposed into multiple SWR requirements
6. Use consistent terminology throughout all requirements
7. Consider the user journey and workflows when defining requirements
