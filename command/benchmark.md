---
name: benchmark
description: Run performance benchmarks, load tests, and performance analysis
version: 1.0.0
category: development
author: CodeFlow
tags: [benchmark, performance, load-testing, profiling, optimization]
parameters:
  - name: type
    type: string
    required: true
    description: 'Type of benchmark to run'
    options: ['load', 'stress', 'spike', 'volume', 'endurance', 'profile']
  - name: target
    type: string
    required: true
    description: 'Target to benchmark (endpoint, function, service, etc.)'
  - name: duration
    type: string
    required: false
    description: 'Benchmark duration (e.g., 5m, 1h, 1000req)'
    default: '5m'
  - name: concurrency
    type: number
    required: false
    description: 'Number of concurrent users/requests'
    default: 10
  - name: environment
    type: string
    required: false
    description: 'Environment to benchmark'
    options: ['local', 'staging', 'production']
    default: 'local'
  - name: metrics
    type: array
    required: false
    description: 'Specific metrics to collect'
    items:
      type: string
    default: ['response-time', 'throughput', 'error-rate', 'cpu', 'memory']
examples:
  - name: 'Load test API endpoint'
    command: 'benchmark type=load target=/api/users duration=10m concurrency=50'
    description: 'Run load test on API endpoint for 10 minutes with 50 concurrent users'
  - name: 'Stress test application'
    command: "benchmark type=stress target=web-app environment=staging metrics=['response-time', 'cpu', 'memory']"
    description: 'Stress test staging application with specific metrics'
  - name: 'Profile function performance'
    command: 'benchmark type=profile target=processUserData duration=1000req'
    description: 'Profile specific function with 1000 requests'
agents:
  - performance-engineer
  - quality-testing-performance-tester
  - monitoring-expert
  - data-engineer
  - observability-engineer
phases:
  - name: 'Benchmark Planning'
    description: 'Plan and configure benchmark execution'
    agents: [performance-engineer, quality-testing-performance-tester]
    steps:
      - 'Define benchmark objectives and success criteria'
      - 'Configure test scenarios and parameters'
      - 'Set up monitoring and metrics collection'
      - 'Prepare test data and environment'
      - 'Establish baseline performance metrics'
  - name: 'Environment Setup'
    description: 'Prepare environment for benchmarking'
    agents: [monitoring-expert, observability-engineer]
    steps:
      - 'Initialize monitoring and tracing systems'
      - 'Set up metrics collection endpoints'
      - 'Configure logging and profiling tools'
      - 'Prepare test data and scenarios'
      - 'Validate environment readiness'
    parallel: true
  - name: 'Benchmark Execution'
    description: 'Execute the performance benchmark'
    agents: [performance-engineer, quality-testing-performance-tester]
    steps:
      - 'Start benchmark with specified parameters'
      - 'Monitor system performance in real-time'
      - 'Collect metrics and performance data'
      - 'Handle errors and anomalies gracefully'
      - 'Scale load according to test type'
    parallel: true
  - name: 'Data Collection and Analysis'
    description: 'Collect and analyze benchmark results'
    agents: [data-engineer, performance-engineer]
    steps:
      - 'Aggregate performance metrics and logs'
      - 'Analyze response times and throughput'
      - 'Identify performance bottlenecks'
      - 'Calculate statistical measures (percentiles, averages)'
      - 'Compare against baseline and thresholds'
    parallel: true
  - name: 'Reporting and Recommendations'
    description: 'Generate comprehensive benchmark report'
    agents: [performance-engineer, observability-engineer]
    steps:
      - 'Generate visual performance reports'
      - 'Identify performance issues and root causes'
      - 'Provide optimization recommendations'
      - 'Calculate capacity planning metrics'
      - 'Create executive summary and detailed findings'
implementation_details:
  - 'Use performance-engineer for benchmark design and execution'
  - 'Leverage quality-testing-performance-tester for load testing frameworks'
  - 'Integrate monitoring-expert for real-time observability'
  - 'Apply data-engineer for metrics analysis and visualization'
  - 'Utilize observability-engineer for comprehensive tracing'
  - 'Support multiple benchmark types (load, stress, spike, volume, endurance)'
  - 'Integrate with popular tools (JMeter, k6, Artillery, Locust)'
  - 'Provide real-time dashboards and alerting'
success_criteria:
  - 'Benchmark executed successfully within specified parameters'
  - 'All metrics collected and analyzed'
  - 'Performance bottlenecks identified and documented'
  - 'Comprehensive report generated with recommendations'
  - 'Results compared against baselines and thresholds'
  - 'Environment restored to original state'
error_handling:
  - 'Handle benchmark failures and timeouts gracefully'
  - 'Retry mechanisms for transient issues'
  - 'Environment cleanup on failure'
  - 'Clear error messages with troubleshooting steps'
  - 'Preserve partial results for analysis'
integration_examples:
  - 'CI/CD pipeline performance regression detection'
  - 'Pre-deployment performance validation'
  - 'Capacity planning and scaling analysis'
  - 'Performance monitoring integration'
best_practices:
  - 'Establish clear performance baselines before changes'
  - 'Use realistic test scenarios and data'
  - 'Monitor system resources during testing'
  - 'Analyze results statistically for meaningful insights'
  - 'Document benchmark configurations for reproducibility'
related_commands:
  - 'monitor': 'For ongoing performance monitoring'
  - 'metrics': 'For performance metrics collection'
  - 'impact-analysis': 'For performance impact assessment'
  - 'deploy': 'For performance validation in deployments'
changelog:
  - '1.0.0': 'Initial implementation with comprehensive performance benchmarking'
---

# Performance Benchmark Command

**Input**: $ARGUMENTS

The `benchmark` command runs comprehensive performance benchmarks, load tests, and profiling to ensure your applications can handle expected and peak loads.

## Overview

This command provides detailed performance analysis, helping identify bottlenecks, validate scalability, and ensure optimal user experience under various load conditions.

## Key Features

- **Multiple Test Types**: Load, stress, spike, volume, endurance, and profiling tests
- **Comprehensive Metrics**: Response times, throughput, error rates, resource utilization
- **Real-time Monitoring**: Live dashboards and alerting during tests
- **Detailed Analysis**: Statistical analysis and bottleneck identification
- **Optimization Recommendations**: Actionable insights for performance improvement

## Usage

```bash
# Load test API endpoint
benchmark type=load target=/api/users duration=10m concurrency=50

# Stress test application in staging
benchmark type=stress target=web-app environment=staging metrics=['response-time', 'cpu', 'memory']

# Profile specific function
benchmark type=profile target=processUserData duration=1000req
```

## Output

The command generates:

- Comprehensive performance report with metrics
- Visual graphs and charts for key indicators
- Bottleneck analysis and root cause identification
- Statistical summaries (percentiles, averages, standard deviations)
- Optimization recommendations and capacity planning insights

## Integration

This command integrates with:

- CI/CD pipelines for performance regression testing
- Monitoring systems for ongoing performance tracking
- Load testing tools for comprehensive analysis
- Alerting systems for performance threshold breaches

Use this command to ensure your applications perform reliably under various load conditions and to identify optimization opportunities.
