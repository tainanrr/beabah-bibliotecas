import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  id?: string;
  className?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
  className,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length > 0) {
      const lower = value.toLowerCase();
      const matches = suggestions.filter(
        (s) => s.toLowerCase().includes(lower) && s.toLowerCase() !== lower
      );
      setFiltered(matches);
      setOpen(matches.length > 0);
    } else {
      setFiltered([]);
      setOpen(false);
    }
  }, [value, suggestions]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          if (value.trim().length > 0 && filtered.length > 0) {
            setOpen(true);
          }
        }}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-[200px] overflow-y-auto">
          {filtered.map((item) => (
            <div
              key={item}
              className={cn(
                'px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground',
                item.toLowerCase() === value.toLowerCase() && 'bg-accent'
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
