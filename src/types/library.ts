// Type definitions for the Library Management System

export type UserRole = 'admin_rede' | 'bibliotecario' | 'leitor';

export type CopyStatus = 'disponivel' | 'emprestado' | 'manutencao' | 'extraviado';

export type LoanStatus = 'aberto' | 'devolvido';

export type ReservationStatus = 'pendente' | 'disponivel' | 'cancelada' | 'concluida';

export interface Library {
  id: string;
  name: string;
  city: string;
  address: string;
  active: boolean;
  config_loan_days: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  library_id: string | null;
  active: boolean;
  blocked_until: string | null;
  lgpd_consent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  category: string;
  year: number;
  cover_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Copy {
  id: string;
  book_id: string;
  library_id: string;
  code_bar: string;
  status: CopyStatus;
  location_shelf: string;
  created_at: string;
  updated_at: string;
  // Relations
  book?: Book;
  library?: Library;
}

export interface Loan {
  id: string;
  user_id: string;
  copy_id: string;
  library_id: string;
  loan_date: string;
  due_date: string;
  return_date: string | null;
  status: LoanStatus;
  renewals_count: number;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  copy?: Copy;
  library?: Library;
}

export interface Reservation {
  id: string;
  user_id: string;
  book_id: string;
  library_id: string;
  request_date: string;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
  // Relations
  user?: User;
  book?: Book;
  library?: Library;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  // Relations
  user?: User;
}

// Dashboard KPIs
export interface DashboardKPIs {
  totalLibraries: number;
  totalBooks: number;
  totalCopies: number;
  totalUsers: number;
  activeLoans: number;
  loansThisMonth: number;
  overdueLoans: number;
}

// Loan eligibility check result
export interface LoanEligibility {
  eligible: boolean;
  reasons: string[];
}

// Search result for public catalog
export interface BookSearchResult extends Book {
  availability: {
    libraryId: string;
    libraryName: string;
    availableCopies: number;
    totalCopies: number;
  }[];
}
