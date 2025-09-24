# CodeFlow Deployment Guide

## Overview

CodeFlow is a CLI tool for managing AI agents across different platforms, built with Bun and TypeScript. This guide provides comprehensive deployment procedures for production environments.

## Table of Contents

1. [Infrastructure Setup](#infrastructure-setup)
2. [Deployment Procedures](#deployment-procedures)
3. [Monitoring](#monitoring)
4. [Rollback Strategy](#rollback-strategy)
5. [Operational Guidelines](#operational-guidelines)

## Infrastructure Setup

### Prerequisites

- AWS CLI configured with appropriate permissions
- Terraform >= 1.0
- Docker for container builds
- Node.js >= 18.0.0 and Bun runtime

### AWS Infrastructure Setup

CodeFlow uses a production-ready AWS infrastructure with the following components:

#### Core Components

- **VPC**: Multi-AZ VPC with public/private/database subnets
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: HTTPS load balancing with WAF protection
- **RDS PostgreSQL**: Managed database with Multi-AZ deployment
- **S3**: Static asset storage with CloudFront CDN
- **CloudFront**: Global content delivery network

#### Required AWS Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:*",
        "ecs:*",
        "rds:*",
        "s3:*",
        "cloudfront:*",
        "route53:*",
        "iam:*",
        "logs:*",
        "wafv2:*",
        "acm:*",
        "ssm:*",
        "kms:*"
      ],
      "Resource": "*"
    }
  ]
}
```

#### Infrastructure Deployment

1. **Navigate to infrastructure directory:**

   ```bash
   cd infrastructure/aws-webapp
   ```

2. **Initialize Terraform:**

   ```bash
   terraform init
   ```

3. **Configure environment variables:**

   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your specific values
   ```

4. **Required terraform.tfvars configuration:**

   ```hcl
   # Basic Configuration
   aws_region     = "us-east-1"
   project_name   = "codeflow"
   environment    = "prod"

   # Database
   db_password    = "your-secure-password-here"

   # SSL Certificate (obtain from ACM)
   certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

   # Domain (optional)
   create_route53_records = true
   domain_name            = "codeflow.yourdomain.com"

   # Container Configuration
   container_image = "codeflow/codeflow-server:latest"
   container_port  = 3000
   desired_count   = 3
   cpu            = "512"
   memory         = "1024"
   ```

5. **Plan and apply infrastructure:**
   ```bash
   terraform plan
   terraform apply
   ```

#### Security Configuration

- **Network Security**: Application runs in private subnets
- **Security Groups**: Least-privilege access rules
- **SSL/TLS**: HTTPS encryption with ACM certificates
- **Secrets Management**: Use AWS Systems Manager Parameter Store or Secrets Manager
- **IAM**: Minimal required permissions for ECS tasks

#### Environment Variables Setup

Store sensitive configuration in AWS Systems Manager Parameter Store:

```bash
# Database configuration
aws ssm put-parameter \
  --name "/codeflow/prod/database/url" \
  --value "postgresql://user:password@host:5432/codeflow" \
  --type "SecureString"

# API keys and secrets
aws ssm put-parameter \
  --name "/codeflow/prod/api-keys/openai" \
  --value "sk-your-openai-key" \
  --type "SecureString"

# Application configuration
aws ssm put-parameter \
  --name "/codeflow/prod/config/log-level" \
  --value "info" \
  --type "String"
```

### CI/CD Pipeline Setup

#### GitHub Actions Configuration

The project includes comprehensive CI/CD pipelines:

1. **Cross-Platform Testing** (`.github/workflows/test.yml`)
   - Runs on push/PR to main branches
   - Tests across Linux, Windows, macOS
   - Includes unit, integration, and cross-platform tests
   - Validates MCP server integration

2. **UATS Compliance** (`.github/workflows/uats-compliance.yml`)
   - Validates agent compliance on changes to agent files
   - Runs TypeScript type checking
   - Validates agent registry integrity

#### Additional Pipeline Stages

Create additional workflows for deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Run tests
        run: bun run test

      - name: Build container
        run: |
          docker build -t codeflow/codeflow-server:${{ github.sha }} .
          docker tag codeflow/codeflow-server:${{ github.sha }} codeflow/codeflow-server:latest

      - name: Push to ECR
        run: |
          aws ecr get-login-password --region ${{ secrets.AWS_REGION }} | docker login --username AWS --password-stdin ${{ secrets.ECR_REGISTRY }}
          docker push codeflow/codeflow-server:${{ github.sha }}
          docker push codeflow/codeflow-server:latest

      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ${{ secrets.ECS_CLUSTER }} \
            --service ${{ secrets.ECS_SERVICE }} \
            --force-new-deployment \
            --region ${{ secrets.AWS_REGION }}
```

## Deployment Procedures

### NPM Package Deployment

CodeFlow is distributed as an NPM package for CLI usage:

#### Pre-deployment Checklist

```bash
# Security verification
grep -r -i "key\|secret\|token\|password\|api.*key" src/
grep -r "fetch\|http\|https\|axios" src/
grep -r "process\.env" src/

# Quality checks
bun run typecheck
bun run test
bun run lint

# Build verification
bun run build:cli
```

#### NPM Publication Process

1. **Authenticate with NPM:**

   ```bash
   npm login
   npm whoami
   ```

2. **Prepare release:**

   ```bash
   # Update version (patch, minor, or major)
   npm version patch  # or minor/major

   # Verify package contents
   npm pack --dry-run
   npm publish --dry-run
   ```

3. **Publish package:**

   ```bash
   npm publish --access public
   ```

4. **Verify publication:**
   ```bash
   npm view @agentic-codeflow/cli
   npx @agentic-codeflow/cli --version
   ```

### Container Deployment

#### Docker Configuration

Create a multi-stage Dockerfile for production:

```dockerfile
# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build:cli

# Production stage
FROM oven/bun:distroless

WORKDIR /app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lock ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/codeflow-agents ./codeflow-agents
COPY --from=builder /app/command ./command

RUN bun install --frozen-lockfile --production

EXPOSE 3000
CMD ["bun", "run", "mcp:server"]
```

#### Container Build and Push

```bash
# Build container
docker build -t codeflow/codeflow-server:${VERSION} .

# Tag for ECR
docker tag codeflow/codeflow-server:${VERSION} ${ECR_REGISTRY}/codeflow/codeflow-server:${VERSION}

# Push to ECR
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}
docker push ${ECR_REGISTRY}/codeflow/codeflow-server:${VERSION}
```

#### ECS Deployment

```bash
# Update ECS service
aws ecs update-service \
  --cluster codeflow-prod-cluster \
  --service codeflow-prod-service \
  --force-new-deployment \
  --region ${AWS_REGION}
```

### Blue-Green Deployment Strategy

#### Setup Blue-Green Environments

1. **Create blue environment:**

   ```bash
   terraform workspace new blue
   terraform apply -var="environment=blue"
   ```

2. **Create green environment:**

   ```bash
   terraform workspace new green
   terraform apply -var="environment=green"
   ```

3. **Deploy to green environment:**

   ```bash
   # Update container image for green
   aws ecs update-service \
     --cluster codeflow-green-cluster \
     --service codeflow-green-service \
     --force-new-deployment
   ```

4. **Switch traffic (Route 53):**
   ```bash
   # Update Route 53 alias to point to green ALB
   aws route53 change-resource-record-sets \
     --hosted-zone-id ${HOSTED_ZONE_ID} \
     --change-batch file://switch-to-green.json
   ```

## Monitoring

### Application Monitoring

#### CloudWatch Metrics

Configure comprehensive monitoring:

```bash
# ECS metrics
aws logs create-log-group --log-group-name /ecs/codeflow-prod

# Custom metrics
aws cloudwatch put-metric-alarm \
  --alarm-name "CodeFlow-HighCPU" \
  --alarm-description "CPU utilization above 70%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 70 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=ClusterName,Value=codeflow-prod-cluster Name=ServiceName,Value=codeflow-prod-service
```

#### Health Checks

Configure ALB health checks:

```hcl
# In terraform configuration
health_check {
  enabled             = true
  healthy_threshold   = 2
  unhealthy_threshold = 2
  timeout             = 5
  interval            = 30
  path                = "/health"
  matcher             = "200"
}
```

#### Application Health Endpoint

Implement health check endpoint in the application:

```typescript
// src/server/health.ts
import { createServer } from 'http';

export function createHealthServer(port: number) {
  const server = createServer((req, res) => {
    if (req.url === '/health') {
      // Check database connectivity
      // Check external service dependencies
      // Return 200 if healthy, 503 if not
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version,
        })
      );
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
  });

  return server;
}
```

### Logging Strategy

#### Structured Logging

Implement structured logging throughout the application:

```typescript
// src/utils/logger.ts
import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  defaultMeta: { service: 'codeflow' },
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
    new transports.File({ filename: 'error.log', level: 'error' }),
    new transports.File({ filename: 'combined.log' }),
  ],
});
```

#### Log Aggregation

- Use CloudWatch Logs for centralized logging
- Set up log retention policies
- Create log metric filters for alerts

### Performance Monitoring

#### Key Metrics to Monitor

- **Response Times**: API endpoint response times
- **Error Rates**: 4xx and 5xx error percentages
- **Resource Usage**: CPU, memory, disk I/O
- **Database Performance**: Query execution times, connection counts
- **Cache Hit Rates**: If using Redis or similar

#### APM Integration

Consider integrating Application Performance Monitoring:

```bash
# Example: AWS X-Ray integration
npm install aws-xray-sdk
```

## Rollback Strategy

### Automated Rollback Procedures

#### ECS Rollback

```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster codeflow-prod-cluster \
  --service codeflow-prod-service \
  --task-definition codeflow-prod:5  # Previous version
```

#### NPM Package Rollback

```bash
# Deprecate problematic version
npm deprecate @agentic-codeflow/cli@1.2.3 "This version has critical issues. Use 1.2.2 instead"

# Publish patch version
npm version patch
npm publish
```

### Rollback Automation

#### Circuit Breaker Pattern

Implement circuit breaker for automatic rollback:

```typescript
// src/utils/circuit-breaker.ts
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      // Trigger rollback procedure
      this.triggerRollback();
    }
  }

  private triggerRollback() {
    // Implement rollback logic
    console.error('Circuit breaker triggered - initiating rollback');
    // Call rollback API or script
  }
}
```

### Database Rollback Strategy

#### Migration Rollback

```bash
# Using migration tool (example with knex.js)
knex migrate:rollback

# Or with custom migration scripts
node scripts/rollback-migration.js --version 1.2.3
```

#### Data Backup Strategy

- **Automated Backups**: Daily RDS snapshots
- **Point-in-time Recovery**: Enable for critical data
- **Backup Verification**: Regular restore tests

### Rollback Testing

#### Pre-deployment Validation

```bash
# Test rollback procedure in staging
./scripts/test-rollback.sh

# Validate rollback scripts
./scripts/validate-rollback-plan.sh
```

## Operational Guidelines

### Daily Operations

#### Health Monitoring

```bash
# Check service status
aws ecs describe-services --cluster codeflow-prod-cluster --services codeflow-prod-service

# Monitor logs
aws logs tail /ecs/codeflow-prod --follow

# Check ALB health
aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN
```

#### Log Analysis

```bash
# Search for errors in logs
aws logs filter-log-events \
  --log-group-name /ecs/codeflow-prod \
  --filter-pattern "ERROR" \
  --start-time $(date -d '1 hour ago' +%s)000

# Monitor performance metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=codeflow-prod-cluster Name=ServiceName,Value=codeflow-prod-service \
  --start-time $(date -d '1 hour ago' +%s) \
  --end-time $(date +%s) \
  --period 300 \
  --statistics Average
```

### Incident Response

#### Alert Response Procedures

1. **Assess Impact**: Check affected systems and users
2. **Gather Information**: Review logs and metrics
3. **Contain Issue**: Implement temporary fixes if needed
4. **Resolve Issue**: Deploy fix or rollback
5. **Post-mortem**: Document incident and improvements

#### Escalation Matrix

- **Level 1**: On-call engineer (response within 15 minutes)
- **Level 2**: Engineering team lead (response within 30 minutes)
- **Level 3**: Full engineering team (response within 1 hour)

### Maintenance Procedures

#### Regular Maintenance Tasks

```bash
# Update dependencies (monthly)
bun update
bun run test  # Ensure compatibility

# Rotate secrets (quarterly)
aws secretsmanager update-secret \
  --secret-id codeflow/prod/database \
  --secret-string '{"password":"new-password"}'

# Update SSL certificates (before expiration)
aws acm renew-certificate --certificate-arn $CERT_ARN

# Database maintenance
aws rds modify-db-instance \
  --db-instance-identifier codeflow-prod \
  --apply-immediately \
  --db-instance-class db.t3.medium  # Scale up for maintenance
```

#### Backup Verification

```bash
# Test backup restoration
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier codeflow-test-restore \
  --db-snapshot-identifier codeflow-prod-snapshot-2024-01-01

# Verify data integrity
./scripts/verify-backup-integrity.sh
```

### Security Operations

#### Vulnerability Management

```bash
# Scan for vulnerabilities
npm audit
bun run audit  # If using Bun's audit feature

# Update base images
docker pull oven/bun:latest
docker build --no-cache -t codeflow/codeflow-server:new .

# Security patching
# Update infrastructure
terraform plan
terraform apply
```

#### Access Management

- **Principle of Least Privilege**: Regular review of IAM permissions
- **Multi-factor Authentication**: Required for all accounts
- **Access Logging**: Monitor and audit access patterns

### Performance Optimization

#### Scaling Procedures

```bash
# Horizontal scaling
aws ecs update-service \
  --cluster codeflow-prod-cluster \
  --service codeflow-prod-service \
  --desired-count 5

# Vertical scaling
aws ecs register-task-definition \
  --family codeflow-prod \
  --cpu 1024 \
  --memory 2048 \
  --container-definitions file://task-definition.json

aws ecs update-service \
  --cluster codeflow-prod-cluster \
  --service codeflow-prod-service \
  --task-definition codeflow-prod
```

#### Performance Monitoring

- **Response Time Alerts**: Alert when p95 > 2 seconds
- **Error Rate Alerts**: Alert when 5xx > 1%
- **Resource Alerts**: Alert when CPU > 80% or Memory > 85%

### Disaster Recovery

#### Recovery Procedures

1. **Assess Damage**: Determine scope of incident
2. **Activate DR Plan**: Switch to backup systems
3. **Data Recovery**: Restore from backups
4. **Service Restoration**: Bring systems back online
5. **Verification**: Test all critical functions

#### Business Continuity

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 1 hour
- **Multi-region Deployment**: Consider for critical production systems

### Documentation and Training

#### Operational Documentation

- **Runbooks**: Step-by-step procedures for common tasks
- **Playbooks**: Response procedures for incidents
- **Knowledge Base**: Solutions to common issues

#### Team Training

- **Regular Drills**: Quarterly incident response exercises
- **Knowledge Sharing**: Weekly technical reviews
- **Certification**: AWS and security certifications

This deployment guide provides a comprehensive framework for deploying and operating CodeFlow in production environments. Regular review and updates to these procedures are essential for maintaining system reliability and security.
