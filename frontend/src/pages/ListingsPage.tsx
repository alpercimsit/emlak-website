import { useEffect, useState } from 'react';
import axios from 'axios';
import ListingList from '../components/ListingList';
import ListingMap from '../components/ListingMap';

export interface Listing {
  id: number;
  title: string;
  description: string;
  price: number;
  rooms: number;
  latitude: number;
  longitude: number;
  imageUrl: string;
}

function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [view, setView] = useState<'list' | 'map'>('list');

  useEffect(() => {
    axios.get<Listing[]>('/api/listings').then((res) => setListings(res.data));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setView('list')} disabled={view === 'list'}>
          Liste Görünümü
        </button>{' '}
        <button onClick={() => setView('map')} disabled={view === 'map'}>
          Harita Görünümü
        </button>
      </div>

      {view === 'list' ? (
        <ListingList listings={listings} />
      ) : (
        <ListingMap listings={listings} />
      )}
    </div>
  );
}

export default ListingsPage;

