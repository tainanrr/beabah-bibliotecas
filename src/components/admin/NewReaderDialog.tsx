import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { AutocompleteInput } from '@/components/ui/autocomplete-input';
import { SearchableSelect } from '@/components/ui/searchable-select';

type Library = Tables<'libraries'>;

type CustomOption = {
  id: string;
  name: string;
  is_default: boolean;
};

const ETHNICITY_OPTIONS = [
  'Preta',
  'Parda',
  'Branca',
  'Amarela',
  'Indígena',
  'Outro',
];

const GENDER_OPTIONS = [
  'Mulheres cis',
  'Mulheres trans',
  'Homens cis',
  'Homens trans',
  'Não-binárie',
];

const EDUCATION_OPTIONS = [
  'Sem escolaridade',
  'Educação Infantil',
  'Ensino Fundamental (1º ao 5º ano)',
  'Ensino Fundamental (6º ao 9º ano)',
  'Ensino Médio',
  'Ensino Superior',
  'Pós-graduação Especialização',
  'Mestrado',
  'Doutorado',
];

interface NewReaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  libraries: Library[];
  interestsOptions: string[];
  favoriteGenresOptions: string[];
  interestsFullOptions: CustomOption[];
  genresFullOptions: CustomOption[];
  onSaved: () => void;
  onAddInterest: (name: string) => Promise<void>;
  onAddGenre: (name: string) => Promise<void>;
  onManageInterests: () => void;
  onManageGenres: () => void;
  neighborhoodSuggestions?: string[];
  citySuggestions?: string[];
}

function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const INITIAL_FORM = {
  name: '',
  email: '',
  birth_date: '',
  phone: '',
  address_street: '',
  address_neighborhood: '',
  address_city: '',
  ethnicity: '',
  gender: '',
  education_level: '',
  interests: [] as string[],
  favorite_genres: [] as string[],
  suggestions: '',
};

export function NewReaderDialog({
  open,
  onOpenChange,
  libraries,
  interestsOptions,
  favoriteGenresOptions,
  interestsFullOptions,
  genresFullOptions,
  onSaved,
  onAddInterest,
  onAddGenre,
  onManageInterests,
  onManageGenres,
  neighborhoodSuggestions = [],
  citySuggestions = [],
}: NewReaderDialogProps) {
  const { user } = useAuth();

  const [form, setForm] = useState(INITIAL_FORM);
  const [lgpdConsent, setLgpdConsent] = useState(false);
  const [registrationDate, setRegistrationDate] = useState(getTodayString);
  const [selectedLibraryId, setSelectedLibraryId] = useState('');
  const [newInterestInput, setNewInterestInput] = useState('');
  const [newGenreInput, setNewGenreInput] = useState('');

  const resetForm = useCallback(() => {
    setForm(INITIAL_FORM);
    setLgpdConsent(false);
    setSelectedLibraryId('');
    setRegistrationDate(getTodayString());
    setNewInterestInput('');
    setNewGenreInput('');
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  }, [onOpenChange, resetForm]);

  const updateField = useCallback(<K extends keyof typeof INITIAL_FORM>(key: K, value: (typeof INITIAL_FORM)[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    const name = form.name.trim();
    const email = form.email.trim();

    if (!name) {
      toast({ title: 'Erro', description: 'Nome é obrigatório.', variant: 'destructive' });
      return;
    }

    if (!lgpdConsent) {
      toast({ title: 'Consentimento LGPD obrigatório', description: 'O(A) leitor(a) deve aceitar os termos de uso de dados.', variant: 'destructive' });
      return;
    }

    let libraryIdToUse: string;
    if (user?.role === 'bibliotecario' && user.library_id) {
      libraryIdToUse = user.library_id;
    } else {
      libraryIdToUse = selectedLibraryId;
    }

    if (!libraryIdToUse) {
      toast({ title: 'Erro', description: 'Biblioteca de origem é obrigatória.', variant: 'destructive' });
      return;
    }

    if (libraries.length === 0) {
      toast({ title: 'Erro', description: 'Nenhuma biblioteca disponível. Por favor, cadastre uma biblioteca primeiro.', variant: 'destructive' });
      return;
    }

    try {
      const createdAt = registrationDate ? `${registrationDate}T12:00:00` : new Date().toISOString();

      const insertData = {
        name,
        email: email || null,
        role: 'leitor',
        library_id: libraryIdToUse,
        lgpd_consent: true,
        active: true,
        created_at: createdAt,
        birth_date: form.birth_date || null,
        phone: form.phone.trim() || null,
        address_street: form.address_street.trim() || null,
        address_neighborhood: form.address_neighborhood.trim() || null,
        address_city: form.address_city.trim() || null,
        ethnicity: form.ethnicity || null,
        gender: form.gender || null,
        education_level: form.education_level || null,
        interests: form.interests.length > 0 ? form.interests.join(', ') : null,
        favorite_genres: form.favorite_genres.length > 0 ? form.favorite_genres.join(', ') : null,
        suggestions: form.suggestions.trim() || null,
      };

      const { data, error } = await (supabase as any)
        .from('users_profile')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Erro do Supabase:', error);
        throw error;
      }

      console.log('Leitor criado com sucesso:', data);

      toast({ title: 'Leitor(a) cadastrado(a)', description: 'O cadastro foi realizado com sucesso.' });

      handleOpenChange(false);
      onSaved();
    } catch (error: any) {
      console.error('Erro ao salvar leitor:', error);
      const errorMessage = error?.message || error?.details || 'Não foi possível salvar o leitor.';

      if (error?.message?.includes('Could not find the table')) {
        toast({ title: 'Tabela não encontrada', description: 'A tabela "users_profile" não existe no banco de dados.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: errorMessage, variant: 'destructive' });
      }
    }
  };

  const handleAddInterestClick = async () => {
    const name = newInterestInput.trim();
    if (!name) {
      toast({ title: 'Erro', description: 'Digite o nome do novo interesse.', variant: 'destructive' });
      return;
    }
    if (interestsOptions.some(opt => opt.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Aviso', description: 'Esse interesse já existe na lista.', variant: 'destructive' });
      return;
    }
    await onAddInterest(name);
    setNewInterestInput('');
  };

  const handleAddGenreClick = async () => {
    const name = newGenreInput.trim();
    if (!name) {
      toast({ title: 'Erro', description: 'Digite o nome do novo gênero literário.', variant: 'destructive' });
      return;
    }
    if (favoriteGenresOptions.some(opt => opt.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Aviso', description: 'Esse gênero literário já existe na lista.', variant: 'destructive' });
      return;
    }
    await onAddGenre(name);
    setNewGenreInput('');
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gov">
          <Plus className="mr-2 h-4 w-4" />
          Novo(a) Leitor(a)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Leitor(a)</DialogTitle>
          <DialogDescription>Preencha os dados do novo usuário</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Dados Básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome Completo *</Label>
              <Input
                id="new-name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nome do leitor"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">E-mail</Label>
              <Input
                id="new-email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-birth_date">Data de Nascimento</Label>
              <Input
                id="new-birth_date"
                type="date"
                value={form.birth_date}
                onChange={(e) => updateField('birth_date', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-phone">Telefone</Label>
              <Input
                id="new-phone"
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(51) 99999-9999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-registrationDate">Data de Cadastro</Label>
              <Input
                id="new-registrationDate"
                type="date"
                value={registrationDate}
                onChange={(e) => setRegistrationDate(e.target.value)}
              />
            </div>
          </div>

          {/* Biblioteca */}
          {user?.role === 'admin_rede' ? (
            <div className="space-y-2">
              <Label>Biblioteca Vinculada *</Label>
              <Select value={selectedLibraryId} onValueChange={setSelectedLibraryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {libraries.length === 0 ? (
                    <SelectItem value="" disabled>Nenhuma biblioteca disponível</SelectItem>
                  ) : (
                    libraries.map((lib) => (
                      <SelectItem key={lib.id} value={lib.id}>{lib.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {libraries.length === 0 && (
                <p className="text-xs text-muted-foreground">Cadastre uma biblioteca primeiro</p>
              )}
            </div>
          ) : (
            user?.role === 'bibliotecario' && user.library_id && (
              <div className="space-y-2">
                <Label>Biblioteca Vinculada</Label>
                <Input
                  value={libraries.find(l => l.id === user.library_id)?.name || 'Biblioteca'}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O leitor será vinculado à sua biblioteca</p>
              </div>
            )
          )}

          {/* Endereço */}
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-3">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="new-address_street">Rua e Número</Label>
                <Input
                  id="new-address_street"
                  value={form.address_street}
                  onChange={(e) => updateField('address_street', e.target.value)}
                  placeholder="Rua, número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-address_neighborhood">Bairro</Label>
                <AutocompleteInput
                  id="new-address_neighborhood"
                  value={form.address_neighborhood}
                  onChange={(v) => updateField('address_neighborhood', v)}
                  suggestions={neighborhoodSuggestions}
                  placeholder="Bairro"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-3">
              <div className="space-y-2">
                <Label htmlFor="new-address_city">Cidade/UF</Label>
                <AutocompleteInput
                  id="new-address_city"
                  value={form.address_city}
                  onChange={(v) => updateField('address_city', v)}
                  suggestions={citySuggestions}
                  placeholder="Cidade-RS"
                />
              </div>
            </div>
          </div>

          {/* Dados Demográficos */}
          <div className="border-t pt-4 mt-2">
            <h4 className="font-medium text-sm mb-3">Dados Demográficos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-ethnicity">Etnia/Raça</Label>
                <SearchableSelect
                  id="new-ethnicity"
                  value={form.ethnicity}
                  onValueChange={(v) => updateField('ethnicity', v)}
                  options={ETHNICITY_OPTIONS}
                  placeholder="Selecione..."
                  searchPlaceholder="Pesquisar etnia/raça..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-gender">Gênero</Label>
                <SearchableSelect
                  id="new-gender"
                  value={form.gender}
                  onValueChange={(v) => updateField('gender', v)}
                  options={GENDER_OPTIONS}
                  placeholder="Selecione..."
                  searchPlaceholder="Pesquisar gênero..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-education_level">Escolaridade</Label>
                <SearchableSelect
                  id="new-education_level"
                  value={form.education_level}
                  onValueChange={(v) => updateField('education_level', v)}
                  options={EDUCATION_OPTIONS}
                  placeholder="Selecione..."
                  searchPlaceholder="Pesquisar escolaridade..."
                />
              </div>
            </div>
          </div>

          {/* Interesses */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Interesses na Biblioteca</h4>
              {interestsFullOptions.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={onManageInterests} className="text-xs h-7">
                  <Settings className="h-3 w-3 mr-1" />
                  Gerenciar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {interestsOptions.map((interest) => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={`new-interest-${interest}`}
                    checked={form.interests.includes(interest)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateField('interests', [...form.interests, interest]);
                      } else {
                        updateField('interests', form.interests.filter(i => i !== interest));
                      }
                    }}
                  />
                  <Label htmlFor={`new-interest-${interest}`} className="text-sm font-normal cursor-pointer">
                    {interest}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Adicionar novo interesse..."
                value={newInterestInput}
                onChange={(e) => setNewInterestInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterestClick(); } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddInterestClick}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Gêneros Literários Favoritos */}
          <div className="border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Gêneros Literários Favoritos</h4>
              {genresFullOptions.length > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={onManageGenres} className="text-xs h-7">
                  <Settings className="h-3 w-3 mr-1" />
                  Gerenciar
                </Button>
              )}
            </div>
            <div className="space-y-2">
              {favoriteGenresOptions.map((genre) => (
                <div key={genre} className="flex items-center space-x-2">
                  <Checkbox
                    id={`new-genre-${genre}`}
                    checked={form.favorite_genres.includes(genre)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateField('favorite_genres', [...form.favorite_genres, genre]);
                      } else {
                        updateField('favorite_genres', form.favorite_genres.filter(g => g !== genre));
                      }
                    }}
                  />
                  <Label htmlFor={`new-genre-${genre}`} className="text-sm font-normal cursor-pointer">
                    {genre}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-3">
              <Input
                placeholder="Adicionar novo gênero literário..."
                value={newGenreInput}
                onChange={(e) => setNewGenreInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGenreClick(); } }}
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={handleAddGenreClick}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sugestões */}
          <div className="border-t pt-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="new-suggestions">Sugestões/Observações</Label>
              <Input
                id="new-suggestions"
                value={form.suggestions}
                onChange={(e) => updateField('suggestions', e.target.value)}
                placeholder="Sugestões de livros ou observações"
              />
            </div>
          </div>

          {/* LGPD Consent */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 mt-2">
            <h4 className="font-medium text-sm">Termo de Consentimento LGPD *</h4>
            <p className="text-xs text-muted-foreground">
              Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
              autorizo a coleta, armazenamento e tratamento dos meus dados pessoais para
              fins de cadastro e utilização dos serviços da biblioteca.
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lgpd"
                checked={lgpdConsent}
                onCheckedChange={(checked) => setLgpdConsent(checked as boolean)}
              />
              <Label htmlFor="lgpd" className="text-sm font-medium leading-none cursor-pointer">
                Li e aceito os termos de uso de dados
              </Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
          <Button variant="gov" onClick={handleSave}>Cadastrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
