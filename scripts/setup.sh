#!/bin/bash

set -e

echo "🚀 Setting up AWS AI Development Environment"

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    else
        echo "✅ $1 is installed"
    fi
}

echo "📋 Checking required tools..."
check_tool "node"
check_tool "pnpm"
check_tool "aws"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
else
    echo "✅ Node.js version is compatible: $(node --version)"
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Set up environment files
echo "🔧 Setting up environment files..."

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file from .env.example"
    echo "⚠️  Please edit .env file with your configuration"
fi

if [ ! -f ".env.local" ]; then
    cp .env.local.example .env.local
    echo "📝 Created .env.local file from .env.local.example"
    echo "⚠️  Please edit .env.local file for local development"
fi

# Build packages
echo "🔨 Building packages..."
pnpm run build

# Check AWS credentials
echo "🔐 Checking AWS credentials..."
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo "✅ AWS credentials are configured"
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    AWS_REGION=$(aws configure get region || echo "us-east-1")
    echo "   Account: $AWS_ACCOUNT"
    echo "   Region: $AWS_REGION"
else
    echo "❌ AWS credentials are not configured"
    echo "   Please run: aws configure"
    echo "   Or set up AWS SSO: aws sso login"
fi

# Git hooks setup
echo "🪝 Setting up Git hooks..."
if [ -d ".git" ]; then
    npx husky install
    echo "✅ Git hooks configured"
else
    echo "⚠️  Not a Git repository, skipping Git hooks setup"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Edit .env and .env.local files with your configuration"
echo "2. Configure AWS credentials if not already done"
echo "3. Run 'pnpm run dev' to start development"
echo "4. Run 'pnpm run deploy:dev' to deploy to development environment"
echo ""
echo "Available commands:"
echo "  pnpm run dev        - Start development servers"
echo "  pnpm run build      - Build all packages"
echo "  pnpm run test       - Run tests"
echo "  pnpm run lint       - Run linting"
echo "  pnpm run type-check - Run type checking"
echo "  pnpm run deploy:dev - Deploy to development"
echo ""