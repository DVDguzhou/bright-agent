# Upload IPA to App Store Connect via iTMSTransporter on Windows.
# Requires: App.ipa + AppStoreInfo.plist in -IpaDir

param(
    [Parameter(Mandatory = $true)]
    [string]$IpaDir,

    [Parameter(Mandatory = $true)]
    [string]$AppleId,

    [Parameter(Mandatory = $true)]
    [string]$AppSpecificPassword,

    [string]$TransporterPath = "",

    # Team ID from Apple Developer / DistributionSummary.plist (fixes "Client configuration failed")
    [string]$AscProvider = "488YD7DW8G"
)

$candidates = @(
    $TransporterPath,
    "C:\Program Files\itms\bin\iTMSTransporter.cmd",
    "$env:USERPROFILE\Downloads\itms-portable\iTMSTransporter.cmd"
) | Where-Object { $_ -and (Test-Path $_) }

$Transporter = $candidates | Select-Object -First 1
if (-not $Transporter) {
    Write-Error "iTMSTransporter not found. Install Transporter or pass -TransporterPath."
    exit 1
}

Write-Host "Transporter: $Transporter"
Write-Host "Provider (Team ID): $AscProvider"

$Ipa = Join-Path $IpaDir "App.ipa"
$Plist = Join-Path $IpaDir "AppStoreInfo.plist"

if (-not (Test-Path $Ipa)) {
    Write-Error "Missing App.ipa: $Ipa"
    exit 1
}
if (-not (Test-Path $Plist)) {
    Write-Error "Missing AppStoreInfo.plist in $IpaDir (required on Windows)."
    exit 1
}

Write-Host "Uploading $Ipa ..."
& $Transporter -m upload `
    -assetFile $Ipa `
    -assetDescription $Plist `
    -u $AppleId `
    -p $AppSpecificPassword `
    -asc_provider $AscProvider `
    -WONoPause true `
    -v eXtreme

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed, exit code $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "Upload OK. Check App Store Connect in 5-30 minutes for Build processing."
