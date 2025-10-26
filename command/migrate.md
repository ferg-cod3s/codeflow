---
name: migrate
mode: command
description: Perform database schema and data migrations with zero downtime
version: 1.0.0
inputs:
  - name: migration_type
    description: Type of migration (schema, data, both)
    type: string
    default: schema
  - name: source
    description: Source database or schema version
    type: string
    required: true
  - name: target
    description: Target database or schema version
    type: string
    required: true
  - name: downtime_allowed
    description: Whether downtime is allowed (true, false)
    type: boolean
    default: false
  - name: rollback_strategy
    description: Rollback strategy (automatic, manual, none)
    type: string
    default: automatic
  - name: validation_level
    description: Level of validation (basic, thorough, comprehensive)
    type: string
    default: thorough
outputs:
  - Migration scripts and execution plans
  - Rollback procedures and scripts
  - Data validation reports
  - Performance impact analysis
  - Migration documentation and runbooks
cache_strategy:
  type: tiered
  ttl: 7200
  key_pattern: 'migrate:{source}:{target}:{migration_type}'
success_signals:
  - Migration completed successfully
  - Data integrity validated
  - Performance within acceptable limits
  - Rollback procedures tested
failure_modes:
  - Migration script execution failures
  - Data corruption or loss
  - Performance degradation beyond thresholds
  - Rollback procedure failures
---

# Migrate Command

## Overview

The `migrate` command performs database schema and data migrations with zero downtime capabilities. It provides comprehensive migration planning, execution, validation, and rollback procedures for safe database changes.

## Phases

### Phase 1: Migration Analysis and Planning

**Agent:** `development-migrations-specialist`
**Objective:** Analyze migration requirements and create execution plan

**Tasks:**

- Analyze source and target schema differences
- Identify data transformation requirements
- Assess migration complexity and risks
- Estimate migration duration and resource requirements
- Create detailed migration execution plan

**Parallel Execution:**

- `database-expert` - Schema analysis and optimization
- `data-engineer` - Data transformation planning

### Phase 2: Migration Script Generation

**Agent:** `development-migrations-specialist`
**Objective:** Generate migration scripts and procedures

**Tasks:**

- Generate forward migration scripts
- Create rollback migration scripts
- Develop data transformation procedures
- Create validation and verification scripts
- Generate performance monitoring queries

**Parallel Execution:**

- `database-optimizer` - Performance optimization scripts
- `sql-pro` - Advanced SQL query optimization

### Phase 3: Zero-Downtime Strategy Design

**Agent:** `development-migrations-specialist`
**Objective:** Design zero-downtime migration strategy

**Tasks:**

- Design blue-green deployment strategy
- Create feature flag implementation plan
- Develop shadow database setup
- Plan application compatibility layers
- Create traffic routing procedures

**Parallel Execution:**

- `infrastructure-builder` - Infrastructure setup for migration
- `backend-architect` - Application compatibility design

### Phase 4: Pre-Migration Validation

**Agent:** `database-expert`
**Objective:** Validate migration readiness and prerequisites

**Tasks:**

- Validate source database consistency
- Test migration scripts in staging environment
- Verify backup and restore procedures
- Validate rollback procedures
- Check resource capacity and performance

**Parallel Execution:**

- `quality-testing-performance-tester` - Performance validation
- `security-scanner` - Security validation of migration

### Phase 5: Migration Execution

**Agent:** `development-migrations-specialist`
**Objective:** Execute migration with monitoring and validation

**Tasks:**

- Execute pre-migration backups
- Run migration scripts with monitoring
- Monitor system performance during migration
- Validate data integrity post-migration
- Update application configurations

**Parallel Execution:**

- `monitoring-expert` - Real-time monitoring
- `incident-responder` - Incident response readiness

### Phase 6: Post-Migration Validation

**Agent:** `database-expert`
**Objective:** Validate migration success and system stability

**Tasks:**

- Perform comprehensive data validation
- Validate application functionality
- Monitor performance metrics
- Verify data consistency and integrity
- Conduct security validation

**Parallel Execution:**

- `quality-testing-performance-tester` - Performance testing
- `full-stack-developer` - Application functionality testing

### Phase 7: Cleanup and Optimization

**Agent:** `database-optimizer`
**Objective:** Optimize post-migration performance and cleanup

**Tasks:**

- Optimize database indexes and statistics
- Clean up temporary migration artifacts
- Update monitoring and alerting configurations
- Optimize queries for new schema
- Document final state and changes

**Parallel Execution:**

- `infrastructure-builder` - Infrastructure cleanup
- `documentation-specialist` - Final documentation updates

## Implementation Details

### Migration Types

#### Schema Migrations

- **Table Creation**: New tables, columns, indexes, constraints
- **Table Modification**: Column changes, type conversions, constraint updates
- **Index Management**: Index creation, modification, deletion
- **Constraint Changes**: Primary keys, foreign keys, unique constraints
- **Data Type Changes**: Type conversions, precision changes

#### Data Migrations

- **Data Transformation**: Format changes, calculations, aggregations
- **Data Movement**: Table-to-table transfers, partitioning changes
- **Data Cleansing**: Duplicate removal, validation, normalization
- **Data Enrichment**: Adding computed columns, derived data
- **Data Archival**: Moving old data to archive tables

#### Combined Migrations

- **Schema + Data**: Complex migrations requiring both changes
- **Multi-step Migrations**: Phased approaches for large changes
- **Cross-database Migrations**: Moving between different database systems
- **Version Upgrades**: Database version migrations with schema changes

### Zero-Downtime Strategies

#### Blue-Green Deployment

- **Parallel Environments**: Maintain old and new versions simultaneously
- **Traffic Switching**: Gradual traffic routing between environments
- **Validation Period**: Test new version before full switch
- **Instant Rollback**: Quick revert to previous version if needed

#### Shadow Database

- **Read Replicas**: Use read replicas for testing
- **Shadow Writes**: Write to both old and new schemas
- **Data Validation**: Compare results between schemas
- **Gradual Cutover**: Slowly increase traffic to new schema

#### Feature Flags

- **Application-level Control**: Use feature flags to control migration
- **Gradual Rollout**: Enable migration for subsets of users
- **Instant Disable**: Quick rollback if issues detected
- **A/B Testing**: Compare performance between versions

#### Compatibility Layers

- **API Compatibility**: Maintain backward-compatible APIs
- **Data Mapping**: Map between old and new data structures
- **Translation Layers**: Translate between schema versions
- **Graceful Degradation**: Handle both schema versions during transition

### Migration Strategies

#### Rolling Migrations

- **Incremental Changes**: Break large migrations into small steps
- **Backward Compatibility**: Maintain compatibility during migration
- **Gradual Updates**: Update components incrementally
- **Risk Mitigation**: Reduce risk through small, reversible changes

#### Big Bang Migrations

- **All-at-Once**: Complete migration in single operation
- **Planned Downtime**: Schedule maintenance window
- **Comprehensive Testing**: Extensive pre-migration testing
- **Full Rollback Plan**: Complete rollback procedures

#### Hybrid Approaches

- **Phased Migration**: Combine rolling and big bang approaches
- **Critical Path**: Identify and prioritize critical migration steps
- **Risk Assessment**: Balance risk and complexity
- **Contingency Planning**: Multiple fallback strategies

### Validation Strategies

#### Data Integrity Validation

- **Row Count Validation**: Compare row counts before and after
- **Checksum Validation**: Compare data checksums
- **Sample Validation**: Validate sample data sets
- **Business Rule Validation**: Validate business logic constraints
- **Cross-Reference Validation**: Validate foreign key relationships

#### Performance Validation

- **Query Performance**: Compare query execution times
- **Index Usage**: Validate index effectiveness
- **Resource Utilization**: Monitor CPU, memory, I/O usage
- **Concurrency Testing**: Test under load conditions
- **Benchmark Comparison**: Compare against performance baselines

#### Application Validation

- **Functional Testing**: Test all application features
- **Integration Testing**: Test system integrations
- **User Acceptance Testing**: Validate user workflows
- **API Testing**: Test API endpoints and contracts
- **End-to-End Testing**: Test complete user journeys

### Rollback Strategies

#### Automatic Rollback

- **Trigger Conditions**: Define automatic rollback triggers
- **Performance Thresholds**: Set performance-based rollback conditions
- **Error Rate Thresholds**: Rollback on error rate increases
- **Data Validation Failures**: Automatic rollback on validation failures
- **Time-based Rollback**: Rollback if migration exceeds time limits

#### Manual Rollback

- **Decision Points**: Define manual decision points
- **Rollback Procedures**: Document manual rollback steps
- **Approval Workflows**: Require approval for rollback decisions
- **Communication Plans**: Plan rollback communications
- **Post-Rollback Validation**: Validate system state after rollback

#### Point-in-Time Recovery

- **Backup Strategy**: Maintain point-in-time backups
- **Recovery Procedures**: Document recovery procedures
- **Data Consistency**: Ensure data consistency after recovery
- **Application State**: Restore application state
- **Validation Testing**: Test system after recovery

## Integration Examples

### Schema Migration

```bash
/migrate migration_type="schema" source="v1.0" target="v1.1" downtime_allowed=false rollback_strategy="automatic" validation_level="thorough"
```

### Data Migration

```bash
/migrate migration_type="data" source="legacy_system" target="new_system" downtime_allowed=true rollback_strategy="manual" validation_level="comprehensive"
```

### Combined Migration

```bash
/migrate migration_type="both" source="postgres_12" target="postgres_14" downtime_allowed=false rollback_strategy="automatic" validation_level="thorough"
```

## Output Documentation

The command generates comprehensive migration documentation including:

1. **Migration Execution Plan**
2. **Migration Scripts and Procedures**
3. **Rollback Documentation**
4. **Data Validation Reports**
5. **Performance Impact Analysis**
6. **Runbooks and Troubleshooting Guides**
7. **Post-Migration Optimization Recommendations**

## Success Criteria

- Migration completed successfully without data loss
- Data integrity validated and confirmed
- Performance within acceptable thresholds
- Application functionality verified
- Rollback procedures tested and validated
- Documentation complete and accurate

## Risk Mitigation

### Pre-Migration Risks

- **Data Loss**: Comprehensive backup strategies
- **Downtime**: Zero-downtime migration techniques
- **Performance Degradation**: Performance testing and monitoring
- **Application Compatibility**: Compatibility layers and testing
- **Rollback Failures**: Comprehensive rollback testing

### During Migration Risks

- **Migration Failures**: Error handling and retry mechanisms
- **Data Corruption**: Real-time validation and monitoring
- **Performance Issues**: Performance monitoring and optimization
- **Application Errors**: Application monitoring and alerting
- **Resource Exhaustion**: Resource monitoring and scaling

### Post-Migration Risks

- **Hidden Issues**: Extended monitoring and validation
- **Performance Regression**: Performance monitoring and optimization
- **Data Inconsistencies**: Ongoing data validation
- **Application Issues**: Application monitoring and support
- **Rollback Complexity**: Maintaining rollback capability
