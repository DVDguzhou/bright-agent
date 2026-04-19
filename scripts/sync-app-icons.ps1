# Regenerate iOS + Android launcher icons from design-assets/app-icon-source.png
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $here "resize-app-icon.ps1")
& (Join-Path $here "generate-android-icons.ps1")
