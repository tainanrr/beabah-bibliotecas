# Script PowerShell para salvar código rapidamente
Write-Host "💾 Salvando código no Git..." -ForegroundColor Cyan
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

