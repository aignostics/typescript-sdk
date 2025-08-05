#!/bin/bash

# Minimal working Docker test script
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CONTAINER_NAME="verdaccio-minimal"
PORT=4875

cleanup() {
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# trap cleanup EXIT

print_status "Starting minimal Verdaccio test..."

# Clean up first
cleanup

# Start Verdaccio with minimal config (no auth required)
print_status "Starting Verdaccio container..."
docker run -d \
    --name $CONTAINER_NAME \
    -p $PORT:4873 \
    -e VERDACCIO_PROTOCOL=http \
    -e VERDACCIO_PORT=4873 \
    verdaccio/verdaccio:6 \
    sh -c "echo 'storage: /verdaccio/storage
packages:
  \"@*/*\":
    access: \$anonymous
    publish: \$anonymous
  \"**\":
    access: \$anonymous  
    publish: \$anonymous
uplinks:
  npmjs:
    url: https://registry.npmjs.org/' > /verdaccio/conf/config.yaml && verdaccio --config /verdaccio/conf/config.yaml"

# Wait for startup
print_status "Waiting for Verdaccio..."
for i in {1..20}; do
    if curl -s "http://localhost:$PORT" >/dev/null 2>&1; then
        print_success "Verdaccio is running!"
        break
    fi
    [ $i -eq 20 ] && { print_error "Failed to start"; exit 1; }
    sleep 2
done

# Test publish
print_status "Building package..."
npm run build >/dev/null 2>&1

print_status "Testing publish..."
if npm publish --registry http://localhost:$PORT; then
    print_success "Publish successful!"
    
    # Test install
    print_status "Testing install..."
    docker run --rm \
        --link $CONTAINER_NAME:verdaccio \
        node:20-alpine \
        sh -c "
            npm config set registry http://verdaccio:4873
            npm install -g @aignostics/sdk
            aignostics-platform --version
        "
    
    print_success "All tests passed!"
else
    print_error "Publish failed"
    docker logs $CONTAINER_NAME
    exit 1
fi
