# AGENTS.md - Development Guidelines

## Project Overview
This repository contains an AI-powered product development toolkit with specialized agent personalities and comprehensive development tools. The project uses a structured workflow from product requirements to implementation.

## Project Structure
- `/personality/` - AI agent role prompts for product development workflow
- `/sparc_tools/` - Development tools documentation (MCP, infrastructure, protocols)
- `/plans/` - **SINGLE SOURCE**: All project implementation plans and progress tracking
  - `implementation-plan.md`: The main, multi-phase plan for developing the learning portal
  - `tech_choices.md`: The single source of truth for all technology stack decisions
  - `visual-asset-plan.md`: The plan for generating and managing visual assets for the project
- `/live-coding/` - Live development sessions and prototypes
  - `/config/` - **NEW**: Centralized configuration management
    - `/build/` - Build-related configs (Jest, Next.js, Tailwind, PostCSS)
    - `/quality/` - Code quality configs (ESLint, Prettier, Lighthouse)
    - `/deployment/` - Deployment configs (Vercel)
    - `/typescript/` - TypeScript configuration
  - `/src/` - Application source code
  - `/tests/` - Comprehensive test suite (unit, integration, infrastructure)
  - `/tech_docs/` - **MANDATORY REFERENCE**: Technical documentation for approved technologies

## Build/Test Commands
Technology stack focus: **Next.js 14 + React 18 + Supabase + PostgreSQL + GraphQL** (as defined in SA.md)
- `npm run dev` / `npm run build` (Next.js development and production builds)
- `npm test` / `npm run test:e2e` (React/Next.js testing)
- `supabase start` / `supabase db reset` (Local Supabase development)
- `docker build -t app .` / `docker run -p 3000:3000 app` (Docker containerization)

## Plan Management Guidelines

### **CRITICAL RESTRICTION: NO NEW PLAN FILES**
- **NEVER** create new plan.md files - the project is in maintenance/testing phase
- **ONLY UPDATE** existing plans in `/plans/` directory:
  - `implementation-plan.md` - Update with testing progress and infrastructure setup
  - `tech_choices.md` - Update with any configuration or deployment decisions
  - `visual-asset-plan.md` - Update only if visual assets are modified
- **FORBIDDEN**: Creating feature-specific plans, refactoring plans, or any new planning documents

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

### Plan Update Triggers (RESTRICTED SCOPE)
Update **EXISTING** plans only when:
- **Testing Results**: Update implementation-plan.md with test outcomes and coverage
- **Infrastructure Setup**: Update implementation-plan.md with deployment progress
- **Configuration Changes**: Update tech_choices.md with config reorganization decisions
- **Bug Fixes**: Update implementation-plan.md with critical fixes and resolutions
- **Performance Issues**: Update implementation-plan.md with optimization results
- **FORBIDDEN**: New feature planning, architectural changes, scope expansion

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

## Post-Reorganization Testing Protocol

### **MANDATORY TESTING AFTER CODE REORGANIZATION**
After any significant code reorganization, file moves, or structural changes:

1. **Configuration Validation**
   - Verify all config files work from new locations
   - Test build process: `npm run build`
   - Test development server: `npm run dev`
   - Validate TypeScript compilation: `npm run type-check`

2. **Comprehensive Test Suite Execution**
   - **Unit Tests**: `npm run test:unit` - All 83+ unit tests must pass
   - **Integration Tests**: `npm run test:integration` - Cross-component functionality
   - **Full Test Suite**: `npm run test:coverage` - Verify 90%+ coverage maintained
   - **CI Tests**: `npm run test:ci` - Production-ready test validation

3. **Cross-Phase Integration Verification**
   - Run Phase Integration tests to verify all phases still work together
   - Test authentication flows (Phase 2) with UI components (Phase 1)
   - Verify content management (Phase 3) with authorization (Phase 2)
   - Validate advanced features (Phase 4) with all previous phases

4. **Infrastructure and Build Validation**
   - Test infrastructure setup scripts: `./tests/infrastructure/validate-setup.sh`
   - Verify Storybook builds: `npm run build-storybook`
   - Validate linting and formatting: `npm run lint` and `npm run format:check`

### **Development Session Protocol (MAINTENANCE PHASE)**
For each coding session in maintenance/testing phase:
1. **Configuration Check**: Verify all configs work from new `/config/` structure
2. **Test Status Review**: Check which tests are failing after reorganization
3. **MANDATORY: Run Tests First**: Execute test suite before any code changes
4. **Fix Broken Tests**: Address any test failures caused by reorganization
5. **Integration Validation**: Verify cross-component functionality still works
6. **Performance Check**: Ensure reorganization didn't impact performance
7. **Update Documentation**: Update only existing plans with testing results
8. **Quality Gate**: All tests must pass before considering work complete

## Best Practices Enforcement

### Development Standards (MAINTENANCE PHASE)
- **Test-First Approach**: Run existing tests before making any changes
- **Regression Prevention**: Ensure reorganization doesn't break existing functionality
- **Integration Validation**: Verify all 4 phases continue to work together seamlessly
- **Configuration Management**: Maintain centralized config structure in `/config/`
- **Documentation Updates**: Update only existing plans with testing and infrastructure progress
- **Performance Monitoring**: Ensure reorganization maintains performance benchmarks
- **Quality Gates**: 90%+ test coverage must be maintained after any changes

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