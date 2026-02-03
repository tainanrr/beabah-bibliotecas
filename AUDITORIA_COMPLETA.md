# Sistema de Auditoria Completo

## O que foi implementado:

### 1. Estrutura do Banco de Dados (`improve_audit_system.sql`)
- Tabela `audit_logs` expandida com campos completos:
  - `user_id`: ID do usuário que realizou a ação
  - `library_id`: ID da biblioteca relacionada
  - `action`: Tipo de ação (CREATE, UPDATE, DELETE, LOAN, etc.)
  - `entity_type`: Tipo de entidade (book, copy, loan, user, library, etc.)
  - `entity_id`: ID da entidade afetada
  - `entity_name`: Nome/título da entidade
  - `details`: Detalhes completos em JSON
  - `old_values`: Valores antigos (para edições)
  - `new_values`: Valores novos (para edições)
  - `status`: Status da ação (success, error, warning)
  - `error_message`: Mensagem de erro se houver
  - `ip_address`: IP do usuário (preparado)
  - `user_agent`: User agent do navegador
  - Índices para melhorar performance

### 2. Utilitário de Auditoria (`src/utils/audit.ts`)
Funções helper para facilitar a criação de logs:
- `createAuditLog()`: Função principal para criar logs
- `logCreate()`: Helper para ações de criação
- `logUpdate()`: Helper para ações de atualização (compara valores antigos e novos)
- `logDelete()`: Helper para ações de exclusão
- `logError()`: Helper para registrar erros
- `logLoan()`: Helper específico para operações de empréstimo

### 3. Interface de Visualização (`src/pages/admin/Audit.tsx`)
- Tabela expandida com 8 colunas:
  - Data/Hora
  - Usuário (nome e email)
  - Biblioteca
  - Ação
  - Tipo de Entidade
  - Entidade (nome e ID)
  - Status (com badge colorido)
  - Detalhes (expansível com valores antigos/novos)
- Exportação completa para Excel com todos os campos
- Visualização de alterações (valores antigos vs novos)

### 4. Logs Implementados

#### Bibliotecas (`Libraries.tsx`)
- ✅ Criação de biblioteca
- ✅ Edição de biblioteca (com valores antigos/novos)
- ✅ Exclusão de biblioteca (com informações de dependências)

#### Circulação (`Circulation.tsx`)
- ✅ Criação de empréstimo
- ✅ Devolução de empréstimo
- ✅ Renovação de empréstimo

#### Usuários (`Settings.tsx`)
- ✅ Criação de usuário
- ✅ Edição de usuário (com valores antigos/novos)
- ✅ Exclusão de usuário (com informações de dependências)

#### Catálogo (`Catalog.tsx`)
- ✅ Criação de livro
- ✅ Edição de livro (com valores antigos/novos)

## Como adicionar logs em outras operações:

### Exemplo 1: Criar Exemplar
```typescript
import { logCreate } from '@/utils/audit';

// Após criar o exemplar com sucesso:
await logCreate(
  'COPY_CREATE',
  'copy',
  newCopy.id,
  `${book.title} - ${newCopy.code}`,
  {
    book_id: newCopy.book_id,
    code: newCopy.code,
    library_id: newCopy.library_id,
    status: newCopy.status,
  },
  user?.id,
  user?.library_id
);
```

### Exemplo 2: Editar Exemplar
```typescript
import { logUpdate } from '@/utils/audit';

// Antes de atualizar, buscar valores antigos:
const { data: oldCopy } = await supabase
  .from('copies')
  .select('*')
  .eq('id', copyId)
  .single();

// Após atualizar:
await logUpdate(
  'COPY_UPDATE',
  'copy',
  copyId,
  `${book.title} - ${copy.code}`,
  oldCopy,
  newCopyData,
  user?.id,
  user?.library_id
);
```

### Exemplo 3: Criar Evento
```typescript
import { logCreate } from '@/utils/audit';

await logCreate(
  'EVENT_CREATE',
  'event',
  newEvent.id,
  newEvent.title,
  {
    title: newEvent.title,
    date: newEvent.date,
    library_id: newEvent.library_id,
    category: newEvent.category,
  },
  user?.id,
  user?.library_id
);
```

### Exemplo 4: Registrar Erro
```typescript
import { logError } from '@/utils/audit';

try {
  // operação que pode falhar
} catch (error) {
  await logError(
    'BOOK_CREATE',
    'book',
    error.message,
    {
      attempted_data: formData,
    },
    user?.id,
    user?.library_id
  );
  throw error;
}
```

## Próximos passos recomendados:

1. **Executar o script SQL** `improve_audit_system.sql` no Supabase
2. **Adicionar logs em mais operações:**
   - Criação/edição/exclusão de exemplares
   - Criação/edição/exclusão de eventos
   - Alterações de configuração
   - Exportações de dados
   - Login/Logout de usuários
   - Alterações de aparência
3. **Testar** a visualização na tela de Auditoria
4. **Verificar** se os logs estão sendo criados corretamente

## Tipos de Ação Disponíveis:

- `BOOK_CREATE`, `BOOK_UPDATE`, `BOOK_DELETE`
- `COPY_CREATE`, `COPY_UPDATE`, `COPY_DELETE`, `COPY_STATUS_CHANGE`
- `LOAN_CREATE`, `LOAN_RETURN`, `LOAN_RENEW`, `LOAN_CANCEL`
- `USER_CREATE`, `USER_UPDATE`, `USER_DELETE`, `USER_ACTIVATE`, `USER_DEACTIVATE`, `USER_LOGIN`, `USER_LOGOUT`
- `LIBRARY_CREATE`, `LIBRARY_UPDATE`, `LIBRARY_DELETE`, `LIBRARY_ACTIVATE`, `LIBRARY_DEACTIVATE`
- `EVENT_CREATE`, `EVENT_UPDATE`, `EVENT_DELETE`, `EVENT_CANCEL`
- `CONFIG_UPDATE`, `APPEARANCE_UPDATE`
- `EXPORT_DATA`, `IMPORT_DATA`, `BULK_OPERATION`




