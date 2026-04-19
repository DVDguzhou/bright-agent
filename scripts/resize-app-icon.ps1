# Regenerate ios/App/.../AppIcon-512@2x.png (1024x1024) from design-assets/app-icon-source.png
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$src = Join-Path $root "design-assets\app-icon-source.png"
$dst = Join-Path $root "ios\App\App\Assets.xcassets\AppIcon.appiconset\AppIcon-512@2x.png"
if (-not (Test-Path $src)) {
  Write-Error "Missing source: $src"
}
$img = [System.Drawing.Image]::FromFile($src)
Write-Host "Source: $($img.Width)x$($img.Height) -> 1024x1024"
$size = 1024
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.Clear([System.Drawing.Color]::Black)
$g.DrawImage($img, 0, 0, $size, $size)
$bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
$img.Dispose()
Write-Host "Wrote $dst"
