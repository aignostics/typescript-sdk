#!/bin/bash

# Quick test script to verify the package works locally
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "Running quick local compatibility test..."

# Build the package
print_status "Building package..."
npm run build

# Test CLI locally
print_status "Testing CLI commands..."
node dist/cli.js --version
node dist/cli.js info
node dist/cli.js test-api --endpoint https://jsonplaceholder.typicode.com

# Test programmatic usage
print_status "Testing programmatic usage..."
cat > quick-test.js << 'EOF'
const { PlatformSDK } = require('./dist/index.js');

async function test() {
    const sdk = new PlatformSDK({
        baseURL: 'https://jsonplaceholder.typicode.com',
        timeout: 5000
    });
    
    console.log('SDK Version:', sdk.getVersion());
    console.log('SDK Config:', JSON.stringify(sdk.getConfig(), null, 2));
    
    try {
        const result = await sdk.testConnection();
        console.log('Connection test result:', result);
        console.log('✅ Local test passed');
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        process.exit(1);
    }
}

test().catch(console.error);
EOF

node quick-test.js
rm -f quick-test.js

print_success "Quick local test completed successfully!"
print_status "To run full Docker-based compatibility testing, use: npm run test:compatibility:docker"
