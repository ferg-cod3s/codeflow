# CloudWatch Monitoring and Alerting for Codeflow

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "codeflow_logs" {
  name              = "/codeflow/${var.environment}"
  retention_in_days = var.log_retention_days
  kms_key_id        = var.kms_key_arn

  tags = {
    Name        = "codeflow-${var.environment}-logs"
    Environment = var.environment
    Service     = "codeflow"
  }
}

# CloudWatch Alarms for ECS
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "codeflow-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.ecs_cpu_threshold
  alarm_description   = "ECS CPU utilization is high for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "codeflow-${var.environment}-ecs-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.ecs_memory_threshold
  alarm_description   = "ECS memory utilization is high for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks_low" {
  alarm_name          = "codeflow-${var.environment}-ecs-tasks-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.min_running_tasks
  alarm_description   = "Running task count is below minimum for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

# ALB Alarms
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  alarm_name          = "codeflow-${var.environment}-alb-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.alb_5xx_threshold
  alarm_description   = "ALB 5xx error count is high for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_response_time" {
  alarm_name          = "codeflow-${var.environment}-alb-response-time"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.alb_response_time_threshold
  alarm_description   = "ALB response time is high for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

# RDS Alarms (if database is used)
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  count               = var.enable_rds_alarms ? 1 : 0
  alarm_name          = "codeflow-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization is high for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_free_storage_low" {
  count               = var.enable_rds_alarms ? 1 : 0
  alarm_name          = "codeflow-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_free_storage_threshold
  alarm_description   = "RDS free storage space is low for Codeflow ${var.environment}"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

# Custom Codeflow Metrics Alarms
resource "aws_cloudwatch_metric_alarm" "codeflow_command_errors" {
  alarm_name          = "codeflow-${var.environment}-command-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CommandSuccess"
  namespace           = "Codeflow/CLI"
  period              = "300"
  statistic           = "Average"
  threshold           = 0.95  # Alert if success rate drops below 95%
  alarm_description   = "Codeflow command success rate is low"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Service = "codeflow-cli"
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

resource "aws_cloudwatch_metric_alarm" "codeflow_slow_commands" {
  alarm_name          = "codeflow-${var.environment}-slow-commands"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CommandExecutionTime"
  namespace           = "Codeflow/CLI"
  period              = "300"
  statistic           = "Average"
  threshold           = var.codeflow_command_timeout_ms
  alarm_description   = "Codeflow command execution time is too high"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    Service = "codeflow-cli"
  }

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "codeflow-${var.environment}-alerts"

  tags = {
    Environment = var.environment
    Service     = "codeflow"
  }
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = "*"
        }
        Action = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = var.aws_account_id
          }
        }
      }
    ]
  })
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "codeflow" {
  dashboard_name = "codeflow-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      # ECS Metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name, "ServiceName", var.ecs_service_name],
            [".", "MemoryUtilization", ".", ".", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ECS Resource Utilization"
          period  = 300
        }
      },

      # ALB Metrics
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", var.alb_arn_suffix],
            [".", "HTTPCode_Target_2XX_Count", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "ALB Request Metrics"
          period  = 300
        }
      },

      # Codeflow Custom Metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["Codeflow/CLI", "CommandExecutionTime", "Service", "codeflow-cli"],
            [".", "AgentExecutionTime", ".", "."],
            [".", "MCPOperationDuration", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Codeflow Performance Metrics"
          period  = 300
        }
      },

      # Error Rates
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["Codeflow/CLI", "CommandSuccess", "Service", "codeflow-cli"],
            [".", "AgentSuccess", ".", "."]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.aws_region
          title   = "Codeflow Success Rates"
          period  = 300
        }
      },

      # Logs Insights Widget
      {
        type   = "log"
        x      = 0
        y      = 12
        width  = 24
        height = 6

        properties = {
          query = "fields @timestamp, level, message, command, duration | filter level = 'ERROR' | sort @timestamp desc | limit 100"
          region = var.aws_region
          title  = "Recent Error Logs"
        }
      }
    ]
  })
}