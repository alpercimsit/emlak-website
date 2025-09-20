import React, { useState, useEffect, useRef } from 'react';
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

  const [selectedProvince, setSelectedProvince] = useState<Province | undefined>();
  const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>();
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<Neighborhood | undefined>();

  // Track if this is the initial render to prevent unnecessary onLocationChange calls
  const isInitialRenderRef = useRef(true);

  // Store the initial location in state to capture the correct values
  const [savedInitialLocation, setSavedInitialLocation] = useState<LocationData | undefined>();

  // Update saved location when initialLocation changes, but only if it's not empty
  useEffect(() => {
    console.log('LocationSelector: received initialLocation:', initialLocation);
    if (initialLocation && (initialLocation.province || initialLocation.district || initialLocation.neighborhood)) {
      console.log('Saving initialLocation to state:', initialLocation);
      setSavedInitialLocation(initialLocation);

      // Also update the selected states immediately in a single batch
      setSelectedProvince(initialLocation.province);
      setSelectedDistrict(initialLocation.district);
      setSelectedNeighborhood(initialLocation.neighborhood);
    }
  }, [initialLocation]);

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

  // Set province when provinces are loaded
  useEffect(() => {
    console.log('Province useEffect triggered:', {
      initialProvince: savedInitialLocation?.province,
      provincesLength: provinces.length
    });

    if (savedInitialLocation?.province && provinces.length > 0) {
      // Check if we have a matching province by name
      const matchingProvince = provinces.find(p => p.name === savedInitialLocation.province?.name);
      if (matchingProvince) {
        console.log('Setting province by name match:', matchingProvince);
        setSelectedProvince(matchingProvince);
      } else if (savedInitialLocation.province.id !== 0) {
        console.log('Setting province by id:', savedInitialLocation.province);
        setSelectedProvince(savedInitialLocation.province);
      }
    }
  }, [savedInitialLocation?.province, provinces.length]); // Depend on both savedInitialLocation.province and provinces

  // Set district when province is selected or districts are loaded
  useEffect(() => {
    console.log('District useEffect triggered:', {
      initialDistrict: savedInitialLocation?.district,
      districtsLength: districts.length,
      selectedProvince: selectedProvince
    });

    // Only set district if we have a saved initial district and the districts are loaded
    if (savedInitialLocation?.district && districts.length > 0) {
      // Check if the initial district is in the loaded districts by name or id
      const districtExists = districts.find(d =>
        d.name === savedInitialLocation.district?.name ||
        (savedInitialLocation.district?.id !== 0 && d.id === savedInitialLocation.district?.id)
      );
      if (districtExists) {
        console.log('Setting district:', districtExists);
        setSelectedDistrict(districtExists);
      }
    } else {
      console.log('District useEffect conditions not met');
    }
  }, [savedInitialLocation?.district, districts]); // Depend on both savedInitialLocation.district and districts

  // Set neighborhood when district is selected or neighborhoods are loaded
  useEffect(() => {
    console.log('Neighborhood useEffect triggered:', {
      initialNeighborhood: savedInitialLocation?.neighborhood,
      neighborhoodsLength: neighborhoods.length,
      selectedDistrict: selectedDistrict
    });

    // Only set neighborhood if we have a saved initial neighborhood and the neighborhoods are loaded
    if (savedInitialLocation?.neighborhood && neighborhoods.length > 0) {
      // Check if the initial neighborhood is in the loaded neighborhoods by name or id
      const neighborhoodExists = neighborhoods.find(n =>
        n.name === savedInitialLocation.neighborhood?.name ||
        (savedInitialLocation.neighborhood?.id !== 0 && n.id === savedInitialLocation.neighborhood?.id)
      );
      if (neighborhoodExists) {
        console.log('Setting neighborhood:', neighborhoodExists);
        setSelectedNeighborhood(neighborhoodExists);
      }
    } else {
      console.log('Neighborhood useEffect conditions not met');
    }
  }, [savedInitialLocation?.neighborhood, neighborhoods]); // Depend on both savedInitialLocation.neighborhood and neighborhoods

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      console.log('Loading districts for province:', selectedProvince);
      setLoading(prev => ({ ...prev, districts: true }));
      setDistricts([]);
      setSelectedDistrict(undefined);
      setSelectedNeighborhood(undefined);

      api.getDistricts(selectedProvince.id)
        .then(districtsData => {
          console.log('Districts loaded:', districtsData);
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
      console.log('Loading neighborhoods for district:', selectedDistrict);
      setLoading(prev => ({ ...prev, neighborhoods: true }));
      setNeighborhoods([]);
      setSelectedNeighborhood(undefined);

      api.getNeighborhoods(selectedDistrict.id)
        .then(neighborhoodsData => {
          console.log('Neighborhoods loaded:', neighborhoodsData);
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
    if (onLocationChange && !isInitialRenderRef.current) {
      // Only call onLocationChange if we have meaningful changes
      const hasProvince = selectedProvince !== undefined;
      const hasDistrict = selectedDistrict !== undefined;
      const hasNeighborhood = selectedNeighborhood !== undefined;

      if (hasProvince || hasDistrict || hasNeighborhood) {
        onLocationChange({
          province: selectedProvince,
          district: selectedDistrict,
          neighborhood: selectedNeighborhood
        });
      }
    }

    // Mark as not initial render after first call
    if (isInitialRenderRef.current) {
      isInitialRenderRef.current = false;
    }
  }, [selectedProvince, selectedDistrict, selectedNeighborhood, isInitialRenderRef.current]);


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
