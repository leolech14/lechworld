#!/bin/bash

# Railway Deployment Script
# Usage: ./scripts/deploy-railway.sh [environment] [service] [flags]
# Environment: production | staging | development (default: production)
# Service: api | worker | all (default: api)
# Flags: --force, --skip-migrations, --debug, --rollback

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
SERVICE="${2:-api}"
PROJECT_NAME="lechworld"
CONFIG_FILE="railway.json"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_debug() {
    if [[ " $@ " =~ " --debug " ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $1"
    fi
}

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed"
        print_status "Installing Railway CLI..."
        npm install -g @railway/cli
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        print_status "Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check if Docker is installed (optional but recommended)
    if command -v docker &> /dev/null; then
        print_success "Docker is installed (optional)"
    else
        print_warning "Docker is not installed (optional but recommended for local testing)"
    fi
    
    print_success "All required dependencies are installed"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        production|staging|development)
            print_success "Valid environment: $ENVIRONMENT"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_status "Valid environments: production, staging, development"
            exit 1
            ;;
    esac
}

# Function to validate service
validate_service() {
    print_status "Validating service: $SERVICE"
    
    case $SERVICE in
        api|worker|all)
            print_success "Valid service: $SERVICE"
            ;;
        *)
            print_error "Invalid service: $SERVICE"
            print_status "Valid services: api, worker, all"
            exit 1
            ;;
    esac
}

# Function to check required environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    REQUIRED_VARS=(
        "RAILWAY_TOKEN"
        "RAILWAY_PROJECT_ID"
    )
    
    # Additional vars for production
    if [ "$ENVIRONMENT" = "production" ]; then
        REQUIRED_VARS+=(
            "DATABASE_URL"
            "REDIS_URL"
            "JWT_SECRET"
        )
    fi
    
    MISSING_VARS=()
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        print_status "Please set these variables in your .env file or export them"
        exit 1
    fi
    
    print_success "All required environment variables are set"
}

# Function to load environment variables
load_env_vars() {
    print_status "Loading environment variables for $ENVIRONMENT..."
    
    ENV_FILE=".env.$ENVIRONMENT"
    if [ -f "$ENV_FILE" ]; then
        export $(cat $ENV_FILE | grep -v '^#' | xargs)
        print_success "Loaded variables from $ENV_FILE"
    else
        print_warning "No $ENV_FILE found, using default environment variables"
    fi
}

# Function to authenticate with Railway
authenticate_railway() {
    print_status "Authenticating with Railway..."
    
    railway link $RAILWAY_PROJECT_ID --environment $ENVIRONMENT || {
        print_error "Failed to link Railway project"
        exit 1
    }
    
    print_success "Successfully linked to Railway project"
}

# Function to run tests
run_tests() {
    print_status "Running tests before deployment..."
    
    if [[ " $@ " =~ " --skip-tests " ]]; then
        print_warning "Skipping tests (--skip-tests flag detected)"
        return 0
    fi
    
    pnpm run test:api || {
        print_error "API tests failed! Aborting deployment."
        exit 1
    }
    
    print_success "All tests passed"
}

# Function to build the service
build_service() {
    local service_name=$1
    print_status "Building $service_name service..."
    
    if [[ " $@ " =~ " --skip-build " ]]; then
        print_warning "Skipping build (--skip-build flag detected)"
        return 0
    fi
    
    # Install dependencies
    print_status "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Build the service
    case $service_name in
        api)
            print_status "Building API service..."
            pnpm run build:api || {
                print_error "API build failed!"
                exit 1
            }
            ;;
        worker)
            print_status "Building Worker service..."
            pnpm run build:worker || {
                print_error "Worker build failed!"
                exit 1
            }
            ;;
    esac
    
    print_success "$service_name build completed successfully"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    if [[ " $@ " =~ " --skip-migrations " ]]; then
        print_warning "Skipping migrations (--skip-migrations flag detected)"
        return 0
    fi
    
    # Check current migration status
    print_status "Checking migration status..."
    pnpm run db:status || {
        print_warning "Could not check migration status"
    }
    
    # Run pending migrations
    print_status "Applying pending migrations..."
    pnpm run db:migrate:$ENVIRONMENT || {
        print_error "Migration failed!"
        print_status "Attempting rollback..."
        pnpm run db:rollback
        exit 1
    }
    
    print_success "Migrations completed successfully"
}

# Function to deploy service to Railway
deploy_service() {
    local service_name=$1
    print_status "Deploying $service_name to Railway ($ENVIRONMENT)..."
    
    DEPLOY_ARGS=""
    
    # Add force flag if specified
    if [[ " $@ " =~ " --force " ]]; then
        DEPLOY_ARGS="$DEPLOY_ARGS --force"
        print_warning "Force deployment enabled"
    fi
    
    # Deploy using Railway CLI
    print_status "Executing deployment command for $service_name..."
    
    railway up \
        --service $service_name \
        --environment $ENVIRONMENT \
        $DEPLOY_ARGS || {
        print_error "Deployment failed for $service_name!"
        exit 1
    }
    
    print_success "$service_name deployed successfully!"
    
    # Get deployment URL
    DEPLOYMENT_URL=$(railway status --service $service_name --json | jq -r '.url')
    if [ -n "$DEPLOYMENT_URL" ] && [ "$DEPLOYMENT_URL" != "null" ]; then
        print_status "Service URL: https://$DEPLOYMENT_URL"
        echo "https://$DEPLOYMENT_URL" > ".last-deployment-url-$service_name"
    fi
}

# Function to verify deployment
verify_deployment() {
    local service_name=$1
    print_status "Verifying $service_name deployment..."
    
    if [ ! -f ".last-deployment-url-$service_name" ]; then
        print_warning "No deployment URL found for $service_name"
        return 1
    fi
    
    DEPLOYMENT_URL=$(cat .last-deployment-url-$service_name)
    
    # Wait for deployment to be ready
    print_status "Waiting for $service_name to be ready..."
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL/health)
        
        if [ "$HTTP_STATUS" = "200" ]; then
            print_success "$service_name is accessible (HTTP $HTTP_STATUS)"
            
            # Run health check
            HEALTH_RESPONSE=$(curl -s $DEPLOYMENT_URL/health)
            HEALTH_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.status' 2>/dev/null || echo "unknown")
            
            if [ "$HEALTH_STATUS" = "healthy" ]; then
                print_success "Health check passed for $service_name"
                return 0
            else
                print_warning "Health check returned: $HEALTH_STATUS"
            fi
            break
        else
            print_debug "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES: HTTP $HTTP_STATUS"
            RETRY_COUNT=$((RETRY_COUNT + 1))
            sleep 2
        fi
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        print_error "$service_name deployment verification failed after $MAX_RETRIES attempts"
        return 1
    fi
}

# Function to run smoke tests
run_smoke_tests() {
    local service_name=$1
    print_status "Running smoke tests for $service_name..."
    
    if [ ! -f ".last-deployment-url-$service_name" ]; then
        print_warning "No deployment URL found for smoke tests"
        return 1
    fi
    
    DEPLOYMENT_URL=$(cat .last-deployment-url-$service_name)
    
    # Basic API endpoints to test
    ENDPOINTS=(
        "/health"
        "/api/v1/status"
        "/api/v1/docs"
    )
    
    FAILED_TESTS=0
    
    for endpoint in "${ENDPOINTS[@]}"; do
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL$endpoint)
        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
            print_success "✓ $endpoint (HTTP $HTTP_STATUS)"
        else
            print_error "✗ $endpoint (HTTP $HTTP_STATUS)"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    done
    
    if [ $FAILED_TESTS -gt 0 ]; then
        print_error "$FAILED_TESTS smoke tests failed"
        return 1
    else
        print_success "All smoke tests passed"
    fi
}

# Function to deploy all services
deploy_all_services() {
    print_status "Deploying all services..."
    
    SERVICES=("api" "worker")
    
    for service in "${SERVICES[@]}"; do
        build_service $service "$@"
        deploy_service $service "$@"
        verify_deployment $service
        run_smoke_tests $service
    done
}

# Function to rollback deployment
rollback() {
    local service_name=${1:-api}
    print_status "Rolling back $service_name deployment..."
    
    railway rollback \
        --service $service_name \
        --environment $ENVIRONMENT \
        --yes || {
        print_error "Rollback failed for $service_name"
        exit 1
    }
    
    print_success "Rollback completed successfully for $service_name"
}

# Function to show deployment logs
show_logs() {
    local service_name=${1:-api}
    print_status "Fetching logs for $service_name..."
    
    railway logs \
        --service $service_name \
        --environment $ENVIRONMENT \
        --lines 100
}

# Function to show deployment status
show_status() {
    print_status "Fetching deployment status..."
    
    railway status --json | jq '.' || {
        print_error "Failed to fetch deployment status"
        railway status
    }
}

# Function to run post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."
    
    # Clear application cache
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Clearing application cache..."
        # Add cache clearing logic here
    fi
    
    # Send deployment notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        print_status "Sending deployment notification..."
        
        DEPLOYMENT_INFO=""
        if [ -f ".last-deployment-url-api" ]; then
            DEPLOYMENT_INFO="API: $(cat .last-deployment-url-api)"
        fi
        
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Backend deployed to $ENVIRONMENT\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Service\", \"value\": \"$SERVICE\", \"short\": true},
                        {\"title\": \"URL\", \"value\": \"$DEPLOYMENT_INFO\", \"short\": false},
                        {\"title\": \"Deployed by\", \"value\": \"$(git config user.name)\", \"short\": true},
                        {\"title\": \"Commit\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true}
                    ]
                }]
            }"
        print_success "Notification sent"
    fi
    
    # Update deployment metrics
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Recording deployment metrics..."
        echo "{
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"environment\": \"$ENVIRONMENT\",
            \"service\": \"$SERVICE\",
            \"commit\": \"$(git rev-parse HEAD)\",
            \"branch\": \"$(git branch --show-current)\",
            \"deployer\": \"$(git config user.name)\"
        }" >> deployments.log
    fi
}

# Main execution
main() {
    clear
    echo "========================================="
    echo "     Railway Deployment Script"
    echo "     Environment: $ENVIRONMENT"
    echo "     Service: $SERVICE"
    echo "========================================="
    echo ""
    
    # Check for special commands
    case "${3:-}" in
        rollback)
            rollback $SERVICE
            exit 0
            ;;
        logs)
            show_logs $SERVICE
            exit 0
            ;;
        status)
            show_status
            exit 0
            ;;
    esac
    
    # Check for rollback flag
    if [[ " $@ " =~ " --rollback " ]]; then
        rollback $SERVICE
        exit 0
    fi
    
    # Run deployment pipeline
    check_dependencies
    validate_environment
    validate_service
    check_env_vars
    load_env_vars
    authenticate_railway
    run_tests "$@"
    
    # Run migrations before deployment (only for API service)
    if [ "$SERVICE" = "api" ] || [ "$SERVICE" = "all" ]; then
        run_migrations "$@"
    fi
    
    # Deploy based on service selection
    if [ "$SERVICE" = "all" ]; then
        deploy_all_services "$@"
    else
        build_service $SERVICE "$@"
        deploy_service $SERVICE "$@"
        verify_deployment $SERVICE
        run_smoke_tests $SERVICE
    fi
    
    post_deployment
    
    echo ""
    echo "========================================="
    echo "     Deployment Complete!"
    echo "========================================="
    print_success "Successfully deployed $SERVICE to $ENVIRONMENT"
    
    # Show deployment URLs
    if [ -f ".last-deployment-url-api" ]; then
        echo ""
        echo "API URL: $(cat .last-deployment-url-api)"
    fi
    if [ -f ".last-deployment-url-worker" ]; then
        echo "Worker URL: $(cat .last-deployment-url-worker)"
    fi
}

# Run main function with all arguments
main "$@"