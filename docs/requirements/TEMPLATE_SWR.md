# SWR Template - Software Requirement

**Purpose**: Use this template to create Software Requirements (SWR) - detailed technical requirements that implement stakeholder requirements (SHR).

## Template Structure

```markdown
---
itemId: SWR-[PARENT-NAME]-[DESCRIPTIVE-SUFFIX]
itemTitle: [Brief Descriptive Title]
itemHasParent: SHR-[PARENT-NAME]
itemType: Requirement
# Software requirement (user|system)
Requirement type: [FUNCTIONAL|REGULATORY|PERFORMANCE|SECURITY|USABILITY]
Layer: [System (backend logic)|User Interface (frontend)|GUI|CLI|API|Database|etc.]
---

<!-- Original reference: [Optional - Reference to original requirement ID if migrating] -->

[Detailed requirement description. Can be written as a plain statement or as a user story. Should clearly specify the technical implementation requirement.]
```

## Field Definitions

### YAML Frontmatter (Required)

- **itemId**: Unique identifier following pattern `SWR-[PARENT-NAME]-[DESCRIPTIVE-SUFFIX]`
  - `[PARENT-NAME]`: The full descriptive name from parent SHR (e.g., APP-DISCOVERY, AUTH, ERROR-COMM)
  - `[DESCRIPTIVE-SUFFIX]`: Short descriptive identifier for this specific requirement
  - Use hyphenated uppercase names
  - Example: `SWR-APP-DISCOVERY-LIST`, `SWR-APP-DISCOVERY-DETAILS`, `SWR-AUTH-TOKEN-BASED`, `SWR-ERROR-COMM-CLI-OUTPUT`

- **itemTitle**: Short, descriptive title (3-8 words recommended)
  - Should be specific about the technical requirement
  - Use title case
  - Example: "List Available Applications", "Accept Optional Run Name and Description"

- **itemHasParent**: Reference to parent SHR using format `SHR-[PARENT-NAME]`
  - Must match an existing SHR itemId exactly
  - Example: `SHR-APP-DISCOVERY`, `SHR-AUTH`, `SHR-ERROR-COMM`

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
itemId: SWR-APP-DISCOVERY-LIST
itemTitle: List Available Applications
itemHasParent: SHR-APP-DISCOVERY
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

<!-- Original reference: SWR-TSSDK-2.1 -->

System shall provide a list of available applications for user selection.
```

### Example 2: CLI Requirement
```markdown
---
itemId: SWR-ERROR-COMM-CLI-OUTPUT
itemTitle: CLI Error Output
itemHasParent: SHR-ERROR-COMM
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: CLI
---

<!-- Original reference: SWR-TSSDK-6.4 -->

CLI shall write error messages to standard error stream and provide machine-readable operation status through standard exit mechanisms.
```

### Example 3: Authentication Requirement
```markdown
---
itemId: SWR-AUTH-TOKEN-BASED
itemTitle: Token-Based Authentication
itemHasParent: SHR-AUTH
itemType: Requirement
# Software requirement (system)
Requirement type: SECURITY
---

<!-- Original reference: SWR-TSSDK-1.1 -->

System shall authenticate API requests using access tokens.
```

### Example 4: Detailed Application Requirement
```markdown
---
itemId: SWR-APP-DISCOVERY-DETAILS
itemTitle: Application Details
itemHasParent: SHR-APP-DISCOVERY
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

<!-- Original reference: SWR-TSSDK-2.2 -->

System shall provide application identification, description, and regulatory compliance information for each retrieved application.
```

### Example 5: Request Validation Requirement
```markdown
---
itemId: SWR-APP-EXEC-REQUEST-VALIDATION
itemTitle: Request Validation
itemHasParent: SHR-APP-EXEC
itemType: Requirement
# Software requirement (user)
Requirement type: FUNCTIONAL
Layer: System (backend logic)
---

<!-- Original reference: SWR-TSSDK-3.3 -->

System shall validate run request format before submission to the platform.
```

## Naming Conventions

### itemId Pattern
`SWR-[PARENT-NAME]-[DESCRIPTIVE-SUFFIX]`

**Structure**:
1. **Parent Name**: Must exactly match the parent SHR's descriptive name
   - Example: If parent is `SHR-APP-DISCOVERY`, use `SWR-APP-DISCOVERY-*`

2. **Descriptive Suffix**: Short identifier specific to this requirement
   - Use descriptive keywords: LIST, DETAILS, CREATE, DELETE, VALIDATION, etc.
   - Keep it concise but meaningful
   - Use hyphens for multi-word suffixes

**Examples**:
- `SWR-APP-DISCOVERY-LIST` (parent: SHR-APP-DISCOVERY)
- `SWR-APP-DISCOVERY-DETAILS` (parent: SHR-APP-DISCOVERY)
- `SWR-AUTH-TOKEN-BASED` (parent: SHR-AUTH)
- `SWR-ERROR-COMM-CLI-OUTPUT` (parent: SHR-ERROR-COMM)
- `SWR-APP-EXEC-REQUEST-VALIDATION` (parent: SHR-APP-EXEC)

**Recommendation**: Use descriptive suffixes that clearly indicate the specific functionality being implemented.

## Relationship to SHR

Each SWR must:
1. Reference exactly one parent SHR via `itemHasParent`
2. Implement a specific aspect of that parent SHR
3. Be more detailed and technical than the parent SHR
4. Focus on HOW to implement WHAT the parent SHR describes

**Example Breakdown**:
```
SHR-APP-DISCOVERY: "Application Discovery"
├── SWR-APP-DISCOVERY-LIST: "List Available Applications"
├── SWR-APP-DISCOVERY-DETAILS: "Application Details"
├── SWR-APP-DISCOVERY-VERSION-LIST: "List Application Versions"
└── SWR-APP-DISCOVERY-VERSION-DETAILS: "Application Version Details"
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
- [ ] itemId follows SWR-[PARENT-NAME]-[DESCRIPTIVE-SUFFIX] pattern
- [ ] itemId parent name exactly matches the parent SHR's name
- [ ] itemTitle is clear and descriptive
- [ ] itemHasParent references a valid SHR (exact match)
- [ ] itemType is set to "Requirement"
- [ ] Software requirement type (user|system) is specified
- [ ] Requirement type is one of the valid values
- [ ] Layer is specified (optional but recommended)
- [ ] Requirement description is clear and implementable
- [ ] Requirement is testable/verifiable
- [ ] YAML frontmatter is properly formatted
- [ ] Optional comment included for original reference if migrating
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
