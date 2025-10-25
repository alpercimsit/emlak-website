import { useState, useEffect, useRef } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';

// Smart dropdown positioning hook
function useSmartDropdownPosition(dropdownRef: React.RefObject<HTMLDivElement>) {
  const [dropdownDirection, setDropdownDirection] = useState<'down' | 'up'>('down');

  useEffect(() => {
    const calculateDirection = () => {
      if (!dropdownRef.current) return;

      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 300; // maxHeight of dropdown

      // Calculate space below and above
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If there's not enough space below (less than dropdown height + 20px padding)
      // and there's more space above, open upwards
      if (spaceBelow < dropdownHeight + 20 && spaceAbove > spaceBelow) {
        setDropdownDirection('up');
      } else {
        setDropdownDirection('down');
      }
    };

    // Calculate on mount and when dropdown opens
    calculateDirection();

    // Recalculate on window resize or scroll
    const handleResizeOrScroll = () => {
      calculateDirection();
    };

    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
  }, []);

  return dropdownDirection;
}

export interface FilterState {
  category: 'all' | 'arsa' | 'konut';
  subCategory: 'all' | 'satilik' | 'kiralik' | 'tarla' | 'bagYeri' | 'Hisse'; // konut ve arsa için alt kategori
  searchText: string;
  ilanNo: string;
  fiyatMin: string;
  fiyatMax: string;
  alanMin: string;
  alanMax: string;
  il: {id: number, name: string} | null;
  ilce: {id: number, name: string} | null;
  mahalle: {id: number, name: string} | null;
  // Arsa özel filtreleri
  adaNo: string;
  parselNo: string;
  // Konut özel filtreleri
  binaYaslari: string[];
  odaSayilari: string[];
  katlar: string[];
  // Kiralık/Satılık konut özel filtreleri
  balkon: string;
  asansor: string;
  esyali: string;
  // Admin-only filtreler
  sahibiAd: string;
  sahibiTel: string;
  sahibindenNo: string;
  sahibindenTarih: string;
  not: string;
  gizliIlanlar: string;
}

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
  isAdmin: boolean;
}

interface Province {
  id: number;
  name: string;
}

interface District {
  id: number;
  name: string;
}

interface Neighborhood {
  id: number;
  name: string;
}

interface ComboboxProps {
  options: Array<{id: number, name: string}>;
  value: {id: number, name: string} | null;
  onChange: (option: {id: number, name: string} | null) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

interface MultiSelectDropdownProps {
  options: string[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
}

// Combobox component for searchable dropdown
function Combobox({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
  loading = false
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Array<{id: number, name: string}>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownDirection = useSmartDropdownPosition(dropdownRef);

  // Normalize Turkish characters for consistent matching
  const normalizeTurkish = (str: string) => {
    const turkishCharMap: {[key: string]: string} = {
      'İ': 'i', 'I': 'ı', 'ı': 'i',
      'Ş': 's', 'ş': 's',
      'Ğ': 'g', 'ğ': 'g',
      'Ü': 'u', 'ü': 'u',
      'Ö': 'o', 'ö': 'o',
      'Ç': 'c', 'ç': 'c'
    };

    // First normalize Turkish characters, then convert to lowercase
    // This avoids the issue where "İstanbul".toLowerCase() becomes "i̇stanbul"
    let result = str;

    // Apply normalization multiple times to handle all Turkish characters
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      const newResult = result.split('').map(char => turkishCharMap[char] || char).join('');
      if (newResult === result) break;
      result = newResult;
      iterations++;
    }

    return result.toLowerCase();
  };

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const searchTermNormalized = normalizeTurkish(searchTerm);

      const filtered = options.filter(option => {
        const optionNameNormalized = normalizeTurkish(option.name);
        return optionNameNormalized.startsWith(searchTermNormalized);
      });

      // Sort filtered options: exact matches first, then partial matches
      const exactMatches = filtered.filter(option =>
        normalizeTurkish(option.name) === searchTermNormalized
      );
      const partialMatches = filtered.filter(option =>
        normalizeTurkish(option.name).startsWith(searchTermNormalized) &&
        normalizeTurkish(option.name) !== searchTermNormalized
      );

      // Combine exact matches first, then partial matches
      setFilteredOptions([...exactMatches, ...partialMatches]);

    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Set initial search term when value changes
  useEffect(() => {
    if (value) {
      setSearchTerm(value.name);
    } else {
      setSearchTerm('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // Clear selection if input is empty
    if (!newValue.trim()) {
      onChange(null);
    }
  };

  const handleOptionSelect = (option: {id: number, name: string}) => {
    setSelectedOptionId(option.id);
    onChange(option);
    setSearchTerm(option.name);

    // Close dropdown with animation after selection
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setSelectedOptionId(null);
    }, 300);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    // Start closing animation
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="combobox-container" style={{ position: 'relative' }} ref={dropdownRef}>
      <label className="filter-label">
        {label}
      </label>
      <div className="combobox-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="text"
          className="filter-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          style={{
            paddingRight: value ? '35px' : '15px',
            cursor: disabled ? 'not-allowed' : 'text'
          }}
        />
        {value && !disabled && (
          <button
            type="button"
            className="combobox-clear-btn"
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '2px'
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        {loading && (
          <div
            className="combobox-loading"
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '14px'
            }}
          >
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          className={`combobox-dropdown ${isClosing ? 'closing' : ''}`}
          style={{
            position: 'absolute',
            [dropdownDirection === 'up' ? 'bottom' : 'top']: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--border-color, #dee2e6)',
            borderRadius: '4px',
            boxShadow: dropdownDirection === 'up' ? '0 -2px 8px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 2000
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.id}
                className={`combobox-option ${selectedOptionId === option.id ? 'selected' : ''}`}
                onMouseDown={(e) => {
                  e.preventDefault(); // Bu satır input'un 'blur' olmasını engeller.
                  handleOptionSelect(option);
                }}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color, #f1f3f4)',
                  backgroundColor: value?.id === option.id ? 'var(--primary-color, #007bff)' : 'white',
                  color: value?.id === option.id ? 'white' : 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (value?.id !== option.id) {
                    e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value?.id !== option.id) {
                    e.currentTarget.style.backgroundColor = 'white';
                  }
                }}
              >
                {option.name}
              </div>
            ))
          ) : (
            <div
              className="combobox-no-results"
              style={{
                padding: '12px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '14px'
              }}
            >
              Sonuç bulunamadı
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// MultiSelectDropdown component for multiple selections
function MultiSelectDropdown({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownDirection = useSmartDropdownPosition(dropdownRef);

  // Normalize Turkish characters for consistent matching
  const normalizeTurkish = (str: string) => {
    const turkishCharMap: {[key: string]: string} = {
      'İ': 'i', 'I': 'ı', 'ı': 'i',
      'Ş': 's', 'ş': 's',
      'Ğ': 'g', 'ğ': 'g',
      'Ü': 'u', 'ü': 'u',
      'Ö': 'o', 'ö': 'o',
      'Ç': 'c', 'ç': 'c'
    };

    // Apply normalization multiple times to handle all Turkish characters
    let result = str;
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      const newResult = result.split('').map(char => turkishCharMap[char] || char).join('');
      if (newResult === result) break;
      result = newResult;
      iterations++;
    }

    return result.toLowerCase();
  };

  // Filter options based on search term
  const filteredOptions = searchTerm
    ? options.filter(option => {
        const optionNormalized = normalizeTurkish(option);
        const searchTermNormalized = normalizeTurkish(searchTerm);
        return optionNormalized.includes(searchTermNormalized);
      })
    : options;

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleInputBlur = () => {
    // Start closing animation
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 200);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
  };

  const handleOptionToggle = (option: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add selection animation
    setSelectedOption(option);

    if (value.includes(option)) {
      onChange(value.filter(item => item !== option));
    } else {
      onChange([...value, option]);
    }

    // Keep dropdown open for multiple selections with animation feedback
    setTimeout(() => {
      setSelectedOption(null);
    }, 300);
  };

  const handleRemoveValue = (optionToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(value.filter(item => item !== optionToRemove));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
    setSearchTerm('');
  };

  const displayText = value.length === 0
    ? placeholder
    : value.length === 1
    ? value[0]
    : `${value.length} seçenek seçildi`;

  return (
    <div className="filter-group" ref={dropdownRef}>
      <label className="filter-label">
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="filter-input"
          placeholder={displayText}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          disabled={disabled}
          style={{
            paddingRight: value.length > 0 ? '70px' : '40px',
            cursor: disabled ? 'not-allowed' : 'text',
            color: searchTerm ? 'inherit' : (value.length === 0 ? 'var(--text-muted)' : 'inherit')
          }}
        />

        {/* Selected values display */}
        {value.length > 0 && searchTerm === '' && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '8px',
              transform: 'translateY(-50%)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              pointerEvents: 'none'
            }}
          >
            {value.slice(0, 2).map(selectedValue => (
              <span
                key={selectedValue}
                style={{
                  backgroundColor: 'var(--primary-color, #007bff)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {selectedValue}
                <button
                  type="button"
                  onClick={(e) => handleRemoveValue(selectedValue, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    padding: '0',
                    marginLeft: '2px',
                    width: '12px',
                    height: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'auto'
                  }}
                >
                  ×
                </button>
              </span>
            ))}
            {value.length > 2 && (
              <span
                style={{
                  backgroundColor: 'var(--background-secondary, #f8f9fa)',
                  color: 'var(--text-muted)',
                  padding: '2px 6px',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              >
                +{value.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Right side buttons */}
        <div style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {value.length > 0 && searchTerm === '' && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
          <i
            className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
            style={{
              color: 'var(--text-muted)',
              fontSize: '12px'
            }}
          />
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div
            className={`multiselect-dropdown ${isClosing ? 'closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              [dropdownDirection === 'up' ? 'bottom' : 'top']: '100%',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '1px solid var(--border-color, #dee2e6)',
              borderRadius: '4px',
              boxShadow: dropdownDirection === 'up' ? '0 -4px 16px rgba(0,0,0,0.15)' : '0 4px 16px rgba(0,0,0,0.15)',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 2000
            }}
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option}
                  className={`multiselect-option ${selectedOption === option ? 'selected' : ''}`}
                  onClick={(e) => handleOptionToggle(option, e)}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color, #f1f3f4)',
                    backgroundColor: value.includes(option) ? 'var(--primary-color, #007bff)' : 'white',
                    color: value.includes(option) ? 'white' : 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}
                  onMouseEnter={(e) => {
                    if (!value.includes(option)) {
                      e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!value.includes(option)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={value.includes(option)}
                    onChange={() => {}}
                    style={{ margin: 0 }}
                  />
                  {option}
                </div>
              ))
            ) : (
              <div
                className="multiselect-no-results"
                style={{
                  padding: '12px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px'
                }}
              >
                Sonuç bulunamadı
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Property filters component for rental and sale housing
function PropertyFilters({ filters, onFiltersChange }: { filters: FilterState; onFiltersChange: (filters: FilterState) => void }) {
  const [balkonOpen, setBalkonOpen] = useState(false);
  const [balkonClosing, setBalkonClosing] = useState(false);
  const [asansorOpen, setAsansorOpen] = useState(false);
  const [asansorClosing, setAsansorClosing] = useState(false);
  const [esyaliOpen, setEsyaliOpen] = useState(false);
  const [esyaliClosing, setEsyaliClosing] = useState(false);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Only close if clicking outside of all property filter dropdowns
      if (!target.closest('.property-filter-dropdown')) {
        if (balkonOpen) {
          setBalkonClosing(true);
          setTimeout(() => {
            setBalkonOpen(false);
            setBalkonClosing(false);
          }, 200);
        }
        if (asansorOpen) {
          setAsansorClosing(true);
          setTimeout(() => {
            setAsansorOpen(false);
            setAsansorClosing(false);
          }, 200);
        }
        if (esyaliOpen) {
          setEsyaliClosing(true);
          setTimeout(() => {
            setEsyaliOpen(false);
            setEsyaliClosing(false);
          }, 200);
        }
      }
    };

    if (balkonOpen || asansorOpen || esyaliOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [balkonOpen, asansorOpen, esyaliOpen]);

  const balkonOptions = ['Tümü', 'Var', 'Yok'];
  const asansorOptions = ['Tümü', 'Var', 'Yok'];
  const esyaliOptions = ['Tümü', 'Eşyalı', 'Eşyasız'];

  const handleBalkonChange = (value: string) => {
    onFiltersChange({ ...filters, balkon: value });
    setBalkonClosing(true);
    setTimeout(() => {
      setBalkonOpen(false);
      setBalkonClosing(false);
    }, 200);
  };

  const handleAsansorChange = (value: string) => {
    onFiltersChange({ ...filters, asansor: value });
    setAsansorClosing(true);
    setTimeout(() => {
      setAsansorOpen(false);
      setAsansorClosing(false);
    }, 200);
  };

  const handleEsyaliChange = (value: string) => {
    onFiltersChange({ ...filters, esyali: value });
    setEsyaliClosing(true);
    setTimeout(() => {
      setEsyaliOpen(false);
      setEsyaliClosing(false);
    }, 200);
  };

  return (
    <div className="filter-group">
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'flex-end' }}>
        {/* Balkon Filter */}
        <div style={{ flex: 1 }}>
          <label className="filter-label">Balkon</label>
          <div style={{ position: 'relative' }} className="property-filter-dropdown">
            <button
              type="button"
              className="filter-input"
              onClick={(e) => {
                e.stopPropagation();
                setBalkonOpen(!balkonOpen);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color, #dee2e6)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.balkon ? 'inherit' : 'var(--text-muted)' }}>
                {filters.balkon || 'Tümü'}
              </span>
              <i className={`fas fa-chevron-${balkonOpen ? 'up' : 'down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>
            {balkonOpen && (
              <div
                className={balkonClosing ? 'closing' : ''}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color, #dee2e6)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  marginTop: '2px'
                }}
              >
                {balkonOptions.map(option => (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBalkonChange(option);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color, #f1f3f4)',
                      backgroundColor: filters.balkon === option ? 'var(--primary-color, #007bff)' : 'white',
                      color: filters.balkon === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.balkon !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filters.balkon !== option) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Asansör Filter */}
        <div style={{ flex: 1 }}>
          <label className="filter-label">Asansör</label>
          <div style={{ position: 'relative' }} className="property-filter-dropdown">
            <button
              type="button"
              className="filter-input"
              onClick={(e) => {
                e.stopPropagation();
                setAsansorOpen(!asansorOpen);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color, #dee2e6)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.asansor ? 'inherit' : 'var(--text-muted)' }}>
                {filters.asansor || 'Tümü'}
              </span>
              <i className={`fas fa-chevron-${asansorOpen ? 'up' : 'down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>
            {asansorOpen && (
              <div
                className={asansorClosing ? 'closing' : ''}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color, #dee2e6)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  marginTop: '2px'
                }}
              >
                {asansorOptions.map(option => (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAsansorChange(option);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color, #f1f3f4)',
                      backgroundColor: filters.asansor === option ? 'var(--primary-color, #007bff)' : 'white',
                      color: filters.asansor === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.asansor !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filters.asansor !== option) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Eşyalı Filter */}
        <div style={{ flex: 1 }}>
          <label className="filter-label">Eşyalı</label>
          <div style={{ position: 'relative' }} className="property-filter-dropdown">
            <button
              type="button"
              className="filter-input"
              onClick={(e) => {
                e.stopPropagation();
                setEsyaliOpen(!esyaliOpen);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color, #dee2e6)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.esyali ? 'inherit' : 'var(--text-muted)' }}>
                {filters.esyali || 'Tümü'}
              </span>
              <i className={`fas fa-chevron-${esyaliOpen ? 'up' : 'down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>
            {esyaliOpen && (
              <div
                className={esyaliClosing ? 'closing' : ''}
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color, #dee2e6)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  marginTop: '2px'
                }}
              >
                {esyaliOptions.map(option => (
                  <div
                    key={option}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEsyaliChange(option);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color, #f1f3f4)',
                      backgroundColor: filters.esyali === option ? 'var(--primary-color, #007bff)' : 'white',
                      color: filters.esyali === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.esyali !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (filters.esyali !== option) {
                        e.currentTarget.style.backgroundColor = 'white';
                      }
                    }}
                  >
                    {option}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterPanel({ filters, onFiltersChange, totalCount, isAdmin }: Props) {
  const [showKonutSubmenu, setShowKonutSubmenu] = useState(false);
  const [showArsaSubmenu, setShowArsaSubmenu] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    neighborhoods: false
  });

  // Load provinces on component mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(prev => ({ ...prev, provinces: true }));
      try {
        const provincesData = await api.getProvinces();
        setProvinces(provincesData);
      } catch (error) {
        console.error('Error loading provinces:', error);
      } finally {
        setLoading(prev => ({ ...prev, provinces: false }));
      }
    };

    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (filters.il) {
      setLoading(prev => ({ ...prev, districts: true }));
      setDistricts([]);
      api.getDistricts(filters.il.id)
        .then(districtsData => {
          setDistricts(districtsData);
        })
        .catch(error => {
          console.error('Error loading districts:', error);
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, districts: false }));
        });
    } else {
      setDistricts([]);
      onFiltersChange({ ...filters, ilce: null, mahalle: null });
    }
  }, [filters.il, onFiltersChange]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (filters.ilce) {
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      setNeighborhoods([]);
      api.getNeighborhoods(filters.ilce.id)
        .then(neighborhoodsData => {
          setNeighborhoods(neighborhoodsData);
        })
        .catch(error => {
          console.error('Error loading neighborhoods:', error);
        })
        .finally(() => {
          setLoading(prev => ({ ...prev, neighborhoods: false }));
        });
    } else {
      setNeighborhoods([]);
      onFiltersChange({ ...filters, mahalle: null });
    }
  }, [filters.ilce, onFiltersChange]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleArrayFilterToggle = (key: 'binaYaslari' | 'odaSayilari' | 'katlar', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];

    onFiltersChange({ ...filters, [key]: newArray });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: 'all',
      subCategory: 'all',
      searchText: '',
      ilanNo: '',
      fiyatMin: '',
      fiyatMax: '',
      alanMin: '',
      alanMax: '',
      il: null,
      ilce: null,
      mahalle: null,
      adaNo: '',
      parselNo: '',
      binaYaslari: [],
      odaSayilari: [],
      katlar: [],
      balkon: '',
      asansor: '',
      esyali: '',
      sahibiAd: '',
      sahibiTel: '',
      sahibindenNo: '',
      sahibindenTarih: '',
      not: '',
      gizliIlanlar: ''
    });
  };

  const binaYasiOptions = ['0','1','2','3','4','5', '6-10 arası', '11-15 arası', '16-20 arası', '21-25 arası', '26-30 arası', '31 ve üzeri'];
  const odaSayisiOptions = ['Stüdyo (1+0)', '1+1', '2+1', '2+2', '3+1', '3+2', '4+1', '4+2', '4+3', '4+4', '5+1', '5+2', '5+3', '6+1', '6+2', '6+3', '7+1', '7+2', '7+3', '8+1', '8+2', '8+3', '9+1', '9+2', '9+3'];
  const katOptions = [
    'Bodrum Kat',
    'Zemin Kat',
    'Giriş Katı',
    'Yüksek Giriş',
    'Bahçe Katı',
    'Çatı Katı',
    'Teras',
    'Müstakil',
    'Villa Tipi',
    'Kot 1',
    'Kot 2',
    'Kot 3',
    'Kot 4',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29',
    '30 ve Üzeri',
  ];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>
          <i className="fas fa-filter" style={{ marginRight: 'var(--spacing-sm)' }}></i>
          İlan Filtreleme
        </h3>
      </div>

      {/* Kategori Seçimi */}
      <div className="filter-section">
        <div className={`category-buttons ${filters.category === 'konut' ? 'konut-active' : filters.category === 'arsa' ? 'arsa-active' : ''}`}>
          <div
            className="category-button-wrapper"
            onMouseEnter={() => setShowArsaSubmenu(true)}
            onMouseLeave={() => setShowArsaSubmenu(false)}
          >
            <button
              className={`category-btn ${filters.category === 'arsa' ? 'active' : ''}`}
              onClick={() => {
                onFiltersChange({ ...filters, category: 'arsa', subCategory: 'all' });
              }}
            >
              <i className="fas fa-map"></i>
              Arsa
            </button>
            {showArsaSubmenu && (
              <div className="submenu">
                <button
                  className={`submenu-btn ${filters.subCategory === 'tarla' ? 'active' : ''}`}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: 'arsa', subCategory: 'tarla' });
                  }}
                >
                  Tarla
                </button>
                <button
                  className={`submenu-btn ${filters.subCategory === 'bagYeri' ? 'active' : ''}`}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: 'arsa', subCategory: 'bagYeri' });
                  }}
                >
                  Bağ Yeri
                </button>
                <button
                  className={`submenu-btn ${filters.subCategory === 'Hisse' ? 'active' : ''}`}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: 'arsa', subCategory: 'Hisse' });
                  }}
                >
                  Hisse
                </button>
              </div>
            )}
          </div>

          <div
            className="category-button-wrapper"
            onMouseEnter={() => setShowKonutSubmenu(true)}
            onMouseLeave={() => setShowKonutSubmenu(false)}
          >
            <button
              className={`category-btn ${filters.category === 'konut' ? 'active' : ''}`}
              onClick={() => {
                onFiltersChange({ ...filters, category: 'konut', subCategory: 'all' });
              }}
            >
              <i className="fas fa-home"></i>
              Konut
            </button>
            {showKonutSubmenu && (
              <div className="submenu">
                <button
                  className={`submenu-btn ${filters.subCategory === 'satilik' ? 'active' : ''}`}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: 'konut', subCategory: 'satilik' });
                  }}
                >
                  Satılık
                </button>
                <button
                  className={`submenu-btn ${filters.subCategory === 'kiralik' ? 'active' : ''}`}
                  onClick={() => {
                    onFiltersChange({ ...filters, category: 'konut', subCategory: 'kiralik' });
                  }}
                >
                  Kiralık
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Arama Filtreleri */}
      <div className="filter-section">
        {/* İçerik Arama */}
        <div className="filter-group">
          <label className="filter-label">
            İlan Arama
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="Başlık, açıklama içinde ara..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
          />
        </div>

        {/* İlan No Arama */}
        <div className="filter-group">
          <label className="filter-label">
            İlan No
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="İlan numarası"
            value={filters.ilanNo}
            onChange={(e) => handleFilterChange('ilanNo', e.target.value)}
          />
        </div>

        {/* Fiyat Aralığı */}
        <div className="filter-group">
          <label className="filter-label">
            Fiyat (TL)
          </label>
          <div className="range-inputs">
            <input
              type="number"
              className="filter-input"
              placeholder="Minimum"
              value={filters.fiyatMin}
              onChange={(e) => handleFilterChange('fiyatMin', e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Maksimum"
              value={filters.fiyatMax}
              onChange={(e) => handleFilterChange('fiyatMax', e.target.value)}
            />
          </div>
        </div>

        {/* Alan Aralığı */}
        <div className="filter-group">
          <label className="filter-label">
            Alan (m²)
          </label>
          <div className="range-inputs">
            <input
              type="number"
              className="filter-input"
              placeholder="Minimum"
              value={filters.alanMin}
              onChange={(e) => handleFilterChange('alanMin', e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Maksimum"
              value={filters.alanMax}
              onChange={(e) => handleFilterChange('alanMax', e.target.value)}
            />
          </div>
        </div>

        {/* Konum Filtreleri */}
        <div className="filter-group">
          <label className="filter-label">
            Konum
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Combobox
              options={provinces}
              value={filters.il}
              onChange={(value) => handleFilterChange('il', value)}
              placeholder="İl"
              label=""
              disabled={loading.provinces}
              loading={loading.provinces}
            />

            <Combobox
              options={districts}
              value={filters.ilce}
              onChange={(value) => handleFilterChange('ilce', value)}
              placeholder="İlçe"
              label=""
              disabled={!filters.il || loading.districts || districts.length === 0}
              loading={loading.districts}
            />

            <Combobox
              options={neighborhoods}
              value={filters.mahalle}
              onChange={(value) => handleFilterChange('mahalle', value)}
              placeholder="Mahalle"
              label=""
              disabled={!filters.ilce || loading.neighborhoods || neighborhoods.length === 0}
              loading={loading.neighborhoods}
            />
          </div>
        </div>

        {/* Arsa Özel Filtreleri */}
        {filters.category === 'arsa' && (
          <>
            {/* Ada No ve Parsel No - Yan yana */}
            <div className="filter-group">
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Ada No
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Ada numarası..."
                    value={filters.adaNo}
                    onChange={(e) => handleFilterChange('adaNo', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Parsel No
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Parsel numarası..."
                    value={filters.parselNo}
                    onChange={(e) => handleFilterChange('parselNo', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Konut Özel Filtreleri */}
        {filters.category === 'konut' && (
          <>
            {/* Bina Yaşı */}
            <MultiSelectDropdown
              options={binaYasiOptions}
              value={filters.binaYaslari}
              onChange={(values) => handleFilterChange('binaYaslari', values)}
              placeholder="Bina yaşı seçin..."
              label="Bina Yaşı"
            />

            {/* Oda Sayısı */}
            <MultiSelectDropdown
              options={odaSayisiOptions}
              value={filters.odaSayilari}
              onChange={(values) => handleFilterChange('odaSayilari', values)}
              placeholder="Oda sayısı seçin..."
              label="Oda Sayısı"
            />

            {/* Kat */}
            <MultiSelectDropdown
              options={katOptions}
              value={filters.katlar}
              onChange={(values) => handleFilterChange('katlar', values)}
              placeholder="Bulunduğu kat seçin..."
              label="Bulunduğu Kat"
            />

            {/* Kiralık/Satılık Konut Özel Filtreleri */}
            {(filters.category === 'konut') && (
              <PropertyFilters filters={filters} onFiltersChange={onFiltersChange} />
            )}
          </>
        )}

        {/* Admin-only Filtreler */}
        {isAdmin && (
          <>
            {/* Admin Filtreleri Başlığı */}
            <br />
            <div style={{ marginBottom: 'var(--spacing-sm)' }}>
              <h4 style={{
                color: 'var(--primary-color)',
                marginBottom: 'var(--spacing-sm)',
                fontSize: '14px',
                borderBottom: '1px solid var(--primary-color)',
                paddingBottom: '8px'
              }}>
                <i className="fas fa-user-shield" style={{ marginRight: 'var(--spacing-xs)' }}></i>
                Admin Filtreleri
              </h4>
            </div>

            {/* Sahibi Adı ve Sahibi Telefon - Yan yana */}
            <div className="filter-group">
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Sahibi Adı
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Sahibi adı ile ara..."
                    value={filters.sahibiAd}
                    onChange={(e) => handleFilterChange('sahibiAd', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Sahibi Telefon
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Sahibi telefon ile ara..."
                    value={filters.sahibiTel}
                    onChange={(e) => handleFilterChange('sahibiTel', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Sahibinden No ve Sahibinden Tarih - Yan yana */}
            <div className="filter-group">
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Sahibinden No
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Sahibinden numarası..."
                    value={filters.sahibindenNo}
                    onChange={(e) => handleFilterChange('sahibindenNo', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Sahibinden Tarih
                  </label>
                  <input
                    type="date"
                    className="filter-input"
                    value={filters.sahibindenTarih}
                    onChange={(e) => handleFilterChange('sahibindenTarih', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Not ve Gizli İlanlar - Yan yana (not daha geniş) */}
            <div className="filter-group">
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label className="filter-label">
                    Not
                  </label>
                  <input
                    type="text"
                    className="filter-input"
                    placeholder="Not içeriği ile ara..."
                    value={filters.not}
                    onChange={(e) => handleFilterChange('not', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="filter-label">
                    Gizli İlanlar
                  </label>
                  <select
                    className="filter-input"
                    value={filters.gizliIlanlar}
                    onChange={(e) => handleFilterChange('gizliIlanlar', e.target.value)}
                  >
                    <option value="">Tümü</option>
                    <option value="gizli">Sadece Gizli</option>
                    <option value="acik">Sadece Açık</option>
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Temizle Butonu */}
        <div className="filter-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={clearFilters}
          >
            <i className="fas fa-eraser"></i>
            Filtreleri Temizle
          </button>
        </div>
      </div>
    </div>
  );
}

export default FilterPanel;
