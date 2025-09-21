import { useState, useEffect } from 'react';
import { Listing } from '../pages/ListingsPage';
import api from '../utils/api';

export interface FilterState {
  category: 'arsa' | 'konut';
  subCategory: 'all' | 'satilik' | 'kiralik'; // konut için alt kategori
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
}

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  totalCount: number;
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Array<{id: number, name: string}>>([]);

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
    // Delay closing to allow option click
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  return (
    <div className="combobox-container" style={{ position: 'relative' }}>
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
          className="combobox-dropdown"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid var(--border-color, #dee2e6)',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => (
              <div
                key={option.id}
                className="combobox-option"
                onClick={() => handleOptionSelect(option)}
                style={{
                  padding: '6px 10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border-color, #f1f3f4)',
                  backgroundColor: value?.id === option.id ? 'var(--primary-color, #007bff)' : 'white',
                  color: value?.id === option.id ? 'white' : 'inherit',
                  fontSize: '14px'
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

function FilterPanel({ filters, onFiltersChange, totalCount }: Props) {
  const [showKonutSubmenu, setShowKonutSubmenu] = useState(false);
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
      category: 'arsa',
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
      katlar: []
    });
  };

  const binaYasiOptions = ['0-5 yıl', '6-10 yıl', '11-15 yıl', '16-20 yıl', '21+ yıl'];
  const odaSayisiOptions = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1', '6+1'];
  const katOptions = ['Bodrum', 'Zemin', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'];

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>
          <i className="fas fa-filter" style={{ marginRight: 'var(--spacing-sm)' }}></i>
          İlan Filtreleme
        </h3>
        <div className="filter-count" style={{ display: 'none' }}>
          Bulunan Kayıt: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Kategori Seçimi */}
      <div className="filter-section">
        <div className={`category-buttons ${filters.category === 'konut' ? 'konut-active' : ''}`}>
          <div className="category-button-wrapper">
            <button
              className={`category-btn ${filters.category === 'arsa' ? 'active' : ''}`}
              onClick={() => {
                onFiltersChange({ ...filters, category: 'arsa', subCategory: 'all' });
              }}
            >
              <i className="fas fa-map"></i>
              Arsa
            </button>
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
            <i className="fas fa-search"></i>
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
            <i className="fas fa-hashtag"></i>
            İlan No
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="İlan numarası..."
            value={filters.ilanNo}
            onChange={(e) => handleFilterChange('ilanNo', e.target.value)}
          />
        </div>

        {/* Fiyat Aralığı */}
        <div className="filter-group">
          <label className="filter-label">
            <i className="fas fa-lira-sign"></i>
            Fiyat Aralığı
          </label>
          <div className="range-inputs">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={filters.fiyatMin}
              onChange={(e) => handleFilterChange('fiyatMin', e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Maks"
              value={filters.fiyatMax}
              onChange={(e) => handleFilterChange('fiyatMax', e.target.value)}
            />
          </div>
        </div>

        {/* Alan Aralığı */}
        <div className="filter-group">
          <label className="filter-label">
            <i className="fas fa-expand"></i>
            Alan (m²)
          </label>
          <div className="range-inputs">
            <input
              type="number"
              className="filter-input"
              placeholder="Min"
              value={filters.alanMin}
              onChange={(e) => handleFilterChange('alanMin', e.target.value)}
            />
            <span>-</span>
            <input
              type="number"
              className="filter-input"
              placeholder="Maks"
              value={filters.alanMax}
              onChange={(e) => handleFilterChange('alanMax', e.target.value)}
            />
          </div>
        </div>

        {/* Konum Filtreleri */}
        <div className="filter-group">
          <label className="filter-label">
            <i className="fas fa-map-marker-alt"></i>
            Adres
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
            {/* Ada No */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-map"></i>
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

            {/* Parsel No */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-map-pin"></i>
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
          </>
        )}

        {/* Konut Özel Filtreleri */}
        {filters.category === 'konut' && (
          <>
            {/* Bina Yaşı */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-calendar"></i>
                Bina Yaşı
              </label>
              <div className="checkbox-group">
                {binaYasiOptions.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.binaYaslari.includes(option)}
                      onChange={() => handleArrayFilterToggle('binaYaslari', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Oda Sayısı */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-bed"></i>
                Oda Sayısı
              </label>
              <div className="checkbox-group">
                {odaSayisiOptions.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.odaSayilari.includes(option)}
                      onChange={() => handleArrayFilterToggle('odaSayilari', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Kat */}
            <div className="filter-group">
              <label className="filter-label">
                <i className="fas fa-layer-group"></i>
                Bulunduğu Kat
              </label>
              <div className="checkbox-group">
                {katOptions.map(option => (
                  <label key={option} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.katlar.includes(option)}
                      onChange={() => handleArrayFilterToggle('katlar', option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
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
