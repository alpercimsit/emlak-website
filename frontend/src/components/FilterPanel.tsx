import { useState } from 'react';
import { Listing } from '../pages/ListingsPage';

export interface FilterState {
  category: 'arsa' | 'konut';
  subCategory: 'all' | 'satilik' | 'kiralik'; // konut için alt kategori
  searchText: string;
  ilanNo: string;
  fiyatMin: string;
  fiyatMax: string;
  alanMin: string;
  alanMax: string;
  il: string;
  ilce: string;
  mahalle: string;
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

function FilterPanel({ filters, onFiltersChange, totalCount }: Props) {
  const [showKonutSubmenu, setShowKonutSubmenu] = useState(false);

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
      category: 'konut',
      subCategory: 'all',
      searchText: '',
      ilanNo: '',
      fiyatMin: '',
      fiyatMax: '',
      alanMin: '',
      alanMax: '',
      il: '',
      ilce: '',
      mahalle: '',
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
          İlan Kategorileri
        </h3>
        <div className="filter-count">
          Bulunan Kayıt: <strong>{totalCount}</strong>
        </div>
      </div>

      {/* Kategori Seçimi */}
      <div className="filter-section">
        <div className="category-buttons">
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
      </div>

      {/* Arama Filtreleri */}
      <div className="filter-section">
        <h4>İlan Filtreleme</h4>
        
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
            İl
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="İl adı..."
            value={filters.il}
            onChange={(e) => handleFilterChange('il', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <i className="fas fa-map-marker-alt"></i>
            İlçe
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="İlçe adı..."
            value={filters.ilce}
            onChange={(e) => handleFilterChange('ilce', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label">
            <i className="fas fa-map-marker-alt"></i>
            Mahalle
          </label>
          <input
            type="text"
            className="filter-input"
            placeholder="Mahalle adı..."
            value={filters.mahalle}
            onChange={(e) => handleFilterChange('mahalle', e.target.value)}
          />
        </div>

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
