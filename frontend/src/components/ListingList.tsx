import { Listing } from '../pages/ListingsPage';

interface Props {
  listings: Listing[];
}

function ListingList({ listings }: Props) {
  if (!listings.length) return <p>Henüz ilan yok.</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {listings.map((l) => (
        <li key={l.id} style={{ border: '1px solid #ddd', marginBottom: 8, padding: 8 }}>
          <h3>{l.title}</h3>
          <p>{l.description}</p>
          <p>
            <strong>Fiyat:</strong> {l.price.toLocaleString('tr-TR')} TL
          </p>
          {l.imageUrl && <img src={l.imageUrl} alt={l.title} style={{ maxWidth: '100%', height: 'auto' }} />}
        </li>
      ))}
    </ul>
  );
}

export default ListingList;

