param(
    [string]$MobileAppUrl = "https://brightagent.cn",
    [ValidateSet("apk", "aab")]
    [string]$Format = "apk"
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "../..")
$androidDir = Join-Path $root "android"
$keystoreProps = Join-Path $androidDir "keystore.properties"
$keystoreFile = Join-Path $androidDir "brightagent-release.keystore"

if (-not (Test-Path $keystoreProps)) {
    Write-Host ""
    Write-Host "Missing android/keystore.properties" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run once:"
    Write-Host '  keytool -genkeypair -v -keystore android/brightagent-release.keystore -alias brightagent -keyalg RSA -keysize 2048 -validity 10000'
    Write-Host "  copy android\keystore.properties.example android\keystore.properties"
    Write-Host ""
    exit 1
}

if (-not (Test-Path $keystoreFile)) {
    Write-Host "Missing android/brightagent-release.keystore" -ForegroundColor Red
    exit 1
}

Write-Host "MOBILE_APP_URL=$MobileAppUrl"
$env:MOBILE_APP_URL = $MobileAppUrl

$androidStudioJbr = "C:\Program Files\Android\Android Studio\jbr"
if (Test-Path $androidStudioJbr) {
    $env:JAVA_HOME = $androidStudioJbr
    $env:Path = "$androidStudioJbr\bin;" + $env:Path
    Write-Host "JAVA_HOME=$env:JAVA_HOME"
}

Push-Location $root
try {
    Write-Host "Syncing Capacitor..."
    npm run mobile:sync
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

Push-Location $androidDir
try {
    if ($Format -eq "aab") {
        Write-Host "Building release AAB..."
        & .\gradlew.bat bundleRelease --no-daemon
        $output = Join-Path $androidDir "app\build\outputs\bundle\release\app-release.aab"
    } else {
        Write-Host "Building release APK..."
        & .\gradlew.bat assembleRelease --no-daemon
        $output = Join-Path $androidDir "app\build\outputs\apk\release\app-release.apk"
    }

    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    if (-not (Test-Path $output)) {
        Write-Host "Build failed: output file not found." -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "Build succeeded:" -ForegroundColor Green
    Write-Host $output
    Write-Host ""
    Write-Host "Verify signing (optional):"
    $apksigner = Join-Path $env:LOCALAPPDATA "Android\Sdk\build-tools\36.1.0\apksigner.bat"
    Write-Host ('  "' + $apksigner + '" verify --print-certs "' + $output + '"')
} finally {
    Pop-Location
}
