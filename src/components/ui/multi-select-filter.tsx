import * as React from 'react';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn, includesIgnoringAccents } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';

interface MultiSelectFilterProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
}

export function MultiSelectFilter({
  options,
  selected,
  onChange,
  placeholder = 'Selecione...',
  searchPlaceholder = 'Pesquisar...',
  className,
}: MultiSelectFilterProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((opt) => includesIgnoringAccents(opt, searchQuery));
  }, [options, searchQuery]);

  const allSelected = selected.length === options.length && options.length > 0;
  const noneSelected = selected.length === 0;

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...options]);
    }
  };

  const triggerLabel = noneSelected
    ? placeholder
    : selected.length === 1
      ? selected[0]
      : `${selected.length} selecionados`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal h-10',
            noneSelected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate text-left flex-1">
            {triggerLabel}
          </span>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {!noneSelected && (
              <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-xs rounded-full">
                {selected.length}
              </Badge>
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="ml-1 opacity-50 hover:opacity-100">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="max-h-[250px] overflow-y-auto p-1">
          {!searchQuery && (
            <button
              onClick={handleSelectAll}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground font-medium border-b mb-1 pb-2"
            >
              <Checkbox
                checked={allSelected}
                className="mr-2"
                tabIndex={-1}
              />
              {allSelected ? 'Desmarcar todos' : 'Marcar todos'}
              <span className="ml-auto text-xs text-muted-foreground">
                {options.length}
              </span>
            </button>
          )}

          {filtered.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          ) : (
            filtered.map((option) => {
              const isChecked = selected.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => handleToggle(option)}
                  className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                    isChecked && 'bg-accent/50',
                  )}
                >
                  <Checkbox
                    checked={isChecked}
                    className="mr-2"
                    tabIndex={-1}
                  />
                  <span className="truncate">{option}</span>
                </button>
              );
            })
          )}
        </div>

        {!noneSelected && (
          <div className="border-t p-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-7 text-xs text-muted-foreground"
              onClick={() => { onChange([]); }}
            >
              <X className="mr-1 h-3 w-3" />
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
