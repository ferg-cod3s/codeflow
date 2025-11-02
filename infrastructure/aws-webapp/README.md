# AWS Web Application Infrastructure



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


This Terraform configuration creates a scalable, secure, and production-ready AWS infrastructure for a web application using modern best practices.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public/private/database subnets
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: HTTPS load balancing with WAF protection
- **RDS PostgreSQL**: Managed database with Multi-AZ deployment
- **S3**: Static asset storage with CloudFront CDN
- **CloudFront**: Global content delivery network
- **Security Groups**: Least-privilege network security
- **IAM**: Minimal required permissions
- **CloudWatch**: Monitoring and alerting
- **Route 53**: DNS management (optional)

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **Terraform** >= 1.0
3. **AWS Account** with necessary permissions

### Required AWS Permissions

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
        "acm:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Quick Start

1. **Clone and navigate to the infrastructure directory:**

   ```bash
   cd infrastructure/aws-webapp
   ```

2. **Initialize Terraform:**

   ```bash
   terraform init
   ```

3. **Create a terraform.tfvars file:**

   ```hcl
   aws_region     = "us-east-1"
   project_name   = "mywebapp"
   environment    = "dev"
   db_password    = "your-secure-password"
   certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"
   ```

4. **Plan the deployment:**

   ```bash
   terraform plan
   ```

5. **Apply the infrastructure:**
   ```bash
   terraform apply
   ```

## Configuration

### Environment Variables

Create a `terraform.tfvars` file with your specific values:

```hcl
# Basic Configuration
aws_region     = "us-east-1"
project_name   = "mywebapp"
environment    = "dev"

# Database
db_password    = "your-secure-password"

# SSL Certificate (for HTTPS)
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Domain (optional)
create_route53_records = true
domain_name            = "mywebapp.com"

# Container Configuration
container_image = "nginx:latest"
container_port  = 80
desired_count   = 2
cpu            = "256"
memory         = "512"

# Monitoring
sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:my-alerts"
```

### Backend Configuration

Update the backend configuration in `main.tf` with your S3 bucket and DynamoDB table:

```hcl
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "webapp/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "terraform-locks"
}
```

## Module Structure

```
modules/
├── vpc/              # Network infrastructure
├── security-groups/  # Security configurations
├── alb/              # Application Load Balancer
├── ecs/              # Container orchestration
├── rds/              # Database
├── s3/               # Static assets
├── cloudfront/       # CDN
├── route53/          # DNS (optional)
└── monitoring/       # CloudWatch alerts
```

## Security Features

- **Network Security**: Private subnets for application and database
- **Security Groups**: Least-privilege access rules
- **WAF**: Web Application Firewall protection (optional)
- **SSL/TLS**: HTTPS encryption with ACM certificates
- **IAM**: Minimal required permissions
- **VPC Endpoints**: Secure access to AWS services

## Scaling Configuration

The infrastructure includes auto-scaling based on CPU and memory utilization:

- **CPU Target**: 70% utilization
- **Memory Target**: 80% utilization
- **Minimum Tasks**: 1
- **Maximum Tasks**: 10

## Monitoring and Alerting

CloudWatch alarms are configured for:

- ALB 5xx errors
- ECS CPU utilization
- ECS memory utilization
- RDS connections
- RDS storage space

## Cost Optimization

- **Fargate Spot**: Uses spot instances for cost savings
- **Auto Scaling**: Scales down during low traffic
- **Reserved Instances**: Consider for production workloads
- **S3 Storage Classes**: Intelligent tiering for static assets

## Deployment Pipeline

### CI/CD Integration

The infrastructure supports deployment pipelines:

```bash
# Update container image
terraform apply -var="container_image=myapp:v1.2.3"

# Scale the application
terraform apply -var="desired_count=5"
```

### Blue-Green Deployments

Use Terraform workspaces for blue-green deployments:

```bash
# Create blue environment
terraform workspace select blue
terraform apply

# Create green environment
terraform workspace new green
terraform apply

# Switch traffic (update Route 53 or ALB)
```

## Troubleshooting

### Common Issues

1. **ECS Service fails to start:**
   - Check CloudWatch logs
   - Verify security group rules
   - Ensure VPC endpoints are configured

2. **ALB health checks fail:**
   - Verify health check path
   - Check container port configuration
   - Review security groups

3. **Database connection issues:**
   - Verify security group allows ECS access
   - Check database subnet configuration
   - Ensure proper credentials

### Debugging Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster mywebapp-dev-cluster --services mywebapp-dev-service

# View container logs
aws logs tail /ecs/mywebapp-dev --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## Cleanup

To destroy the infrastructure:

```bash
terraform destroy
```

**Warning**: This will permanently delete all resources. Ensure you have backups of important data.

## Contributing

1. Follow Terraform best practices
2. Use descriptive variable names
3. Include comments for complex configurations
4. Test changes in a development environment first
5. Update documentation for significant changes

## Support

For issues and questions:

1. Check the troubleshooting section
2. Review AWS documentation
3. Check Terraform documentation
4. Create an issue with detailed information
