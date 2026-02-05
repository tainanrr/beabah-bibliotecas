# =============================================================================
# Script de Backup Automático - Supabase
# =============================================================================
# Configure as variáveis abaixo e agende este script no Agendador de Tarefas
# =============================================================================

# Configurações do Supabase (PREENCHA COM SEUS DADOS)
$SUPABASE_HOST = "db.aifbokpfauwtvlbjbpbj.supabase.co"  # Seu host do Supabase
$SUPABASE_PASSWORD = "SUA_SENHA_AQUI"  # Senha do banco de dados
$SUPABASE_USER = "postgres"
$SUPABASE_DB = "postgres"
$SUPABASE_PORT = "5432"

# Pasta onde os backups serão salvos
$BACKUP_DIR = "C:\Backups\Supabase"

# Número de backups a manter (mais antigos serão deletados)
$KEEP_BACKUPS = 7

# =============================================================================
# NÃO MODIFIQUE ABAIXO DESTA LINHA
# =============================================================================

# Criar pasta de backup se não existir
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force
}

# Nome do arquivo com timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$BACKUP_DIR\backup_$timestamp.sql"

# Definir variável de ambiente para a senha
$env:PGPASSWORD = $SUPABASE_PASSWORD

Write-Host "============================================="
Write-Host "Iniciando backup do Supabase..."
Write-Host "Data/Hora: $(Get-Date)"
Write-Host "============================================="

try {
    # Executar pg_dump
    # Nota: Você precisa ter o PostgreSQL instalado ou baixar apenas o pg_dump
    # Download: https://www.postgresql.org/download/windows/
    
    $pgDumpPath = "pg_dump"  # Ou caminho completo: "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    
    & $pgDumpPath `
        --host=$SUPABASE_HOST `
        --port=$SUPABASE_PORT `
        --username=$SUPABASE_USER `
        --dbname=$SUPABASE_DB `
        --no-owner `
        --no-privileges `
        --format=plain `
        --file=$backupFile
    
    if ($LASTEXITCODE -eq 0) {
        # Comprimir o backup
        $compressedFile = "$backupFile.zip"
        Compress-Archive -Path $backupFile -DestinationPath $compressedFile -Force
        Remove-Item $backupFile -Force
        
        $fileSize = (Get-Item $compressedFile).Length / 1MB
        Write-Host "✅ Backup criado com sucesso!"
        Write-Host "   Arquivo: $compressedFile"
        Write-Host "   Tamanho: $([math]::Round($fileSize, 2)) MB"
        
        # Limpar backups antigos
        $backups = Get-ChildItem $BACKUP_DIR -Filter "backup_*.zip" | Sort-Object CreationTime -Descending
        if ($backups.Count -gt $KEEP_BACKUPS) {
            $toDelete = $backups | Select-Object -Skip $KEEP_BACKUPS
            foreach ($file in $toDelete) {
                Remove-Item $file.FullName -Force
                Write-Host "🗑️  Backup antigo removido: $($file.Name)"
            }
        }
    } else {
        Write-Host "❌ Erro ao criar backup!"
        exit 1
    }
} catch {
    Write-Host "❌ Erro: $_"
    exit 1
} finally {
    # Limpar variável de ambiente
    $env:PGPASSWORD = ""
}

Write-Host "============================================="
Write-Host "Backup finalizado!"
Write-Host "============================================="
