$root = (Resolve-Path "$PSScriptRoot\..").Path
$port = 8765
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Output "Serving $root at http://localhost:$port/"

$mime = @{
  '.html'='text/html'; '.js'='application/javascript'; '.css'='text/css';
  '.json'='application/json'; '.png'='image/png'; '.svg'='image/svg+xml'
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $path = $ctx.Request.Url.AbsolutePath
  if ($path -eq '/') { $path = '/index.html' }
  $file = Join-Path $root ($path.TrimStart('/'))
  if (Test-Path $file -PathType Leaf) {
    $ext = [IO.Path]::GetExtension($file)
    $ctx.Response.ContentType = $mime[$ext]
    if (-not $ctx.Response.ContentType) { $ctx.Response.ContentType = 'application/octet-stream' }
    $bytes = [IO.File]::ReadAllBytes($file)
    $ctx.Response.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $ctx.Response.StatusCode = 404
  }
  $ctx.Response.OutputStream.Close()
}
