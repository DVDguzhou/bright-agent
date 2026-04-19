# Generate Android mipmaps from design-assets/app-icon-source.png (1024 recommended).
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$src = Join-Path $root "design-assets\app-icon-source.png"
if (-not (Test-Path $src)) { Write-Error "Missing: $src" }

function Save-IconSize([string]$srcPath, [string]$outPath, [int]$size) {
    $img = [System.Drawing.Image]::FromFile($srcPath)
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Black)
    $g.DrawImage($img, 0, 0, $size, $size)
    $dir = Split-Path $outPath -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $img.Dispose()
}

$res = Join-Path $root "android\app\src\main\res"
# Adaptive icon foreground (108dp -> px per density)
$fg = @{
    "mipmap-mdpi"    = 108
    "mipmap-hdpi"    = 162
    "mipmap-xhdpi"   = 216
    "mipmap-xxhdpi"  = 324
    "mipmap-xxxhdpi" = 432
}
foreach ($e in $fg.GetEnumerator()) {
    $folder = $e.Key
    $px = $e.Value
    Save-IconSize $src (Join-Path $res "$folder\ic_launcher_foreground.png") $px
    Write-Host "foreground $folder ${px}px"
}
# Legacy launcher icons (48dp)
$legacy = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}
foreach ($e in $legacy.GetEnumerator()) {
    $folder = $e.Key
    $px = $e.Value
    $base = Join-Path $res $folder
    Save-IconSize $src (Join-Path $base "ic_launcher.png") $px
    Save-IconSize $src (Join-Path $base "ic_launcher_round.png") $px
    Write-Host "legacy $folder ${px}px"
}
Write-Host "Done."
