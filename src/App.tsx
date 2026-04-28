/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import Map from './components/Map';
import CitizenContributionForm from './components/CitizenContributionForm';
import SpaceContributionForm from './components/SpaceContributionForm';
import UpcomingEvents from './components/UpcomingEvents';
import DetailModal from './components/DetailModal';
import eventosPastoData from './data/notion-events-pasto.json';
import eventosNarinoData from './data/notion-events-narino.json';
import placesData from './data/notion-places.json';
import { Calendar, MapPin, Tag, Search, Filter, ExternalLink, Plus, Users, Mic, Music, User, Palette, Heart, PartyPopper } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { isAfter, parseISO } from 'date-fns';

// Combine events
const allEventos = [
  ...eventosPastoData.map(e => ({
    nombre_evento: e.nombre,
    municipio: e.municipio || 'Pasto',
    fecha_inicio: e.fechas,
    fecha_fin: '',
    categoria: e.tipoDeEvento,
    coordenadas: e.coordenadas ? { lat: e.coordenadas[0], lng: e.coordenadas[1] } : null,
    organizacion: e.organizacion,
    redesOWeb: e.redesOWeb,
    descripcion: (e as any).descripcion || '',
    imagen: (e as any).imagen || ''
  })),
  ...eventosNarinoData.map(e => ({
    nombre_evento: e.nombre,
    municipio: e.municipio,
    fecha_inicio: e.fechas,
    fecha_fin: '',
    categoria: e.tipoDeEvento,
    coordenadas: e.coordenadas ? { lat: e.coordenadas[0], lng: e.coordenadas[1] } : null,
    organizacion: e.organizacion,
    redesOWeb: '',
    descripcion: (e as any).descripcion || '',
    imagen: (e as any).imagen || ''
  }))
];

interface LayeredIconProps {
  icon: any;
  className?: string;
  color1?: string;
  color2?: string;
}

const LayeredIcon = ({ icon: Icon, className = "w-6 h-6", color1 = "text-[var(--color-vibrant-coral)]", color2 = "text-[var(--color-vibrant-yellow)]" }: LayeredIconProps) => (
  <div className={`relative inline-flex items-center justify-center ${className}`}>
    <Icon className={`absolute top-0.5 left-0.5 w-[80%] h-[80%] opacity-80 mix-blend-multiply ${color2}`} fill="currentColor" strokeWidth={0} />
    <Icon className={`relative z-10 w-[90%] h-[90%] opacity-90 mix-blend-multiply ${color1}`} fill="currentColor" strokeWidth={0} />
  </div>
);

import PassportGrid from './components/PassportGrid';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<'eventos' | 'espacios' | 'pasaporte'>('eventos');
  const [eventTypeFilter, setEventTypeFilter] = useState<'todos' | 'proximos'>('todos');
  const [eventos, setEventos] = useState(allEventos);
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSpaceFormOpen, setIsSpaceFormOpen] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [focusLocation, setFocusLocation] = useState<{lat: number, lng: number} | null>(null);

  const MONTHS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'user_events'), orderBy('fechaInicio', 'asc'));
        const querySnapshot = await getDocs(q);
        const fetchedEvents: any[] = [];
        const now = new Date();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'approved' && (isAfter(parseISO(data.fechaInicio), now) || isAfter(parseISO(data.fechaFin || data.fechaInicio), now))) {
            fetchedEvents.push({ id: doc.id, ...data });
          }
        });
        setUpcomingEvents(fetchedEvents);
      } catch (err) {
        console.error("Error fetching upcoming events for map:", err);
      }
    };
    fetchEvents();
  }, []);
  
  // Filters for Espacios
  const [tipoEspacio, setTipoEspacio] = useState<string[]>([]);
  const [tipoPlan, setTipoPlan] = useState<string[]>([]);
  const [disciplina, setDisciplina] = useState<string[]>([]);

  // Filter events based on search term, selected municipality, and selected month
  const filteredEvents = eventos.filter((evento) => {
    const matchesSearch = evento.nombre_evento.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          evento.municipio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMunicipio = selectedMunicipio ? evento.municipio === selectedMunicipio : true;
    const matchesMonth = selectedMonth ? evento.fecha_inicio.toLowerCase().includes(selectedMonth) : true;
    return matchesSearch && matchesMunicipio && matchesMonth;
  });

  // Filter places based on search term and selected filters
  const filteredPlaces = placesData.filter((place: any) => {
    const matchesSearch = place.lugar.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          place.ubicacion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEspacio = tipoEspacio.length === 0 || tipoEspacio.includes(place.tipoDeEspacio);
    const matchesPlan = tipoPlan.length === 0 || tipoPlan.some(p => place.tipoDePlan?.includes(p));
    const matchesDisciplina = disciplina.length === 0 || disciplina.some(d => place.disciplina.includes(d));
    return matchesSearch && matchesEspacio && matchesPlan && matchesDisciplina;
  });

  // Unique categories for dropdowns
  const tiposDeEspacio = Array.from(new Set(placesData.map((p: any) => p.tipoDeEspacio).filter(Boolean)));
  const tiposDePlan = Array.from(new Set(placesData.flatMap((p: any) => p.tipoDePlan ? p.tipoDePlan.split(',').map((s: string) => s.trim()) : []).filter(Boolean)));
  const disciplinas = Array.from(new Set(placesData.flatMap((p: any) => p.disciplina.split(', ')).filter(Boolean)));

  if (currentScreen === 'landing') {
    return (
      <div className="flex flex-col h-[100dvh] bg-[var(--color-vibrant-cream)] items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="bg-white rounded-3xl p-6 text-center mb-8 w-full shadow-sm flex flex-col items-center justify-center">
            <img src="/icons/nari-cultural/logo-cuadrado.svg" alt="Nariño Cultural Logo" className="w-48 h-auto mb-4" />
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-vibrant-blue)]">
              ¿Qué quieres ver?
            </h1>
          </div>
          <div className="flex w-full gap-4">
            <button 
              onClick={() => { setActiveTab('eventos'); setCurrentScreen('app'); }}
              className="flex-1 bg-[var(--color-vibrant-coral)] text-white py-3 rounded-2xl text-lg font-bold shadow-md active:scale-95 transition-transform border-b-4 border-b-[#c95945]"
            >
              Eventos
            </button>
            <button 
              onClick={() => { setActiveTab('espacios'); setCurrentScreen('app'); }}
              className="flex-1 bg-white border-[3px] border-[var(--color-vibrant-coral)] text-[var(--color-vibrant-purple)] py-3 rounded-2xl text-lg font-bold shadow-sm active:scale-95 transition-transform"
            >
              Sitios de interes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-[var(--color-vibrant-cream)] font-sans pb-[80px] md:pb-0 overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex flex-col md:flex-row md:items-center justify-between z-10 gap-4 border-b border-gray-100">
        <div className="flex items-center">
          <img src="/icons/nari-cultural/logo-horizontal.svg" alt="Nariño Cultural" className="h-10 md:h-12 object-contain" />
        </div>
        
        {/* Tabs - Hidden on mobile, handled by bottom nav */}
        <div className="hidden md:flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
          <button
            onClick={() => setActiveTab('eventos')}
            className={`px-4 py-2 min-h-[44px] whitespace-nowrap rounded-md text-sm font-medium transition-colors ${
              activeTab === 'eventos' ? 'bg-white text-[var(--color-vibrant-coral)] shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('espacios')}
            className={`px-4 py-2 min-h-[44px] whitespace-nowrap rounded-md text-sm font-medium transition-colors ${
              activeTab === 'espacios' ? 'bg-white text-[var(--color-vibrant-mint)] shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sitios de Interés
          </button>
          <button
            onClick={() => setActiveTab('pasaporte')}
            className={`px-4 py-2 min-h-[44px] whitespace-nowrap rounded-md text-sm font-medium transition-colors ${
              activeTab === 'pasaporte' ? 'bg-white text-yellow-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Pasaporte Ciudadano
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {activeTab !== 'pasaporte' && (
            <div className="relative flex-1 md:w-64">
              <input 
                type="text" 
                placeholder={activeTab === 'eventos' ? "Buscar eventos..." : "Buscar espacios..."}
                className="w-full pl-10 pr-4 py-2 min-h-[44px] rounded-full border border-[var(--color-vibrant-mint)] bg-white/80 focus:outline-none focus:ring-2 focus:ring-[var(--color-vibrant-coral)] focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-[var(--color-vibrant-mint)] w-5 h-5" />
            </div>
          )}
          
          <div className="hidden md:flex gap-2">
            {activeTab === 'espacios' && (
              <button
                onClick={() => setIsSpaceFormOpen(true)}
                className="bg-[var(--color-vibrant-mint)] hover:brightness-95 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center shrink-0 shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>Añadir espacio</span>
              </button>
            )}
            {activeTab === 'eventos' && (
              <button
                onClick={() => setIsFormOpen(true)}
                className="bg-[var(--color-vibrant-coral)] hover:brightness-95 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center shrink-0 shadow-sm min-h-[44px]"
              >
                <Plus className="w-4 h-4 mr-2" />
                <span>¿Tienes un evento?</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {activeTab === 'pasaporte' ? (
          <PassportGrid userId={null} />
        ) : (
          <>
            {/* Sidebar / List */}
            <aside className={`w-full md:w-1/3 lg:w-1/4 md:border-r border-gray-200 flex flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] order-2 md:order-1 ${activeTab === 'espacios' ? 'absolute inset-0 pointer-events-none md:relative md:pointer-events-auto bg-transparent md:bg-[var(--color-vibrant-cream)] md:flex md:h-full' : 'bg-[var(--color-vibrant-cream)] flex-1 h-full'}`}>
              
              {activeTab === 'eventos' ? (
                <>
                  <div className="p-4 border-b border-gray-200 flex justify-center bg-white shadow-sm z-10">
                    <div className="bg-gray-100 p-1.5 rounded-full flex w-full max-w-sm relative">
                      <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${eventTypeFilter === 'todos' ? 'translate-x-0' : 'translate-x-[calc(100%+12px)]'}`} />
                      <button onClick={() => setEventTypeFilter('todos')} className={`flex-1 py-2 text-sm font-bold rounded-full z-10 transition-colors ${eventTypeFilter === 'todos' ? 'text-[var(--color-vibrant-blue)]' : 'text-gray-500 hover:text-gray-700'}`}>Permanentes</button>
                      <button onClick={() => setEventTypeFilter('proximos')} className={`flex-1 py-2 text-sm font-bold rounded-full z-10 transition-colors ${eventTypeFilter === 'proximos' ? 'text-[var(--color-vibrant-blue)]' : 'text-gray-500 hover:text-gray-700'}`}>Próximos</button>
                    </div>
                  </div>

                  {eventTypeFilter === 'proximos' ? (
                    <div className="flex-1 overflow-x-hidden overflow-y-auto pb-24 md:pb-0">
                      <UpcomingEvents onSelectItem={(item) => setSelectedItem({ ...item, type: 'evento', nombre_evento: item.nombre })} />
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-[var(--color-vibrant-cream)]">
                        <h2 className="font-bold text-[var(--color-vibrant-blue)]">
                          {selectedMunicipio ? `Eventos en ${selectedMunicipio}` : 'Todos los eventos'}
                        </h2>
                        <span className="bg-[var(--color-vibrant-mint)]/20 text-[var(--color-vibrant-blue)] text-sm font-bold px-3 py-1 rounded-full">
                          {filteredEvents.length}
                        </span>
                      </div>
                      
                      <div className="p-4 bg-white border-b border-gray-100">
                        <label className="block text-xs font-bold text-[var(--color-vibrant-blue)] mb-2 uppercase tracking-wide">Filtro por mes</label>
                        <select 
                          className="w-full text-sm border-2 border-[var(--color-vibrant-mint)] rounded-xl p-3 min-h-[44px] focus:ring-[var(--color-vibrant-coral)] focus:border-[var(--color-vibrant-coral)] bg-[var(--color-vibrant-cream)] outline-none font-medium text-[var(--color-vibrant-blue)]"
                          value={selectedMonth || ''}
                          onChange={(e) => setSelectedMonth(e.target.value || null)}
                        >
                          <option value="">Todos los meses</option>
                          {MONTHS.map(month => (
                            <option key={month} value={month}>{month.charAt(0).toUpperCase() + month.slice(1)}</option>
                          ))}
                        </select>
                      </div>

                      {selectedMunicipio && (
                        <div className="px-4 py-2 bg-[var(--color-vibrant-yellow)]/30 border-b border-[var(--color-vibrant-yellow)] flex justify-between items-center">
                          <span className="text-sm text-[var(--color-vibrant-blue)] font-medium">Lugar: <strong>{selectedMunicipio}</strong></span>
                          <button 
                            onClick={() => setSelectedMunicipio(null)}
                            className="text-xs font-bold text-[var(--color-vibrant-coral)] hover:underline"
                          >
                            Limpiar
                          </button>
                        </div>
                      )}

                      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 md:pb-4 custom-scrollbar">
                        {filteredEvents.length > 0 ? (
                          filteredEvents.map((evento, idx) => (
                            <div key={idx} className="bg-white border-2 border-[var(--color-vibrant-mint)]/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 group flex flex-col">
                              {evento.imagen && (
                                <img src={evento.imagen} alt={evento.nombre_evento} className="w-full h-36 object-cover rounded-xl mb-4 shrink-0" />
                              )}
                              <h3 className="font-bold text-lg text-[var(--color-vibrant-blue)] mb-3 group-hover:text-[var(--color-vibrant-coral)] transition-colors">
                                {evento.nombre_evento}
                              </h3>
                              
                              <div className="space-y-2.5 text-sm text-gray-600 flex-grow">
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2 text-[var(--color-vibrant-coral)] shrink-0" />
                                  <span className="font-medium text-[var(--color-vibrant-blue)]">{evento.municipio}</span>
                                </div>
                                <div className="flex items-center block">
                                  <Calendar className="w-4 h-4 mr-2 text-[var(--color-vibrant-coral)] shrink-0" />
                                  <span className="font-medium text-[var(--color-vibrant-blue)]">{evento.fecha_inicio}{evento.fecha_fin ? ` - ${evento.fecha_fin}` : ''}</span>
                                </div>
                                {evento.categoria && (
                                  <div className="flex items-center mt-2">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-vibrant-mint)]/20 text-[var(--color-vibrant-purple)] border border-[var(--color-vibrant-mint)]/50">
                                      {evento.categoria}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button 
                                onClick={() => {
                                  if (evento.coordenadas) {
                                    setFocusLocation(evento.coordenadas);
                                  }
                                  setSelectedItem({ ...evento, type: 'evento' });
                                }}
                                className="mt-4 w-full min-h-[44px] py-2 text-sm font-bold text-[var(--color-vibrant-purple)] border-2 border-[var(--color-vibrant-mint)] rounded-xl hover:bg-[var(--color-vibrant-mint)]/20 transition-colors"
                              >
                                Ver detalles
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-gray-500">
                            <p>No se encontraron eventos.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
            <>
              <div className="hidden md:flex p-4 border-b border-gray-100 justify-between items-center bg-gray-50/50">
                <h2 className="font-semibold text-gray-800">Espacios Culturales</h2>
                <span className="bg-[var(--color-vibrant-mint)] text-white text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {filteredPlaces.length}
                </span>
              </div>
              
              {/* Filters for Espacios */}
              {/* Mobile Filter Toggle */}
              <div className="md:hidden absolute top-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                 <button 
                    onClick={() => setIsFiltersOpen(true)}
                    className="pointer-events-auto bg-[var(--color-vibrant-yellow)] shadow-md px-6 py-3 rounded-full flex items-center gap-2 text-sm font-bold text-[var(--color-vibrant-blue)] border border-[var(--color-vibrant-mint)] hover:scale-105 transition-transform"
                 >
                    <Filter className="w-4 h-4 text-[var(--color-vibrant-purple)]" /> Filtrar Lugares
                    {(tipoEspacio.length > 0 || tipoPlan.length > 0 || disciplina.length > 0) && (
                       <span className="bg-[var(--color-vibrant-coral)] text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                          {tipoEspacio.length + tipoPlan.length + disciplina.length}
                       </span>
                    )}
                 </button>
              </div>

              {/* Backdrop for mobile */}
              {isFiltersOpen && (
                 <div className="md:hidden fixed inset-0 bg-black/60 z-50 transition-opacity pointer-events-auto" onClick={() => setIsFiltersOpen(false)} />
              )}

              {/* Sidebar Content */}
              <div className={`md:flex flex-col flex-1 min-h-0 fixed md:relative bottom-0 left-0 right-0 top-16 md:top-0 bg-[var(--color-vibrant-cream)] rounded-t-3xl md:rounded-none z-[60] md:z-10 transition-transform duration-300 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] md:shadow-none pointer-events-auto md:pointer-events-auto ${isFiltersOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} ${activeTab === 'espacios' ? 'flex' : 'hidden md:flex'}`}>
                {/* Handle & Title */}
                <div className="md:hidden flex flex-col items-center p-3 border-b border-[var(--color-vibrant-mint)]/30">
                   <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-3"></div>
                   <div className="flex justify-between w-full items-center px-2">
                     <h2 className="text-lg font-bold text-[var(--color-vibrant-purple)]">Filtrar Lugares</h2>
                     <button className="bg-gray-100 p-2 rounded-full text-gray-500" onClick={() => setIsFiltersOpen(false)}>
                       <span className="text-lg leading-none">&times;</span>
                     </button>
                   </div>
                </div>

                <div className="hidden md:flex p-4 border-b border-gray-100 justify-between items-center bg-[var(--color-vibrant-cream)]">
                  <h2 className="font-semibold text-[var(--color-vibrant-blue)] flex items-center gap-2"><Filter className="w-4 h-4"/> Filtros</h2>
                  {(tipoEspacio.length > 0 || tipoPlan.length > 0 || disciplina.length > 0) && (
                    <button onClick={() => { setTipoEspacio([]); setTipoPlan([]); setDisciplina([]); }} className="text-xs text-[var(--color-vibrant-coral)] hover:underline">Limpiar</button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
                  {/* Tipo de Espacio */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-vibrant-blue)] mb-3">Tipo de espacio</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {tiposDeEspacio.map((t: any) => {
                        const tLower = t.toLowerCase();
                        let iconSrc = null;
                        if (tLower.includes("bar")) iconSrc = "/icons/nari-cultural/espacio-bar.svg";
                        else if (tLower.includes("biblioteca")) iconSrc = "/icons/nari-cultural/espacio-biblioteca.svg";
                        else if (tLower.includes("cafeter")) iconSrc = "/icons/nari-cultural/espacio-cafeteria.svg";
                        else if (tLower.includes("casa")) iconSrc = "/icons/nari-cultural/espacio-casa-cultural.svg";
                        else if (tLower.includes("publico") || tLower.includes("público")) iconSrc = "/icons/nari-cultural/espacio-espacio-publico.svg";
                        else if (tLower.includes("fundaci")) iconSrc = "/icons/nari-cultural/espacio-fundacion.svg";
                        else if (tLower.includes("museo")) iconSrc = "/icons/nari-cultural/espacio-museo.svg";
                        else if (tLower.includes("teatro")) iconSrc = "/icons/nari-cultural/espacio-teatro.svg";

                        return (
                          <button 
                            key={t}
                            onClick={() => {
                              if (tipoEspacio.includes(t)) setTipoEspacio(tipoEspacio.filter(item => item !== t));
                              else setTipoEspacio([...tipoEspacio, t]);
                            }}
                            className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-all border-2 ${tipoEspacio.includes(t) ? 'bg-[var(--color-vibrant-coral)] border-transparent text-white' : 'bg-white border-transparent text-gray-600 hover:border-gray-200'}`}
                          >
                            {iconSrc && <img src={iconSrc} alt={t} className={`w-8 h-8 ${tipoEspacio.includes(t) ? 'brightness-0 invert' : ''}`} />}
                            <span className="text-center">{t}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tipo de Plan */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-vibrant-blue)] mb-3">Tipo de plan</h4>
                    <div className="flex flex-wrap gap-2">
                      {tiposDePlan.map((t: any) => {
                        const tLower = t.toLowerCase();
                        let iconSrc = null;
                        
                        if (tLower.includes("música") || tLower.includes("musica")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-musical.svg";
                        } else if (tLower.includes("familiar")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-familiar.svg";
                        } else if (tLower.includes("amig")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-con-amigos.svg";
                        } else if (tLower.includes("solo") || tLower.includes("solx")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-solo.svg";
                        } else if (tLower.includes("creativo")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-creativo.svg";
                        } else if (tLower.includes("romántic") || tLower.includes("romantico") || tLower.includes("romantica")) {
                          iconSrc = "/icons/nari-cultural/tipo-de-plan-romantico.svg";
                        }

                        return (
                          <button 
                            key={t}
                            onClick={() => {
                              if (tipoPlan.includes(t)) setTipoPlan(tipoPlan.filter(item => item !== t));
                              else setTipoPlan([...tipoPlan, t]);
                            }}
                            className={`px-4 py-2 rounded-full flex items-center gap-2 text-xs font-semibold shadow-sm transition-all border ${tipoPlan.includes(t) ? 'bg-[var(--color-vibrant-yellow)] border-transparent text-[var(--color-vibrant-blue)]' : 'bg-white border-gray-100 text-gray-600'}`}
                          >
                            {iconSrc && <img src={iconSrc} alt={t} className="w-5 h-5" />}
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Disciplina */}
                  <div>
                    <h4 className="text-xs font-bold text-[var(--color-vibrant-blue)] mb-3">Disciplina</h4>
                    <div className="flex flex-col gap-2">
                      {disciplinas.map((t: any) => {
                        const tLower = t.toLowerCase();
                        let iconSrc = null;

                        if (tLower.includes("conferencia")) iconSrc = "/icons/nari-cultural/disciplina-conferencias.svg";
                        else if (tLower.includes("circular")) iconSrc = "/icons/nari-cultural/disciplina-economia-circular.svg";
                        else if (tLower.includes("exposici")) iconSrc = "/icons/nari-cultural/disciplina-exposiciones.svg";
                        else if (tLower.includes("lectura")) iconSrc = "/icons/nari-cultural/disciplina-lectura.svg";
                        else if (tLower.includes("música") || tLower.includes("musica")) iconSrc = "/icons/nari-cultural/disciplina-musica-en-vivo.svg";
                        else if (tLower.includes("presentaci")) iconSrc = "/icons/nari-cultural/disciplina-presentaciones.svg";
                        else if (tLower.includes("taller")) iconSrc = "/icons/nari-cultural/disciplina-talleres.svg";

                        return (
                          <button 
                            key={t}
                            onClick={() => {
                              if (disciplina.includes(t)) setDisciplina(disciplina.filter(item => item !== t));
                              else setDisciplina([...disciplina, t]);
                            }}
                            className={`px-4 py-3 rounded-2xl flex items-center justify-between text-sm shadow-sm transition-all border ${disciplina.includes(t) ? 'bg-[var(--color-vibrant-purple)] border-transparent text-white font-semibold' : 'bg-white border-gray-100 text-gray-600'}`}
                          >
                            <div className="flex items-center gap-3">
                              {iconSrc && <img src={iconSrc} alt={t} className={`w-6 h-6 ${disciplina.includes(t) ? 'brightness-0 invert' : ''}`} />}
                              <span>{t}</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${disciplina.includes(t) ? 'border-white' : 'border-gray-300'}`}>
                              {disciplina.includes(t) && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <div className="p-4 bg-white border-t border-gray-100 md:hidden pb-[max(env(safe-area-inset-bottom),16px)]">
                  <button 
                    onClick={() => setIsFiltersOpen(false)} 
                    className="w-full bg-[var(--color-vibrant-coral)] text-white rounded-full py-3 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
                  >
                    Aplicar Filtros
                    <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs">
                      {filteredPlaces.length}
                    </span>
                  </button>
                </div>
              </div>

              <div className="hidden md:flex flex-1 overflow-y-auto p-4 space-y-4">
                {filteredPlaces.length > 0 ? (
                  filteredPlaces.map((place: any, idx: number) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200 group">
                      <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {place.lugar || 'Espacio sin nombre'}
                      </h3>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        {place.ubicacion && (
                          <div className="flex items-start">
                            <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400 shrink-0" />
                            <span>{place.ubicacion}</span>
                          </div>
                        )}
                        {place.tipoDeEspacio && (
                          <div className="flex items-center">
                            <Tag className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              {place.tipoDeEspacio}
                            </span>
                          </div>
                        )}
                        {place.tipoDePlan && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {place.tipoDePlan}
                            </span>
                          </div>
                        )}
                        {place.disciplina && (
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500">
                              <strong>Disciplina:</strong> {place.disciplina}
                            </span>
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setSelectedItem({ ...place, type: 'espacio' })}
                        className="mt-3 w-full py-1.5 text-xs font-medium text-purple-600 border border-purple-100 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Ver detalles
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    <p>No se encontraron espacios culturales.</p>
                    <p className="text-xs mt-2">Intenta cambiar los filtros o asegúrate de haber ejecutado <code>npm run fetch-notion</code>.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        {/* Map Area */}
        <section className={`relative bg-gray-100 p-0 md:p-4 w-full md:flex-1 order-1 md:order-2 overflow-hidden ${activeTab === 'eventos' ? 'hidden md:block md:h-full' : 'flex-1 h-full md:h-full'}`}>
           <Map 
             activeTab={activeTab}
             eventos={filteredEvents} 
             espacios={filteredPlaces.map((p: any) => ({
               ...p,
               coordenadas: p.coordenadas ? { lat: p.coordenadas[0], lng: p.coordenadas[1] } : null
             }))}
             selectedMunicipio={selectedMunicipio}
             onSelectMunicipio={setSelectedMunicipio}
             onSelectItem={setSelectedItem}
             userEvents={upcomingEvents}
             focusLocation={focusLocation}
           />
        </section>
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] z-40 px-2 py-2 flex justify-between items-center pb-[max(env(safe-area-inset-bottom),12px)]">
        <button 
          onClick={() => setActiveTab('eventos')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'eventos' ? 'text-[var(--color-vibrant-coral)]' : 'text-gray-400 opacity-60'}`}
        >
          <div className="w-14 h-10 rounded-full flex items-center justify-center mb-1">
            <img src="/icons/nari-cultural/icono-calendario.svg" alt="Eventos" className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold">Eventos</span>
        </button>
        <button 
          onClick={() => setActiveTab('espacios')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'espacios' ? 'text-[var(--color-vibrant-mint)]' : 'text-gray-400 opacity-60'}`}
        >
          <div className="w-14 h-10 rounded-full flex items-center justify-center mb-1">
            <img src="/icons/nari-cultural/icono-mapa.svg" alt="Espacios" className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold">Lugares</span>
        </button>
        <button 
          onClick={() => setActiveTab('pasaporte')}
          className={`flex flex-col items-center flex-1 transition-colors ${activeTab === 'pasaporte' ? 'text-[var(--color-vibrant-orange)]' : 'text-gray-400 opacity-60'}`}
        >
          <div className="w-14 h-10 rounded-full flex items-center justify-center mb-1">
            <img src="/icons/nari-cultural/icono-pasaporte.svg" alt="Pasaporte" className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold">Pasaporte</span>
        </button>
      </div>

      {/* Mobile FAB */}
      {activeTab !== 'pasaporte' && (
        <div className="md:hidden fixed bottom-[90px] right-4 z-50">
          {activeTab === 'espacios' ? (
            <button
              onClick={() => setIsSpaceFormOpen(true)}
              className="bg-[var(--color-vibrant-mint)] border border-white hover:brightness-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Añadir espacio"
            >
              <Plus className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-[var(--color-vibrant-coral)] border border-white hover:brightness-95 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
              aria-label="Añadir evento"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />

      {/* Event Form Modal */}
      <CitizenContributionForm 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
        tiposDeEvento={Array.from(new Set(allEventos.map(e => e.categoria).filter(Boolean)))}
      />

      {/* Space Form Modal */}
      <SpaceContributionForm 
        isOpen={isSpaceFormOpen} 
        onClose={() => setIsSpaceFormOpen(false)} 
        tiposDeEspacio={tiposDeEspacio as string[]}
        tiposDePlan={tiposDePlan as string[]}
        disciplinas={disciplinas as string[]}
      />
    </div>
  );
}
