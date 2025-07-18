#!/bin/bash

# Docker-based Node.js LTS compatibility testing script
# This script uses Docker to test the package with different Node.js versions in isolated containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERDACCIO_PORT=4873
VERDACCIO_URL="http://verdaccio-test:4873"
PACKAGE_NAME="@aignostics/platform-typescript-sdk"
VERDACCIO_CONTAINER="verdaccio-test"
DOCKER_NETWORK="test-network"

# Current Node.js LTS versions (as of 2025)
NODE_VERSIONS=("18.20.4" "20.18.0" "22.12.0")

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

# Function to cleanup on exit
cleanup() {
    print_status "Cleaning up Docker containers..."
    
    # Stop and remove Verdaccio container
    docker stop $VERDACCIO_CONTAINER 2>/dev/null || true
    docker rm $VERDACCIO_CONTAINER 2>/dev/null || true
    
    # Remove any test containers
    docker ps -a --filter "name=node-test-*" --format "{{.Names}}" | xargs -r docker rm -f
    
    # Remove Docker network
    docker network rm $DOCKER_NETWORK 2>/dev/null || true
    
    # Clean up config files
    rm -f verdaccio-config.yaml htpasswd test-package.sh
    
    print_status "Cleanup completed"
}

# Set trap to cleanup on exit
trap cleanup EXIT INT TERM

# Function to start Verdaccio in Docker
start_verdaccio() {
    print_status "Starting Verdaccio in Docker container..."
    
    # Create Docker network
    docker network create $DOCKER_NETWORK 2>/dev/null || true
    
    # Create empty htpasswd file to avoid auth errors
    touch htpasswd
    
    # Create Verdaccio config with proper anonymous access
    cat > verdaccio-config.yaml << EOF
storage: /verdaccio/storage
auth:
  htpasswd:
    file: /verdaccio/conf/htpasswd
    max_users: 1000
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@aignostics/*':
    access: \$anonymous
    publish: \$anonymous
    unpublish: \$anonymous
    proxy: npmjs
  '**':
    access: \$anonymous
    publish: \$anonymous
    unpublish: \$anonymous
    proxy: npmjs
server:
  keepAliveTimeout: 60
logs:
  type: stdout
  format: pretty
  level: info
web:
  enable: true
  title: Verdaccio Test Registry
middlewares:
  audit:
    enabled: false
EOF
    
    # Stop existing container if running
    docker stop $VERDACCIO_CONTAINER 2>/dev/null || true
    docker rm $VERDACCIO_CONTAINER 2>/dev/null || true
    
    # Start Verdaccio container
    docker run -d \
        --name $VERDACCIO_CONTAINER \
        --network $DOCKER_NETWORK \
        -p $VERDACCIO_PORT:4873 \
        -v "$(pwd)/verdaccio-config.yaml:/verdaccio/conf/config.yaml" \
        -v "$(pwd)/htpasswd:/verdaccio/conf/htpasswd" \
        verdaccio/verdaccio:6
    
    # Wait for Verdaccio to start
    print_status "Waiting for Verdaccio to start..."
    for i in {1..30}; do
        if curl -s "http://localhost:$VERDACCIO_PORT" >/dev/null 2>&1; then
            print_success "Verdaccio is running on http://localhost:$VERDACCIO_PORT"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Verdaccio failed to start"
            exit 1
        fi
        sleep 2
    done
}

# Function to build and publish package
build_and_publish() {
    print_status "Building and publishing package..."
    
    # Clean previous builds
    npm run clean 2>/dev/null || true
    
    # Build the package
    print_status "Building package..."
    npm run build
    
    # Set registry to local Verdaccio
    npm config set registry http://localhost:$VERDACCIO_PORT
    
    # For scoped packages, we need to set the registry specifically
    npm config set @aignostics:registry http://localhost:$VERDACCIO_PORT
    npm config set "//localhost:$VERDACCIO_PORT/:_authToken=anonymous"
    
    print_status "Registry configured for anonymous publishing"
    
    # Check Verdaccio status
    print_status "Checking Verdaccio status..."
    curl -s "http://localhost:$VERDACCIO_PORT/-/ping" || true
    
    # Try to publish with verbose output
    print_status "Publishing package..."
    if ! npm publish --registry http://localhost:$VERDACCIO_PORT --loglevel verbose; then
        print_error "Failed to publish package"
        print_status "Checking Verdaccio logs..."
        docker logs $VERDACCIO_CONTAINER | tail -20
        exit 1
    fi
    
    print_success "Package published successfully"
}

# Function to test package with specific Node version
test_node_version() {
    local node_version=$1
    local container_name="node-test-$node_version"
    
    print_status "Testing with Node.js $node_version..."
    
    # Create test script
    cat > test-package.sh << EOF
#!/bin/sh
set -e

echo "Node.js version: \$(node --version)"
echo "npm version: \$(npm --version)"

# Create test directory
mkdir -p /test-app
cd /test-app

# Initialize npm project
npm init -y

# Set registry to Verdaccio
npm config set @aignostics:registry http://verdaccio-test:4873

# Install the package
echo "Installing $PACKAGE_NAME..."
npm install $PACKAGE_NAME

# Test CLI commands
echo "Testing CLI commands..."

# Test version command
echo "Testing version command..."
npx aignostics-platform --version

# Test info command
echo "Testing info command..."
npx aignostics-platform info

# Test API connection command
echo "Testing API connection command..."
npx aignostics-platform test-api --endpoint https://jsonplaceholder.typicode.com

# Test programmatic usage
echo "Testing programmatic usage..."
cat > test-usage.js << JSEOF
const { PlatformSDK } = require('$PACKAGE_NAME');

async function test() {
    const sdk = new PlatformSDK({
        baseURL: 'https://platform.aignostics.com',
        timeout: 5000
    });
    
    console.log('SDK Version:', sdk.getVersion());
    console.log('SDK Config:', JSON.stringify(sdk.getConfig(), null, 2));
    
    try {
        const result = await sdk.testConnection();
        console.log('Connection test result:', result);
        console.log('✅ Programmatic usage test passed');
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

test().catch(console.error);
JSEOF

node test-usage.js

echo "✅ All tests passed for Node.js \$(node --version)"
EOF
    
    chmod +x test-package.sh
    
    # Run test in Docker container
    docker run --rm \
        --name "$container_name" \
        --network $DOCKER_NETWORK \
        -v "$(pwd)/test-package.sh:/test-package.sh" \
        "node:$node_version-alpine" \
        sh -c "apk add --no-cache curl && /test-package.sh"
    
    print_success "Node.js $node_version testing completed successfully!"
}

# Main execution
main() {
    print_status "Starting Docker-based Node.js LTS compatibility testing..."
    print_status "Testing Node.js versions: ${NODE_VERSIONS[*]}"
    
    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is required but not installed"
        exit 1
    fi
    
    # Start Verdaccio
    start_verdaccio
    
    # Build and publish package
    build_and_publish
    
    # Test with each Node.js version
    for node_version in "${NODE_VERSIONS[@]}"; do
        print_status "========================================"
        print_status "Testing with Node.js $node_version"
        print_status "========================================"
        
        test_node_version "$node_version"
    done
    
    print_success "========================================"
    print_success "All Node.js LTS versions tested successfully!"
    print_success "Package is compatible with all tested versions"
    print_success "========================================"
}

# Check prerequisites
print_status "Checking prerequisites..."

if [ ! -f "package.json" ]; then
    print_error "This script must be run from the package root directory"
    exit 1
fi

# Run main function
main
