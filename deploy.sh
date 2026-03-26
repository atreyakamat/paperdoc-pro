#!/bin/bash

# Quick Deploy Script for Personal Paperwork OS
# This script helps you deploy to production in minutes

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                Personal Paperwork OS - Quick Deploy                          ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Function to generate secret
generate_secret() {
    node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Choose your deployment method:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Vercel (Recommended - Easiest)"
echo "2. Docker (Local or VPS)"
echo "3. Railway"
echo "4. Generate secrets only"
echo "5. Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Deploying to Vercel..."
        echo ""
        echo "Step 1: Install Vercel CLI"
        npm i -g vercel
        echo ""
        echo "Step 2: You'll need these environment variables:"
        echo ""
        echo "DATABASE_URL=postgresql://user:pass@host:5432/dbname"
        echo "AUTH_SECRET=$(generate_secret)"
        echo "SHARE_LINK_SECRET=$(generate_secret)"
        echo "NODE_ENV=production"
        echo ""
        echo "📋 Copy the secrets above and have them ready!"
        echo ""
        read -p "Press Enter when ready to continue..."
        echo ""
        echo "Step 3: Running Vercel deployment..."
        vercel
        echo ""
        echo "✅ Deployment initiated!"
        echo ""
        echo "Next steps:"
        echo "1. Add environment variables in Vercel Dashboard"
        echo "2. Run: DATABASE_URL='your-prod-url' npx prisma db push"
        echo "3. Visit your deployed URL"
        echo ""
        ;;
    2)
        echo ""
        echo "🐳 Setting up Docker deployment..."
        echo ""

        if ! command -v docker &> /dev/null; then
            echo "❌ Docker is not installed. Please install Docker first."
            exit 1
        fi

        echo "Creating .env file..."
        cat > .env << EOF
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/paperdoc"
AUTH_SECRET="$(generate_secret)"
SHARE_LINK_SECRET="$(generate_secret)"
NODE_ENV="production"
EOF

        echo "✅ .env file created"
        echo ""
        echo "Building Docker image..."
        docker build -t paperdoc-pro .
        echo ""
        echo "✅ Docker image built!"
        echo ""
        echo "To run:"
        echo "  docker run -d -p 3000:3000 --env-file .env paperdoc-pro"
        echo ""
        echo "Don't forget to run migrations:"
        echo "  docker run --env-file .env paperdoc-pro npx prisma db push"
        echo ""
        ;;
    3)
        echo ""
        echo "🚂 Deploying to Railway..."
        echo ""
        echo "Step 1: Install Railway CLI"
        npm i -g @railway/cli
        echo ""
        echo "Step 2: Login to Railway"
        railway login
        echo ""
        echo "Step 3: Initialize project"
        railway init
        echo ""
        echo "Step 4: Add PostgreSQL"
        railway add --plugin postgresql
        echo ""
        echo "Step 5: Set environment variables"
        railway variables set AUTH_SECRET="$(generate_secret)"
        railway variables set SHARE_LINK_SECRET="$(generate_secret)"
        railway variables set NODE_ENV="production"
        echo ""
        echo "Step 6: Deploy"
        railway up
        echo ""
        echo "Step 7: Run migrations"
        railway run npx prisma db push
        echo ""
        echo "✅ Deployment complete!"
        echo ""
        ;;
    4)
        echo ""
        echo "🔐 Generating secrets..."
        echo ""
        echo "AUTH_SECRET=$(generate_secret)"
        echo "SHARE_LINK_SECRET=$(generate_secret)"
        echo ""
        echo "Copy these secrets and use them in your deployment!"
        echo ""
        ;;
    5)
        echo ""
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo ""
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  📄 STATUS.md                - Quick start & current status"
echo "  📄 DEPLOYMENT.md            - Complete deployment guide"
echo "  📄 GTM_STRATEGY.md          - Launch & marketing strategy"
echo "  📄 PRODUCTION_CHECKLIST.md  - Pre-launch verification"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Your Personal Paperwork OS is ready to go live!"
echo ""
