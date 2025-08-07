#!/bin/bash

# Vercel Deployment Script
# Usage: ./scripts/deploy-vercel.sh [environment] [flags]
# Environment: production | staging | preview (default: production)
# Flags: --force, --skip-build, --debug

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
PROJECT_NAME="lechworld"
BUILD_DIR="apps/web/dist"
CONFIG_FILE="vercel.json"

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

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_error "Vercel CLI is not installed"
        print_status "Installing Vercel CLI globally..."
        npm install -g vercel
    fi
    
    # Check if pnpm is installed
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed"
        print_status "Installing pnpm..."
        npm install -g pnpm
    fi
    
    print_success "All dependencies are installed"
}

# Function to validate environment
validate_environment() {
    print_status "Validating environment: $ENVIRONMENT"
    
    case $ENVIRONMENT in
        production|staging|preview)
            print_success "Valid environment: $ENVIRONMENT"
            ;;
        *)
            print_error "Invalid environment: $ENVIRONMENT"
            print_status "Valid environments: production, staging, preview"
            exit 1
            ;;
    esac
}

# Function to check required environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    REQUIRED_VARS=(
        "VERCEL_TOKEN"
        "VERCEL_ORG_ID"
        "VERCEL_PROJECT_ID"
    )
    
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

# Function to run tests
run_tests() {
    print_status "Running tests before deployment..."
    
    if [[ " $@ " =~ " --skip-tests " ]]; then
        print_warning "Skipping tests (--skip-tests flag detected)"
        return 0
    fi
    
    pnpm run test:ci || {
        print_error "Tests failed! Aborting deployment."
        exit 1
    }
    
    print_success "All tests passed"
}

# Function to build the project
build_project() {
    print_status "Building project for $ENVIRONMENT..."
    
    if [[ " $@ " =~ " --skip-build " ]]; then
        print_warning "Skipping build (--skip-build flag detected)"
        return 0
    fi
    
    # Clean previous build
    rm -rf $BUILD_DIR
    
    # Install dependencies
    print_status "Installing dependencies..."
    pnpm install --frozen-lockfile
    
    # Build the project
    print_status "Building frontend application..."
    NODE_ENV=production VITE_ENVIRONMENT=$ENVIRONMENT pnpm run build:web || {
        print_error "Build failed! Aborting deployment."
        exit 1
    }
    
    # Check build output
    if [ ! -d "$BUILD_DIR" ]; then
        print_error "Build directory not found: $BUILD_DIR"
        exit 1
    fi
    
    BUILD_SIZE=$(du -sh $BUILD_DIR | cut -f1)
    print_success "Build completed successfully (Size: $BUILD_SIZE)"
}

# Function to deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel ($ENVIRONMENT)..."
    
    DEPLOY_ARGS=""
    
    # Set deployment arguments based on environment
    case $ENVIRONMENT in
        production)
            DEPLOY_ARGS="--prod"
            ;;
        staging)
            DEPLOY_ARGS="--target staging"
            ;;
        preview)
            DEPLOY_ARGS=""
            ;;
    esac
    
    # Add force flag if specified
    if [[ " $@ " =~ " --force " ]]; then
        DEPLOY_ARGS="$DEPLOY_ARGS --force"
        print_warning "Force deployment enabled"
    fi
    
    # Add debug flag if specified
    if [[ " $@ " =~ " --debug " ]]; then
        DEPLOY_ARGS="$DEPLOY_ARGS --debug"
        print_status "Debug mode enabled"
    fi
    
    # Deploy using Vercel CLI
    print_status "Executing deployment command..."
    DEPLOYMENT_URL=$(vercel $DEPLOY_ARGS \
        --token=$VERCEL_TOKEN \
        --scope=$VERCEL_ORG_ID \
        --confirm \
        --no-clipboard \
        2>&1 | tee /dev/tty | grep -oP 'https://[^\s]+\.vercel\.app' | tail -1)
    
    if [ -z "$DEPLOYMENT_URL" ]; then
        print_error "Failed to retrieve deployment URL"
        exit 1
    fi
    
    print_success "Deployment successful!"
    print_status "Deployment URL: $DEPLOYMENT_URL"
    
    # Set alias for staging
    if [ "$ENVIRONMENT" = "staging" ]; then
        print_status "Setting staging alias..."
        vercel alias set $DEPLOYMENT_URL staging-$PROJECT_NAME.vercel.app \
            --token=$VERCEL_TOKEN \
            --scope=$VERCEL_ORG_ID
        print_success "Staging alias set: https://staging-$PROJECT_NAME.vercel.app"
    fi
    
    echo "$DEPLOYMENT_URL" > .last-deployment-url
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    if [ ! -f ".last-deployment-url" ]; then
        print_warning "No deployment URL found to verify"
        return 1
    fi
    
    DEPLOYMENT_URL=$(cat .last-deployment-url)
    
    # Wait for deployment to be ready
    print_status "Waiting for deployment to be ready..."
    sleep 10
    
    # Check if the deployment is accessible
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $DEPLOYMENT_URL)
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Deployment is accessible (HTTP $HTTP_STATUS)"
        
        # Run basic health check
        HEALTH_STATUS=$(curl -s $DEPLOYMENT_URL/api/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            print_success "Health check passed"
        else
            print_warning "Health check returned: $HEALTH_STATUS"
        fi
    else
        print_error "Deployment is not accessible (HTTP $HTTP_STATUS)"
        return 1
    fi
}

# Function to run post-deployment tasks
post_deployment() {
    print_status "Running post-deployment tasks..."
    
    # Purge CDN cache if in production
    if [ "$ENVIRONMENT" = "production" ]; then
        print_status "Purging CDN cache..."
        # Add your CDN cache purge logic here
    fi
    
    # Send deployment notification
    if [ -n "$SLACK_WEBHOOK" ]; then
        print_status "Sending deployment notification..."
        DEPLOYMENT_URL=$(cat .last-deployment-url)
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"Frontend deployed to $ENVIRONMENT\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"URL\", \"value\": \"$DEPLOYMENT_URL\", \"short\": true},
                        {\"title\": \"Deployed by\", \"value\": \"$(git config user.name)\", \"short\": true},
                        {\"title\": \"Branch\", \"value\": \"$(git branch --show-current)\", \"short\": true}
                    ]
                }]
            }"
        print_success "Notification sent"
    fi
    
    # Create deployment tag in git
    if [ "$ENVIRONMENT" = "production" ]; then
        TAG_NAME="deploy-$(date +%Y%m%d-%H%M%S)"
        git tag -a $TAG_NAME -m "Production deployment on $(date)"
        print_success "Created deployment tag: $TAG_NAME"
    fi
}

# Function to rollback deployment
rollback() {
    print_status "Rolling back deployment..."
    
    vercel rollback \
        --token=$VERCEL_TOKEN \
        --scope=$VERCEL_ORG_ID \
        --yes
    
    if [ $? -eq 0 ]; then
        print_success "Rollback completed successfully"
    else
        print_error "Rollback failed"
        exit 1
    fi
}

# Function to show deployment history
show_history() {
    print_status "Fetching deployment history..."
    
    vercel list \
        --token=$VERCEL_TOKEN \
        --scope=$VERCEL_ORG_ID \
        --limit=10
}

# Main execution
main() {
    clear
    echo "========================================="
    echo "     Vercel Deployment Script"
    echo "     Environment: $ENVIRONMENT"
    echo "========================================="
    echo ""
    
    # Check for special commands
    case "${2:-}" in
        rollback)
            rollback
            exit 0
            ;;
        history)
            show_history
            exit 0
            ;;
    esac
    
    # Run deployment pipeline
    check_dependencies
    validate_environment
    check_env_vars
    load_env_vars
    run_tests "$@"
    build_project "$@"
    deploy_to_vercel "$@"
    verify_deployment
    post_deployment
    
    echo ""
    echo "========================================="
    echo "     Deployment Complete!"
    echo "========================================="
    print_success "Frontend successfully deployed to $ENVIRONMENT"
    
    if [ -f ".last-deployment-url" ]; then
        echo ""
        echo "URL: $(cat .last-deployment-url)"
    fi
}

# Run main function with all arguments
main "$@"