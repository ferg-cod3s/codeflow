terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "webapp/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  project_name     = var.project_name
  environment      = var.environment
  vpc_cidr         = var.vpc_cidr
  azs              = var.availability_zones
  public_subnets   = var.public_subnets
  private_subnets  = var.private_subnets
  database_subnets = var.database_subnets
}

# Security Groups
module "security_groups" {
  source = "./modules/security-groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnets        = module.vpc.public_subnets
  alb_security_group_id = module.security_groups.alb_sg_id
  certificate_arn       = var.certificate_arn
}

# ECS Cluster and Service
module "ecs" {
  source = "./modules/ecs"

  project_name             = var.project_name
  environment              = var.environment
  vpc_id                   = module.vpc.vpc_id
  private_subnets          = module.vpc.private_subnets
  ecs_security_group_id    = module.security_groups.ecs_sg_id
  alb_target_group_arn     = module.alb.target_group_arn
  container_image          = var.container_image
  container_port           = var.container_port
  desired_count            = var.desired_count
  cpu                      = var.cpu
  memory                   = var.memory
}

# RDS Database
module "rds" {
  source = "./modules/rds"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  database_subnets       = module.vpc.database_subnets
  rds_security_group_id  = module.security_groups.rds_sg_id
  db_instance_class      = var.db_instance_class
  db_engine              = var.db_engine
  db_engine_version      = var.db_engine_version
  db_name                = var.db_name
  db_username            = var.db_username
  db_password            = var.db_password
  backup_retention_period = var.backup_retention_period
}

# S3 Bucket for Static Assets
module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"

  project_name         = var.project_name
  environment          = var.environment
  s3_bucket_domain_name = module.s3.bucket_domain_name
  s3_bucket_id         = module.s3.bucket_id
  certificate_arn      = var.certificate_arn
  alb_domain_name      = module.alb.alb_dns_name
}

# Route 53 Records (optional)
module "route53" {
  count  = var.create_route53_records ? 1 : 0
  source = "./modules/route53"

  project_name    = var.project_name
  environment     = var.environment
  domain_name     = var.domain_name
  alb_dns_name    = module.alb.alb_dns_name
  alb_zone_id     = module.alb.alb_zone_id
  cloudfront_domain_name = module.cloudfront.cloudfront_domain_name
  cloudfront_zone_id     = module.cloudfront.cloudfront_zone_id
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_name = var.project_name
  environment  = var.environment
  ecs_cluster_name = module.ecs.cluster_name
  ecs_service_name = module.ecs.service_name
  rds_instance_id  = module.rds.db_instance_id
  alb_arn_suffix   = module.alb.alb_arn_suffix
  sns_topic_arn    = var.sns_topic_arn
}