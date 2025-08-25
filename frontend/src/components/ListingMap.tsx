import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Listing } from '../pages/ListingsPage';
import L from 'leaflet';

// Fix default icon issue with Leaflet + Vite
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// override icons
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Props {
  listings: Listing[];
}

function ListingMap({ listings }: Props) {
  // Geçici olarak harita devre dışı - koordinat bilgisi henüz backend'de yok
  return (
    <div style={{ 
      height: '70vh', 
      width: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px'
    }}>
      <div style={{ textAlign: 'center', color: '#6c757d' }}>
        <i className="fas fa-map-marked-alt" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
        <h3>Harita Görünümü Geliştiriliyor</h3>
        <p>Koordinat sistemi güncellendikten sonra harita aktif olacak.</p>
        <p>Şu anda {listings.length} ilan listeleniyor.</p>
      </div>
    </div>
  );
}

export default ListingMap;

