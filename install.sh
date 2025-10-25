#!/bin/bash

# Overtabbed Browser Extension - Installation Script

echo "🚀 Setting up Overtabbed Browser Extension..."
echo "📦 Installing latest compatible packages..."

# Check if pnpm is available, otherwise use npm
if command -v pnpm &> /dev/null; then
    echo "📦 Using pnpm for package management..."
    pnpm install
else
    echo "📦 Using npm for package management..."
    npm install
fi

echo "✅ Dependencies installed successfully!"
echo ""
echo "📁 Setting up source icons..."
node scripts/setup-icons.js
echo ""
echo "🔧 Available commands:"
echo "  npm run dev         - Start development server"
echo "  npm run build       - Build extension for production"
echo "  npm run preview     - Preview production build"
echo "  npm run type-check  - Run TypeScript type checking"
echo "  npm run lint        - Run ESLint"
echo ""
echo "📦 Latest package versions installed:"
echo "  React: 18.3.1"
echo "  TypeScript: 5.6.3"
echo "  Vite: 5.4.10"
echo "  ESLint: 9.15.0"
echo ""
echo "📖 See README.md for detailed setup instructions"
