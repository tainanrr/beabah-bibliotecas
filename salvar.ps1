# Script PowerShell para salvar código rapidamente
Write-Host "💾 Salvando código no Git..." -ForegroundColor Cyan

# Auto-incrementar versão
Write-Host "📦 Atualizando versão do sistema..." -ForegroundColor Yellow
node scripts/bump-version.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ Aviso: Não foi possível atualizar a versão" -ForegroundColor Yellow
}

git add .
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Salvamento automático - $timestamp"
Write-Host "✅ Código salvo com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Comandos úteis:" -ForegroundColor Yellow
Write-Host "  git log --oneline          - Ver histórico"
Write-Host "  git status                - Ver alterações"
Write-Host "  git restore arquivo.tsx   - Desfazer alterações"
Write-Host ""
