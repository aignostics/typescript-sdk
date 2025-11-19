# SWR Template - Software Requirement

**Purpose**: Use this template to create Software Requirements (SWR) - detailed technical requirements that implement stakeholder requirements (SHR).

## Template Structure

```markdown
---
itemId: SWR-[MODULE]-[PARENT_NUMBER]-[DESCRIPTIVE_NAME]
itemTitle: [Brief Descriptive Title]
itemHasParent: SHR-[MODULE]-[PARENT_NUMBER]
itemType: Requirement
# Software requirement (user|system)
Requirement type: [FUNCTIONAL|REGULATORY|PERFORMANCE|SECURITY|USABILITY]
Layer: [System (backend logic)|User Interface (frontend)|GUI|CLI|API|Database|etc.]
---

[Detailed requirement description. Can be written as a plain statement or as a user story. Should clearly specify the technical implementation requirement.]
```

## Field Definitions

### YAML Frontmatter (Required)

- **itemId**: Unique identifier following pattern `SWR-[MODULE]-[PARENT_NUMBER]-[DESCRIPTIVE_NAME]`
  - `[MODULE]`: Same module as parent SHR (e.g., APPLICATION, SYSTEM, BUCKET)
  - `[PARENT_NUMBER]`: The number from the parent SHR (e.g., if parent is SHR-APPLICATION-2, use 2)
  - `[DESCRIPTIVE_NAME]`: Short descriptive name or sequential number (e.g., LIST-APPS, 1, 2)
  - Example: `SWR-APPLICATION-1-LIST`, `SWR-APPLICATION-2-1`, `SWR-SYSTEM-1-GUI-HEALTH`

- **itemTitle**: Short, descriptive title (3-8 words recommended)
  - Should be specific about the technical requirement
  - Use title case
  - Example: "List Available Applications", "Accept Optional Run Name and Description"

- **itemHasParent**: Reference to parent SHR using format `SHR-[MODULE]-[NUMBER]`
  - Must match an existing SHR itemId
  - Example: `SHR-APPLICATION-1`, `SHR-SYSTEM-2`

- **itemType**: Always set to `Requirement` for requirements documents

- **Software requirement comment**: Choose one:
  - `# Software requirement (user)` - User-facing software requirements
  - `# Software requirement (system)` - System-level software requirements

- **Requirement type**: Choose one based on the nature of the requirement:
  - `FUNCTIONAL`: Requirements describing specific system functions or operations
  - `REGULATORY`: Requirements derived from regulations, standards, or compliance needs
  - `PERFORMANCE`: Requirements about system performance, speed, or efficiency
  - `SECURITY`: Requirements about system security, access control, or data protection
  - `USABILITY`: Requirements about user experience, accessibility, or ease of use

- **Layer**: (Optional) Specify the architectural layer:
  - `System (backend logic)` - Backend business logic, services, APIs
  - `User Interface (frontend)` - Frontend web/mobile interface
  - `GUI` - Desktop GUI application
  - `CLI` - Command-line interface
  - `API` - API endpoints and contracts
  - `Database` - Database schema and operations
  - `System (frontend interface)` - Frontend system components
  - Or any other layer relevant to your architecture

### Requirement Description (Required)

- **Format**: Direct text after YAML frontmatter (no heading)
- **Content**: 1-3 sentences describing the specific technical requirement
- **Style Options**:

  **Option 1 - Plain Statement** (most common):
  ```
  System shall provide a list of available applications for user selection.
  ```

  **Option 2 - User Story Format**:
  ```
  As a user, I expected the current health of Launchpad being always visible in the footer of the GUI so that I can ensure the system is operational.
  ```

  **Option 3 - Detailed Statement**:
  ```
  System shall accept optional user-provided run name and description during application run submission. The system shall validate that run names do not exceed 100 characters and descriptions do not exceed 500 characters when provided, and shall store these metadata fields with the run record.
  ```

- **Guidelines**:
  - Be specific about technical implementation
  - Include validation rules, constraints, or limits if applicable
  - Use "System shall..." for system actions
  - Use "As a user..." for user story format
  - Focus on HOW the parent SHR will be implemented
  - Include acceptance criteria when relevant

## Examples

### Example 1: Simple Backend Requirement
```markdown
---
itemId: SWR-APPLICATION-1-1
itemTitle: List Available Applications
itemHasParent: SHR-APPLICATION-1
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

System shall provide a list of available applications for user selection.
```

### Example 2: GUI Requirement with User Story
```markdown
---
itemId: SWR-SYSTEM-GUI-HEALTH-1
itemTitle: GUI System Health Visibility
itemHasParent: SHR-SYSTEM-1
itemType: Requirement
# Software requirement (system)
Requirement type: REGULATORY
Layer: GUI
---

As a user, I expected the current health of Launchpad being always visible in the footer of the GUI so that I can ensure the system is operational.
```

### Example 3: Detailed Requirement with Validation
```markdown
---
itemId: SWR-APPLICATION-2-13
itemTitle: Accept Optional Run Name and Description
itemHasParent: SHR-APPLICATION-2
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

System shall accept optional user-provided run name and description during application run submission. The system shall validate that run names do not exceed 100 characters and descriptions do not exceed 500 characters when provided, and shall store these metadata fields with the run record.
```

### Example 4: Storage Operation Requirement
```markdown
---
itemId: SWR-BUCKET-1-1
itemTitle: Upload Directory Structure to Bucket Storage
itemHasParent: SHR-BUCKET-1
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

System shall upload local directory structures with multiple files and subdirectories to bucket storage while preserving file organization.
```

### Example 5: Complex Multi-Granularity Requirement
```markdown
---
itemId: SWR-APPLICATION-3-1
itemTitle: Download Application Run Results
itemHasParent: SHR-APPLICATION-3
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

System shall download application run results at multiple granularity levels: all items per run, individual items, and individual artifacts per item. The system shall download to specified destination directories when requested by run identifier, retrieve results regardless of run status, and provide download confirmation with status information indicating whether run was completed or canceled.
```

## Naming Conventions

### itemId Pattern
`SWR-[MODULE]-[PARENT_NUMBER]-[DESCRIPTIVE_NAME]`

**Descriptive Name Options**:
1. **Sequential numbers**: 1, 2, 3, etc.
   - Example: SWR-APPLICATION-1-1, SWR-APPLICATION-1-2
   - Pro: Simple, easy to generate
   - Con: Less self-documenting

2. **Short descriptive keywords**: LIST, UPLOAD, DELETE, etc.
   - Example: SWR-APPLICATION-1-LIST, SWR-BUCKET-1-UPLOAD
   - Pro: More readable, self-documenting
   - Con: Requires consistent naming

3. **Combined approach**: Use descriptive names for major features, numbers for variations
   - Example: SWR-APPLICATION-2-SUBMIT-1, SWR-APPLICATION-2-SUBMIT-2
   - Pro: Balances clarity and simplicity
   - Con: More complex to manage

**Recommendation**: Use sequential numbers unless descriptive names add significant clarity.

### Module and Parent Number
- Must match the parent SHR
- Example: If parent is `SHR-APPLICATION-2`, then SWR prefix is `SWR-APPLICATION-2-*`

## Relationship to SHR

Each SWR must:
1. Reference exactly one parent SHR via `itemHasParent`
2. Implement a specific aspect of that parent SHR
3. Be more detailed and technical than the parent SHR
4. Focus on HOW to implement WHAT the parent SHR describes

**Example Breakdown**:
```
SHR-APPLICATION-1: "Application Discovery and Navigation"
├── SWR-APPLICATION-1-1: "List Available Applications"
├── SWR-APPLICATION-1-2: "Display Application Details"
└── SWR-APPLICATION-1-3: "Navigate to Application View"
```

## Layer Guidelines

Choose the appropriate layer based on where the requirement is implemented:

- **System (backend logic)**: Business logic, data processing, API services
- **User Interface (frontend)**: Web or mobile UI components and interactions
- **GUI**: Desktop graphical interface
- **CLI**: Command-line interface commands and options
- **API**: REST/GraphQL endpoints, request/response formats
- **Database**: Schema, queries, data persistence
- **Integration**: External system integrations
- **Infrastructure**: Deployment, scaling, monitoring

**Note**: Layer field is optional but recommended for clarity. Omit if not applicable to your project.

## Best Practices

1. **Specificity**: SWRs should be specific enough to implement and test
2. **Traceability**: Always link to parent SHR via itemHasParent
3. **Granularity**: One SWR per distinct technical requirement
4. **Testability**: Write requirements that can be verified through automated or manual testing
5. **Completeness**: Include validation rules, constraints, error handling
6. **Clarity**: Use clear, unambiguous language
7. **Consistency**: Use consistent terminology with parent SHR and other SWRs

## Common Patterns

### Validation Requirements
```markdown
System shall validate that [field] does not exceed [limit] characters when provided, and shall [action] when validation fails.
```

### Data Operations
```markdown
System shall [action] [data] to/from [location] while [constraint/condition].
```

### User Interface Requirements
```markdown
As a user, I expect [UI element] to [behavior] in [location] so that [benefit/reason].
```

### Multi-Step Operations
```markdown
System shall [action1] at multiple [scope] levels: [option1], [option2], and [option3]. The system shall [action2] when [condition], and provide [output] with [details].
```

## Validation Checklist

Before finalizing an SWR, verify:
- [ ] itemId follows SWR-[MODULE]-[PARENT_NUMBER]-[DESCRIPTIVE_NAME] pattern
- [ ] itemTitle is clear and descriptive
- [ ] itemHasParent references a valid SHR
- [ ] itemType is set to "Requirement"
- [ ] Software requirement type (user|system) is specified
- [ ] Requirement type is one of the valid values
- [ ] Layer is specified (if applicable)
- [ ] Requirement description is clear and implementable
- [ ] Requirement is testable/verifiable
- [ ] YAML frontmatter is properly formatted
- [ ] Requirement implements part of the parent SHR

## Notes for AI Agents

When generating SWR files:
1. Always start by identifying the parent SHR
2. Break down the parent SHR into logical, implementable components
3. Create one SWR file per technical requirement
4. Ensure each SWR is specific enough to implement
5. Include validation rules and constraints where applicable
6. Use consistent terminology with parent SHR
7. Consider the full technical stack (frontend, backend, database, etc.)
8. Group related SWRs under the same parent SHR
9. Ensure completeness: all aspects of parent SHR should be covered by child SWRs
10. Maintain traceability: every SWR should clearly implement part of its parent SHR
