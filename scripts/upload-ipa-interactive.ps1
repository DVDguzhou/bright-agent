# Interactive IPA upload (password stays on your machine only).
param(
    [string]$IpaDir = "$env:USERPROFILE\Downloads\ios-ipa-build6",
    [string]$AscProvider = "488YD7DW8G",
    [string]$TransporterPath = "$env:USERPROFILE\Downloads\itms-portable\iTMSTransporter.cmd"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $IpaDir)) {
    Write-Host "Extracting ios-ipa.zip ..."
    Expand-Archive -Path "$env:USERPROFILE\Downloads\ios-ipa.zip" -DestinationPath $IpaDir -Force
}

$Ipa = Join-Path $IpaDir "App.ipa"
$Plist = Join-Path $IpaDir "AppStoreInfo.plist"

if (-not (Test-Path $TransporterPath)) {
    Write-Error "Transporter not found at $TransporterPath"
}

if (-not (Test-Path $Ipa)) { Write-Error "Missing $Ipa" }
if (-not (Test-Path $Plist)) { Write-Error "Missing $Plist" }

$AppleId = Read-Host "Apple ID email"
$Secure = Read-Host "App-specific password (from appleid.apple.com)" -AsSecureString
$Bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secure)
try {
    $Password = [Runtime.InteropServices.Marshal]::PtrToStringAuto($Bstr)
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($Bstr)
}

Write-Host "Uploading Build 6 ..."
& $TransporterPath -m upload `
    -assetFile $Ipa `
    -assetDescription $Plist `
    -u $AppleId `
    -p $Password `
    -asc_provider $AscProvider `
    -WONoPause true `
    -v eXtreme

if ($LASTEXITCODE -ne 0) {
    Write-Error "Upload failed, exit code $LASTEXITCODE"
}

Write-Host "Upload OK. Check App Store Connect / TestFlight in 5-30 minutes."
