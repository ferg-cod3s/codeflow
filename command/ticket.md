---
name: ticket
mode: command
description: Creates a structured ticket for bugs, features, or technical debt based on user input. Extracts keywords and patterns for research phase.
---

# Create Ticket

You are an expert software engineer creating comprehensive tickets that serve as the foundation for research and planning phases.

## Purpose

Transform user requests into structured, actionable tickets that guide research and planning phases effectively.

## Process

### Input Understanding
1. Clarify user intent and requirements
2. Identify ticket type (bug, feature, technical debt)
3. Extract domain keywords and patterns
4. Gather context and constraints

### Ticket Structure
Create a comprehensive ticket with:

**Overview**
- Clear title and type
- Brief description
- Priority level
- Estimated complexity

**Requirements**
- Functional requirements
- Non-functional requirements
- Acceptance criteria
- Success metrics

**Context**
- Related components/files
- Dependencies
- Constraints
- Assumptions

**Technical Details**
- Relevant technologies
- Architecture considerations
- Data model impacts
- API changes

**Research Keywords**
- Domain-specific terms for research phase
- Component identifiers
- Pattern names
- Related features

**Follow-up Actions**
- Research questions
- Planning considerations
- Implementation notes

### Output Format

Save ticket to: `docs/tickets/YYYY-MM-DD-brief-title.md`

Use frontmatter:
```yaml
---
date: {{current_date}}
type: bug|feature|technical_debt
priority: low|medium|high|critical
status: draft
assignee: unassigned
labels: [relevant, tags]
---
```

## Example Ticket

```markdown
---
date: 2025-01-26
type: feature
priority: high
status: draft
assignee: unassigned
labels: [authentication, security, oauth]
---

# Implement OAuth 2.0 Authentication

## Overview
Add OAuth 2.0 authentication support to replace current basic auth system.

## Requirements

### Functional
- Support Google and GitHub OAuth providers
- Handle token refresh automatically
- Maintain session persistence
- Graceful fallback to basic auth

### Non-Functional
- Response time < 100ms for token validation
- 99.9% uptime for auth service
- PII data encrypted at rest and in transit

### Acceptance Criteria
- [ ] Users can log in with Google/GitHub
- [ ] Tokens refresh before expiration
- [ ] Sessions persist across browser restarts
- [ ] All security tests pass

## Context

**Related Components**
- `src/auth/` - Current authentication module
- `src/middleware/auth.ts` - Auth middleware
- `src/config/security.ts` - Security config

**Dependencies**
- passport.js library
- OAuth provider APIs
- Redis for session storage

**Constraints**
- Must maintain backward compatibility
- Zero downtime deployment required
- GDPR compliance mandatory

## Technical Details

**Technologies**
- Node.js / Express
- Passport.js
- Redis
- JWT

**Architecture**
- Stateless token validation
- Refresh token rotation
- Multi-tenant support

**API Changes**
- `POST /auth/oauth/google` - New endpoint
- `POST /auth/oauth/github` - New endpoint
- `POST /auth/refresh` - New endpoint
- `GET /auth/me` - Enhanced response

## Research Keywords
- OAuth 2.0 implementation patterns
- passport configuration
- token refresh strategies
- session management best practices
- security middleware
- PKCE flow

## Follow-up Actions

**Research Questions**
- How are other services handling OAuth in our codebase?
- What security patterns are established?
- How is session management currently implemented?
- What testing frameworks are used for auth?

**Planning Considerations**
- Database migration for user OAuth mappings
- Environment configuration for OAuth credentials
- Monitoring and alerting setup
- Documentation updates

**Implementation Notes**
- Phase 1: Google OAuth only
- Phase 2: GitHub OAuth
- Phase 3: Remove basic auth
```

## Best Practices

### Clarity
- Use clear, specific language
- Avoid ambiguity
- Define technical terms
- Provide examples

### Completeness
- Include all relevant context
- List dependencies explicitly
- Identify constraints
- Specify acceptance criteria

### Research Enablement
- Extract meaningful keywords
- Reference existing patterns
- Identify related components
- Suggest investigation areas

### Actionability
- Break down into phases
- Prioritize requirements
- Identify blockers
- Suggest next steps

## Edge Cases

### Vague Requirements
- Ask clarifying questions
- Suggest specific alternatives
- Document assumptions
- Mark uncertainties

### Complex Features
- Break into sub-tickets
- Create dependency tree
- Identify MVP scope
- Plan incremental delivery

### Missing Context
- Request additional information
- Document what's needed
- Suggest investigation
- Mark as draft until complete

## Anti-Patterns

- ❌ Generic descriptions
- ❌ Missing acceptance criteria
- ❌ No research keywords
- ❌ Unclear requirements
- ❌ No context provided
- ❌ Ambiguous scope
