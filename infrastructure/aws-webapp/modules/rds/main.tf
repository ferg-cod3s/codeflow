resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.database_subnets

  tags = {
    Name = "${var.project_name}-${var.environment}-db-subnet-group"
  }
}

resource "aws_rds_cluster" "main" {
  count                   = var.engine_mode == "serverless" ? 1 : 0
  cluster_identifier      = "${var.project_name}-${var.environment}-cluster"
  engine                  = var.db_engine
  engine_version          = var.db_engine_version
  database_name           = var.db_name
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [var.rds_security_group_id]
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.backup_window

  scaling_configuration {
    auto_pause               = true
    max_capacity             = var.serverless_max_capacity
    min_capacity             = var.serverless_min_capacity
    seconds_until_auto_pause = 300
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

resource "aws_rds_cluster_instance" "main" {
  count                = var.engine_mode == "serverless" ? 1 : 0
  identifier           = "${var.project_name}-${var.environment}-instance-1"
  cluster_identifier   = aws_rds_cluster.main[0].id
  instance_class       = var.db_instance_class
  engine               = var.db_engine
  engine_version       = var.db_engine_version
  db_subnet_group_name = aws_db_subnet_group.main.name

  tags = {
    Name = "${var.project_name}-${var.environment}-instance-1"
  }
}

# Traditional RDS instance (for provisioned mode)
resource "aws_db_instance" "main" {
  count                   = var.engine_mode == "provisioned" ? 1 : 0
  identifier              = "${var.project_name}-${var.environment}-db"
  engine                  = var.db_engine
  engine_version          = var.db_engine_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.allocated_storage
  storage_type            = var.storage_type
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.main.name
  vpc_security_group_ids  = [var.rds_security_group_id]
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window
  multi_az                = var.multi_az
  skip_final_snapshot     = var.skip_final_snapshot
  final_snapshot_identifier = var.final_snapshot_identifier

  enabled_cloudwatch_logs_exports = var.enabled_cloudwatch_logs_exports

  tags = {
    Name = "${var.project_name}-${var.environment}-db"
  }
}

# RDS Proxy (optional)
resource "aws_db_proxy" "main" {
  count                 = var.create_db_proxy ? 1 : 0
  name                  = "${var.project_name}-${var.environment}-proxy"
  engine_family         = "POSTGRESQL"
  idle_client_timeout   = 1800
  require_tls           = true
  role_arn              = aws_iam_role.rds_proxy_role[0].arn
  vpc_security_group_ids = [var.rds_security_group_id]
  vpc_subnet_ids        = var.database_subnets

  auth {
    auth_scheme = "SECRETS"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.rds_credentials[0].arn
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-proxy"
  }
}

resource "aws_db_proxy_default_target_group" "main" {
  count         = var.create_db_proxy ? 1 : 0
  db_proxy_name = aws_db_proxy.main[0].name

  connection_pool_config {
    max_connections_percent      = 100
    max_idle_connections_percent = 50
    connection_borrow_timeout    = 120
  }
}

resource "aws_db_proxy_target" "main" {
  count                 = var.create_db_proxy ? 1 : 0
  db_proxy_name         = aws_db_proxy.main[0].name
  target_group_name     = aws_db_proxy_default_target_group.main[0].name
  rds_resource_id       = var.engine_mode == "serverless" ? aws_rds_cluster.main[0].id : aws_db_instance.main[0].id
  type                  = var.engine_mode == "serverless" ? "TRACKED_CLUSTER" : "RDS_INSTANCE"
}

# Secrets Manager for database credentials
resource "aws_secretsmanager_secret" "rds_credentials" {
  count                   = var.create_db_proxy ? 1 : 0
  name                    = "${var.project_name}-${var.environment}-db-credentials"
  description             = "Database credentials for ${var.project_name}"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.project_name}-${var.environment}-db-credentials"
  }
}

resource "aws_secretsmanager_secret_version" "rds_credentials" {
  count         = var.create_db_proxy ? 1 : 0
  secret_id     = aws_secretsmanager_secret.rds_credentials[0].id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
  })
}

# IAM role for RDS Proxy
resource "aws_iam_role" "rds_proxy_role" {
  count = var.create_db_proxy ? 1 : 0
  name  = "${var.project_name}-${var.environment}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-rds-proxy-role"
  }
}

resource "aws_iam_role_policy" "rds_proxy_policy" {
  count = var.create_db_proxy ? 1 : 0
  name  = "${var.project_name}-${var.environment}-rds-proxy-policy"
  role  = aws_iam_role.rds_proxy_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.rds_credentials[0].arn
      }
    ]
  })
}