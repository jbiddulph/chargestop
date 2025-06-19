import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function MapPage() {
  return (
    <div className="w-full max-w-5xl mx-auto p-4 min-h-[calc(100vh-80px)] flex flex-col">
      <h1 className="text-2xl md:text-3xl font-semibold mb-4 text-center">Map</h1>
      <Suspense fallback={<div>Loading map...</div>}>
        <Map height="60vh" />
      </Suspense>
    </div>
  );
} 