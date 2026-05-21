# Windows 上用 iTMSTransporter 上传 IPA 到 App Store Connect
# 前置：已安装 Transporter（需管理员权限运行安装包）
# 下载：https://help.apple.com/itc/transporteruserguide/en.lproj/static.html → Install Transporter on Windows

param(
    [Parameter(Mandatory = $true)]
    [string]$IpaDir,

    [Parameter(Mandatory = $true)]
    [string]$AppleId,

    [Parameter(Mandatory = $true)]
    [string]$AppSpecificPassword
)

$Transporter = "C:\Program Files\itms\bin\iTMSTransporter.cmd"
if (-not (Test-Path $Transporter)) {
    Write-Error "未找到 iTMSTransporter。请先以管理员身份安装 Transporter。"
    exit 1
}

$Ipa = Join-Path $IpaDir "App.ipa"
$Plist = Join-Path $IpaDir "AppStoreInfo.plist"

if (-not (Test-Path $Ipa)) {
    Write-Error "找不到 $Ipa"
    exit 1
}
if (-not (Test-Path $Plist)) {
    Write-Error "找不到 AppStoreInfo.plist。Windows 上传必须同时有 IPA 和 AppStoreInfo.plist。"
    Write-Error "请重新从 GitHub Actions 下载 ios-ipa 产物（已更新 CI 会自动生成该文件）。"
    exit 1
}

Write-Host "正在上传 $Ipa ..."
& $Transporter -m upload `
    -assetFile $Ipa `
    -assetDescription $Plist `
    -u $AppleId `
    -p $AppSpecificPassword `
    -v eXtreme

if ($LASTEXITCODE -ne 0) {
    Write-Error "上传失败，退出码 $LASTEXITCODE"
    exit $LASTEXITCODE
}

Write-Host "上传成功。请到 App Store Connect 等待 Build 处理完成（约 5–30 分钟）。"
