# Strategy Generation Patterns by Agent Type

## Research Agent Patterns

### Code-Path Analysis Strategy

**When to Use**: Understanding execution flow, debugging issues, tracing data flow
**Pattern**:

- Identify entry points and exit points
- Trace key decision branches and conditional logic
- Map data transformations and state changes
- Document critical paths and edge cases
- Analyze error handling and exception flows

**Example Application**: "How does user authentication work in this system?"

1. Find login endpoints and entry points
2. Trace credential validation flow
3. Follow token generation and storage
4. Map authorization checks and permissions
5. Document session management and logout

### Pattern Discovery Strategy

**When to Use**: Finding recurring patterns, identifying best practices, understanding conventions
**Pattern**:

- Scan codebase for repeated code structures
- Identify naming conventions and architectural patterns
- Find common utility functions and shared logic
- Analyze design patterns and abstractions
- Document pattern variations and evolution

**Example Application**: "What are the common error handling patterns?"

1. Search for try-catch blocks and error handling
2. Identify error types and response formats
3. Find logging and monitoring patterns
4. Analyze user-facing error messages
5. Document error recovery and retry logic

### Architecture Mapping Strategy

**When to Use**: Understanding system structure, identifying boundaries, planning changes
**Pattern**:

- Identify major components and modules
- Map data flow and dependencies between components
- Document interfaces and contracts
- Analyze separation of concerns
- Identify architectural layers and boundaries

**Example Application**: "How is the payment processing system organized?"

1. Identify payment-related services and modules
2. Map payment flow from UI to external APIs
3. Document data models and persistence
4. Analyze integration points with external services
5. Identify security boundaries and compliance requirements

### Integration Analysis Strategy

**When to Use**: Understanding component interactions, planning integrations, troubleshooting dependencies
**Pattern**:

- Identify integration points and interfaces
- Analyze data exchange formats and protocols
- Document dependency relationships
- Map communication patterns (sync/async)
- Identify potential failure points and fallbacks

**Example Application**: "How does the frontend integrate with the backend?"

1. Identify API endpoints and data contracts
2. Analyze authentication and authorization flow
3. Map real-time communication (WebSockets, etc.)
4. Document error handling and retry logic
5. Identify caching and performance optimizations

## Planning Agent Patterns

### Sequential Planning Strategy

**When to Use**: Linear workflows, clear dependencies, step-by-step processes
**Pattern**:

- Identify prerequisite tasks and dependencies
- Create ordered sequence of activities
- Define completion criteria for each step
- Plan verification and validation points
- Estimate timeline and resource needs

**Example Application**: "Plan database migration for new user table"

1. Design new table schema and relationships
2. Create migration script with rollback plan
3. Test migration in development environment
4. Plan production deployment with downtime window
5. Verify data integrity and application functionality

### Feature-Driven Planning Strategy

**When to Use**: User-facing features, product development, value delivery focus
**Pattern**:

- Define user stories and acceptance criteria
- Break features into deliverable increments
- Plan user experience and interface design
- Coordinate frontend and backend development
- Plan testing and user validation

**Example Application**: "Plan user profile management feature"

1. Define user profile requirements and user stories
2. Design UI components and user flow
3. Plan backend API and data model
4. Coordinate frontend and backend development
5. Plan testing, deployment, and user training

### Minimal Viable Planning Strategy

**When to Use**: Quick validation, resource constraints, iterative development
**Pattern**:

- Identify core value proposition
- Define smallest useful increment
- Plan rapid development and deployment
- Build in feedback collection mechanisms
- Plan iterative improvements based on usage

**Example Application**: "Plan basic analytics dashboard"

1. Define essential metrics and visualizations
2. Implement basic data collection and storage
3. Create simple dashboard with key charts
4. Deploy to subset of users for feedback
5. Plan enhancements based on user needs

### Parallel Planning Strategy

**When to Use**: Independent workstreams, team coordination, resource optimization
**Pattern**:

- Identify independent work packages
- Assign workstreams to team members
- Plan integration points and coordination
- Define interfaces and contracts between streams
- Plan testing and validation across streams

**Example Application**: "Plan e-commerce checkout system"

1. Parallel stream: Payment processing integration
2. Parallel stream: Shipping and tax calculation
3. Parallel stream: Order management and inventory
4. Integration: Combine all streams in checkout flow
5. Testing: End-to-end checkout validation

## Development Agent Patterns

### Component-First Strategy

**When to Use**: UI-heavy features, React/Vue/Angular development, design system integration
**Pattern**:

- Build UI components with mock data
- Implement component state management
- Add styling and responsive design
- Integrate with backend APIs
- Add error handling and loading states

**Example Application**: "Build product search interface"

1. Create search input and results components
2. Implement filtering and sorting UI
3. Add pagination and loading states
4. Integrate with search API endpoints
5. Add error handling and empty states

### API-First Strategy

**When to Use**: Backend services, microservices, mobile app backends
**Pattern**:

- Design API contracts and data models
- Implement endpoints with validation
- Add authentication and authorization
- Create documentation and testing tools
- Build client integrations

**Example Application**: "Build user management API"

1. Design user data model and endpoints
2. Implement CRUD operations with validation
3. Add authentication and role-based access
4. Create API documentation and tests
5. Build admin interface for user management

### Data-First Strategy

**When to Use**: Data-intensive applications, analytics, reporting systems
**Pattern**:

- Design data models and relationships
- Implement data access layer
- Create migration scripts and seeding
- Build data processing and validation
- Implement business logic and services

**Example Application**: "Build reporting system"

1. Design report data models and storage
2. Implement data collection and aggregation
3. Create report generation logic
4. Build export and visualization features
5. Add scheduling and automation

### Integration-First Strategy

**When to Use**: Connecting existing systems, API integrations, workflow automation
**Pattern**:

- Analyze existing systems and interfaces
- Design integration patterns and data flow
- Implement adapters and connectors
- Handle authentication and data transformation
- Add monitoring and error handling

**Example Application**: "Integrate CRM with email marketing"

1. Analyze CRM and email platform APIs
2. Design data synchronization patterns
3. Implement integration connectors
4. Handle data mapping and transformation
5. Add monitoring and conflict resolution

## Pattern Selection Guidelines

### Choose Based On:

- **Problem Type**: Research vs. Planning vs. Development
- **Context**: Existing codebase vs. new development
- **Constraints**: Time, resources, team skills
- **Requirements**: Speed vs. quality vs. maintainability

### Combine Patterns When:

- Complex problems require multiple approaches
- Different phases need different strategies
- Team expertise spans multiple domains
- Risk mitigation requires diverse approaches

### Adapt Patterns By:

- Scaling complexity up or down
- Adjusting for team size and skills
- Modifying for specific technologies
- Customizing for organizational constraints
