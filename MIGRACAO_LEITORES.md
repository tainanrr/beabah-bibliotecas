# Migração de Leitores do Sistema Antigo

## Visão Geral

Este documento explica como importar os dados de leitores do sistema antigo (planilha Google Forms) para o novo sistema de biblioteca.

## Novos Campos Adicionados

A tabela `users_profile` foi expandida para incluir todos os dados do formulário antigo:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `birth_date` | Data de nascimento | 1990-05-15 |
| `phone` | Telefone | 51 999999999 |
| `address_street` | Endereço (rua e número) | Rua das Flores, 123 |
| `address_neighborhood` | Bairro | Jardim Planalto |
| `address_city` | Cidade | Esteio-RS |
| `ethnicity` | Etnia/Raça | Branca, Parda, Preta, etc. |
| `gender` | Gênero | Mulheres cis, Homens cis, etc. |
| `education_level` | Escolaridade | Ensino Médio |
| `interests` | Interesses na biblioteca | Levar livro, Participar de eventos |
| `favorite_genres` | Gêneros literários favoritos | Contos, Poesia, Terror |
| `suggestions` | Sugestões de melhoria | Mais livros de ficção |
| `original_registration_date` | Data de cadastro original | 2022-01-15 14:30:00 |
| `notes` | Observações internas | - |

## Passo a Passo da Migração

### 1. Executar Migração do Banco de Dados

Primeiro, execute o script que adiciona os novos campos:

```sql
-- Execute no Supabase SQL Editor:
-- Arquivo: add_reader_fields_migration.sql
```

### 2. Obter o ID da Biblioteca

Antes de importar os leitores, você precisa do UUID da biblioteca:

```sql
SELECT id, name, city FROM libraries;
```

Copie o `id` da biblioteca desejada (ex: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

### 3. Configurar os Scripts de Importação

Nos arquivos de importação, substitua `'SEU_LIBRARY_ID_AQUI'` pelo UUID real:

**Arquivos a serem editados:**
- `import_readers_legacy.sql` (parte 1)
- `import_readers_legacy_part2.sql` (parte 2)
- `import_readers_legacy_part3.sql` (parte 3)
- `import_readers_legacy_part4.sql` (parte 4)
- `import_readers_legacy_part5.sql` (parte 5 - final)

**Exemplo de substituição:**
```sql
-- ANTES:
'SEU_LIBRARY_ID_AQUI'

-- DEPOIS (com seu UUID real):
'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
```

**Dica:** Use Ctrl+H (ou Cmd+H no Mac) para substituir todos de uma vez.

### 4. Executar a Importação

Execute os scripts na ordem no **Supabase SQL Editor**:

1. `import_readers_legacy.sql` (50 leitores)
2. `import_readers_legacy_part2.sql` (50 leitores)
3. `import_readers_legacy_part3.sql` (50 leitores)
4. `import_readers_legacy_part4.sql` (50 leitores)
5. `import_readers_legacy_part5.sql` (65 leitores - final)

### 5. Verificar Importação

Após a execução, verifique se os dados foram importados:

```sql
-- Contar total de leitores
SELECT COUNT(*) FROM users_profile WHERE role = 'leitor';

-- Ver alguns leitores com dados completos
SELECT 
    name, 
    email, 
    phone, 
    address_neighborhood, 
    ethnicity,
    favorite_genres
FROM users_profile 
WHERE role = 'leitor' 
LIMIT 10;
```

## Dados Importados

A importação inclui **265 leitores** com os seguintes dados:

### Distribuição por Etnia
- Branca: ~55%
- Parda: ~25%
- Preta: ~15%
- Outras (Indígena, Amarela, Quilombola): ~5%

### Distribuição por Gênero
- Mulheres cis: ~70%
- Homens cis: ~25%
- Não-binárie/Trans: ~5%

### Distribuição por Escolaridade
- Educação Infantil: ~5%
- Ensino Fundamental (1º ao 5º): ~20%
- Ensino Fundamental (6º ao 9º): ~25%
- Ensino Médio: ~30%
- Ensino Superior: ~15%
- Pós-graduação: ~5%

### Gêneros Literários mais populares
1. Novelas / Romances / Ficção
2. Terror / Suspense
3. Contos tradicionais
4. Livros de HQ
5. Literatura fantástica
6. Poesia
7. Romance espírita

## Tratamento de Dados

### Emails Duplicados
- Leitores sem email receberam um email gerado: `nome.leitor@biblioteca.local`
- O sistema usa `ON CONFLICT (email) DO UPDATE` para atualizar registros existentes

### Datas Inválidas
- Datas de nascimento claramente erradas (ex: 01/01/0001) foram tratadas como `NULL`

### Telefones
- Mantidos no formato original (com ou sem DDD)

### Sugestões dos Leitores
- Preservadas no campo `suggestions` para consulta futura

## Observações Importantes

1. **Consentimento LGPD**: Todos os leitores importados são marcados com `lgpd_consent = true`, assumindo que deram consentimento no formulário original.

2. **Status Ativo**: Todos os leitores são importados como `active = true`.

3. **Data Original**: A data de cadastro original é preservada no campo `original_registration_date`.

4. **Backup**: Recomenda-se fazer backup do banco antes da importação.

## Problemas Comuns

### Erro de UUID Inválido
```
invalid input syntax for type uuid: "SEU_LIBRARY_ID_AQUI"
```
**Solução**: Você esqueceu de substituir `SEU_LIBRARY_ID_AQUI` pelo UUID real.

### Erro de Email Duplicado
```
duplicate key value violates unique constraint
```
**Solução**: O script usa `ON CONFLICT DO UPDATE`, mas se houver problemas, verifique emails duplicados manualmente.

### Tabela Não Encontrada
```
relation "users_profile" does not exist
```
**Solução**: Certifique-se de que a tabela existe no Supabase antes de executar os scripts.

## Suporte

Em caso de dúvidas ou problemas, verifique:
1. O Supabase SQL Editor para mensagens de erro
2. Os logs do Supabase em "Logs > API"
3. A estrutura da tabela em "Database > Tables"
