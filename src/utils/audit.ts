/**
 * Sistema de Auditoria Completo
 * Registra todas as ações realizadas no sistema com informações detalhadas
 */

import { supabase } from '@/integrations/supabase/client';

export type AuditAction = 
  // Livros
  | 'BOOK_CREATE' | 'BOOK_UPDATE' | 'BOOK_DELETE'
  // Exemplares
  | 'COPY_CREATE' | 'COPY_UPDATE' | 'COPY_DELETE' | 'COPY_STATUS_CHANGE'
  // Empréstimos
  | 'LOAN_CREATE' | 'LOAN_RETURN' | 'LOAN_RENEW' | 'LOAN_CANCEL'
  // Usuários
  | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE' | 'USER_ACTIVATE' | 'USER_DEACTIVATE' | 'USER_LOGIN' | 'USER_LOGOUT'
  // Bibliotecas
  | 'LIBRARY_CREATE' | 'LIBRARY_UPDATE' | 'LIBRARY_DELETE' | 'LIBRARY_ACTIVATE' | 'LIBRARY_DEACTIVATE'
  // Eventos
  | 'EVENT_CREATE' | 'EVENT_UPDATE' | 'EVENT_DELETE' | 'EVENT_CANCEL'
  // Configurações
  | 'CONFIG_UPDATE' | 'APPEARANCE_UPDATE'
  // Outros
  | 'EXPORT_DATA' | 'IMPORT_DATA' | 'BULK_OPERATION';

export type EntityType = 
  | 'book' | 'copy' | 'loan' | 'user' | 'library' | 'event' | 'config' | 'appearance' | 'other';

export interface AuditLogData {
  user_id?: string | null;
  library_id?: string | null;
  action: AuditAction;
  entity_type: EntityType;
  entity_id?: string | null;
  entity_name?: string | null;
  details?: Record<string, any>;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  status?: 'success' | 'error' | 'warning';
  error_message?: string | null;
}

/**
 * Cria um log de auditoria completo
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    // Obter informações do navegador
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    
    // Preparar dados do log
    const logData = {
      user_id: data.user_id || null,
      library_id: data.library_id || null,
      action: data.action,
      entity_type: data.entity_type,
      entity_id: data.entity_id || null,
      entity_name: data.entity_name || null,
      details: data.details || {},
      old_values: data.old_values || null,
      new_values: data.new_values || null,
      status: data.status || 'success',
      error_message: data.error_message || null,
      user_agent: userAgent,
      // IP será capturado pelo backend se necessário
    };

    const { error } = await (supabase as any)
      .from('audit_logs')
      .insert(logData);

    if (error) {
      console.error('Erro ao criar log de auditoria:', error);
      // Não lançar erro para não interromper o fluxo principal
    }
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    // Não lançar erro para não interromper o fluxo principal
  }
}

/**
 * Helper para criar log de criação
 */
export async function logCreate(
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  data: Record<string, any>,
  userId?: string,
  libraryId?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    library_id: libraryId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: {
      operation: 'CREATE',
      ...data,
    },
    new_values: data,
    status: 'success',
  });
}

/**
 * Helper para criar log de atualização
 */
export async function logUpdate(
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  oldValues: Record<string, any>,
  newValues: Record<string, any>,
  userId?: string,
  libraryId?: string
): Promise<void> {
  // Identificar campos alterados
  const changedFields: Record<string, any> = {};
  Object.keys(newValues).forEach(key => {
    if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
      changedFields[key] = {
        old: oldValues[key],
        new: newValues[key],
      };
    }
  });

  await createAuditLog({
    user_id: userId,
    library_id: libraryId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: {
      operation: 'UPDATE',
      changed_fields: Object.keys(changedFields),
      changes_count: Object.keys(changedFields).length,
    },
    old_values: oldValues,
    new_values: newValues,
    status: 'success',
  });
}

/**
 * Helper para criar log de exclusão
 */
export async function logDelete(
  action: AuditAction,
  entityType: EntityType,
  entityId: string,
  entityName: string,
  data: Record<string, any>,
  userId?: string,
  libraryId?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    library_id: libraryId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details: {
      operation: 'DELETE',
      ...data,
    },
    old_values: data,
    status: 'success',
  });
}

/**
 * Helper para criar log de erro
 */
export async function logError(
  action: AuditAction,
  entityType: EntityType,
  errorMessage: string,
  details?: Record<string, any>,
  userId?: string,
  libraryId?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    library_id: libraryId,
    action,
    entity_type: entityType,
    details: {
      operation: 'ERROR',
      ...details,
    },
    status: 'error',
    error_message: errorMessage,
  });
}

/**
 * Helper para criar log de empréstimo
 */
export async function logLoan(
  action: 'LOAN_CREATE' | 'LOAN_RETURN' | 'LOAN_RENEW' | 'LOAN_CANCEL',
  loanId: string,
  bookTitle: string,
  readerName: string,
  details: Record<string, any>,
  userId?: string,
  libraryId?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    library_id: libraryId,
    action,
    entity_type: 'loan',
    entity_id: loanId,
    entity_name: `${bookTitle} - ${readerName}`,
    details: {
      operation: action,
      book_title: bookTitle,
      reader_name: readerName,
      ...details,
    },
    status: 'success',
  });
}




