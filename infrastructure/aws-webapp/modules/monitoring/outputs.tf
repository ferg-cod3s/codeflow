output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.codeflow_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.codeflow_logs.arn
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=codeflow-${var.environment}"
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = [
    aws_cloudwatch_metric_alarm.ecs_cpu_high.arn,
    aws_cloudwatch_metric_alarm.ecs_memory_high.arn,
    aws_cloudwatch_metric_alarm.ecs_running_tasks_low.arn,
    aws_cloudwatch_metric_alarm.alb_5xx_errors.arn,
    aws_cloudwatch_metric_alarm.alb_response_time.arn,
    aws_cloudwatch_metric_alarm.codeflow_command_errors.arn,
    aws_cloudwatch_metric_alarm.codeflow_slow_commands.arn
  ]
}