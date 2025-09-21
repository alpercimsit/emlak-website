import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';


interface Props {
  onLocationChange?: (location: {il: string, ilce: string, mahalle: string}) => void;
  initialLocation?: {il: string, ilce: string, mahalle: string};
  className?: string;
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
  value: string | undefined | null;
  onChange: (value: string | null | undefined) => void;
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

  // Set initial search term when value changes
  useEffect(() => {
    if (value && value !== searchTerm) {
      setSearchTerm(value);
    } else if (!value && searchTerm) {
      setSearchTerm('');
    }
  }, [value]); // Include value in dependency array

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);

    // Clear selection if input is empty
    if (!newValue.trim()) {
      onChange(null);
    }
  };

  const handleOptionSelect = (option: {id: number, name: string}) => {
    onChange(option.name);
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
      <label className="form-label">
        <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
        {label}
      </label>
      <div className="combobox-input-wrapper" style={{ position: 'relative' }}>
        <input
          type="text"
          className="form-control"
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
          {(() => {
            const filtered = searchTerm
              ? options.filter(option =>
                  option.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
              : options;
            return filtered.length > 0 ? (
              filtered.map(option => (
                <div
                  key={option.id}
                  className="combobox-option"
                  onClick={() => handleOptionSelect(option)}
                  style={{
                    padding: '6px 10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color, #f1f3f4)',
                    backgroundColor: value === option.name ? 'var(--primary-color, #007bff)' : 'white',
                    color: value === option.name ? 'white' : 'inherit',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => {
                    if (value !== option.name) {
                      e.currentTarget.style.backgroundColor = 'var(--background-secondary, #f8f9fa)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== option.name) {
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
            );
          })()}
        </div>
      )}
    </div>
  );
}

function LocationSelector({ onLocationChange, initialLocation, className = '' }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    neighborhoods: false
  });

  // String values for location
  const [il, setIl] = useState<string>('');
  const [ilce, setIlce] = useState<string>('');
  const [mahalle, setMahalle] = useState<string>('');

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

  // Load all location data once on component mount
  useEffect(() => {
    const loadAllLocationData = async () => {
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

    loadAllLocationData();
  }, []); // Only run once on mount

  // Load districts when province changes
  useEffect(() => {
    if (il) {
      setLoading(prev => ({ ...prev, districts: true }));
      setDistricts([]);

      const province = provinces.find(p => p.name === il);
      if (province) {
        api.getDistricts(province.id)
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
        setLoading(prev => ({ ...prev, districts: false }));
      }
    } else {
      setDistricts([]);
      setLoading(prev => ({ ...prev, districts: false }));
    }
  }, [il, provinces]); // Include provinces since it's used inside

  // Load neighborhoods when district changes
  useEffect(() => {
    if (ilce) {
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      setNeighborhoods([]);

      const district = districts.find(d => d.name === ilce);
      if (district) {
        api.getNeighborhoods(district.id)
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
        setLoading(prev => ({ ...prev, neighborhoods: false }));
      }
    } else {
      setNeighborhoods([]);
      setLoading(prev => ({ ...prev, neighborhoods: false }));
    }
  }, [ilce, districts]); // Include districts since it's used inside

  // Initialize values from initialLocation
  useEffect(() => {
    if (initialLocation) {
      setIl(initialLocation.il || '');
      setIlce(initialLocation.ilce || '');
      setMahalle(initialLocation.mahalle || '');
    }
  }, [initialLocation]);

  // Notify parent component of location changes
  useEffect(() => {
    if (onLocationChange && (il || ilce || mahalle)) {
      onLocationChange({
        il,
        ilce,
        mahalle
      });
    }
  }, [il, ilce, mahalle]); // Stable dependency array


  // Filter districts and neighborhoods based on selected values
  const availableDistricts = il ? districts : [];
  const availableNeighborhoods = ilce ? neighborhoods : [];

  return (
    <div className={`location-selector ${className}`}>
      <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
        {/* Province Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={provinces}
            value={il}
            onChange={(value) => {
              setIl(value || '');
              setIlce(''); // Clear district when province changes
              setMahalle(''); // Clear neighborhood when province changes
            }}
            placeholder="İl"
            label="İl"
            disabled={loading.provinces}
            loading={loading.provinces}
          />
        </div>

        {/* District Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={availableDistricts}
            value={ilce}
            onChange={(value) => {
              setIlce(value || '');
              setMahalle(''); // Clear neighborhood when district changes
            }}
            placeholder="İlçe"
            label="İlçe"
            disabled={!il || loading.districts}
            loading={loading.districts}
          />
        </div>

        {/* Neighborhood Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={availableNeighborhoods}
            value={mahalle}
            onChange={(value) => setMahalle(value || '')}
            placeholder="Mahalle"
            label="Mahalle"
            disabled={!ilce || loading.neighborhoods}
            loading={loading.neighborhoods}
          />
        </div>
      </div>

      {/* Selected Location Summary */}
      {(il || ilce || mahalle) && (
        <div className="selected-location" style={{
          marginTop: 'var(--spacing-sm)',
          padding: 'var(--spacing-sm)',
          backgroundColor: 'var(--background-secondary, #f8f9fa)',
          borderRadius: '4px',
          border: '1px solid var(--border-color, #dee2e6)'
        }}>
          <small className="text-muted">
            <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-xs)' }}></i>
            Seçilen konum: {
              il && ilce && mahalle
                ? `${il} > ${ilce} > ${mahalle}`
                : il && ilce
                ? `${il} > ${ilce}`
                : il
                ? il
                : ''
            }
          </small>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
