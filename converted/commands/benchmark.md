---
name: benchmark
description: Run performance benchmarks, load tests, and performance analysis
template: >-
  # Performance Benchmark Command


  **Input**: $ARGUMENTS



  The `benchmark` command runs comprehensive performance benchmarks, load tests,
  and profiling to ensure your applications can handle expected and peak loads.


  ## Overview


  This command provides detailed performance analysis, helping identify
  bottlenecks, validate scalability, and ensure optimal user experience under
  various load conditions.


  ## Key Features


  - **Multiple Test Types**: Load, stress, spike, volume, endurance, and
  profiling tests

  - **Comprehensive Metrics**: Response times, throughput, error rates, resource
  utilization

  - **Real-time Monitoring**: Live dashboards and alerting during tests

  - **Detailed Analysis**: Statistical analysis and bottleneck identification

  - **Optimization Recommendations**: Actionable insights for performance
  improvement


  ## Usage


  ```bash

  # Load test API endpoint

  benchmark type=load target=/api/users duration=10m concurrency=50


  # Stress test application in staging

  benchmark type=stress target=web-app environment=staging
  metrics=['response-time', 'cpu', 'memory']


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


  Use this command to ensure your applications perform reliably under various
  load conditions and to identify optimization opportunities.
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
