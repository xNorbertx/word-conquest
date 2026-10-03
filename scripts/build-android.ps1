$ErrorActionPreference='Stop'
$buildRoot=Join-Path $env:LOCALAPPDATA 'WordConquestBuild'
$env:JAVA_HOME=(Get-ChildItem (Join-Path $buildRoot 'java') -Directory | Select-Object -First 1).FullName
$env:ANDROID_HOME=Join-Path $buildRoot 'sdk'
$nodeRoot='C:\Users\Norbert\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
$env:PATH="$nodeRoot;$env:JAVA_HOME\bin;$env:PATH"
Push-Location (Split-Path $PSScriptRoot)
try {
  node scripts/build.cjs
  if($LASTEXITCODE){throw 'Web build failed'}
  node node_modules/@capacitor/cli/bin/capacitor sync android
  if($LASTEXITCODE){throw 'Android sync failed'}
  & .\android\gradlew.bat -p android assembleDebug --console=plain
  if($LASTEXITCODE){throw 'Android build failed'}
} finally { Pop-Location }
