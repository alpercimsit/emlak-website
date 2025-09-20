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
          <label className="form-label">
            <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İl
          </label>
          <select
            className="form-control"
            value={selectedProvince?.id || ''}
            onChange={(e) => {
              const provinceId = Number(e.target.value);
              const province = provinces.find(p => p.id === provinceId);
              setSelectedProvince(province);
            }}
            disabled={loading.provinces}
          >
            <option value="">İl seçiniz</option>
            {provinces.map(province => (
              <option key={province.id} value={province.id}>
                {province.name}
              </option>
            ))}
          </select>
          {loading.provinces && (
            <small className="text-muted">
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 'var(--spacing-xs)' }}></i>
              Yükleniyor...
            </small>
          )}
        </div>

        {/* District Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">
            <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            İlçe
          </label>
          <select
            className="form-control"
            value={selectedDistrict?.id || ''}
            onChange={(e) => {
              const districtId = Number(e.target.value);
              const district = districts.find(d => d.id === districtId);
              setSelectedDistrict(district);
            }}
            disabled={!selectedProvince || loading.districts || districts.length === 0}
          >
            <option value="">
              {!selectedProvince ? 'Önce il seçiniz' : 'İlçe seçiniz'}
            </option>
            {districts.map(district => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
          {loading.districts && (
            <small className="text-muted">
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 'var(--spacing-xs)' }}></i>
              Yükleniyor...
            </small>
          )}
        </div>

        {/* Neighborhood Selection */}
        <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
          <label className="form-label">
            <i className="fas fa-map-marker-alt" style={{ marginRight: 'var(--spacing-sm)' }}></i>
            Mahalle
          </label>
          <select
            className="form-control"
            value={selectedNeighborhood?.id || ''}
            onChange={(e) => {
              const neighborhoodId = Number(e.target.value);
              const neighborhood = neighborhoods.find(n => n.id === neighborhoodId);
              setSelectedNeighborhood(neighborhood);
            }}
            disabled={!selectedDistrict || loading.neighborhoods || neighborhoods.length === 0}
          >
            <option value="">
              {!selectedDistrict ? 'Önce ilçe seçiniz' : 'Mahalle seçiniz'}
            </option>
            {neighborhoods.map(neighborhood => (
              <option key={neighborhood.id} value={neighborhood.id}>
                {neighborhood.name}
              </option>
            ))}
          </select>
          {loading.neighborhoods && (
            <small className="text-muted">
              <i className="fas fa-spinner fa-spin" style={{ marginRight: 'var(--spacing-xs)' }}></i>
              Yükleniyor...
            </small>
          )}
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
