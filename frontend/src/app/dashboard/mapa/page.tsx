'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Carregando mapa de oportunidades...</p>
      </div>
    </div>
  ),
});

export default function MapaPage() {
  return <MapView />;
}
