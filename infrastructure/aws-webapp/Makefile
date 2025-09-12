# Terraform Makefile for AWS Web Application Infrastructure

.PHONY: init plan apply destroy clean fmt validate

# Initialize Terraform
init:
	terraform init

# Format Terraform files
fmt:
	terraform fmt -recursive

# Validate Terraform configuration
validate:
	terraform validate

# Plan infrastructure changes
plan:
	terraform plan

# Apply infrastructure changes
apply:
	terraform apply

# Destroy infrastructure
destroy:
	terraform destroy

# Clean up Terraform files
clean:
	rm -rf .terraform/
	rm -f .terraform.lock.hcl
	rm -f terraform.tfstate*

# Full deployment workflow
deploy: init fmt validate plan apply

# Quick check
check: fmt validate plan

# Update infrastructure with new container image
update-image:
	@echo "Usage: make update-image IMAGE=your-app:latest"
	terraform apply -var="container_image=$(IMAGE)"

# Scale application
scale:
	@echo "Usage: make scale COUNT=5"
	terraform apply -var="desired_count=$(COUNT)"

# Switch to different environment
env-%:
	terraform workspace select $*

# Create new environment
new-env-%:
	terraform workspace new $*

# List environments
list-env:
	terraform workspace list

# Show current configuration
show:
	terraform show

# Output important values
outputs:
	terraform output

# Import existing resources (example)
import-alb:
	@echo "Usage: make import-alb ARN=arn:aws:elasticloadbalancing:..."
	terraform import aws_lb.main $(ARN)

# Refresh state
refresh:
	terraform refresh

# Graph dependencies
graph:
	terraform graph | dot -Tsvg > infrastructure.svg

# Cost estimation (requires infracost)
cost:
	infracost breakdown --path .

# Security scan (requires checkov)
security:
	checkov -f .

# Help
help:
	@echo "Available commands:"
	@echo "  init        - Initialize Terraform"
	@echo "  fmt         - Format Terraform files"
	@echo "  validate    - Validate Terraform configuration"
	@echo "  plan        - Plan infrastructure changes"
	@echo "  apply       - Apply infrastructure changes"
	@echo "  destroy     - Destroy infrastructure"
	@echo "  clean       - Clean up Terraform files"
	@echo "  deploy      - Full deployment workflow"
	@echo "  check       - Quick validation check"
	@echo "  update-image - Update container image"
	@echo "  scale       - Scale application"
	@echo "  env-*       - Switch to environment"
	@echo "  new-env-*   - Create new environment"
	@echo "  list-env    - List environments"
	@echo "  show        - Show current configuration"
	@echo "  outputs     - Show outputs"
	@echo "  refresh     - Refresh state"
	@echo "  graph       - Generate dependency graph"
	@echo "  cost        - Estimate costs (requires infracost)"
	@echo "  security    - Security scan (requires checkov)"