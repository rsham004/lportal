#!/bin/bash

# Learning Portal - Quick Start Script
# ====================================
# One-command setup for the entire Learning Portal

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${PURPLE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                    🚀 Learning Portal                        ║
║                   Quick Start Setup                          ║
║                                                              ║
║  Security-First • Semi-Automated • Production-Ready         ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}Welcome to the Learning Portal setup!${NC}"
echo -e "${BLUE}This script will guide you through a secure, semi-automated setup process.${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if scripts exist
if [ ! -f "setup-secure.sh" ] || [ ! -f "validate-setup.sh" ]; then
    echo -e "${RED}❌ Setup scripts not found. Please run from project root directory.${NC}"
    exit 1
fi

# Make scripts executable
chmod +x setup-secure.sh validate-setup.sh

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+ first.${NC}"
    echo -e "${YELLOW}💡 Visit: https://nodejs.org/${NC}"
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"
echo ""

# Show setup options
echo -e "${BLUE}🎯 Setup Options:${NC}"
echo ""
echo "1) 🚀 Full Automated Setup (Recommended)"
echo "   - Guided setup with all services"
echo "   - Secure credential collection"
echo "   - Automatic validation and deployment"
echo ""
echo "2) 📋 Step-by-Step Manual Setup"
echo "   - Individual service setup"
echo "   - Manual credential entry"
echo "   - Custom configuration"
echo ""
echo "3) 🔍 Validate Existing Setup"
echo "   - Test current configuration"
echo "   - Security validation"
echo "   - Performance checks"
echo ""
echo "4) 📖 Show Documentation"
echo "   - Security guide"
echo "   - Setup instructions"
echo "   - Troubleshooting"
echo ""

read -p "Choose an option (1-4): " choice

case $choice in
    1)
        echo -e "${GREEN}🚀 Starting Full Automated Setup...${NC}"
        echo ""
        
        # Step 1: Initialize
        echo -e "${BLUE}Step 1/6: Initialize secure setup${NC}"
        ./setup-secure.sh init
        echo ""
        
        # Step 2: Generate URLs
        echo -e "${BLUE}Step 2/6: Generate service setup URLs${NC}"
        ./setup-secure.sh urls
        echo ""
        echo -e "${YELLOW}📋 Please complete the service setups in your browser${NC}"
        echo -e "${YELLOW}💡 Keep this terminal open and return when done${NC}"
        read -p "Press Enter when you've completed all service setups..."
        echo ""
        
        # Step 3: Collect credentials
        echo -e "${BLUE}Step 3/6: Collect service credentials${NC}"
        ./setup-secure.sh credentials
        echo ""
        
        # Step 4: Generate environment
        echo -e "${BLUE}Step 4/6: Generate environment configuration${NC}"
        ./setup-secure.sh env
        echo ""
        
        # Step 5: Validate setup
        echo -e "${BLUE}Step 5/6: Validate setup${NC}"
        ./validate-setup.sh
        echo ""
        
        # Step 6: Deploy (optional)
        echo -e "${BLUE}Step 6/6: Deploy to production${NC}"
        read -p "Deploy to Vercel now? (y/n): " deploy_now
        if [[ $deploy_now =~ ^[Yy]$ ]]; then
            ./setup-secure.sh deploy
        else
            echo -e "${YELLOW}💡 You can deploy later with: ./setup-secure.sh deploy${NC}"
        fi
        
        echo ""
        echo -e "${GREEN}🎉 Setup Complete!${NC}"
        echo -e "${GREEN}Your Learning Portal is ready for development and production.${NC}"
        ;;
        
    2)
        echo -e "${BLUE}📋 Manual Setup Mode${NC}"
        echo ""
        echo "Available commands:"
        echo "  ./setup-secure.sh init          # Initialize setup"
        echo "  ./setup-secure.sh urls          # Generate setup URLs"
        echo "  ./setup-secure.sh credentials   # Add credentials"
        echo "  ./setup-secure.sh env           # Generate environment"
        echo "  ./setup-secure.sh status        # Check progress"
        echo "  ./validate-setup.sh             # Validate setup"
        echo ""
        echo -e "${YELLOW}💡 Start with: ./setup-secure.sh init${NC}"
        ;;
        
    3)
        echo -e "${BLUE}🔍 Validating existing setup...${NC}"
        echo ""
        ./validate-setup.sh
        ;;
        
    4)
        echo -e "${BLUE}📖 Documentation${NC}"
        echo ""
        echo "Available documentation:"
        echo "  📋 STEP_BY_STEP_SETUP_GUIDE.md     # Detailed manual setup"
        echo "  📋 CORRECTED_SETUP_GUIDE.md        # Updated setup guide"
        echo "  🏗️  INFRASTRUCTURE_SETUP_GUIDE.md   # Infrastructure overview"
        echo "  🔒 SECURITY-SETUP-GUIDE.md         # Security-first setup"
        echo "  📊 PRODUCTION_MONITORING_GUIDE.md  # Monitoring setup"
        echo ""
        echo -e "${YELLOW}💡 For security-first approach, read: SECURITY-SETUP-GUIDE.md${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                     🎯 Next Steps                           ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Development:${NC}"
echo "  cd live-coding && npm run dev     # Start development server"
echo "  npm run build                     # Build for production"
echo "  npm test                          # Run tests"
echo ""
echo -e "${GREEN}Validation:${NC}"
echo "  ./validate-setup.sh               # Comprehensive validation"
echo "  ./setup-secure.sh status          # Check setup progress"
echo ""
echo -e "${GREEN}Deployment:${NC}"
echo "  ./setup-secure.sh deploy          # Deploy to Vercel"
echo ""
echo -e "${GREEN}Security:${NC}"
echo "  ./validate-setup.sh security      # Security validation"
echo "  ./setup-secure.sh clean           # Clean sensitive data"
echo ""
echo -e "${YELLOW}📖 For detailed documentation, see: SECURITY-SETUP-GUIDE.md${NC}"
echo -e "${YELLOW}🔒 All personal information is secured and excluded from git${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"