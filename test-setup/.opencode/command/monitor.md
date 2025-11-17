---
name: monitor
mode: command
description: Set up comprehensive monitoring and alerting for applications and infrastructure
version: 1.0.0
inputs:
  - name: target
    description: Application, service, or infrastructure component to monitor
    type: string
    required: true
  - name: monitoring_type
    description: Type of monitoring to implement (application, infrastructure, user_experience, business)
    type: string
    default: application
  - name: alert_channels
    description: Alert notification channels (slack, email, pagerduty, teams)
    type: array
    default:
      - slack
  - name: sla_targets
    description: Service level agreement targets and thresholds
    type: object
    default:
      {}
outputs:
  - Monitoring dashboards and visualizations
  - Alert configurations and escalation policies
  - SLA monitoring and reporting
  - Performance baseline documentation
cache_strategy:
  type: tiered
  ttl: 3600
  key_pattern: monitor:{target}:{monitoring_type}
success_signals:
  - Monitoring dashboards accessible and populated
  - Alert rules configured and tested
  - SLA tracking implemented
  - Documentation completed
failure_modes:
  - Monitoring service unavailable
  - Insufficient permissions for monitoring setup
  - Invalid target configuration
  - Alert channel configuration failures
model: opencode/grok-code
last_updated: 2025-11-03
command_schema_version: "1.0"
---
# Monitor Command

**Input**: $ARGUMENTS


## Overview

The `monitor` command sets up comprehensive monitoring and alerting for applications, infrastructure, and business metrics. It provides end-to-end monitoring setup including dashboard creation, alert configuration, and SLA tracking.

## Phases

### Phase 1: Discovery and Planning

**Agent:** `codebase-locator`
**Objective:** Identify monitoring requirements and existing infrastructure

**Tasks:**

- Analyze application architecture and dependencies
- Identify key performance indicators (KPIs)
- Map service dependencies and data flows
- Review existing monitoring tools and configurations
- Document monitoring requirements and SLA targets

**Parallel Execution:**

- `codebase-analyzer` - Analyze application performance patterns
- `infrastructure-builder` - Review infrastructure monitoring needs

### Phase 2: Monitoring Infrastructure Setup

**Agent:** `monitoring-expert`
**Objective:** Configure monitoring infrastructure and data collection

**Tasks:**

- Set up monitoring agents and collectors
- Configure metric collection and storage
- Implement log aggregation and analysis
- Set up distributed tracing
- Configure synthetic monitoring

**Parallel Execution:**

- `infrastructure-builder` - Deploy monitoring infrastructure
- `security-scanner` - Ensure monitoring security compliance

### Phase 3: Dashboard and Visualization

**Agent:** `analytics-engineer`
**Objective:** Create comprehensive monitoring dashboards

**Tasks:**

- Design application performance dashboards
- Create infrastructure monitoring views
- Build business metrics dashboards
- Implement real-time monitoring displays
- Create executive summary views

**Parallel Execution:**

- `ux-optimizer` - Optimize dashboard usability
- `data-engineer` - Configure data pipelines for metrics

### Phase 4: Alert Configuration

**Agent:** `monitoring-expert`
**Objective:** Configure intelligent alerting and escalation

**Tasks:**

- Define alert thresholds and conditions
- Configure multi-channel alert routing
- Implement alert suppression and de-duplication
- Set up escalation policies
- Create on-call schedules and rotations

**Parallel Execution:**

- `operations-incident-commander` - Review alert procedures
- `security-scanner` - Configure security alerting

### Phase 5: SLA and Business Metrics

**Agent:** `business-analyst`
**Objective:** Implement SLA tracking and business metrics

**Tasks:**

- Define SLA metrics and calculation methods
- Set up SLA monitoring and reporting
- Configure business KPI tracking
- Create customer experience metrics
- Implement revenue and usage monitoring

**Parallel Execution:**

- `analytics-engineer` - Configure business metric calculations
- `documentation-specialist` - Create SLA documentation

### Phase 6: Testing and Validation

**Agent:** `quality-testing-performance-tester`
**Objective:** Validate monitoring setup and alert functionality

**Tasks:**

- Test metric collection accuracy
- Validate alert triggering and routing
- Perform load testing on monitoring systems
- Test dashboard performance and usability
- Conduct disaster recovery testing

**Parallel Execution:**

- `incident-responder` - Test incident response procedures
- `security-auditor` - Validate monitoring security

## Implementation Details

### Monitoring Types

#### Application Monitoring

- Application Performance Monitoring (APM)
- Error tracking and exception monitoring
- Transaction tracing and profiling
- Custom application metrics
- User experience monitoring

#### Infrastructure Monitoring

- Server and container metrics
- Network performance and availability
- Database performance monitoring
- Storage and backup monitoring
- Cloud resource utilization

#### User Experience Monitoring

- Real user monitoring (RUM)
- Synthetic transaction monitoring
- Frontend performance metrics
- Mobile app performance
- API response time monitoring

#### Business Metrics

- Revenue and transaction monitoring
- User engagement and conversion
- Customer satisfaction metrics
- Operational efficiency metrics
- Compliance and audit metrics

### Alert Management

#### Alert Types

- **Critical**: Immediate response required (P1)
- **High**: Response within 1 hour (P2)
- **Medium**: Response within 4 hours (P3)
- **Low**: Response within 24 hours (P4)

#### Escalation Policies

- Tier 1: On-call engineer
- Tier 2: Team lead
- Tier 3: Engineering manager
- Tier 4: Director/VP

#### Alert Channels

- **Slack**: Real-time notifications and discussions
- **Email**: Detailed alert information and reports
- **PagerDuty**: Critical alert escalation
- **Microsoft Teams**: Enterprise notifications
- **SMS**: Critical alert notifications

### Dashboard Categories

#### Executive Dashboards

- Service health overview
- SLA compliance status
- Business KPI trends
- Cost and resource utilization
- Customer satisfaction metrics

#### Engineering Dashboards

- Application performance metrics
- Infrastructure health
- Error rates and patterns
- Deployment and release tracking
- Team performance metrics

#### Operations Dashboards

- Real-time system status
- Incident and outage tracking
- Capacity and utilization
- Backup and recovery status
- Security event monitoring

## Best Practices

### Monitoring Design

- Follow the "Three Pillars of Monitoring": Metrics, Logs, Traces
- Implement the "Golden Signals": Latency, Traffic, Errors, Saturation
- Use RED methodology for services: Rate, Errors, Duration
- Apply USE methodology for resources: Utilization, Saturation, Errors

### Alert Configuration

- Avoid alert fatigue with intelligent thresholds
- Use multi-condition alerts for reduced false positives
- Implement alert grouping and correlation
- Include runbooks and troubleshooting guides
- Regular alert review and optimization

### Dashboard Design

- Follow dashboard design principles and best practices
- Use consistent color schemes and visualizations
- Include context and annotations
- Optimize for different user roles and needs
- Regular dashboard review and updates

## Integration Examples

### Setting up Application Monitoring

```bash
/monitor target="user-service" monitoring_type="application" alert_channels=["slack","pagerduty"] sla_targets={"availability":99.9,"response_time":500}
```

### Infrastructure Monitoring

```bash
/monitor target="production-cluster" monitoring_type="infrastructure" alert_channels=["email","teams"] sla_targets={"cpu_utilization":80,"memory_utilization":85}
```

### Business Metrics Monitoring

```bash
/monitor target="revenue-tracking" monitoring_type="business" alert_channels=["slack","email"] sla_targets={"daily_revenue_growth":5}
```

## Output Documentation

The command generates comprehensive monitoring documentation including:

1. **Monitoring Architecture Diagram**
2. **Dashboard Catalog and Access Guide**
3. **Alert Configuration Documentation**
4. **SLA Monitoring Reports**
5. **Runbooks and Troubleshooting Guides**
6. **On-Call Procedures and Escalation Policies**

## Success Criteria

- All critical services monitored with appropriate dashboards
- Alert rules configured with proper escalation
- SLA tracking implemented and automated
- Documentation complete and accessible
- Team trained on monitoring tools and procedures