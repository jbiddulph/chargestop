import dynamic from 'next/dynamic';

const MapTest = dynamic(() => import('@components/MapTest'), { ssr: false });

export default function MapTestPage() {
  return (
    <div>
      <h1>MapBox Test</h1>
      <MapTest />
    </div>
  );
}
