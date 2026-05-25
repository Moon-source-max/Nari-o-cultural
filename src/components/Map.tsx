import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Fix for default marker icon in react-leaflet
const icon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Evento {
  nombre_evento: string;
  municipio: string;
  fecha_inicio: string;
  fecha_fin: string;
  categoria: string;
  organizacion?: string;
  redesOWeb?: string;
  descripcion?: string;
  coordenadas?: {
    lat: number;
    lng: number;
  } | null;
}

interface Espacio {
  id: string;
  lugar: string;
  tipoDeEspacio: string;
  tipoDePlan: string;
  disciplina: string;
  organizacion: string;
  ubicacion: string;
  contacto: string;
  coordenadas?: {
    lat: number;
    lng: number;
  };
}

interface MapProps {
  activeTab: 'eventos' | 'espacios' | 'eventos_proximos';
  eventos: Evento[];
  espacios: Espacio[];
  selectedMunicipio: string | null;
  onSelectMunicipio: (municipio: string | null) => void;
  onSelectItem: (item: any) => void;
  userEvents?: any[];
  focusLocation?: { lat: number, lng: number } | null;
}

// Dictionary of municipality centers in Nariño
const MUNICIPIO_CENTERS: Record<string, { lat: number, lng: number }> = {
  'Pasto': { lat: 1.2136, lng: -77.2811 },
  'Ipiales': { lat: 0.8236, lng: -77.6322 },
  'Tumaco': { lat: 1.8067, lng: -78.7647 },
  'Túquerres': { lat: 1.0867, lng: -77.6167 },
  'La Unión': { lat: 1.6067, lng: -77.1333 },
  'Samaniego': { lat: 1.3333, lng: -77.5833 },
  'Barbacoas': { lat: 1.6714, lng: -78.1397 },
  'Guachucal': { lat: 0.9236, lng: -77.7322 },
  'Cumbal': { lat: 0.9167, lng: -77.8000 },
  'Sandona': { lat: 1.2833, lng: -77.4667 },
  'Buesaco': { lat: 1.3833, lng: -77.1500 },
  'Nariño': { lat: 1.2833, lng: -77.3500 },
};

function MapUpdater({ activeTab, selectedMunicipio, focusLocation }: { activeTab: string, selectedMunicipio: string | null, focusLocation?: { lat: number, lng: number } | null }) {
  const map = useMap();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (isMobile) {
      map.scrollWheelZoom.disable();
    } else {
      map.scrollWheelZoom.enable();
    }

    if (focusLocation) {
      map.flyTo([focusLocation.lat, focusLocation.lng], 16);
    } else if (activeTab === 'espacios') {
      map.setView(isMobile ? [1.2136, -77.2811] : [1.2136, -77.2811], isMobile ? 13 : 14); // Pasto city zoom
    } else if (activeTab === 'eventos') {
      if (selectedMunicipio && MUNICIPIO_CENTERS[selectedMunicipio]) {
        const center = MUNICIPIO_CENTERS[selectedMunicipio];
        map.setView([center.lat, center.lng], 13);
      } else {
        map.setView(isMobile ? [1.2136, -77.2811] : [1.2146, -77.2783], isMobile ? 12 : 9); // Nariño zoom
      }
    }
  }, [activeTab, selectedMunicipio, focusLocation, map, isMobile]);
  return null;
}

// Helper to generate a consistent mock coordinate based on string hash
const getMockCoords = (id: string, municipio: string = 'Pasto') => {
  const base = MUNICIPIO_CENTERS[municipio] || MUNICIPIO_CENTERS['Pasto'];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const latOffset = (hash % 100) / 10000;
  const lngOffset = ((hash >> 4) % 100) / 10000;
  return { lat: base.lat + latOffset, lng: base.lng + lngOffset };
};

const getCategoryColor = (categoria: string) => {
  const cat = categoria?.toLowerCase() || '';
  if (cat.includes('casa cultural')) return '#FBD334'; // Vibrant Yellow
  if (cat.includes('teatro')) return '#FE5C5D'; // Vibrant Coral
  if (cat.includes('bar')) return '#9E58FF'; // Vibrant Purple
  if (cat.includes('biblioteca')) return '#26C2FF'; // Vibrant Cyan
  if (cat.includes('cafeteria') || cat.includes('cafetería')) return '#F88D2D'; // Vibrant Orange
  if (cat.includes('espacio público') || cat.includes('espacio publico')) return '#0ED797'; // Vibrant Mint
  if (cat.includes('museo')) return '#FA3884'; // Vibrant Pink
  if (cat.includes('fundacion') || cat.includes('fundación')) return '#227EA0'; // Vibrant Blue
  return '#26C2FF'; // Default Cyan
};

const createCustomIcon = (color: string) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="none" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="${color === '#FFFFFF' ? '#000000' : '#FFFFFF'}"/>
    </svg>
  `;
  return L.divIcon({
    className: '',
    html: svg,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

export default function Map({ activeTab, eventos, espacios, selectedMunicipio, onSelectMunicipio, onSelectItem, userEvents, focusLocation }: MapProps) {
  // Group events by municipality to avoid overlapping markers
  const groupedEvents = eventos.reduce((acc, evento) => {
    // If no coordinates, we can't show it on the map, but we can try to use a mock coordinate based on municipality
    const coords = evento.coordenadas || getMockCoords(evento.nombre_evento, evento.municipio);
    
    if (!acc[evento.municipio]) {
      acc[evento.municipio] = {
        coordenadas: coords,
        eventos: []
      };
    }
    acc[evento.municipio].eventos.push(evento);
    return acc;
  }, {} as Record<string, { coordenadas: { lat: number, lng: number }, eventos: Evento[] }>);

  // Center on Nariño (Pasto)
  const center: [number, number] = [1.2146, -77.2783];

  // Pre-calculate matched events to find unmatched ones
  const matchedEventIds = new Set<string>();
  const espaciosWithEvents = espacios.map((espacio) => {
    const activeEvents = userEvents?.filter(ev => {
      const isMatch = (ev.direccion && ev.direccion.toLowerCase().includes(espacio.lugar.toLowerCase())) ||
        (ev.organizacion && ev.organizacion.toLowerCase() === espacio.lugar.toLowerCase()) ||
        (ev.municipio === 'Pasto' && ev.direccion && espacio.ubicacion && ev.direccion.toLowerCase().includes(espacio.ubicacion.toLowerCase()));
      if (isMatch) matchedEventIds.add(ev.id);
      return isMatch;
    }) || [];
    return { ...espacio, activeEvents };
  });

  const unmatchedEvents = userEvents?.filter(ev => !matchedEventIds.has(ev.id) && ev.coordenadas) || [];
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <MapContainer 
      center={center} 
      zoom={8} 
      scrollWheelZoom={!isMobile}
      className="w-full h-full md:rounded-xl shadow-md z-0"
    >
      <MapUpdater activeTab={activeTab} selectedMunicipio={selectedMunicipio} focusLocation={focusLocation} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {activeTab === 'eventos' && Object.entries(groupedEvents).map(([municipio, data]) => (
        <Marker 
          key={municipio} 
          position={[data.coordenadas.lat, data.coordenadas.lng]}
          icon={createCustomIcon('#F88D2D')} // Orange/Gold for annual events
          eventHandlers={{
            click: () => onSelectMunicipio(municipio),
          }}
        >
          <Popup>
            <div className="p-1">
              <h3 className="font-bold text-lg mb-2 border-b pb-1">{municipio}</h3>
              <p className="text-sm text-gray-600 mb-2">
                {data.eventos.length} evento{data.eventos.length !== 1 ? 's' : ''}
              </p>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {data.eventos.map((ev, idx) => (
                  <li key={idx} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                    <span className="font-semibold block text-blue-700">{ev.nombre_evento}</span>
                    <span className="text-xs text-gray-500 block mb-1">{ev.fecha_inicio}{ev.fecha_fin ? ` - ${ev.fecha_fin}` : ''}</span>
                    {ev.descripcion && (
                      <span className="text-xs text-gray-600 line-clamp-2 italic">{ev.descripcion}</span>
                    )}
                    <button 
                      onClick={() => onSelectItem({ ...ev, type: 'evento' })}
                      className="mt-2 text-[10px] font-bold text-blue-600 hover:underline flex items-center"
                    >
                      Ver detalles completos
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}

      {activeTab === 'espacios' && espaciosWithEvents.map((espacio) => {
        const coords = espacio.coordenadas || getMockCoords(espacio.id || espacio.lugar, 'Pasto');
        const hasUpcomingEvent = espacio.activeEvents.length > 0;
        const markerColor = hasUpcomingEvent ? '#0ED797' : getCategoryColor(espacio.tipoDeEspacio);

        return (
          <Marker 
            key={espacio.id || espacio.lugar} 
            position={[coords.lat, coords.lng]}
            icon={createCustomIcon(markerColor)}
          >
            <Popup>
              <div className="p-1 max-w-[200px]">
                <h3 className="font-bold text-md mb-1 text-purple-700">{espacio.lugar || 'Espacio Cultural'}</h3>
                {espacio.ubicacion && <p className="text-xs text-gray-600 mb-2">{espacio.ubicacion}</p>}
                
                {hasUpcomingEvent && (
                  <div className="mt-2 mb-2 p-2 bg-green-50 border border-green-100 rounded-md">
                    <p className="text-xs font-bold text-green-800 mb-1">¡Evento Próximo!</p>
                    {espacio.activeEvents.map((ev: any) => (
                      <div key={ev.id} className="mb-1 last:mb-0">
                        <p className="text-[10px] font-semibold text-green-900">{ev.nombre}</p>
                        <p className="text-[10px] text-green-700">{format(parseISO(ev.fechaInicio), "d MMM, h:mm a", { locale: es })}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {espacio.tipoDeEspacio && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-800 mr-1">
                      {espacio.tipoDeEspacio}
                    </span>
                  )}
                  {espacio.tipoDePlan && (
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-800">
                      {espacio.tipoDePlan}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => onSelectItem({ ...espacio, type: 'espacio' })}
                  className="mt-3 w-full py-1.5 text-xs font-bold text-purple-600 border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Ver detalles
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {activeTab === 'espacios' && unmatchedEvents.map((ev) => (
        <Marker 
          key={`unmatched-${ev.id}`} 
          position={[ev.coordenadas.lat, ev.coordenadas.lng]}
          icon={createCustomIcon('#0ED797')}
        >
          <Popup>
            <div className="p-1 max-w-[200px]">
              <div className="mt-1 mb-2 p-2 bg-green-50 border border-green-100 rounded-md">
                <p className="text-xs font-bold text-green-800 mb-1">¡Evento Próximo!</p>
                <p className="text-xs font-bold text-green-900">{ev.nombre}</p>
                <p className="text-[10px] text-green-700">{format(parseISO(ev.fechaInicio), "d MMM, h:mm a", { locale: es })}</p>
              </div>
              {ev.direccion && <p className="text-xs text-gray-600 mb-2">{ev.direccion}</p>}
              <button 
                onClick={() => onSelectItem({ ...ev, type: 'evento', nombre_evento: ev.nombre })}
                className="mt-2 w-full py-1.5 text-xs font-bold text-green-600 border border-green-100 rounded-lg hover:bg-green-50 transition-colors"
              >
                Ver detalles del evento
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
