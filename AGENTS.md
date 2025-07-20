# AGENTS.md - Development Guidelines

## Project Overview
This repository contains an AI-powered product development toolkit with specialized agent personalities and comprehensive development tools. The project uses a structured workflow from product requirements to implementation.

## Project Structure
- `/personality/` - AI agent role prompts for product development workflow
- `/sparc_tools/` - Development tools documentation (MCP, infrastructure, protocols)
- `/plans/` - Project implementation plans and progress tracking
- `/live-coding/` - Live development sessions and prototypes

## Build/Test Commands
Technology stack focus: **Python + FastAPI + SQLModel + SQLite** (prototype)
- `python -m pytest` / `python -m pytest path/to/test_file.py::test_function` (Python testing)
- `uvicorn main:app --reload` (FastAPI development server)
- `docker build -t app .` / `docker run -p 8000:8000 app` (Docker containerization)
- `npm run build` / `npm run dev` (if Node.js frontend is added)

## Plan Management Guidelines

### Plan Creation and Location
- **ALWAYS** create plan.md files in the `/plans/` directory
- Use descriptive filenames: `/plans/[project-name]-plan.md` or `/plans/feature-[name]-plan.md`
- Each major feature or project phase should have its own plan file

### Plan Content Requirements
Plans must be **verbose and comprehensive**, including:
- **Project/Feature Overview** with clear objectives
- **Detailed Phase Breakdown** with specific, actionable tasks
- **Task Dependencies** and prerequisites clearly marked
- **Difficulty Estimates** (Easy/Medium/Complex) for each task
- **Progress Tracking** with completion status and dates
- **Implementation Notes** and decisions made during development
- **Blockers and Resolutions** documented as they occur

### Progress Tracking Protocol
- **Update plans regularly** as work progresses (minimum: after each coding session)
- Mark completed tasks with completion dates: `- [x] Task description (Completed: YYYY-MM-DD)`
- Add implementation notes directly in the plan: `- [x] Task (Completed: 2024-01-15) - Notes: Used FastAPI dependency injection`
- Document any deviations from original plan with rationale
- Add new tasks discovered during implementation
- Update difficulty estimates if they prove incorrect

### Plan Update Triggers
Update plans when:
- Starting a new development session
- Completing any task (no matter how small)
- Encountering blockers or changing approach
- Adding new requirements or scope changes
- After code reviews or testing phases
- At the end of each development day

## Code Style Guidelines
Follow these principles for the **Python + FastAPI + SQLModel** stack:
- Use consistent indentation (4 spaces for Python, 2 for frontend)
- Follow Python naming conventions (snake_case for variables/functions, PascalCase for classes)
- Add comprehensive type annotations using Python type hints and SQLModel
- Use descriptive variable and function names that reflect business logic
- Handle errors gracefully with FastAPI exception handlers
- Import organization: standard library, third-party (FastAPI, SQLModel), local imports
- Add comprehensive docstrings for all public APIs and complex functions
- Use async/await for I/O operations where beneficial

## Technology Choices Management

### Tech Choices Documentation
- **ALWAYS** maintain `/plans/tech_choices.md` as the single source of truth for technology decisions
- **Update during planning phase** whenever technology choices are made, changed, or validated
- **Include rationale** for each technology selection with benefits, costs, and alternatives considered
- **Track decision timeline** with dates and decision makers
- **Document integration complexity** and cost implications for each choice

### Tech Choices Update Protocol
Update `/plans/tech_choices.md` when:
- **New technology is selected** or existing choice is changed
- **Alternative technologies are evaluated** (document comparison results)
- **Cost implications change** (pricing updates, usage scaling)
- **Integration challenges discovered** during implementation
- **Performance benchmarks completed** (update with actual metrics)
- **Risk assessment changes** (new risks identified or mitigated)

### Tech Choices Content Requirements
- **Decision Status**: Selected, Under Evaluation, Rejected (with reasons)
- **Rationale**: Why this technology was chosen over alternatives
- **Key Benefits**: Specific advantages for the learning portal use case
- **Integration Complexity**: Low/Medium/High with explanation
- **Cost Impact**: Specific pricing information and scaling considerations
- **Alternatives Considered**: Other options evaluated and why they were not selected
- **Risk Assessment**: Potential issues and mitigation strategies
- **Implementation Notes**: Lessons learned during actual implementation

## AI Agent Workflow Integration
When using personality prompts from `/personality/`:
1. **Product Manager** creates PRD → save to `/plans/product-requirements.md`
2. **Solution Architect** creates architecture → save to `/plans/architecture-guide.md`
3. **Data Architect** creates schema → save to `/plans/database-design.md`
4. **API Developer** creates API spec → save to `/plans/api-specification.md`
5. **Planner** creates implementation plan → save to `/plans/implementation-plan.md`
6. **Prompt Engineer** evaluates tech choices → update `/plans/tech_choices.md`
7. **All agents** update their respective plans as implementation progresses

## Development Session Protocol
For each coding session:
1. Review current plan in `/plans/` directory
2. **Check `/plans/tech_choices.md`** for relevant technology decisions and constraints
3. Update plan with session objectives
4. Implement features following the plan and technology choices
5. **Update tech choices** if implementation reveals new insights, costs, or integration issues
6. Document progress, decisions, and any plan deviations
7. Update plan with completion status and next steps
8. Commit both code changes AND updated plans (including tech_choices.md if modified)

## Notes
- All personality prompts are optimized for **FastAPI + SQLModel + SQLite** stack
- MCP tools available for enhanced AI development workflows
- Plans should be living documents that evolve with the project
- Verbose documentation is preferred over minimal notes
- Track both successes and failures for future reference