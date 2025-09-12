output "db_endpoint" {
  description = "Database endpoint"
  value       = var.engine_mode == "serverless" ? aws_rds_cluster.main[0].endpoint : aws_db_instance.main[0].endpoint
  sensitive   = true
}

output "db_port" {
  description = "Database port"
  value       = var.engine_mode == "serverless" ? aws_rds_cluster.main[0].port : aws_db_instance.main[0].port
}

output "db_name" {
  description = "Database name"
  value       = var.db_name
}

output "db_username" {
  description = "Database username"
  value       = var.db_username
  sensitive   = true
}

output "db_instance_id" {
  description = "Database instance/cluster ID"
  value       = var.engine_mode == "serverless" ? aws_rds_cluster.main[0].id : aws_db_instance.main[0].id
}

output "db_arn" {
  description = "Database ARN"
  value       = var.engine_mode == "serverless" ? aws_rds_cluster.main[0].arn : aws_db_instance.main[0].arn
}

output "db_proxy_endpoint" {
  description = "RDS Proxy endpoint"
  value       = var.create_db_proxy ? aws_db_proxy.main[0].endpoint : null
}

output "db_proxy_arn" {
  description = "RDS Proxy ARN"
  value       = var.create_db_proxy ? aws_db_proxy.main[0].arn : null
}