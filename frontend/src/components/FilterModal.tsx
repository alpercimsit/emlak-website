import { useState, useEffect, useRef } from 'react';
import { FilterState } from '../components/FilterPanel';
import api from '../utils/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
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

// Simplified Combobox for mobile modal
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Array<{id: number, name: string}>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
  useEffect(() => {
    if (searchTerm) {
      const searchTermNormalized = normalizeTurkish(searchTerm);

      const filtered = options.filter(option => {
        const optionNameNormalized = normalizeTurkish(option.name);
        return optionNameNormalized.includes(searchTermNormalized);
      });

      setFilteredOptions(filtered);
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
    onChange(option);
    setSearchTerm(option.name);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="filter-group" style={{ position: 'relative' }} ref={dropdownRef}>
      <label className="filter-label">
        {label}
      </label>
      <div style={{ position: 'relative' }}>
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
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--border-color)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxHeight: '200px',
            overflowY: 'auto',
            zIndex: 2000,
            marginTop: '2px'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color)',
                  backgroundColor: value?.id === option.id ? 'var(--primary-color)' : 'white',
                  color: value?.id === option.id ? 'white' : 'inherit',
                  fontSize: '13px',
                  lineHeight: '1.4'
                }}
                onMouseEnter={(e) => {
                  if (value?.id !== option.id) {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
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

// Property filters component for rental and sale housing
function PropertyFilters({ filters, onFiltersChange }: { filters: FilterState; onFiltersChange: (filters: FilterState) => void }) {
  // 1. Hangi dropdown'ın açık olduğunu takip etmek için state ekleyin
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const balkonOptions = ['Tümü', 'Var', 'Yok'];
  const asansorOptions = ['Tümü', 'Var', 'Yok'];
  const esyaliOptions = ['Tümü', 'Eşyalı', 'Eşyasız'];

  const handleBalkonChange = (value: string) => {
    onFiltersChange({ ...filters, balkon: value });
    setOpenDropdown(null); // 4. Seçim sonrası dropdown'ı kapat
  };

  const handleAsansorChange = (value: string) => {
    onFiltersChange({ ...filters, asansor: value });
    setOpenDropdown(null); // 4. Seçim sonrası dropdown'ı kapat
  };

  const handleEsyaliChange = (value: string) => {
    onFiltersChange({ ...filters, esyali: value });
    setOpenDropdown(null); // 4. Seçim sonrası dropdown'ı kapat
  };

  // Helper fonksiyonu dropdown'ları açıp kapatmak için
  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => (prev === name ? null : name));
  };

  return (
    <div className="filter-group">
      <div style={{ display: 'flex', flexDirection: 'row', gap: 'var(--spacing-md)', alignItems: 'flex-start' }}>
        
        {/* Balkon Filter */}
        <div style={{ flex: 1 }}>
          <label className="filter-label">Balkon</label>
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="filter-input"
              onClick={() => toggleDropdown('balkon')}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.balkon ? 'inherit' : 'var(--text-muted)' }}>
                {filters.balkon || 'Tümü'}
              </span>
              <i className={`fas ${openDropdown === 'balkon' ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>
            
            {openDropdown === 'balkon' && (
              <div
                style={{
                  position: 'absolute',
                  // DEĞİŞİKLİK: Dropdown'ı yukarı açmak için 'top' yerine 'bottom'
                  bottom: '100%', 
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  // DEĞİŞİKLİK: 'marginTop' yerine 'marginBottom'
                  marginBottom: '2px' 
                }}
              >
                {balkonOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => handleBalkonChange(option)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: filters.balkon === option ? 'var(--primary-color)' : 'white',
                      color: filters.balkon === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.balkon !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
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
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="filter-input"
              onClick={() => toggleDropdown('asansor')}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.asansor ? 'inherit' : 'var(--text-muted)' }}>
                {filters.asansor || 'Tümü'}
              </span>
              <i className={`fas ${openDropdown === 'asansor' ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>
            
            {openDropdown === 'asansor' && (
              <div
                style={{
                  position: 'absolute',
                  // DEĞİŞİKLİK: Dropdown'ı yukarı açmak için 'top' yerine 'bottom'
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  // DEĞİŞİKLİK: 'marginTop' yerine 'marginBottom'
                  marginBottom: '2px'
                }}
              >
                {asansorOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => handleAsansorChange(option)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: filters.asansor === option ? 'var(--primary-color)' : 'white',
                      color: filters.asansor === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.asansor !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
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
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="filter-input"
              onClick={() => toggleDropdown('esyali')}
              style={{
                width: '100%',
                textAlign: 'left',
                cursor: 'pointer',
                backgroundColor: 'white',
                padding: '8px 12px',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: filters.esyali ? 'inherit' : 'var(--text-muted)' }}>
                {filters.esyali || 'Tümü'}
              </span>
              <i className={`fas ${openDropdown === 'esyali' ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ fontSize: '12px', color: 'var(--text-muted)' }}></i>
            </button>

            {openDropdown === 'esyali' && (
              <div
                style={{
                  position: 'absolute',
                  // DEĞİŞİKLİK: Dropdown'ı yukarı açmak için 'top' yerine 'bottom'
                  bottom: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1000,
                  // DEĞİŞİKLİK: 'marginTop' yerine 'marginBottom'
                  marginBottom: '2px'
                }}
              >
                {esyaliOptions.map(option => (
                  <div
                    key={option}
                    onClick={() => handleEsyaliChange(option)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: filters.esyali === option ? 'var(--primary-color)' : 'white',
                      color: filters.esyali === option ? 'white' : 'inherit',
                      fontSize: '13px'
                    }}
                    onMouseEnter={(e) => {
                      if (filters.esyali !== option) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
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

function FilterModal({ isOpen, onClose, filters, onFiltersChange, totalCount, isAdmin }: Props) {
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

  // Track if mouse was pressed inside modal
  const [mouseDownInside, setMouseDownInside] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if mouse was not pressed inside modal
    if (!mouseDownInside) {
      onClose();
    }
    setMouseDownInside(false);
  };

  // Handle mouse down to track where the click started
  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    setMouseDownInside(modalContentRef.current?.contains(e.target as Node) || false);
  };

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

    if (isOpen) {
      loadProvinces();
    }
  }, [isOpen]);

  // Load districts when province changes
  useEffect(() => {
    if (filters.il && isOpen) {
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
  }, [filters.il, onFiltersChange, isOpen]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (filters.ilce && isOpen) {
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
  }, [filters.ilce, onFiltersChange, isOpen]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} onMouseDown={handleOverlayMouseDown}>
      <div ref={modalContentRef} className="modal-content filter-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '20px' }}>
            <i className="fas fa-filter" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            Filtreler
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={clearFilters}
              style={{ fontSize: '0.8rem', padding: 'calc(var(--spacing-xs)) var(--spacing-sm)' }}
            >
              <i className="fas fa-eraser" style={{ marginRight: 'calc(var(--spacing-xs))' }}></i>
              Temizle
            </button>
            <button
              className="modal-close"
              onClick={onClose}
              type="button"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div className="modal-body filter-modal-body">
          {/* Kategori Seçimi */}
          <div className="filter-section" style={{ padding: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
            <div className={`category-buttons ${filters.category === 'konut' ? 'konut-active' : filters.category === 'arsa' ? 'arsa-active' : ''}`}>
              <div style={{ display: 'flex', width: '100%' }}>
                <div
                  className="category-button-wrapper"
                  style={{ flex: 1, position: 'relative' }}
                  onMouseEnter={() => setShowArsaSubmenu(true)}
                  onMouseLeave={() => setShowArsaSubmenu(false)}
                >
                  <button
                    className={`category-btn ${filters.category === 'arsa' || filters.category === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      onFiltersChange({ ...filters, category: 'arsa', subCategory: 'all' });
                    }}
                    style={{ width: '100%', justifyContent: 'center', padding: 'var(--spacing-sm)' }}
                  >
                    <i className="fas fa-map"></i>
                    Arsa
                  </button>
                  {showArsaSubmenu && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + var(--spacing-xs))',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 100,
                      opacity: 1,
                      transform: 'translateY(0) scale(1)',
                      overflow: 'hidden'
                    }}>
                      <button
                        className={`submenu-btn ${filters.subCategory === 'tarla' ? 'active' : ''}`}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: 'arsa', subCategory: 'tarla' });
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Tarla
                      </button>
                      <button
                        className={`submenu-btn ${filters.subCategory === 'bagYeri' ? 'active' : ''}`}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: 'arsa', subCategory: 'bagYeri' });
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Bağ Yeri
                      </button>
                      <button
                        className={`submenu-btn ${filters.subCategory === 'Hisse' ? 'active' : ''}`}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: 'arsa', subCategory: 'Hisse' });
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Hisse
                      </button>
                    </div>
                  )}
                </div>

                <div
                  className="category-button-wrapper"
                  style={{ flex: 1, position: 'relative' }}
                  onMouseEnter={() => setShowKonutSubmenu(true)}
                  onMouseLeave={() => setShowKonutSubmenu(false)}
                >
                  <button
                    className={`category-btn ${filters.category === 'konut' || filters.category === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      onFiltersChange({ ...filters, category: 'konut', subCategory: 'all' });
                    }}
                    style={{ width: '100%', justifyContent: 'center', padding: 'var(--spacing-sm)' }}
                  >
                    <i className="fas fa-home"></i>
                    Konut
                  </button>
                  {showKonutSubmenu && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + var(--spacing-xs))',
                      left: 0,
                      right: 0,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      zIndex: 100,
                      opacity: 1,
                      transform: 'translateY(0) scale(1)',
                      overflow: 'hidden'
                    }}>
                      <button
                        className={`submenu-btn ${filters.subCategory === 'satilik' ? 'active' : ''}`}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: 'konut', subCategory: 'satilik' });
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Satılık
                      </button>
                      <button
                        className={`submenu-btn ${filters.subCategory === 'kiralik' ? 'active' : ''}`}
                        onClick={() => {
                          onFiltersChange({ ...filters, category: 'konut', subCategory: 'kiralik' });
                        }}
                        style={{ width: '100%', justifyContent: 'center' }}
                      >
                        Kiralık
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Arama Filtreleri */}
          <div className="filter-section" style={{ padding: 'var(--spacing-sm)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Min"
                  value={filters.fiyatMin}
                  onChange={(e) => handleFilterChange('fiyatMin', e.target.value)}
                  style={{ flex: 1 }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Max"
                  value={filters.fiyatMax}
                  onChange={(e) => handleFilterChange('fiyatMax', e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            {/* Alan Aralığı */}
            <div className="filter-group">
              <label className="filter-label">
                Alan (m²)
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Min"
                  value={filters.alanMin}
                  onChange={(e) => handleFilterChange('alanMin', e.target.value)}
                  style={{ flex: 1 }}
                />
                <span>-</span>
                <input
                  type="number"
                  className="filter-input"
                  placeholder="Max"
                  value={filters.alanMax}
                  onChange={(e) => handleFilterChange('alanMax', e.target.value)}
                  style={{ flex: 1 }}
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
            )}

            {/* Konut Özel Filtreleri */}
            {filters.category === 'konut' && (
              <>
                {/* Kiralık/Satılık Konut Özel Filtreleri */}
                {(filters.category === 'konut') && (
                  <PropertyFilters filters={filters} onFiltersChange={onFiltersChange} />
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

export default FilterModal;
