import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from './input';
import { MapPin, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface GooglePlacesAutocompleteProps {
  value: string;
  onChange: (value: string, placeData?: { lat?: number; lng?: number; placeId?: string }) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

// Variável global para controlar o carregamento do script
let isScriptLoading = false;
let isScriptLoaded = false;
const callbacks: (() => void)[] = [];

const loadGoogleMapsScript = (callback: () => void) => {
  // Se já está carregado, executa o callback imediatamente
  if (isScriptLoaded && window.google?.maps?.places) {
    callback();
    return;
  }

  // Adiciona callback à lista
  callbacks.push(callback);

  // Se já está carregando, apenas aguarda
  if (isScriptLoading) {
    return;
  }

  // Verifica se a API key existe
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('Google Maps API key não configurada. Adicione VITE_GOOGLE_MAPS_API_KEY ao .env');
    return;
  }

  isScriptLoading = true;

  // Define callback global
  window.initGooglePlaces = () => {
    isScriptLoaded = true;
    isScriptLoading = false;
    callbacks.forEach(cb => cb());
    callbacks.length = 0;
  };

  // Carrega o script
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGooglePlaces`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
};

export function GooglePlacesAutocomplete({
  value,
  onChange,
  placeholder = "Digite o endereço...",
  className,
  disabled = false,
}: GooglePlacesAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<any>(null);
  const placesService = useRef<any>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Carrega o script do Google Maps
  useEffect(() => {
    loadGoogleMapsScript(() => {
      if (window.google?.maps?.places) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        // Cria um elemento dummy para o PlacesService
        const dummyElement = document.createElement('div');
        placesService.current = new window.google.maps.places.PlacesService(dummyElement);
        setIsApiReady(true);
      }
    });
  }, []);

  // Atualiza o inputValue quando o value externo muda
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fecha o dropdown quando clica fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca predições
  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || !input.trim()) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    
    autocompleteService.current.getPlacePredictions(
      {
        input,
        componentRestrictions: { country: 'br' }, // Restringe ao Brasil
        types: ['establishment', 'geocode'], // Estabelecimentos e endereços
      },
      (results: PlacePrediction[] | null, status: string) => {
        setIsLoading(false);
        if (status === 'OK' && results) {
          setPredictions(results);
          setIsOpen(true);
          setSelectedIndex(-1);
        } else {
          setPredictions([]);
          setIsOpen(false);
        }
      }
    );
  }, []);

  // Handler de mudança no input com debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue); // Atualiza o valor externo mesmo sem selecionar

    // Limpa timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Define novo timer para buscar predições
    if (isApiReady && newValue.length >= 3) {
      debounceTimer.current = setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  // Seleciona um local
  const handleSelectPlace = (prediction: PlacePrediction) => {
    setInputValue(prediction.description);
    setPredictions([]);
    setIsOpen(false);

    // Busca detalhes do local para obter lat/lng
    if (placesService.current) {
      placesService.current.getDetails(
        {
          placeId: prediction.place_id,
          fields: ['geometry', 'formatted_address'],
        },
        (place: any, status: string) => {
          if (status === 'OK' && place?.geometry?.location) {
            onChange(prediction.description, {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              placeId: prediction.place_id,
            });
          } else {
            onChange(prediction.description, { placeId: prediction.place_id });
          }
        }
      );
    } else {
      onChange(prediction.description, { placeId: prediction.place_id });
    }
  };

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < predictions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : predictions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handleSelectPlace(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // Limpa o campo
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setPredictions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={cn("pl-9 pr-8", className)}
          disabled={disabled}
        />
        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              className={cn(
                "w-full px-3 py-2 text-left hover:bg-slate-100 flex items-start gap-2 transition-colors",
                index === selectedIndex && "bg-slate-100"
              )}
              onClick={() => handleSelectPlace(prediction)}
            >
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {prediction.structured_formatting.main_text}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {prediction.structured_formatting.secondary_text}
                </div>
              </div>
            </button>
          ))}
          
          {/* Powered by Google */}
          <div className="px-3 py-1.5 border-t bg-slate-50 flex items-center justify-end gap-1">
            <span className="text-[10px] text-muted-foreground">powered by</span>
            <img 
              src="https://www.gstatic.com/images/branding/googlelogo/2x/googlelogo_color_74x24dp.png" 
              alt="Google"
              className="h-3"
            />
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="absolute right-10 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Mensagem se API não está configurada */}
      {!apiKey && (
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Configure VITE_GOOGLE_MAPS_API_KEY no arquivo .env para habilitar a busca de locais
        </p>
      )}
    </div>
  );
}
