import React, { useState, useEffect } from 'react';
import api from '../utils/api';

interface LocationData {
  province?: { id: number; name: string };
  district?: { id: number; name: string };
  neighborhood?: { id: number; name: string };
}

interface Props {
  onLocationChange?: (location: LocationData) => void;
  initialLocation?: LocationData;
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
  value: {id: number, name: string} | undefined;
  onChange: (option: {id: number, name: string} | undefined) => void;
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

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
      onChange(undefined);
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
    onChange(undefined);
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

function LocationSelector({ onLocationChange, initialLocation, className = '' }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    neighborhoods: false
  });

  const [selectedProvince, setSelectedProvince] = useState<Province | undefined>(initialLocation?.province);
  const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(initialLocation?.district);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | undefined>(initialLocation?.neighborhood);

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
    if (selectedProvince) {
      setLoading(prev => ({ ...prev, districts: true }));
      setDistricts([]);
      setSelectedDistrict(undefined);
      setSelectedNeighborhood(undefined);

      api.getDistricts(selectedProvince.id)
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
      setSelectedDistrict(undefined);
      setSelectedNeighborhood(undefined);
    }
  }, [selectedProvince]);

  // Load neighborhoods when district changes
  useEffect(() => {
    if (selectedDistrict) {
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      setNeighborhoods([]);
      setSelectedNeighborhood(undefined);

      api.getNeighborhoods(selectedDistrict.id)
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
      setSelectedNeighborhood(undefined);
    }
  }, [selectedDistrict]);

  // Notify parent component of location changes
  useEffect(() => {
    if (onLocationChange) {
      onLocationChange({
        province: selectedProvince,
        district: selectedDistrict,
        neighborhood: selectedNeighborhood
      });
    }
  }, [selectedProvince, selectedDistrict, selectedNeighborhood, onLocationChange]);

  return (
    <div className={`location-selector ${className}`}>
      <div className="d-flex gap-3" style={{ flexWrap: 'wrap' }}>
        {/* Province Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={provinces}
            value={selectedProvince}
            onChange={setSelectedProvince}
            placeholder="İl"
            label="İl"
            disabled={loading.provinces}
            loading={loading.provinces}
          />
        </div>

        {/* District Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={districts}
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            placeholder="İlçe"
            label="İlçe"
            disabled={!selectedProvince || loading.districts || districts.length === 0}
            loading={loading.districts}
          />
        </div>

        {/* Neighborhood Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <Combobox
            options={neighborhoods}
            value={selectedNeighborhood}
            onChange={setSelectedNeighborhood}
            placeholder="Mahalle"
            label="Mahalle"
            disabled={!selectedDistrict || loading.neighborhoods || neighborhoods.length === 0}
            loading={loading.neighborhoods}
          />
        </div>
      </div>

      {/* Selected Location Summary */}
      {(selectedProvince || selectedDistrict || selectedNeighborhood) && (
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
              selectedProvince && selectedDistrict && selectedNeighborhood
                ? `${selectedProvince.name} > ${selectedDistrict.name} > ${selectedNeighborhood.name}`
                : selectedProvince && selectedDistrict
                ? `${selectedProvince.name} > ${selectedDistrict.name}`
                : selectedProvince
                ? selectedProvince.name
                : ''
            }
          </small>
        </div>
      )}
    </div>
  );
}

export default LocationSelector;
