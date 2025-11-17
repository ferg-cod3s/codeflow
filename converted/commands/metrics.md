---
name: metrics
description: Set up comprehensive performance metrics collection and analysis
template: >-
  # Metrics Command


  **Input**: $ARGUMENTS



  ## Overview


  The `metrics` command sets up comprehensive performance metrics collection and
  analysis for applications, infrastructure, and business systems. It provides
  end-to-end metrics infrastructure including collection, storage,
  visualization, and alerting.


  ## Phases


  ### Phase 1: Metrics Requirements Analysis


  **Agent:** `analytics-engineer`

  **Objective:** Analyze metrics requirements and define collection strategy


  **Tasks:**


  - Identify key performance indicators (KPIs)

  - Map system components and dependencies

  - Define metrics collection scope and granularity

  - Assess business and technical requirements

  - Create metrics collection strategy


  **Parallel Execution:**


  - `business-analyst` - Business metrics requirements

  - `codebase-analyzer` - Application performance analysis


  ### Phase 2: Metrics Infrastructure Setup


  **Agent:** `monitoring-expert`

  **Objective:** Set up metrics collection infrastructure


  **Tasks:**


  - Configure metrics collection agents

  - Set up time-series database storage

  - Configure metrics aggregation and processing

  - Implement metrics retention policies

  - Set up data backup and recovery


  **Parallel Execution:**


  - `infrastructure-builder` - Infrastructure deployment

  - `security-scanner` - Metrics security configuration


  ### Phase 3: Application Metrics Implementation


  **Agent:** `full-stack-developer`

  **Objective:** Implement application-level metrics collection


  **Tasks:**


  - Add application performance monitoring

  - Implement custom business metrics

  - Configure distributed tracing

  - Set up error tracking and logging

  - Implement user experience metrics


  **Parallel Execution:**


  - `backend-architect` - Backend metrics implementation

  - `frontend-developer` - Frontend performance metrics


  ### Phase 4: Infrastructure Metrics Configuration


  **Agent:** `infrastructure-builder`

  **Objective:** Configure infrastructure and system metrics


  **Tasks:**


  - Set up server and container metrics

  - Configure network performance monitoring

  - Implement database performance metrics

  - Set up cloud resource monitoring

  - Configure storage and backup metrics


  **Parallel Execution:**


  - `database-expert` - Database metrics configuration

  - `network-engineer` - Network metrics setup


  ### Phase 5: Dashboard and Visualization Setup


  **Agent:** `analytics-engineer`

  **Objective:** Create comprehensive metrics dashboards


  **Tasks:**


  - Design operational dashboards

  - Create executive summary views

  - Build technical performance dashboards

  - Implement real-time monitoring displays

  - Create historical trend analysis views


  **Parallel Execution:**


  - `ux-optimizer` - Dashboard usability optimization

  - `data-engineer` - Data pipeline configuration


  ### Phase 6: Alert Configuration and Automation


  **Agent:** `monitoring-expert`

  **Objective:** Configure intelligent alerting and automation


  **Tasks:**


  - Define alert thresholds and conditions

  - Configure multi-channel alert routing

  - Implement alert suppression and grouping

  - Set up automated response actions

  - Create escalation policies


  **Parallel Execution:**


  - `operations-incident-commander` - Alert procedure review

  - `security-auditor` - Security alerting configuration


  ### Phase 7: Metrics Analysis and Optimization


  **Agent:** `performance-engineer`

  **Objective:** Analyze metrics and optimize performance


  **Tasks:**


  - Establish performance baselines

  - Identify performance bottlenecks

  - Analyze trends and patterns

  - Optimize metrics collection efficiency

  - Create performance improvement recommendations


  **Parallel Execution:**


  - `business-analyst` - Business metrics analysis

  - `data-scientist` - Advanced metrics analysis


  ### Phase 8: Documentation and Training


  **Agent:** `documentation-specialist`

  **Objective:** Create comprehensive documentation and training materials


  **Tasks:**


  - Document metrics architecture and configuration

  - Create user guides for dashboards

  - Develop troubleshooting procedures

  - Create training materials for teams

  - Document best practices and procedures


  **Parallel Execution:**


  - `technical-writer` - Technical documentation

  - `ux-optimizer` - User experience documentation


  ## Implementation Details


  ### Metrics Categories


  #### Application Metrics


  - **Performance Metrics**: Response time, throughput, latency

  - **Error Metrics**: Error rates, exception counts, failure patterns

  - **Business Metrics**: Transaction volume, conversion rates, user engagement

  - **Resource Metrics**: CPU usage, memory consumption, I/O operations

  - **Custom Metrics**: Application-specific KPIs and business logic


  #### Infrastructure Metrics


  - **System Metrics**: CPU, memory, disk, network utilization

  - **Container Metrics**: Container resource usage, orchestration metrics

  - **Database Metrics**: Query performance, connection pools, replication lag

  - **Network Metrics**: Bandwidth usage, packet loss, latency

  - **Cloud Metrics**: Service-specific metrics, cost metrics


  #### User Experience Metrics


  - **Frontend Performance**: Page load times, rendering performance

  - **User Interaction**: Click rates, session duration, bounce rates

  - **Mobile Performance**: App startup time, crash rates, battery usage

  - **API Performance**: API response times, error rates, usage patterns

  - **Geographic Performance**: Regional performance differences


  #### Business Metrics


  - **Revenue Metrics**: Sales volume, revenue per user, customer lifetime value

  - **Operational Metrics**: Process efficiency, resource utilization, cost
  metrics

  - **Customer Metrics**: Satisfaction scores, support tickets, churn rates

  - **Compliance Metrics**: SLA compliance, audit metrics, regulatory
  requirements

  - **Growth Metrics**: User acquisition, market penetration, competitive
  metrics


  ### Collection Strategies


  #### Agent-Based Collection


  - **Application Agents**: Embedded monitoring agents in applications

  - **System Agents**: Operating system level monitoring agents

  - **Network Agents**: Network monitoring and packet analysis

  - **Database Agents**: Database-specific monitoring agents

  - **Custom Agents**: Specialized monitoring for specific technologies


  #### Push-Based Collection


  - **Application Push**: Applications push metrics to collection endpoints

  - **Event Streaming**: Real-time metric streaming via message queues

  - **Batch Upload**: Periodic batch uploads of metrics data

  - **API Endpoints**: RESTful endpoints for metric submission

  - **WebSocket Streaming**: Real-time metric streaming over websockets


  #### Pull-Based Collection


  - **Scraping Endpoints**: Periodic scraping of metric endpoints

  - **SNMP Monitoring**: Network device monitoring via SNMP

  - **Database Queries**: Periodic database queries for metrics

  - **API Polling**: Regular polling of external APIs for metrics

  - **Log Parsing**: Extracting metrics from log files


  ### Storage and Retention


  #### Time-Series Databases


  - **Prometheus**: Open-source monitoring and alerting toolkit

  - **InfluxDB**: Time-series database for high-performance storage

  - **TimescaleDB**: PostgreSQL extension for time-series data

  - **VictoriaMetrics**: Fast, cost-effective monitoring solution

  - **Graphite**: Enterprise-scale monitoring and graphing


  #### Data Retention Strategies


  - **Hot Storage**: Recent data for real-time monitoring (hours to days)

  - **Warm Storage**: Medium-term data for trend analysis (weeks to months)

  - **Cold Storage**: Long-term data for compliance and analysis (months to
  years)

  - **Archive Storage**: Historical data for legal and compliance requirements

  - **Data Aggregation**: Summarized data for long-term trend analysis


  #### Data Compression


  - **Lossless Compression**: Preserve exact values for critical metrics

  - **Lossy Compression**: Acceptable precision loss for storage efficiency

  - **Downsampling**: Reduce data resolution for long-term storage

  - **Rollup Aggregation**: Pre-compute aggregations for common queries

  - **Data Pruning**: Remove unnecessary or redundant data points


  ### Visualization and Dashboards


  #### Operational Dashboards


  - **System Health**: Overall system status and health indicators

  - **Performance Metrics**: Real-time performance monitoring

  - **Error Tracking**: Error rates, types, and patterns

  - **Resource Utilization**: CPU, memory, disk, network usage

  - **Alert Status**: Active alerts and their current status


  #### Executive Dashboards


  - **Business KPIs**: Key business performance indicators

  - **Service Level Agreements**: SLA compliance and performance

  - **Cost Metrics**: Infrastructure and operational costs

  - **Customer Metrics**: Customer satisfaction and engagement

  - **Growth Metrics**: User acquisition and business growth


  #### Technical Dashboards


  - **Application Performance**: Detailed application metrics

  - **Infrastructure Health**: Server and infrastructure status

  - **Database Performance**: Database query and connection metrics

  - **Network Performance**: Network latency and throughput

  - **Security Metrics**: Security events and threat indicators


  ### Alerting and Automation


  #### Alert Types


  - **Threshold Alerts**: Simple threshold-based alerting

  - **Trend Alerts**: Alerts based on metric trends and patterns

  - **Anomaly Detection**: Machine learning-based anomaly detection

  - **Composite Alerts**: Multi-condition alerts with complex logic

  - **Predictive Alerts**: Alerts based on predictive models


  #### Alert Channels


  - **Email**: Detailed alert information and reports

  - **Slack**: Real-time notifications and team collaboration

  - **PagerDuty**: Critical alert escalation and on-call management

  - **SMS**: Critical alert notifications via text message

  - **Webhooks**: Integration with external systems and tools


  #### Automation Actions


  - **Auto-scaling**: Automatic scaling based on metrics thresholds

  - **Self-healing**: Automatic recovery from common issues

  - **Load Balancing**: Automatic traffic routing adjustments

  - **Resource Optimization**: Automatic resource allocation changes

  - **Incident Creation**: Automatic incident ticket creation


  ## Integration Examples


  ### Application Metrics Setup


  ```bash

  /metrics target="web-application" metrics_type="application"
  collection_interval=30 retention_period=14
  dashboard_type=["operational","technical"]

  ```


  ### Infrastructure Metrics


  ```bash

  /metrics target="production-cluster" metrics_type="infrastructure"
  collection_interval=60 retention_period=30
  alert_thresholds={"cpu":80,"memory":85}

  ```


  ### Business Metrics


  ```bash

  /metrics target="e-commerce-platform" metrics_type="business"
  collection_interval=300 retention_period=90
  dashboard_type=["executive","operational"]

  ```


  ## Output Documentation


  The command generates comprehensive metrics documentation including:


  1. **Metrics Architecture Documentation**

  2. **Dashboard Catalog and User Guides**

  3. **Alert Configuration Documentation**

  4. **Performance Baseline Reports**

  5. **Troubleshooting and Runbooks**

  6. **Best Practices and Procedures**

  7. **Training Materials and Documentation**


  ## Success Criteria


  - Metrics collection active and functional

  - Dashboards populated with accurate data

  - Alert rules configured and tested

  - Performance baselines established

  - Documentation complete and accessible

  - Team trained on metrics tools and procedures


  ## Continuous Improvement


  ### Metrics Optimization


  - Regular review of metrics collection efficiency

  - Optimization of storage and retention policies

  - Continuous improvement of dashboards and visualizations

  - Refinement of alert thresholds and rules

  - Performance tuning of metrics infrastructure


  ### Business Alignment


  - Regular review of business metrics alignment

  - Adjustment of KPIs based on business needs

  - Integration with business intelligence systems

  - Regular reporting to stakeholders

  - Continuous improvement of metrics value


  ### Technology Evolution


  - Evaluation of new metrics collection technologies

  - Integration with emerging monitoring tools

  - Adoption of industry best practices

  - Regular updates to metrics infrastructure

  - Continuous learning and improvement
---

# Metrics Command

**Input**: $ARGUMENTS


## Overview

The `metrics` command sets up comprehensive performance metrics collection and analysis for applications, infrastructure, and business systems. It provides end-to-end metrics infrastructure including collection, storage, visualization, and alerting.

## Phases

### Phase 1: Metrics Requirements Analysis

**Agent:** `analytics-engineer`
**Objective:** Analyze metrics requirements and define collection strategy

**Tasks:**

- Identify key performance indicators (KPIs)
- Map system components and dependencies
- Define metrics collection scope and granularity
- Assess business and technical requirements
- Create metrics collection strategy

**Parallel Execution:**

- `business-analyst` - Business metrics requirements
- `codebase-analyzer` - Application performance analysis

### Phase 2: Metrics Infrastructure Setup

**Agent:** `monitoring-expert`
**Objective:** Set up metrics collection infrastructure

**Tasks:**

- Configure metrics collection agents
- Set up time-series database storage
- Configure metrics aggregation and processing
- Implement metrics retention policies
- Set up data backup and recovery

**Parallel Execution:**

- `infrastructure-builder` - Infrastructure deployment
- `security-scanner` - Metrics security configuration

### Phase 3: Application Metrics Implementation

**Agent:** `full-stack-developer`
**Objective:** Implement application-level metrics collection

**Tasks:**

- Add application performance monitoring
- Implement custom business metrics
- Configure distributed tracing
- Set up error tracking and logging
- Implement user experience metrics

**Parallel Execution:**

- `backend-architect` - Backend metrics implementation
- `frontend-developer` - Frontend performance metrics

### Phase 4: Infrastructure Metrics Configuration

**Agent:** `infrastructure-builder`
**Objective:** Configure infrastructure and system metrics

**Tasks:**

- Set up server and container metrics
- Configure network performance monitoring
- Implement database performance metrics
- Set up cloud resource monitoring
- Configure storage and backup metrics

**Parallel Execution:**

- `database-expert` - Database metrics configuration
- `network-engineer` - Network metrics setup

### Phase 5: Dashboard and Visualization Setup

**Agent:** `analytics-engineer`
**Objective:** Create comprehensive metrics dashboards

**Tasks:**

- Design operational dashboards
- Create executive summary views
- Build technical performance dashboards
- Implement real-time monitoring displays
- Create historical trend analysis views

**Parallel Execution:**

- `ux-optimizer` - Dashboard usability optimization
- `data-engineer` - Data pipeline configuration

### Phase 6: Alert Configuration and Automation

**Agent:** `monitoring-expert`
**Objective:** Configure intelligent alerting and automation

**Tasks:**

- Define alert thresholds and conditions
- Configure multi-channel alert routing
- Implement alert suppression and grouping
- Set up automated response actions
- Create escalation policies

**Parallel Execution:**

- `operations-incident-commander` - Alert procedure review
- `security-auditor` - Security alerting configuration

### Phase 7: Metrics Analysis and Optimization

**Agent:** `performance-engineer`
**Objective:** Analyze metrics and optimize performance

**Tasks:**

- Establish performance baselines
- Identify performance bottlenecks
- Analyze trends and patterns
- Optimize metrics collection efficiency
- Create performance improvement recommendations

**Parallel Execution:**

- `business-analyst` - Business metrics analysis
- `data-scientist` - Advanced metrics analysis

### Phase 8: Documentation and Training

**Agent:** `documentation-specialist`
**Objective:** Create comprehensive documentation and training materials

**Tasks:**

- Document metrics architecture and configuration
- Create user guides for dashboards
- Develop troubleshooting procedures
- Create training materials for teams
- Document best practices and procedures

**Parallel Execution:**

- `technical-writer` - Technical documentation
- `ux-optimizer` - User experience documentation

## Implementation Details

### Metrics Categories

#### Application Metrics

- **Performance Metrics**: Response time, throughput, latency
- **Error Metrics**: Error rates, exception counts, failure patterns
- **Business Metrics**: Transaction volume, conversion rates, user engagement
- **Resource Metrics**: CPU usage, memory consumption, I/O operations
- **Custom Metrics**: Application-specific KPIs and business logic

#### Infrastructure Metrics

- **System Metrics**: CPU, memory, disk, network utilization
- **Container Metrics**: Container resource usage, orchestration metrics
- **Database Metrics**: Query performance, connection pools, replication lag
- **Network Metrics**: Bandwidth usage, packet loss, latency
- **Cloud Metrics**: Service-specific metrics, cost metrics

#### User Experience Metrics

- **Frontend Performance**: Page load times, rendering performance
- **User Interaction**: Click rates, session duration, bounce rates
- **Mobile Performance**: App startup time, crash rates, battery usage
- **API Performance**: API response times, error rates, usage patterns
- **Geographic Performance**: Regional performance differences

#### Business Metrics

- **Revenue Metrics**: Sales volume, revenue per user, customer lifetime value
- **Operational Metrics**: Process efficiency, resource utilization, cost metrics
- **Customer Metrics**: Satisfaction scores, support tickets, churn rates
- **Compliance Metrics**: SLA compliance, audit metrics, regulatory requirements
- **Growth Metrics**: User acquisition, market penetration, competitive metrics

### Collection Strategies

#### Agent-Based Collection

- **Application Agents**: Embedded monitoring agents in applications
- **System Agents**: Operating system level monitoring agents
- **Network Agents**: Network monitoring and packet analysis
- **Database Agents**: Database-specific monitoring agents
- **Custom Agents**: Specialized monitoring for specific technologies

#### Push-Based Collection

- **Application Push**: Applications push metrics to collection endpoints
- **Event Streaming**: Real-time metric streaming via message queues
- **Batch Upload**: Periodic batch uploads of metrics data
- **API Endpoints**: RESTful endpoints for metric submission
- **WebSocket Streaming**: Real-time metric streaming over websockets

#### Pull-Based Collection

- **Scraping Endpoints**: Periodic scraping of metric endpoints
- **SNMP Monitoring**: Network device monitoring via SNMP
- **Database Queries**: Periodic database queries for metrics
- **API Polling**: Regular polling of external APIs for metrics
- **Log Parsing**: Extracting metrics from log files

### Storage and Retention

#### Time-Series Databases

- **Prometheus**: Open-source monitoring and alerting toolkit
- **InfluxDB**: Time-series database for high-performance storage
- **TimescaleDB**: PostgreSQL extension for time-series data
- **VictoriaMetrics**: Fast, cost-effective monitoring solution
- **Graphite**: Enterprise-scale monitoring and graphing

#### Data Retention Strategies

- **Hot Storage**: Recent data for real-time monitoring (hours to days)
- **Warm Storage**: Medium-term data for trend analysis (weeks to months)
- **Cold Storage**: Long-term data for compliance and analysis (months to years)
- **Archive Storage**: Historical data for legal and compliance requirements
- **Data Aggregation**: Summarized data for long-term trend analysis

#### Data Compression

- **Lossless Compression**: Preserve exact values for critical metrics
- **Lossy Compression**: Acceptable precision loss for storage efficiency
- **Downsampling**: Reduce data resolution for long-term storage
- **Rollup Aggregation**: Pre-compute aggregations for common queries
- **Data Pruning**: Remove unnecessary or redundant data points

### Visualization and Dashboards

#### Operational Dashboards

- **System Health**: Overall system status and health indicators
- **Performance Metrics**: Real-time performance monitoring
- **Error Tracking**: Error rates, types, and patterns
- **Resource Utilization**: CPU, memory, disk, network usage
- **Alert Status**: Active alerts and their current status

#### Executive Dashboards

- **Business KPIs**: Key business performance indicators
- **Service Level Agreements**: SLA compliance and performance
- **Cost Metrics**: Infrastructure and operational costs
- **Customer Metrics**: Customer satisfaction and engagement
- **Growth Metrics**: User acquisition and business growth

#### Technical Dashboards

- **Application Performance**: Detailed application metrics
- **Infrastructure Health**: Server and infrastructure status
- **Database Performance**: Database query and connection metrics
- **Network Performance**: Network latency and throughput
- **Security Metrics**: Security events and threat indicators

### Alerting and Automation

#### Alert Types

- **Threshold Alerts**: Simple threshold-based alerting
- **Trend Alerts**: Alerts based on metric trends and patterns
- **Anomaly Detection**: Machine learning-based anomaly detection
- **Composite Alerts**: Multi-condition alerts with complex logic
- **Predictive Alerts**: Alerts based on predictive models

#### Alert Channels

- **Email**: Detailed alert information and reports
- **Slack**: Real-time notifications and team collaboration
- **PagerDuty**: Critical alert escalation and on-call management
- **SMS**: Critical alert notifications via text message
- **Webhooks**: Integration with external systems and tools

#### Automation Actions

- **Auto-scaling**: Automatic scaling based on metrics thresholds
- **Self-healing**: Automatic recovery from common issues
- **Load Balancing**: Automatic traffic routing adjustments
- **Resource Optimization**: Automatic resource allocation changes
- **Incident Creation**: Automatic incident ticket creation

## Integration Examples

### Application Metrics Setup

```bash
/metrics target="web-application" metrics_type="application" collection_interval=30 retention_period=14 dashboard_type=["operational","technical"]
```

### Infrastructure Metrics

```bash
/metrics target="production-cluster" metrics_type="infrastructure" collection_interval=60 retention_period=30 alert_thresholds={"cpu":80,"memory":85}
```

### Business Metrics

```bash
/metrics target="e-commerce-platform" metrics_type="business" collection_interval=300 retention_period=90 dashboard_type=["executive","operational"]
```

## Output Documentation

The command generates comprehensive metrics documentation including:

1. **Metrics Architecture Documentation**
2. **Dashboard Catalog and User Guides**
3. **Alert Configuration Documentation**
4. **Performance Baseline Reports**
5. **Troubleshooting and Runbooks**
6. **Best Practices and Procedures**
7. **Training Materials and Documentation**

## Success Criteria

- Metrics collection active and functional
- Dashboards populated with accurate data
- Alert rules configured and tested
- Performance baselines established
- Documentation complete and accessible
- Team trained on metrics tools and procedures

## Continuous Improvement

### Metrics Optimization

- Regular review of metrics collection efficiency
- Optimization of storage and retention policies
- Continuous improvement of dashboards and visualizations
- Refinement of alert thresholds and rules
- Performance tuning of metrics infrastructure

### Business Alignment

- Regular review of business metrics alignment
- Adjustment of KPIs based on business needs
- Integration with business intelligence systems
- Regular reporting to stakeholders
- Continuous improvement of metrics value

### Technology Evolution

- Evaluation of new metrics collection technologies
- Integration with emerging monitoring tools
- Adoption of industry best practices
- Regular updates to metrics infrastructure
- Continuous learning and improvement
