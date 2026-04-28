import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Calendar, MapPin, ExternalLink, Clock } from 'lucide-react';
import { format, isAfter, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface UserEvent {
  id: string;
  nombre: string;
  descripcion: string;
  organizacion?: string;
  redesOWeb?: string;
  fechaInicio: string;
  fechaFin?: string;
  municipio: string;
  direccion?: string;
  tipoDeEvento?: string;
  imagenPromocional?: string;
  status: string;
}

interface UpcomingEventsProps {
  onSelectItem: (item: UserEvent) => void;
}

export default function UpcomingEvents({ onSelectItem }: UpcomingEventsProps) {
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'user_events'), orderBy('fechaInicio', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const fetchedEvents: UserEvent[] = [];
        const now = new Date();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<UserEvent, 'id'>;
          // Filter out past events and ONLY show approved events
          if (data.status === 'approved' && (isAfter(parseISO(data.fechaInicio), now) || isAfter(parseISO(data.fechaFin || data.fechaInicio), now))) {
            fetchedEvents.push({ id: doc.id, ...data });
          }
        });

        setEvents(fetchedEvents);
      } catch (err: any) {
        console.error("Error fetching events:", err);
        setError("No se pudieron cargar los eventos próximos.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <Calendar className="w-16 h-16 mb-4 text-gray-300" />
        <h3 className="text-xl font-medium text-[var(--color-earth-coffee)] mb-2">No hay eventos próximos</h3>
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto h-full bg-[#fdfaf6]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {events.map((event) => (
            <div key={event.id} className="bg-white rounded-xl shadow-sm border border-[var(--color-earth-sage)] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {event.imagenPromocional && (
                <div className="w-full h-48 bg-gray-100 relative overflow-hidden shrink-0">
                  <img 
                    src={event.imagenPromocional} 
                    alt={`Poster de ${event.nombre}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div className="p-6 flex-grow">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-[var(--color-earth-coffee)] line-clamp-2">{event.nombre}</h3>
                  {event.tipoDeEvento && (
                    <span className="bg-[var(--color-earth-sage)]/20 text-[var(--color-earth-wine)] text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ml-2 border border-[var(--color-earth-sage)]/50">
                      {event.tipoDeEvento}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {event.descripcion}
                </p>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start">
                    <Clock className="w-4 h-4 mr-2 text-[var(--color-earth-terra)] shrink-0 mt-0.5" />
                    <span className="font-medium text-[var(--color-earth-coffee)]">
                      {format(parseISO(event.fechaInicio), "d 'de' MMMM, yyyy - h:mm a", { locale: es })}
                      {event.fechaFin && (
                        <>
                          <br />
                          <span className="text-gray-500 font-normal">hasta {format(parseISO(event.fechaFin), "d 'de' MMMM, yyyy - h:mm a", { locale: es })}</span>
                        </>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-[var(--color-earth-coffee)]">{event.municipio}</span>
                      {event.direccion && <span className="block text-gray-500 text-xs mt-0.5">{event.direccion}</span>}
                    </div>
                  </div>
                  
                  {event.organizacion && (
                    <div className="flex items-center pt-3 mt-3 border-t border-gray-100">
                      <span className="font-medium text-gray-900 mr-2">Organiza:</span>
                      {event.organizacion}
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => onSelectItem(event)}
                  className="mt-5 w-full py-2.5 text-sm font-bold text-white bg-[var(--color-earth-terra)] border border-[var(--color-earth-terra)] rounded-xl hover:bg-[#c95945] transition-colors"
                >
                  Ver detalles completos
                </button>
              </div>
              
              {event.redesOWeb && (
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                  <a 
                    href={event.redesOWeb} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[var(--color-earth-wine)] hover:text-[#53272e] text-sm font-medium flex items-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Más información
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
