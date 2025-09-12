variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "lifecycle_prefix" {
  description = "Prefix for lifecycle rules"
  type        = string
  default     = ""
}

variable "create_backup_bucket" {
  description = "Whether to create a backup bucket"
  type        = bool
  default     = false
}