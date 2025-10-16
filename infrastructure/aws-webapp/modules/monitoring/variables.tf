variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "kms_key_arn" {
  description = "KMS key ARN for log encryption"
  type        = string
  default     = null
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

# ECS Configuration
variable "ecs_cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "ecs_service_name" {
  description = "ECS service name"
  type        = string
}

variable "ecs_cpu_threshold" {
  description = "ECS CPU utilization threshold for alerts"
  type        = number
  default     = 80
}

variable "ecs_memory_threshold" {
  description = "ECS memory utilization threshold for alerts"
  type        = number
  default     = 85
}

variable "min_running_tasks" {
  description = "Minimum number of running tasks"
  type        = number
  default     = 1
}

# ALB Configuration
variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
}

variable "alb_5xx_threshold" {
  description = "ALB 5xx error count threshold"
  type        = number
  default     = 10
}

variable "alb_response_time_threshold" {
  description = "ALB response time threshold in seconds"
  type        = number
  default     = 5
}

# RDS Configuration (optional)
variable "enable_rds_alarms" {
  description = "Enable RDS monitoring alarms"
  type        = bool
  default     = false
}

variable "rds_instance_id" {
  description = "RDS instance identifier"
  type        = string
  default     = ""
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold"
  type        = number
  default     = 80
}

variable "rds_free_storage_threshold" {
  description = "RDS free storage threshold in bytes"
  type        = number
  default     = 1073741824  # 1GB
}

# Codeflow-specific Configuration
variable "codeflow_command_timeout_ms" {
  description = "Codeflow command timeout threshold in milliseconds"
  type        = number
  default     = 30000  # 30 seconds
}