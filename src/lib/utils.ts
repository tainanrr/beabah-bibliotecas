import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza texto removendo acentos e caracteres especiais para pesquisa.
 * Converte para minúsculas e remove acentos (á -> a, ç -> c, etc.)
 * @param text - Texto a ser normalizado
 * @returns Texto normalizado sem acentos em minúsculas
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Verifica se o texto contém o termo de busca, ignorando acentos.
 * @param text - Texto onde buscar
 * @param searchTerm - Termo de busca
 * @returns true se o texto contém o termo de busca (ignorando acentos)
 */
export function includesIgnoringAccents(text: string | null | undefined, searchTerm: string): boolean {
  return normalizeText(text).includes(normalizeText(searchTerm));
}

/**
 * Formata um valor de telefone no padrão brasileiro (XX) XXXXX-XXXX.
 * Aceita apenas dígitos e aplica a máscara progressivamente.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
