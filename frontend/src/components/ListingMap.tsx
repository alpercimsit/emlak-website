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
  const center: [number, number] = listings.length
    ? [listings[0].latitude, listings[0].longitude]
    : [41.015137, 28.97953]; // Istanbul default

  return (
    <MapContainer center={center} zoom={13} style={{ height: '70vh', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {listings.map((l) => (
        <Marker key={l.id} position={[l.latitude, l.longitude]}>
          <Popup>
            <strong>{l.title}</strong>
            <br />
            {l.price.toLocaleString('tr-TR')} TL
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default ListingMap;

