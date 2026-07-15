# Compila o instalador NSIS do GitSylva JÁ ASSINADO para o auto-update.
#
# Porque é preciso: desde que o updater existe (tauri.conf.json →
# createUpdaterArtifacts), todo o `tauri build` com bundle termina a assinar o
# artefacto de update com a chave privada — que vive FORA do repo, em
# %USERPROFILE%\.tauri\gitsylva.key. Este script carrega-a e corre tudo.
#
# Uso:  powershell -File scripts\build-installer.ps1
# Para testar só o exe (sem instalador nem assinatura): npx tauri build --no-bundle

$ErrorActionPreference = "Stop"
$key = Join-Path $env:USERPROFILE ".tauri\gitsylva.key"
if (-not (Test-Path $key)) {
  Write-Error "Chave privada do updater nao encontrada em $key — sem ela nao ha updates assinados."
  exit 1
}

$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $key -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""

npx tauri build --bundles nsis
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$out = Join-Path $PSScriptRoot "..\src-tauri\target\release\bundle\nsis"
Write-Host ""
Write-Host "Instalador pronto em: $(Resolve-Path $out)"
Get-ChildItem $out | Format-Table Name, Length, LastWriteTime
