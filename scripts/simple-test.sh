#!/bin/bash

# Simple test script to verify Docker-based publishing works
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
VERDACCIO_PORT=4874  # Use different port to avoid conflicts
VERDACCIO_CONTAINER="verdaccio-simple-test"
DOCKER_NETWORK="simple-test-network"

cleanup() {
    print_status "Cleaning up..."
    docker stop $VERDACCIO_CONTAINER 2>/dev/null || true
    docker rm $VERDACCIO_CONTAINER 2>/dev/null || true
    docker network rm $DOCKER_NETWORK 2>/dev/null || true
    rm -f simple-verdaccio-config.yaml
    print_status "Cleanup completed"
}

trap cleanup EXIT

print_status "Starting simple Verdaccio test..."

# Create network
docker network create $DOCKER_NETWORK 2>/dev/null || true

# Create simple Verdaccio config with anonymous publishing
cat > simple-verdaccio-config.yaml << EOF
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
    access: \$anonymous \$all
    publish: \$anonymous \$all
    unpublish: \$anonymous \$all
  '**':
    access: \$authenticated
    publish: \$authenticated
    unpublish: \$authenticated
    proxy: npmjs
server:
  keepAliveTimeout: 60
logs:
  type: stdout
  format: pretty
  level: info
EOF

# Start Verdaccio
print_status "Starting Verdaccio..."
docker run -d \
    --name $VERDACCIO_CONTAINER \
    --network $DOCKER_NETWORK \
    -p $VERDACCIO_PORT:4873 \
    -v "$(pwd)/simple-verdaccio-config.yaml:/verdaccio/conf/config.yaml" \
    verdaccio/verdaccio:6

# Wait for startup
print_status "Waiting for Verdaccio to start..."
for i in {1..20}; do
    if curl -s "http://localhost:$VERDACCIO_PORT" >/dev/null 2>&1; then
        print_success "Verdaccio is running on http://localhost:$VERDACCIO_PORT"
        break
    fi
    if [ $i -eq 20 ]; then
        print_error "Verdaccio failed to start"
        docker logs $VERDACCIO_CONTAINER
        exit 1
    fi
    sleep 2
done

# Test publishing
print_status "Testing publishing..."

# Build the package first
npm run build

# Set registry
npm config set registry http://localhost:$VERDACCIO_PORT
npm config set @aignostics:registry http://localhost:$VERDACCIO_PORT
npm config set "//localhost:$VERDACCIO_PORT/:_authToken=anonymous"

# Try to publish
if npm publish --registry http://localhost:$VERDACCIO_PORT; then
    print_success "Package published successfully!"
    
    # Test in container
    print_status "Testing installation in container..."
    docker run --rm \
        --network $DOCKER_NETWORK \
        node:20-alpine \
        sh -c "
            set -e
            npm config set @aignostics:registry http://verdaccio-simple-test:4873
            npm config set '//verdaccio-simple-test:4873/:_authToken=anonymous'
            npm install -g @aignostics/sdk
            aignostics-platform --version
        "
    
    print_success "All tests passed!"
else
    print_error "Failed to publish package"
    exit 1
fi
