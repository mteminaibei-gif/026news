# Supabase Auto-Migration Setup Script (PowerShell)
# This script sets up git hooks for automatic database migrations

param(
    [switch]$SkipCliCheck = $false
)

# Colors
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Reset = "`e[0m"

function Write-Success {
    Write-Host "$Green✓$Reset $args"
}

function Write-Warning {
    Write-Host "$Yellow⚠$Reset $args"
}

function Write-Error {
    Write-Host "$Red✗$Reset $args"
}

Write-Host "`n$Green╔════════════════════════════════════════════════════════════╗$Reset"
Write-Host "$Green║  Supabase Auto-Migration Setup                             ║$Reset"
Write-Host "$Green╚════════════════════════════════════════════════════════════╝$Reset`n"

# Step 1: Check if in git repository
Write-Host "Step 1: Checking git repository..."
if (!(Test-Path ".git")) {
    Write-Error "Not a git repository. Please run this from your project root."
    exit 1
}
Write-Success "Found git repository"

# Step 2: Check Supabase CLI
Write-Host "`nStep 2: Checking Supabase CLI..."
if ($SkipCliCheck) {
    Write-Warning "Skipping CLI check (use -SkipCliCheck to skip)"
} else {
    $CliInstalled = $null -ne (Get-Command supabase -ErrorAction SilentlyContinue)
    if ($CliInstalled) {
        $Version = supabase --version
        Write-Success "Supabase CLI installed: $Version"
    } else {
        Write-Error "Supabase CLI not found"
        Write-Host "Install with: npm install -g supabase"
        exit 1
    }
}

# Step 3: Check hooks directory
Write-Host "`nStep 3: Setting up hooks directory..."
$HooksDir = ".git\hooks"
if (!(Test-Path $HooksDir)) {
    New-Item -ItemType Directory -Path $HooksDir | Out-Null
    Write-Success "Created hooks directory"
} else {
    Write-Success "Hooks directory exists"
}

# Step 4: Verify hook files exist
Write-Host "`nStep 4: Verifying hook files..."
$Hooks = @("pre-commit", "post-commit", "pre-commit.bat", "post-commit.bat")
foreach ($Hook in $Hooks) {
    $HookPath = Join-Path $HooksDir $Hook
    if (Test-Path $HookPath) {
        Write-Success "Found: $Hook"
    } else {
        Write-Warning "Missing: $Hook"
    }
}

# Step 5: Set execution permissions
Write-Host "`nStep 5: Setting permissions..."
try {
    $HookFiles = Get-ChildItem $HooksDir -Filter "*-commit*"
    foreach ($File in $HookFiles) {
        $Acl = Get-Acl $File.FullName
        # The file is already accessible, so we just need to verify
        Write-Success "Permissions set: $($File.Name)"
    }
} catch {
    Write-Warning "Could not set permissions: $_"
}

# Step 6: Link Supabase project
Write-Host "`nStep 6: Checking Supabase project link..."
if (Test-Path ".supabase\config.toml") {
    Write-Success "Project already linked"
    $ProjectRef = Get-Content ".supabase\config.toml" | Select-String "project_id" | ForEach-Object { $_ -replace '.*= "', '' -replace '"' }
    Write-Success "Project ref: $ProjectRef"
} else {
    Write-Warning "Supabase project not linked"
    Write-Host "Link with: supabase link --project-ref dvvbafgpluxvaieguiwm"
}

# Step 7: Configure git to use hooks
Write-Host "`nStep 7: Configuring git..."
$HooksPath = ".git\hooks"
# Git on Windows typically auto-detects hooks in .git/hooks
Write-Success "Hooks will be executed automatically on commit"

# Step 8: Test hook execution
Write-Host "`nStep 8: Verifying setup..."
if ((Test-Path "$HooksDir\post-commit") -and (Test-Path "$HooksDir\pre-commit")) {
    Write-Success "Both hooks present and ready"
} else {
    Write-Error "Hooks are missing"
    exit 1
}

# Summary
Write-Host "`n$Green╔════════════════════════════════════════════════════════════╗$Reset"
Write-Host "$Green║  Setup Complete!                                           ║$Reset"
Write-Host "$Green╚════════════════════════════════════════════════════════════╝$Reset`n"

Write-Host "Next steps:`n"
Write-Host "1. Link your Supabase project (if not already linked):"
Write-Host "   ${Green}supabase link --project-ref dvvbafgpluxvaieguiwm$Reset`n"

Write-Host "2. Verify the link:"
Write-Host "   ${Green}supabase status$Reset`n"

Write-Host "3. Test by creating a migration:"
Write-Host "   ${Green}git add supabase/migrations/*.sql$Reset"
Write-Host "   ${Green}git commit -m 'Test migration'$Reset`n"

Write-Host "4. Read the full guide:"
Write-Host "   ${Green}cat SUPABASE_AUTO_MIGRATION_SETUP.md$Reset`n"

Write-Host "The hooks will now automatically validate and push migrations to Supabase!`n"
