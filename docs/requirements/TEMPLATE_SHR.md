# SHR Template - Stakeholder Health Requirement

**Purpose**: Use this template to create Stakeholder Requirements (SHR) - high-level requirements that describe what stakeholders need from the system.

## Template Structure

```markdown
---
itemId: SHR-[MODULE]-[NUMBER]
itemTitle: [Brief Descriptive Title]
itemType: Requirement
# Stakeholder requirement (user)
Requirement type: [ENVIRONMENT|FUNCTIONAL|REGULATORY|PERFORMANCE|SECURITY|USABILITY]
---

## Description

[Detailed description of the stakeholder requirement. This should clearly state what users/stakeholders need to be able to do or what the system needs to provide. Write in complete sentences describing the capability or need from the stakeholder's perspective.]
```

## Field Definitions

### YAML Frontmatter (Required)

- **itemId**: Unique identifier following pattern `SHR-[MODULE]-[NUMBER]`
  - `[MODULE]`: The system module or domain (e.g., APPLICATION, SYSTEM, BUCKET, DATASET, VISUALIZATION)
  - `[NUMBER]`: Sequential number starting from 1 for each module
  - Example: `SHR-APPLICATION-1`, `SHR-SYSTEM-2`

- **itemTitle**: Short, descriptive title (3-8 words recommended)
  - Should be clear and specific
  - Use title case
  - Example: "Application Run Management", "System Health Monitoring and Observability"

- **itemType**: Always set to `Requirement` for requirements documents

- **Requirement type**: Choose one based on the nature of the requirement:
  - `ENVIRONMENT`: Requirements about the operating context, user workflows, or system environment
  - `FUNCTIONAL`: Requirements describing specific system functions or capabilities
  - `REGULATORY`: Requirements derived from regulations, standards, or compliance needs
  - `PERFORMANCE`: Requirements about system performance, speed, or efficiency
  - `SECURITY`: Requirements about system security, access control, or data protection
  - `USABILITY`: Requirements about user experience, accessibility, or ease of use

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
itemId: SHR-APPLICATION-1
itemTitle: Application Discovery and Navigation
itemType: Requirement
# Stakeholder requirement (user)
Requirement type: ENVIRONMENT
---

## Description

Users shall be able to view available AI applications and navigate to specific application views to access application functionality.
```

### Example 2: System Capability with Detail
```markdown
---
itemId: SHR-SYSTEM-1
itemTitle: System Health Monitoring and Observability
itemType: Requirement
# Stakeholder requirement (user)
Requirement type: ENVIRONMENT
---

## Description

Users shall be able to monitor the operational health and status of the system through multiple interfaces to ensure system reliability, diagnose issues, and maintain confidence in system availability. The system shall provide transparent, real-time visibility into its operational state across all user interaction points.
```

### Example 3: Workflow Requirement
```markdown
---
itemId: SHR-APPLICATION-2
itemTitle: Application Run Management
itemType: Requirement
# Stakeholder requirement (user)
Requirement type: ENVIRONMENT
---

## Description

Users shall be able to execute AI applications on their data by preparing data, submitting runs, monitoring run status, managing run lifecycle including cancellation, and accessing results.
```

## Naming Conventions

### Module Names
Use clear, consistent module names that reflect your system architecture:
- APPLICATION (for application management features)
- SYSTEM (for system-wide capabilities)
- BUCKET (for storage management)
- DATASET (for data operations)
- VISUALIZATION (for visualization tools)
- USER (for user management)
- AUTH (for authentication/authorization)
- API (for API-specific requirements)
- etc.

### Numbering
- Start from 1 for each module
- Increment sequentially (1, 2, 3, ...)
- Use the same number space across all requirement types for the module
- Example: SHR-APPLICATION-1, SHR-APPLICATION-2, SHR-APPLICATION-3

## Best Practices

1. **Keep it High-Level**: SHRs describe stakeholder needs, not technical solutions
2. **User-Centric**: Write from the perspective of what users need to accomplish
3. **Complete**: Each SHR should be a complete, standalone capability description
4. **Verifiable**: Write requirements that can be verified through testing or demonstration
5. **Clear Scope**: Define the boundaries of what the requirement covers
6. **Parent-Child**: SHRs will have child SWR requirements that detail HOW to implement them

## Validation Checklist

Before finalizing an SHR, verify:
- [ ] itemId follows SHR-[MODULE]-[NUMBER] pattern
- [ ] itemTitle is clear and descriptive
- [ ] itemType is set to "Requirement"
- [ ] Requirement type is one of the valid values
- [ ] Description section exists with ## heading
- [ ] Description explains WHAT stakeholders need (not HOW)
- [ ] Language is clear and unambiguous
- [ ] Requirement is testable/verifiable
- [ ] YAML frontmatter is properly formatted

## Notes for AI Agents

When generating SHR files:
1. Read the project documentation to understand modules and architecture
2. Identify high-level stakeholder needs and capabilities
3. Group related requirements under appropriate modules
4. Create one SHR file per stakeholder requirement
5. Ensure each SHR can be decomposed into multiple SWR requirements
6. Use consistent terminology throughout all requirements
7. Consider the user journey and workflows when defining requirements
