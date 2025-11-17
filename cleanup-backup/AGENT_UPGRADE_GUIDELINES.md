# Agent Upgrade Guidelines



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


This document provides comprehensive guidelines for upgrading and enhancing agent capabilities within the Codeflow ecosystem. These guidelines ensure agents work effectively with orchestrators, maintain proper context management, and follow security and performance best practices.

## 1. Integration with Orchestrator

### Communication Protocols

- **Standardized Interfaces**: Implement consistent API contracts using JSON-RPC or RESTful endpoints for all agent-orchestrator interactions
- **Message Format**: Use structured message formats with clear action types, parameters, and response schemas
- **Error Handling**: Implement comprehensive error handling with specific error codes and recovery mechanisms
- **Health Checks**: Provide health check endpoints for orchestrators to monitor agent status and availability

### Lifecycle Management

- **Dynamic Spawning**: Support on-demand agent instantiation with proper resource allocation and cleanup
- **State Management**: Implement stateless design where possible, or use distributed state management for complex workflows
- **Resource Limits**: Define and enforce resource constraints (CPU, memory, execution time) to prevent system overload
- **Graceful Shutdown**: Implement proper shutdown procedures with state preservation and cleanup routines

### Orchestrator Compatibility

- **Version Negotiation**: Support version negotiation to ensure compatibility between agents and orchestrators
- **Capability Discovery**: Implement capability advertisement so orchestrators can discover and utilize agent features
- **Fallback Mechanisms**: Provide fallback options when primary agents are unavailable or fail
- **Load Balancing**: Support horizontal scaling and load distribution across multiple agent instances

## 2. Context Gathering

### Context Compression Techniques

- **Hierarchical Context**: Organize context in hierarchical structures with summary levels for different detail requirements
- **Selective Filtering**: Implement intelligent filtering to include only relevant context for specific tasks
- **Progressive Loading**: Load context incrementally, starting with high-level summaries and drilling down as needed
- **Context Validation**: Validate context freshness and relevance before using in decision-making processes

### Information Management

- **Caching Strategy**: Implement multi-level caching (memory, disk, distributed) for frequently accessed context
- **Context Boundaries**: Define clear boundaries between different context domains to prevent information leakage
- **Metadata Enrichment**: Add metadata to context including source, timestamp, confidence level, and expiration
- **Context Sharing**: Enable secure context sharing between related agents while maintaining access controls

### Performance Optimization

- **Lazy Loading**: Load context on-demand to minimize initial overhead and memory usage
- **Context Pruning**: Automatically remove outdated or irrelevant context to maintain optimal performance
- **Parallel Processing**: Process multiple context sources concurrently when gathering comprehensive information
- **Resource Monitoring**: Monitor context gathering performance and implement throttling when necessary

## 3. Parallel Collaboration

### Concurrent Execution Design

- **Task Decomposition**: Break complex workflows into independent, parallelizable subtasks
- **Dependency Management**: Define clear task dependencies and execution order requirements
- **Resource Coordination**: Implement resource allocation and coordination mechanisms for shared resources
- **Progress Tracking**: Provide real-time progress updates and status reporting for parallel operations

### Inter-Agent Communication

- **Message Queues**: Use reliable message queues for asynchronous communication between agents
- **Event-Driven Architecture**: Implement event-driven patterns for loose coupling and scalability
- **Synchronization Points**: Define synchronization points for coordinating parallel execution phases
- **Conflict Resolution**: Implement conflict resolution strategies for concurrent resource access

### Scalability Considerations

- **Horizontal Scaling**: Design agents to scale horizontally across multiple instances
- **Load Distribution**: Implement intelligent load distribution algorithms based on agent capabilities and current load
- **Failure Isolation**: Ensure failures in one parallel branch don't affect other executing branches
- **Result Aggregation**: Provide mechanisms for aggregating and consolidating results from parallel operations

## 4. Best Practices

### Security and Safety

- **Input Validation**: Validate all inputs thoroughly to prevent injection attacks and malicious payloads
- **Access Control**: Implement role-based access control with principle of least privilege
- **Secure Communication**: Use encrypted channels for all agent communications and data transfers
- **Audit Logging**: Maintain comprehensive audit logs for all agent actions and decisions

### Reliability and Monitoring

- **Error Recovery**: Implement robust error recovery mechanisms with automatic retry and fallback options
- **Health Monitoring**: Provide detailed health metrics and performance indicators
- **Logging Standards**: Use structured logging with consistent log levels and formats
- **Alerting**: Implement proactive alerting for critical errors and performance degradation

### Code Quality and Maintenance

- **Type Safety**: Use strong typing and validation schemas for all data structures and APIs
- **Testing**: Implement comprehensive test suites including unit, integration, and performance tests
- **Documentation**: Maintain up-to-date documentation for all agent capabilities and APIs
- **Version Control**: Use semantic versioning and maintain backward compatibility where possible

### Performance Optimization

- **Resource Efficiency**: Optimize resource usage through efficient algorithms and data structures
- **Caching Strategies**: Implement intelligent caching with proper cache invalidation mechanisms
- **Profiling**: Regularly profile agent performance and identify optimization opportunities
- **Memory Management**: Implement proper memory management to prevent leaks and optimize usage

## 5. File Write Protocol for Orchestrators

When an agent (especially an orchestrator like smart-subagent-orchestrator) determines that a file needs to be created, updated, or deleted, it must:

- Spawn a specialized subagent (e.g., full-stack-developer, content-writer, or other with write permissions) to perform the file operation.
- Provide the subagent with all necessary context, requirements, and success criteria for the file write.
- Never attempt to write files directly; always delegate to a subagent with explicit write access.
- Ensure proper handoff: Include any relevant context, dependencies, and integration points.
- Monitor and verify the subagent's output for completeness and correctness before marking the task as complete.

### Implementation Guidelines

- **Permission Validation**: Verify that the target subagent has appropriate write permissions for the intended operation
- **Context Completeness**: Ensure all required context (file path, content requirements, formatting standards) is provided
- **Success Criteria**: Define clear, measurable success criteria for the file operation
- **Error Handling**: Implement proper error handling for file operation failures with rollback mechanisms
- **Audit Trail**: Maintain an audit trail of all file operations including who initiated, what was changed, and when

### Security Considerations

- **Path Validation**: Validate file paths to prevent directory traversal attacks
- **Content Sanitization**: Sanitize file content to prevent injection of malicious code
- **Access Logging**: Log all file write operations for security auditing
- **Backup Creation**: Create backups of modified files before making changes

### Quality Assurance

- **Content Validation**: Validate file content against defined schemas and requirements
- **Integration Testing**: Test file changes in the context of the larger system
- **Review Process**: Implement peer review processes for critical file changes
- **Rollback Procedures**: Maintain rollback procedures for failed or incorrect file operations
