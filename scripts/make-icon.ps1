Add-Type -AssemblyName System.Drawing

function New-ViolaIcon($size, $path, $padding) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::FromArgb(255, 139, 90, 43))

    $wood = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 193, 140, 82))
    $dark = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 90, 56, 30))
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 60, 35, 18)), ([float]($size * 0.012))

    $cx = $size / 2.0
    $s = $size

    # body (figure-8 viola shape) using two overlapping ellipses
    $bodyTop = $s * 0.42
    $bodyW1 = $s * 0.46
    $bodyH1 = $s * 0.30
    $bodyW2 = $s * 0.58
    $bodyH2 = $s * 0.36

    $g.FillEllipse($wood, $cx - $bodyW1/2, $bodyTop, $bodyW1, $bodyH1)
    $g.FillEllipse($wood, $cx - $bodyW2/2, $bodyTop + $bodyH1*0.55, $bodyW2, $bodyH2)
    $g.DrawEllipse($pen, $cx - $bodyW1/2, $bodyTop, $bodyW1, $bodyH1)
    $g.DrawEllipse($pen, $cx - $bodyW2/2, $bodyTop + $bodyH1*0.55, $bodyW2, $bodyH2)

    # f-holes
    $g.FillEllipse($dark, $cx - $bodyW2*0.22, $bodyTop + $bodyH1*0.75, $s*0.02, $s*0.10)
    $g.FillEllipse($dark, $cx + $bodyW2*0.20, $bodyTop + $bodyH1*0.75, $s*0.02, $s*0.10)

    # neck
    $neckW = $s * 0.09
    $neckTop = $s * 0.08
    $g.FillRectangle($wood, $cx - $neckW/2, $neckTop, $neckW, $bodyTop - $neckTop + 2)
    $g.DrawRectangle($pen, $cx - $neckW/2, $neckTop, $neckW, $bodyTop - $neckTop + 2)

    # headstock
    $headW = $s * 0.17
    $headH = $s * 0.10
    $g.FillEllipse($dark, $cx - $headW/2, $neckTop - $headH*0.6, $headW, $headH)

    # strings
    $stringPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 230, 220, 200)), ([float]($size*0.006))
    for ($i = 0; $i -lt 4; $i++) {
        $x = $cx - $s*0.05 + $i * ($s*0.033)
        $g.DrawLine($stringPen, $x, $neckTop, $x, $bodyTop + $bodyH1 + $bodyH2*0.5)
    }

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

New-ViolaIcon 192 "$PSScriptRoot\..\icons\icon-192.png" 0
New-ViolaIcon 512 "$PSScriptRoot\..\icons\icon-512.png" 0
Write-Output "done"
