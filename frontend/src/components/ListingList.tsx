import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Listing } from '../pages/ListingsPage';
import { FilterState } from './FilterPanel';
import api from '../utils/api';

// Aktif Filtreler Component'i
function ActiveFilters({
  filters,
  sortOption,
  onRemoveFilter,
  onRemoveSort
}: {
  filters: FilterState;
  sortOption: string;
  onRemoveFilter: (filterKey: keyof FilterState) => void;
  onRemoveSort: () => void;
}) {
  const activeFilters: Array<{ key: keyof FilterState; label: string; value: string }> = [];

  // Aktif filtreleri tespit et
  if (filters.fiyatMin || filters.fiyatMax) {
    const fiyatLabel = `Fiyat (TL): ${filters.fiyatMin || '0'}${filters.fiyatMin && filters.fiyatMax ? '-' : filters.fiyatMin ? ' ve üzeri' : ''}${filters.fiyatMax ? filters.fiyatMin ? `${filters.fiyatMax}` : `-${filters.fiyatMax}` : ''}`;
    activeFilters.push({ key: 'fiyatMin', label: fiyatLabel, value: 'fiyat' });
  }

  if (filters.alanMin || filters.alanMax) {
    const alanLabel = `Alan (m²): ${filters.alanMin || '0'}${filters.alanMin && filters.alanMax ? '-' : filters.alanMin ? ' ve üzeri' : '-'}${filters.alanMax ? `${filters.alanMax}` : ''}`;
    activeFilters.push({ key: 'alanMin', label: alanLabel, value: 'alan' });
  }

  if (filters.searchText) {
    activeFilters.push({ key: 'searchText', label: `Arama: "${filters.searchText}"`, value: 'searchText' });
  }

  if (filters.ilanNo) {
    activeFilters.push({ key: 'ilanNo', label: `İlan No: ${filters.ilanNo}`, value: 'ilanNo' });
  }

  // Konum filtrelerini birleştir
  const konumParts: string[] = [];
  let konumKey: keyof FilterState = 'il'; // Default olarak il

  if (filters.il) konumParts.push(filters.il.name);
  if (filters.ilce) konumParts.push(filters.ilce.name);
  if (filters.mahalle) konumParts.push(filters.mahalle.name);

  // Hangi konum seviyesinin aktif olduğunu belirle
  if (konumParts.length > 0) {
    if (filters.mahalle && !filters.ilce) {
      // Sadece mahalle seçili
      konumKey = 'mahalle';
    } else if (filters.ilce && !filters.il) {
      // Sadece ilçe seçili
      konumKey = 'ilce';
    } else {
      // İl seçili (veya il + ilçe + mahalle)
      konumKey = 'il';
    }

    activeFilters.push({ key: konumKey, label: `Konum: ${konumParts.join(' / ')}`, value: 'konum' });
  }

  if (filters.category === 'arsa') {
    if (filters.adaNo) {
      activeFilters.push({ key: 'adaNo', label: `Ada No: ${filters.adaNo}`, value: 'adaNo' });
    }
    if (filters.parselNo) {
      activeFilters.push({ key: 'parselNo', label: `Parsel No: ${filters.parselNo}`, value: 'parselNo' });
    }
  }

  if (filters.category === 'konut') {
    if (filters.binaYaslari.length > 0) {
      activeFilters.push({ key: 'binaYaslari', label: `Bina Yaşı: ${filters.binaYaslari.join(', ')}`, value: 'binaYaslari' });
    }
    if (filters.odaSayilari.length > 0) {
      activeFilters.push({ key: 'odaSayilari', label: `Oda Sayısı: ${filters.odaSayilari.join(', ')}`, value: 'odaSayilari' });
    }
    if (filters.katlar.length > 0) {
      activeFilters.push({ key: 'katlar', label: `Kat: ${filters.katlar.join(', ')}`, value: 'katlar' });
    }
    if (filters.balkon && filters.balkon !== 'Tümü') {
      activeFilters.push({ key: 'balkon', label: `Balkon: ${filters.balkon}`, value: 'balkon' });
    }
    if (filters.asansor && filters.asansor !== 'Tümü') {
      activeFilters.push({ key: 'asansor', label: `Asansör: ${filters.asansor}`, value: 'asansor' });
    }
    if (filters.esyali && filters.esyali !== 'Tümü') {
      activeFilters.push({ key: 'esyali', label: `Eşyalı: ${filters.esyali}`, value: 'esyali' });
    }
  }

  // Sıralama bilgisi
  const sortLabels: { [key: string]: string } = {
    'date-desc': 'Tarihe göre önce en yeni',
    'date-asc': 'Tarihe göre önce en eski',
    'price-desc': 'Fiyata göre önce en yüksek',
    'price-asc': 'Fiyata göre önce en düşük',
    'm2-desc': 'm²\'ye göre önce en yüksek',
    'm2-asc': 'm²\'ye göre önce en düşük',
    'pricePerM2-desc': 'TL/m² fiyatına göre önce en yüksek',
    'pricePerM2-asc': 'TL/m² fiyatına göre önce en düşük'
  };

  const hasActiveFilters = activeFilters.length > 0;
  const hasActiveSort = sortOption !== 'date-desc'; // default sıralama değilse

  // Eğer hiç aktif filtre yoksa null döndür
  if (!hasActiveFilters && !hasActiveSort) {
    return null;
  }

  return (
    <div className="active-filters" style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      padding: 'var(--spacing-xs)',
      backgroundColor: 'var(--background-color)',
      borderRadius: 'var(--radius-md)',
      border: '1px solid var(--border-color)',
      
      
      alignItems: 'flex-start'
    }}>
      {/* Aktif Sıralama Kutucuğu */}
      {hasActiveSort && (
        <div className="active-filter-tag" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid var(--border-color)'
        }}>
          <span>Sıralama: {sortLabels[sortOption]}</span>
          <button
            type="button"
            onClick={onRemoveSort}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-color, #dc3545)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Aktif Filtre Kutucukları */}
      {activeFilters.map((filter) => (
        <div key={filter.key} className="active-filter-tag" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          backgroundColor: 'var(--surface-color)',
          color: 'var(--text-primary)',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: '500',
          border: '1px solid var(--border-color)'
        }}>
          <span>{filter.label}</span>
          <button
            type="button"
            onClick={() => onRemoveFilter(filter.key)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0',
              width: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--danger-color, #dc3545)';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      ))}
    </div>
  );
}

interface Props {
  listings: Listing[];
  isAdmin?: boolean;
  onUpdate?: () => void;
  onEditListing?: (listing: Listing) => void;
  filters?: FilterState;
  sortOption?: string;
  onRemoveFilter?: (filterKey: keyof FilterState) => void;
  onRemoveSort?: () => void;
}

function ListingList({ listings, isAdmin = false, onUpdate, onEditListing, filters, sortOption, onRemoveFilter, onRemoveSort }: Props) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Emlak tipi görüntüleme için helper fonksiyon
  const formatEmlakTipi = (emlakTipi: string) => {
    switch (emlakTipi) {
      case 'kiralikDaire':
        return 'Kiralık Daire';
      case 'satilikDaire':
        return 'Satılık Daire';
      case 'Arsa':
        return 'Arsa';
      case 'Tarla':
        return 'Tarla';
      case 'Bağ Yeri':
        return 'Bağ Yeri';
      case 'Arsa Hissesi':
        return 'Arsa Hissesi';
      case 'Daire':
        return 'Daire';
      default:
        return emlakTipi;
    }
  };

  const handleDelete = async (listingId: number) => {
    if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
      return;
    }

    setDeletingId(listingId);
    try {
      await api.deleteListing(listingId);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('İlan silinirken hata:', error);
      alert('İlan silinirken bir hata oluştu');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (listing: Listing) => {
    if (onEditListing) {
      onEditListing(listing);
    }
  };

  const handleListingClick = (listingId: number) => {
    navigate(`/ilan/${listingId}`);
  };

  if (!listings.length) {
    return (
      <div>
        {/* Aktif Filtreler - Hiç ilan olmadığında da göster */}
        {filters && sortOption && onRemoveFilter && onRemoveSort && (
          <ActiveFilters
            filters={filters}
            sortOption={sortOption}
            onRemoveFilter={onRemoveFilter}
            onRemoveSort={onRemoveSort}
          />
        )}

        <div className="empty-state">
          <i className="fas fa-home"></i>
          <h3>Arama kriterlerine uygun ilan bulunamadı.</h3>
          <p>Yakında yeni emlak ilanları eklenecektir.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Aktif Filtreler - Listeden önce */}
      {filters && sortOption && onRemoveFilter && onRemoveSort && (
        <div style={{ marginBottom: 'var(--spacing-md)' }}>
          <ActiveFilters
            filters={filters}
            sortOption={sortOption}
            onRemoveFilter={onRemoveFilter}
            onRemoveSort={onRemoveSort}
          />
        </div>
      )}

      <div className="listings-grid">
        {listings.map((l) => (
        <div key={l.ilan_no} className="card listing-card-compact" onClick={() => handleListingClick(l.ilan_no)} style={{ cursor: 'pointer', maxWidth: '94vw' }}>
          {/* Sol taraf - Kare fotoğraf */}
          <div className="listing-image-container">
            {l.fotolar ? (
              <img src={l.fotolar.split(',')[0]} alt={l.baslik} className="listing-image-square" />
            ) : (
              <div className="listing-no-image">
                <i className="fas fa-image"></i>
              </div>
            )}
          </div>
          
          {/* Sağ taraf - İlan bilgileri */}
          <div className="listing-info">
            <div className="listing-header">
              <div className="listing-title-compact">{l.baslik || 'Başlık belirtilmemiş'}</div>
              <div className="listing-price-compact">
                {l.fiyat.toLocaleString('tr-TR')} TL
              </div>
            </div>
            
            <div className="listing-meta-compact">
              <div className="meta-row">
                <span>
                  <i className="fas fa-expand"></i>
                  {l.m2 ? `${l.m2} m²` : 'Belirtilmemiş'}
                </span>
                {['Arsa', 'Tarla', 'Bağ Yeri', 'Arsa Hissesi'].includes(l.emlak_tipi) && (
                  <span>
                    <i className="fas fa-calculator"></i>
                    {l.m2 && l.m2 > 0
                    ? `${Math.floor(l.fiyat / l.m2).toLocaleString('tr-TR')} TL/m²`
                    : 'Belirtilmemiş'
                    }
                  </span>
                )}
                {!['Arsa', 'Tarla', 'Bağ Yeri', 'Arsa Hissesi'].includes(l.emlak_tipi) && (
                  <span>
                    <i className="fas fa-bed"></i>
                    {l.oda_sayisi || 'Belirtilmemiş'}
                  </span>
                )}
                {!['Arsa', 'Tarla', 'Bağ Yeri', 'Arsa Hissesi'].includes(l.emlak_tipi) && (
                  <span>
                    <i className="fas fa-layer-group"></i>
                    {l.bulundugu_kat != null ? l.bulundugu_kat : 'Belirtilmemiş'}
                  </span>
                )}
              </div>
              <div className="meta-row location">
                <span>
                  <i className="fas fa-map-marker-alt"></i>
                  {[l.il, l.ilce, l.mahalle].filter(Boolean).join(' / ') || 'Konum belirtilmemiş'}
                </span>
              </div>
            </div>
            
            {isAdmin && (
              <div className="admin-actions-compact">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(l);
                  }}
                  disabled={deletingId === l.ilan_no}
                  title="Düzenle"
                >
                  <i className="fas fa-edit"></i>
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(l.ilan_no);
                  }}
                  disabled={deletingId === l.ilan_no}
                  title="Sil"
                >
                  {deletingId === l.ilan_no ? (
                    <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                  ) : (
                    <i className="fas fa-trash"></i>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
        ))}
      </div>
    </div>
  );
}

export default ListingList;

