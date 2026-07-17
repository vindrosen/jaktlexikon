# Skapar 256x256-miniatyrer (PNG med bevarad transparens) i images/thumbs/
# för alla bilder i images/ som ännu saknar miniatyr. Körs om varje gång nya
# artbilder har genererats – befintliga miniatyrer görs inte om.
#
# Användning:  powershell -File tools/make-thumbs.ps1

Add-Type -AssemblyName System.Drawing

$root = Split-Path $PSScriptRoot -Parent
$src = Join-Path $root "images"
$dst = Join-Path $src "thumbs"
New-Item -ItemType Directory -Force $dst | Out-Null

$size = 256
$made = 0

foreach ($file in Get-ChildItem (Join-Path $src "*.png")) {
    $out = Join-Path $dst $file.Name
    if (Test-Path $out) { continue }

    $img = [System.Drawing.Bitmap]::FromFile($file.FullName)
    try {
        $thumb = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $g = [System.Drawing.Graphics]::FromImage($thumb)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.DrawImage($img, 0, 0, $size, $size)
        $g.Dispose()
        $thumb.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
        $thumb.Dispose()
        $made++
    } finally {
        $img.Dispose()
    }
}

$total = (Get-ChildItem (Join-Path $dst "*.png") | Measure-Object).Count
Write-Host "Skapade $made nya miniatyrer. Totalt $total i images/thumbs/."
