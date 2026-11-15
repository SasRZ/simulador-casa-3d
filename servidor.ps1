$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$port/")
$l.Start()
Write-Host "Simulador en http://localhost:$port/  (cierra esta ventana para apagarlo)"
Start-Process "http://localhost:$port/"
$types = @{'.html'='text/html; charset=utf-8';'.js'='text/javascript; charset=utf-8';'.css'='text/css; charset=utf-8';'.json'='application/json';'.png'='image/png';'.jpg'='image/jpeg'}
while ($l.IsListening) {
  $c = $l.GetContext()
  $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/'))
  if ($p -eq '') { $p = 'index.html' }
  $f = Join-Path $root $p
  if ((Test-Path $f -PathType Leaf) -and ([IO.Path]::GetFullPath($f).StartsWith($root))) {
    $b = [IO.File]::ReadAllBytes($f)
    $e = [IO.Path]::GetExtension($f).ToLower()
    if ($types.ContainsKey($e)) { $c.Response.ContentType = $types[$e] }
    $c.Response.Headers.Add('Cache-Control','no-store')
    $c.Response.OutputStream.Write($b,0,$b.Length)
  } else { $c.Response.StatusCode = 404 }
  $c.Response.Close()
}
