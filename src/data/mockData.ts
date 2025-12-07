import { Library, User, Book, Copy, Loan, AuditLog } from '@/types/library';

// Mock Libraries
export const mockLibraries: Library[] = [
  {
    id: 'lib-1',
    name: 'Biblioteca Central',
    city: 'São Paulo',
    address: 'Rua da República, 123 - Centro',
    active: true,
    config_loan_days: 14,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'lib-2',
    name: 'Biblioteca Mário de Andrade',
    city: 'Campinas',
    address: 'Av. Brasil, 456 - Centro',
    active: true,
    config_loan_days: 21,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
  },
  {
    id: 'lib-3',
    name: 'Biblioteca Monteiro Lobato',
    city: 'Santos',
    address: 'Praça Mauá, 789',
    active: true,
    config_loan_days: 14,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
  },
  {
    id: 'lib-4',
    name: 'Biblioteca Paulo Freire',
    city: 'Ribeirão Preto',
    address: 'Rua General Osório, 321',
    active: true,
    config_loan_days: 14,
    created_at: '2024-02-15T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
  },
  {
    id: 'lib-5',
    name: 'Biblioteca Cecília Meireles',
    city: 'Sorocaba',
    address: 'Av. Getúlio Vargas, 555',
    active: false,
    config_loan_days: 14,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
  },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@biblioteca.gov.br',
    name: 'Carlos Administrador',
    role: 'admin_rede',
    library_id: null,
    active: true,
    blocked_until: null,
    lgpd_consent: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'maria.silva@biblioteca.gov.br',
    name: 'Maria Silva',
    role: 'bibliotecario',
    library_id: 'lib-1',
    active: true,
    blocked_until: null,
    lgpd_consent: true,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
  },
  {
    id: 'user-3',
    email: 'joao.santos@biblioteca.gov.br',
    name: 'João Santos',
    role: 'bibliotecario',
    library_id: 'lib-2',
    active: true,
    blocked_until: null,
    lgpd_consent: true,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
  },
  ...Array.from({ length: 17 }, (_, i) => ({
    id: `user-${i + 4}`,
    email: `leitor${i + 1}@email.com`,
    name: `Leitor ${['Ana', 'Pedro', 'Fernanda', 'Lucas', 'Juliana', 'Rafael', 'Camila', 'Bruno', 'Larissa', 'Gustavo', 'Patrícia', 'Thiago', 'Mariana', 'Diego', 'Carolina', 'Felipe', 'Amanda'][i]}`,
    role: 'leitor' as const,
    library_id: mockLibraries[i % 4].id,
    active: i !== 5,
    blocked_until: i === 3 ? '2025-01-15T00:00:00Z' : null,
    lgpd_consent: true,
    created_at: `2024-0${Math.floor(i / 5) + 2}-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
    updated_at: `2024-0${Math.floor(i / 5) + 2}-${String((i % 28) + 1).padStart(2, '0')}T00:00:00Z`,
  })),
];

// Mock Books (Global Catalog)
export const mockBooks: Book[] = [
  { id: 'book-1', title: 'Dom Casmurro', author: 'Machado de Assis', isbn: '9788525406453', publisher: 'Companhia das Letras', category: 'Literatura Brasileira', year: 1899, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-2', title: 'Grande Sertão: Veredas', author: 'Guimarães Rosa', isbn: '9788520923115', publisher: 'Nova Fronteira', category: 'Literatura Brasileira', year: 1956, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-3', title: 'Memórias Póstumas de Brás Cubas', author: 'Machado de Assis', isbn: '9788525410450', publisher: 'Companhia das Letras', category: 'Literatura Brasileira', year: 1881, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-4', title: 'O Cortiço', author: 'Aluísio Azevedo', isbn: '9788544001005', publisher: 'Penguin', category: 'Literatura Brasileira', year: 1890, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-5', title: 'Vidas Secas', author: 'Graciliano Ramos', isbn: '9788501014665', publisher: 'Record', category: 'Literatura Brasileira', year: 1938, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-6', title: 'Capitães da Areia', author: 'Jorge Amado', isbn: '9788535914061', publisher: 'Companhia das Letras', category: 'Literatura Brasileira', year: 1937, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-7', title: 'A Hora da Estrela', author: 'Clarice Lispector', isbn: '9788532511454', publisher: 'Rocco', category: 'Literatura Brasileira', year: 1977, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-8', title: 'O Alienista', author: 'Machado de Assis', isbn: '9788573261400', publisher: 'Martin Claret', category: 'Literatura Brasileira', year: 1882, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-9', title: 'Iracema', author: 'José de Alencar', isbn: '9788544001029', publisher: 'Penguin', category: 'Literatura Brasileira', year: 1865, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-10', title: 'Macunaíma', author: 'Mário de Andrade', isbn: '9788503012225', publisher: 'Itatiaia', category: 'Literatura Brasileira', year: 1928, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-11', title: 'Clean Code', author: 'Robert C. Martin', isbn: '9780132350884', publisher: 'Prentice Hall', category: 'Tecnologia', year: 2008, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-12', title: 'O Poder do Hábito', author: 'Charles Duhigg', isbn: '9788539004119', publisher: 'Objetiva', category: 'Autoajuda', year: 2012, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-13', title: '1984', author: 'George Orwell', isbn: '9788535914849', publisher: 'Companhia das Letras', category: 'Ficção Científica', year: 1949, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-14', title: 'O Pequeno Príncipe', author: 'Antoine de Saint-Exupéry', isbn: '9788522031450', publisher: 'Agir', category: 'Infantojuvenil', year: 1943, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-15', title: 'Harry Potter e a Pedra Filosofal', author: 'J.K. Rowling', isbn: '9788532530783', publisher: 'Rocco', category: 'Infantojuvenil', year: 1997, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-16', title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '9788525432186', publisher: 'Companhia das Letras', category: 'História', year: 2014, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-17', title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', isbn: '9788533613379', publisher: 'Martins Fontes', category: 'Fantasia', year: 1954, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-18', title: 'Crime e Castigo', author: 'Fiódor Dostoiévski', isbn: '9788573264890', publisher: 'Martin Claret', category: 'Clássicos', year: 1866, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-19', title: 'Cem Anos de Solidão', author: 'Gabriel García Márquez', isbn: '9788501012173', publisher: 'Record', category: 'Realismo Mágico', year: 1967, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'book-20', title: 'A Arte da Guerra', author: 'Sun Tzu', isbn: '9788525410511', publisher: 'Companhia das Letras', category: 'Estratégia', year: -500, cover_url: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  ...Array.from({ length: 30 }, (_, i) => ({
    id: `book-${i + 21}`,
    title: ['A Metamorfose', 'O Processo', 'Orgulho e Preconceito', 'O Grande Gatsby', 'Moby Dick', 'Anna Karenina', 'Os Miseráveis', 'O Conde de Monte Cristo', 'O Morro dos Ventos Uivantes', 'Jane Eyre', 'Drácula', 'Frankenstein', 'O Retrato de Dorian Gray', 'A Divina Comédia', 'Hamlet', 'Romeu e Julieta', 'A Odisseia', 'A Ilíada', 'Don Quixote', 'Os Lusíadas', 'Auto da Compadecida', 'Morte e Vida Severina', 'A Moreninha', 'Senhora', 'Lucíola', 'O Guarani', 'A Escrava Isaura', 'Triste Fim de Policarpo Quaresma', 'O Ateneu', 'Quincas Borba'][i],
    author: ['Franz Kafka', 'Franz Kafka', 'Jane Austen', 'F. Scott Fitzgerald', 'Herman Melville', 'Lev Tolstói', 'Victor Hugo', 'Alexandre Dumas', 'Emily Brontë', 'Charlotte Brontë', 'Bram Stoker', 'Mary Shelley', 'Oscar Wilde', 'Dante Alighieri', 'William Shakespeare', 'William Shakespeare', 'Homero', 'Homero', 'Miguel de Cervantes', 'Luís de Camões', 'Ariano Suassuna', 'João Cabral de Melo Neto', 'Joaquim Manuel de Macedo', 'José de Alencar', 'José de Alencar', 'José de Alencar', 'Bernardo Guimarães', 'Lima Barreto', 'Raul Pompeia', 'Machado de Assis'][i],
    isbn: `978853${String(i + 21).padStart(7, '0')}`,
    publisher: ['Companhia das Letras', 'Penguin', 'Martin Claret', 'Rocco', 'Nova Fronteira'][i % 5],
    category: ['Clássicos', 'Romance', 'Ficção', 'Teatro', 'Poesia', 'Literatura Brasileira'][i % 6],
    year: 1850 + (i * 5),
    cover_url: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  })),
];

// Mock Copies
export const mockCopies: Copy[] = mockBooks.slice(0, 30).flatMap((book, bookIndex) => {
  const copiesPerLibrary = [2, 1, 3, 1, 2];
  return mockLibraries.slice(0, 4).flatMap((library, libIndex) => {
    const numCopies = copiesPerLibrary[(bookIndex + libIndex) % 5];
    return Array.from({ length: numCopies }, (_, copyIndex) => ({
      id: `copy-${book.id}-${library.id}-${copyIndex}`,
      book_id: book.id,
      library_id: library.id,
      code_bar: `${library.id.replace('lib-', '')}-${book.id.replace('book-', '').padStart(4, '0')}-${copyIndex + 1}`,
      status: (['disponivel', 'disponivel', 'disponivel', 'emprestado', 'manutencao'] as const)[(bookIndex + libIndex + copyIndex) % 5],
      location_shelf: `${String.fromCharCode(65 + (bookIndex % 10))}-${Math.floor(bookIndex / 10) + 1}`,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      book,
      library,
    }));
  });
});

// Mock Loans
export const mockLoans: Loan[] = Array.from({ length: 35 }, (_, i) => {
  const user = mockUsers.filter(u => u.role === 'leitor')[i % 17];
  const copy = mockCopies.filter(c => c.status === 'emprestado' || i < 20)[i % mockCopies.length];
  const loanDate = new Date(2024, 10, 1 + (i % 25));
  const dueDate = new Date(loanDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const isReturned = i >= 20;
  const returnDate = isReturned ? new Date(dueDate.getTime() - (i % 5) * 24 * 60 * 60 * 1000) : null;

  return {
    id: `loan-${i + 1}`,
    user_id: user.id,
    copy_id: copy.id,
    library_id: copy.library_id,
    loan_date: loanDate.toISOString(),
    due_date: dueDate.toISOString(),
    return_date: returnDate?.toISOString() || null,
    status: isReturned ? 'devolvido' : 'aberto',
    renewals_count: i % 3,
    created_at: loanDate.toISOString(),
    updated_at: loanDate.toISOString(),
    user,
    copy,
  };
});

// Mock Audit Logs
export const mockAuditLogs: AuditLog[] = Array.from({ length: 50 }, (_, i) => {
  const user = mockUsers[i % mockUsers.length];
  const actions = ['LOGIN', 'LOAN_CREATED', 'LOAN_RETURNED', 'BOOK_ADDED', 'COPY_ADDED', 'USER_UPDATED', 'LIBRARY_UPDATED'];
  const action = actions[i % actions.length];
  
  return {
    id: `log-${i + 1}`,
    user_id: user.id,
    action,
    details: { action, timestamp: new Date(2024, 11, 1 - i).toISOString() },
    created_at: new Date(2024, 11, 1 - i).toISOString(),
    user,
  };
});

// Helper functions for data access
export const getLibraryById = (id: string) => mockLibraries.find(l => l.id === id);
export const getUserById = (id: string) => mockUsers.find(u => u.id === id);
export const getBookById = (id: string) => mockBooks.find(b => b.id === id);
export const getCopiesByLibrary = (libraryId: string) => mockCopies.filter(c => c.library_id === libraryId);
export const getLoansByLibrary = (libraryId: string) => mockLoans.filter(l => l.library_id === libraryId);
export const getActiveLoans = () => mockLoans.filter(l => l.status === 'aberto');
export const getOverdueLoans = () => {
  const today = new Date();
  return mockLoans.filter(l => l.status === 'aberto' && new Date(l.due_date) < today);
};
