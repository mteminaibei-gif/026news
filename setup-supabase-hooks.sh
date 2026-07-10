#!/bin/bash
# Supabase Auto-Migration Setup Script (Bash)
# This script sets up git hooks for automatic database migrations

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
success() {
    echo -e "${GREEN}✓${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Supabase Auto-Migration Setup                             ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check git repository
echo "Step 1: Checking git repository..."
if [ ! -d ".git" ]; then
    error "Not a git repository. Please run this from your project root."
    exit 1
fi
success "Found git repository"

# Step 2: Check Supabase CLI
echo ""
echo "Step 2: Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    VERSION=$(supabase --version)
    success "Supabase CLI installed: $VERSION"
else
    error "Supabase CLI not found"
    echo "Install with: npm install -g supabase"
    exit 1
fi

# Step 3: Create/verify hooks directory
echo ""
echo "Step 3: Setting up hooks directory..."
HOOKS_DIR=".git/hooks"
if [ ! -d "$HOOKS_DIR" ]; then
    mkdir -p "$HOOKS_DIR"
    success "Created hooks directory"
else
    success "Hooks directory exists"
fi

# Step 4: Verify hook files
echo ""
echo "Step 4: Verifying hook files..."
for HOOK in "pre-commit" "post-commit"; do
    if [ -f "$HOOKS_DIR/$HOOK" ]; then
        success "Found: $HOOK"
    else
        warning "Missing: $HOOK"
    fi
done

# Step 5: Make hooks executable
echo ""
echo "Step 5: Making hooks executable..."
chmod +x "$HOOKS_DIR/pre-commit" 2>/dev/null && success "pre-commit is executable" || warning "Could not chmod pre-commit"
chmod +x "$HOOKS_DIR/post-commit" 2>/dev/null && success "post-commit is executable" || warning "Could not chmod post-commit"

# Step 6: Check Supabase project link
echo ""
echo "Step 6: Checking Supabase project link..."
if [ -f ".supabase/config.toml" ]; then
    success "Project already linked"
    PROJECT_ID=$(grep "project_id" .supabase/config.toml | sed 's/.*= "//' | sed 's/".*//')
    success "Project ref: $PROJECT_ID"
else
    warning "Supabase project not linked"
    echo "Link with: supabase link --project-ref dvvbafgpluxvaieguiwm"
fi

# Step 7: Configure git
echo ""
echo "Step 7: Configuring git..."
success "Hooks will be executed automatically on commit"

# Step 8: Verify setup
echo ""
echo "Step 8: Verifying setup..."
if [ -f "$HOOKS_DIR/post-commit" ] && [ -f "$HOOKS_DIR/pre-commit" ]; then
    if [ -x "$HOOKS_DIR/post-commit" ] && [ -x "$HOOKS_DIR/pre-commit" ]; then
        success "Both hooks present and executable"
    else
        warning "Hooks exist but may not be executable"
    fi
else
    error "Hooks are missing"
    exit 1
fi

# Summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup Complete!                                           ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Next steps:"
echo ""
echo "1. Link your Supabase project (if not already linked):"
echo -e "   ${GREEN}supabase link --project-ref dvvbafgpluxvaieguiwm${NC}"
echo ""
echo "2. Verify the link:"
echo -e "   ${GREEN}supabase status${NC}"
echo ""
echo "3. Test by creating a migration:"
echo -e "   ${GREEN}git add supabase/migrations/*.sql${NC}"
echo -e "   ${GREEN}git commit -m 'Test migration'${NC}"
echo ""
echo "4. Read the full guide:"
echo -e "   ${GREEN}cat SUPABASE_AUTO_MIGRATION_SETUP.md${NC}"
echo ""
echo "The hooks will now automatically validate and push migrations to Supabase!"
echo ""
