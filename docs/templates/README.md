# [Directory or Component Name]

Briefly describe what this directory contains and the responsibility it owns. Keep this README focused on this part of the project.

## Contents

- `[path/]` — [what this directory contains]
- `[file.ext]` — [what this file is for]

Remove entries that do not apply. List only files and directories that exist.

## How It Fits

Explain how this component relates to the rest of the project and which responsibilities belong here. Link to the relevant architecture or feature documentation instead of copying rules that are maintained elsewhere.

- **Depends on:** [internal modules or external services]
- **Used by:** [callers, services, or other components]
- **Owns:** [responsibilities and boundaries]

## Requirements

List only the tools, runtime versions, services, or environment variables required to work on this component.

- [Requirement and version, if verified]
- [Required local service or configuration]

If the component has no separate requirements, remove this section.

## Development

Explain how to run or work on this component from the repository root or from this directory, and state which working directory each command expects.

```sh
# Replace with a verified command for this component.
[command]
```

Do not copy commands from another component or invent scripts. If the root README or development guide already documents the workflow, link to it and include only component-specific steps here.

## Configuration

Document only configuration this component actually reads.

| Name | Required | Purpose |
| --- | --- | --- |
| `[VARIABLE]` | [Yes/No] | [What it configures] |

Remove this table if there is no component-specific configuration. Never include real secrets or credentials.

## Testing and Quality Checks

List the tests and checks relevant to this component, using commands verified in the repository.

```sh
# Replace with verified test or quality-check commands.
[command]
```

If tests are run centrally, link to the shared testing guide instead of duplicating it.

## Related Documentation

- [Relevant guide](../path/to/guide.md) — [what it explains]
- [API or architecture reference](../path/to/reference.md) — [what it defines]

Use links relative to the location of this README. Update their paths when copying this template into another directory. Keep each rule in its owning document; link to it rather than maintaining a second version here.

---

**Maintainer note:** Replace every bracketed placeholder, remove sections that do not apply, verify all paths and commands, and keep this README specific to the directory where it lives.
