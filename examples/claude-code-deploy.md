---
name: deploy
description: Deploy application to specified environment with comprehensive validation
argument-hint: [environment] [version] [options]
allowed-tools: Bash(git:*), Bash(npm:*), Bash(docker:*), Bash(kubectl:*)
---

# Deployment Command

Deploying application with arguments: **$ARGUMENTS**

## Environment: $1

## Version: $2

## Additional Options: $3

## Pre-deployment Validation

!`if [ -z "$1" ]; then
  echo "❌ Error: Environment is required"
  echo "Usage: /deploy [environment] [version] [options]"
  echo "Valid environments: development, staging, production"
  exit 1
fi`

!`case "$1" in
  development|staging|production)
    echo "✅ Valid environment: $1"
    ;;
  *)
    echo "❌ Error: Invalid environment '$1'"
    echo "Valid environments: development, staging, production"
    exit 1
    ;;
esac`

## Version Validation

!`if [ -z "$2" ]; then
  echo "⚠️  Warning: No version specified, using latest"
  VERSION="latest"
else
  VERSION="$2"
  echo "✅ Version specified: $VERSION"
fi`

## Git Status Check

!`echo "🔍 Checking git status..."`
!`if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️  Warning: Working directory has uncommitted changes"
  git status --short
  echo ""
  echo "Consider committing changes before deployment"
else
  echo "✅ Working directory is clean"
fi`

## Build Application

!`echo "🔨 Building application for $1 environment..."`
!`npm run build:$1`

!`if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi`

## Deployment Steps

!`echo "🚀 Starting deployment to $1..."`
!`echo "Version: $VERSION"`
!`echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"`

### Environment-specific deployment

!`case "$1" in
  development)
    echo "🔧 Deploying to development environment..."
    docker-compose -f docker-compose.dev.yml up -d
    ;;
  staging)
    echo "🧪 Deploying to staging environment..."
    kubectl apply -f k8s/staging/ -n staging
    ;;
  production)
    echo "🌟 Deploying to production environment..."
    kubectl apply -f k8s/production/ -n production
    # Additional production safeguards
    kubectl rollout status deployment/app -n production --timeout=300s
    ;;
esac`

## Post-deployment Verification

!`echo "🔍 Verifying deployment..."`
!`sleep 10`

!`case "$1" in
  development)
    curl -f http://localhost:3000/health || echo "❌ Health check failed"
    ;;
  staging)
    kubectl get pods -n staging -l app=app
    ;;
  production)
    kubectl get pods -n production -l app=app
    kubectl get service app -n production
    ;;
esac`

## Rollback Information

!`if [ "$3" = "--rollback" ] || [ "$3" = "--enable-rollback" ]; then
  echo "🔄 Rollback enabled. Previous version available via:"
  echo "  /rollback $1 $VERSION"
fi`

## Deployment Summary

!`echo "✅ Deployment completed successfully!"`
!`echo "Environment: $1"`
!`echo "Version: $VERSION"`
!`echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"`
!`echo ""`
!`echo "📊 Monitor the deployment with:"`
!`echo "  /status $1"`
!`echo "  /logs $1"`
