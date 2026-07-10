#Requires -Version 5.1

<#
.SYNOPSIS
    Deploy migration to Supabase using SQL REST API
    
.DESCRIPTION
    This script reads the migration file and executes it via Supabase API.
    Requires: SUPABASE_SERVICE_ROLE_KEY environment variable
    
.EXAMPLE
    .\deploy-to-supabase.ps1
#>

# Configuration
$PROJECT_URL = "https://dvvbafgpluxvaieguiwm.supabase.co"
$SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
$MIGRATION_FILE = ".\supabase\migrations\20240711_schema_enhancements.sql"

# Color output
$ErrorColor = "Red"
$SuccessColor = "Green"
$InfoColor = "Cyan"

Write-Host "`n🚀 Supabase Migration Deployment" -ForegroundColor $InfoColor
Write-Host "================================`n" -ForegroundColor $InfoColor

# Check for service role key
if (-not $SERVICE_ROLE_KEY) {
    Write-Host "❌ ERROR: SUPABASE_SERVICE_ROLE_KEY not set" -ForegroundColor $ErrorColor
    Write-Host "   Set it with: `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-key'" -ForegroundColor Yellow
    Write-Host "`n   You can find this in Supabase Dashboard → Settings → API Keys → Service Role Key`n"
    exit 1
}

# Check if migration file exists
if (-not (Test-Path $MIGRATION_FILE)) {
    Write-Host "❌ ERROR: Migration file not found at $MIGRATION_FILE" -ForegroundColor $ErrorColor
    exit 1
}

Write-Host "📄 Reading migration file..." -ForegroundColor $InfoColor
$sqlContent = Get-Content $MIGRATION_FILE -Raw

Write-Host "✓ Migration file loaded ($(($sqlContent.Length / 1024).ToString("F1")) KB)" -ForegroundColor $SuccessColor

# Split into individual statements and execute
$statements = $sqlContent -split ";\s*`n" | Where-Object { $_.Trim() -and -not $_.Trim().StartsWith("--") }

Write-Host "`n📊 Migration contains $(($statements | Measure-Object).Count) statements" -ForegroundColor $InfoColor

Write-Host "`n⏳ Deploying to Supabase..." -ForegroundColor $InfoColor
Write-Host "URL: $PROJECT_URL`n" -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type" = "application/json"
    "Prefer" = "return=minimal"
}

# Execute all SQL at once
$url = "$PROJECT_URL/rest/v1/rpc/exec_sql"
$body = @{
    sql = $sqlContent
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✅ Migration executed successfully!" -ForegroundColor $SuccessColor
} catch {
    $errorResponse = $_.Exception.Response
    if ($errorResponse) {
        $reader = New-Object System.IO.StreamReader($errorResponse.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        Write-Host "❌ Deployment failed:" -ForegroundColor $ErrorColor
        Write-Host "$errorContent`n" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor $ErrorColor
    }
    exit 1
}

Write-Host "`n✨ Deployment complete!" -ForegroundColor $SuccessColor
Write-Host "📋 Next steps:" -ForegroundColor $InfoColor
Write-Host "   1. Open Supabase Dashboard" -ForegroundColor Gray
Write-Host "   2. Go to Database → Tables" -ForegroundColor Gray
Write-Host "   3. Verify new tables created:" -ForegroundColor Gray
Write-Host "      - audit_log, api_rate_limits, article_likes," -ForegroundColor Gray
Write-Host "      - user_follows, article_versions, article_tags, etc." -ForegroundColor Gray
Write-Host "   4. Run test queries in SQL Editor" -ForegroundColor Gray
Write-Host "`n✅ All done!`n" -ForegroundColor $SuccessColor
