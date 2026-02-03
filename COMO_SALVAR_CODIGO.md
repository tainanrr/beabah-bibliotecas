# 📦 Como Salvar seu Código - Guia de Backup

## ⚠️ IMPORTANTE: Faça commits regulares!

Para evitar perder código como aconteceu antes, siga estes passos:

## 🔄 Salvar Código Regularmente (Commits)

### 1. **Salvar tudo de uma vez (Recomendado)**
```bash
git add .
git commit -m "Descrição do que foi feito"
```

### 2. **Verificar o que foi alterado antes de salvar**
```bash
git status
```

### 3. **Ver histórico de alterações**
```bash
git log --oneline
```

## 📤 Backup na Nuvem (Recomendado)

### Opção 1: GitHub (Gratuito)
1. Crie uma conta em https://github.com
2. Crie um novo repositório (privado ou público)
3. Execute:
```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git branch -M main
git push -u origin main
```

### Opção 2: GitLab (Gratuito)
1. Crie uma conta em https://gitlab.com
2. Crie um novo projeto
3. Execute:
```bash
git remote add origin https://gitlab.com/SEU_USUARIO/SEU_PROJETO.git
git branch -M main
git push -u origin main
```

## 🔄 Após cada sessão de trabalho

**Sempre execute antes de fechar o Cursor:**
```bash
git add .
git commit -m "Trabalho do dia - [descreva o que fez]"
git push  # Se tiver configurado repositório remoto
```

## 📋 Comandos Úteis

### Ver o que mudou
```bash
git status
git diff
```

### Desfazer alterações não salvas
```bash
git restore arquivo.tsx  # Desfaz alterações em um arquivo
git restore .            # Desfaz todas as alterações não commitadas
```

### Ver histórico
```bash
git log --oneline --graph
```

### Voltar para um commit anterior
```bash
git log --oneline  # Veja o hash do commit
git checkout HASH_DO_COMMIT  # Volta para aquele commit
git checkout master  # Volta para a versão mais recente
```

## 🎯 Dica: Crie um alias para facilitar

Adicione ao seu `.bashrc` ou `.zshrc`:
```bash
alias gsave='git add . && git commit -m "Auto-save $(date +%Y-%m-%d_%H:%M:%S)"'
```

Depois é só digitar `gsave` para salvar rapidamente!

## ⚡ Atalho Rápido no Cursor

1. Abra o terminal integrado (Ctrl + `)
2. Digite: `git add . && git commit -m "Salvamento automático"`
3. Pressione Enter

## 🔐 Segurança

- **NUNCA** commite arquivos `.env` com senhas
- Use `.gitignore` para ignorar arquivos sensíveis
- Se usar GitHub/GitLab, considere repositório privado

## 📞 Em caso de perda de código

Se perder código novamente:
1. `git log` - Veja o histórico
2. `git checkout HASH` - Volte para um commit anterior
3. `git reflog` - Veja TODAS as ações (até commits deletados)






