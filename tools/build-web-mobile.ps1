param(
    [string]$CreatorPath = 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe'
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$configPath = (Resolve-Path (Join-Path $PSScriptRoot 'web-mobile-build.json')).Path
$outputRoot = Join-Path $projectRoot 'build'
if (!(Test-Path -LiteralPath $CreatorPath)) { throw "Creator executable missing: $CreatorPath" }
New-Item -ItemType Directory -Path $outputRoot -Force | Out-Null
$buildArgs = @('--project', ('"' + $projectRoot + '"'), '--build', ('"configPath=' + $configPath + '"'))
$buildProcess = New-Object System.Diagnostics.Process
$buildProcess.StartInfo.FileName = $CreatorPath
$buildProcess.StartInfo.Arguments = $buildArgs -join ' '
$buildProcess.StartInfo.UseShellExecute = $false
$buildProcess.StartInfo.CreateNoWindow = $true
$buildProcess.StartInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[void]$buildProcess.Start()
# Builder workers can retain redirected pipes after the CLI exits. Use the
# official logDest file for diagnostics and wait only for the CLI process.
$buildProcess.WaitForExit()
$buildProcess.ExitCode | Set-Content (Join-Path $outputRoot 'creator-build-exit-code.txt')
if ($buildProcess.ExitCode -ne 36) { throw "Cocos build failed (exit $($buildProcess.ExitCode)); see build/web-mobile-build.log." }
$entry = Join-Path $outputRoot 'web-mobile/index.html'
if (!(Test-Path -LiteralPath $entry)) { throw 'Creator reported success but web-mobile/index.html is missing.' }
Write-Output "Build succeeded: $entry (Cocos exit code 36)"
