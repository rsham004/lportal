# AGENTS.md - Development Guidelines

## Project Overview
This repository contains an AI-powered product development toolkit with specialized agent personalities and comprehensive development tools. The project uses a structured workflow from product requirements to implementation.

## Project Structure
- `/personality/` - AI agent role prompts for product development workflow
- `/sparc_tools/` - Development tools documentation (MCP, infrastructure, protocols)
- `/plans/` - Project implementation plans and progress tracking. This directory contains the following plans:
  - `implementation-plan.md`: The main, multi-phase plan for developing the learning portal.
  - `tech_choices.md`: The single source of truth for all technology stack decisions.
  - `visual-asset-plan.md`: The plan for generating and managing visual assets for the project.
- `/live-coding/` - Live development sessions and prototypes
- `/live-coding/tech_docs/` - **MANDATORY REFERENCE**: Comprehensive technical documentation for approved technologies

## Build/Test Commands
Technology stack focus: **Next.js 14 + React 18 + Supabase + PostgreSQL + GraphQL** (as defined in SA.md)
- `npm run dev` / `npm run build` (Next.js development and production builds)
- `npm test` / `npm run test:e2e` (React/Next.js testing)
- `supabase start` / `supabase db reset` (Local Supabase development)
- `docker build -t app .` / `docker run -p 3000:3000 app` (Docker containerization)

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

## Phased Development Approach

### Phase Gate Methodology
The project follows a **strict phase gate approach** where each phase must be 100% complete before proceeding:

#### **Phase 1: Web Design and Frontend Architecture** (Weeks 1-3)
- Complete responsive frontend architecture with component library
- Automated testing and CI/CD pipeline setup
- Performance optimization and accessibility compliance
- **Gate Criteria**: 95+ Lighthouse score, 90%+ test coverage, design system complete

#### **Phase 2: Authentication and Access Control** (Weeks 4-6)
- Secure authentication with multi-factor support
- Role-based access control implementation
- User management and security monitoring
- **Gate Criteria**: Security audit passed, <100ms auth performance, OWASP compliance

#### **Phase 3: Content Management and Video Delivery** (Weeks 7-10)
- Content management system with video integration
- Progressive web app with offline capabilities
- Course structure and analytics
- **Gate Criteria**: <100ms video start time, offline functionality tested, content system complete

#### **Phase 4: Advanced Features and Optimization** (Weeks 11-14)
- Real-time features and advanced learning tools
- Performance optimization for 100K+ users
- Final testing and production deployment
- **Gate Criteria**: 100K+ user load tested, 99.9% uptime, all features complete

### Phase Completion Requirements
**EVERY phase must meet ALL criteria before proceeding:**
- ✅ **All tasks completed** with code review approval
- ✅ **Automated tests passing** (unit, integration, e2e where applicable)
- ✅ **Performance benchmarks met** for phase-specific metrics
- ✅ **Security review completed** and vulnerabilities addressed
- ✅ **Documentation updated** including implementation notes and lessons learned
- ✅ **Stakeholder sign-off** on phase deliverables
- ✅ **Production deployment** (or staging for later phases) successful

### Quality Assurance Standards
**Code Quality Requirements:**
- **Test Coverage**: Minimum 90% for all phases
- **Code Review**: All code must be reviewed by senior developer
- **Documentation**: All functions and components documented
- **Type Safety**: 100% type coverage verified with mypy
- **Linting**: Zero `ruff` errors, consistent `black` formatting

**Performance Standards:**
- **Core Web Vitals**: LCP <2.5s, FID <100ms, CLS <0.1
- **Lighthouse Score**: 95+ across all metrics
- **Bundle Size**: Optimized for fast loading
- **API Response**: <200ms for 95% of requests
- **Uptime**: 99.9% availability target

**Security Standards:**
- **OWASP Top 10**: All vulnerabilities addressed
- **Data Protection**: GDPR/CCPA compliance
- **Authentication**: Multi-factor authentication required
- **Encryption**: All data encrypted in transit and at rest
- **Audit Logging**: Complete security event logging

**Accessibility Standards:**
- **WCAG 2.1 AA**: Full compliance required
- **Screen Reader**: Complete compatibility
- **Keyboard Navigation**: 100% keyboard accessible
- **Color Contrast**: Minimum 4.5:1 ratio
- **Focus Management**: Clear focus indicators

## Code Style Guidelines
Follow these principles for the **Next.js 14 + React 18 + TypeScript** stack:
- Use consistent indentation (2 spaces for TypeScript/JavaScript)
- Follow TypeScript naming conventions (camelCase for variables/functions, PascalCase for components/types)
- Add comprehensive type annotations using TypeScript and strict mode
- Use descriptive variable and function names that reflect business logic
- Handle errors gracefully with React Error Boundaries and try-catch blocks
- Import organization: React imports, third-party libraries, local imports
- Add comprehensive JSDoc comments for all public APIs and complex functions
- Use async/await for asynchronous operations and proper error handling

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
3. **Data Architect** creates schema → save to `/live-coding/DA.md`
4. **API Developer** creates API spec → save to `/plans/api-specification.md`
5. **Planner** creates implementation plan → save to `/plans/implementation-plan.md`
6. **Prompt Engineer** evaluates tech choices → update `/plans/tech_choices.md`
7. **All agents** update their respective plans as implementation progresses

## Development Session Protocol
For each coding session:
1. **Phase Gate Check**: Verify current phase completion status and requirements
2. Review current plan in `/plans/` directory
3. **MANDATORY: Check `/live-coding/tech_docs/`** for technical documentation of approved technologies
4. **Check `/plans/tech_choices.md`** for relevant technology decisions and constraints
5. **Technology Compliance**: ONLY use technologies documented in SA.md and tech_docs/
6. **Quality Gate Validation**: Ensure previous tasks meet quality standards before starting new work
7. Update plan with session objectives and expected outcomes
8. Implement features following the plan, technology choices, and best practices
9. **Continuous Testing**: Run automated tests throughout development
10. **Code Review**: Submit code for review before marking tasks complete
11. **Update tech choices** if implementation reveals new insights, costs, or integration issues
12. Document progress, decisions, and any plan deviations with lessons learned
13. **Quality Validation**: Verify all quality standards met for completed tasks
14. Update plan with completion status and next steps
15. **Phase Gate Assessment**: Check if phase completion criteria are met
16. Commit both code changes AND updated plans (including tech_choices.md if modified)

## Best Practices Enforcement

### Development Standards
- **Test-Driven Development (TDD)**: Write tests before implementation. All new code should be accompanied by corresponding tests.
- **Code Reviews**: Mandatory peer review for all code changes
- **Continuous Integration**: Automated testing on every commit
- **Documentation**: Update documentation with every feature
- **Security First**: Security considerations in every development decision
- **Performance Monitoring**: Continuous performance tracking and optimization

### Risk Management
- **Phase Gate Reviews**: Technical, security, performance, and business reviews
- **Rollback Procedures**: Version control, database migrations, feature flags
- **Monitoring**: Real-time alerts and comprehensive logging
- **Backup Strategy**: Automated backups with tested restore procedures
- **Disaster Recovery**: Documented procedures for system recovery

### Success Metrics Tracking
- **Technical Metrics**: Performance benchmarks, quality metrics, security compliance
- **Business Metrics**: User satisfaction, system reliability, scalability validation
- **Continuous Improvement**: Regular retrospectives and process optimization

## Technology Compliance Requirements

### MANDATORY Technology Stack (as defined in SA.md)
**ONLY the following technologies may be used:**
- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Framework**: Tailwind CSS, Headless UI
- **State Management**: Zustand, TanStack Query (React Query)
- **Backend**: Vercel/Supabase Edge Functions
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma (TypeScript), SQLModel (Python prototyping only)
- **Authentication**: Clerk
- **Authorization**: CASL + Row Level Security (RLS)
- **Video Delivery**: Mux
- **Caching**: Redis
- **API Design**: GraphQL
- **Deployment**: Vercel

### Technical Documentation Reference
**ALWAYS reference `/live-coding/tech_docs/` before implementing:**
- `nextjs-14-overview.md` - Next.js 14 features and best practices
- `react-18-overview.md` - React 18 components, hooks, and patterns
- `supabase-overview.md` - Database, auth, storage, realtime features
- `postgresql-overview.md` - SQL features, indexing, performance
- `graphql-overview.md` - Schema design, queries, mutations, best practices

### Technology Restrictions
**FORBIDDEN**: Any technology not explicitly listed in SA.md or tech_docs/
- No alternative frameworks (Vue, Angular, Svelte, etc.)
- No alternative databases (MongoDB, MySQL, etc.)
- No alternative auth providers (Auth0, Firebase Auth, etc.)
- No alternative deployment platforms (AWS, GCP, Azure, etc.)
- No alternative state management (Redux, MobX, etc.)

## Notes
- All personality prompts are optimized for **Next.js 14 + React 18 + Supabase** stack
- MCP tools available for enhanced AI development workflows
- Plans should be living documents that evolve with the project
- Verbose documentation is preferred over minimal notes
- Track both successes and failures for future reference
- **CRITICAL**: Technology compliance is mandatory - any deviation requires SA.md update first