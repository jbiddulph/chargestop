import { useState } from 'react';
import { useChargers } from '@lib/useChargers';

const ChargersList = () => {
  const [page, setPage] = useState(1);
  const pageSize = 500;
  const { chargers, total, loading, error } = useChargers(page, pageSize);

  const totalPages = Math.ceil(total / pageSize);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <ul>
        {chargers.map((charger) => (
          <li key={charger.id}>{charger.name}</li>
        ))}
      </ul>
      <div style={{ marginTop: '1rem' }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>Page {page} of {totalPages}</span>
        <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ChargersList; 