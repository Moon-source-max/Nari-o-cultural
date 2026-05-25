import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isWithinInterval, setYear, setMonth, setDate, getYear, getMonth, getDate } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarViewProps {
  permanentes: any[];
  proximos: any[];
  onSelectItem: (item: any) => void;
}

const MONTH_MAP: Record<string, number> = {
  'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3, 'mayo': 4, 'junio': 5,
  'julio': 6, 'agosto': 7, 'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11
};

function parseFechaString(fechasStr: string | undefined): { start: Date, end: Date } | null {
  if (!fechasStr) return null;
  const lower = fechasStr.toLowerCase();
  
  const currentYear = new Date().getFullYear();
  let startMonth = 0;
  let endMonth = 0;
  
  // Find months in string
  Object.keys(MONTH_MAP).forEach(m => {
    if (lower.includes(m)) {
      startMonth = MONTH_MAP[m];
      endMonth = MONTH_MAP[m]; // default same
    }
  });

  // Very basic regex to catch patterns like "28 de diciembre", "2 al 7 de enero", "24 y 25 de septiembre"
  const singleDate = lower.match(/^(\d{1,2})\s+de\s+([a-z]+)$/);
  if (singleDate) {
    const day = parseInt(singleDate[1], 10);
    const m = MONTH_MAP[singleDate[2]];
    if (m !== undefined) {
      const d = new Date(currentYear, m, day);
      return { start: d, end: d };
    }
  }

  const rangeDate = lower.match(/^(\d{1,2})\s*(al|y)\s*(\d{1,2})\s*de\s+([a-z]+)$/);
  if (rangeDate) {
    const startDay = parseInt(rangeDate[1], 10);
    const endDay = parseInt(rangeDate[3], 10);
    const m = MONTH_MAP[rangeDate[4]];
    if (m !== undefined) {
      return { 
        start: new Date(currentYear, m, startDay), 
        end: new Date(currentYear, m, endDay) 
      };
    }
  }
  
  // Just month name e.g. "Junio"
  if (Object.keys(MONTH_MAP).includes(lower.trim())) {
    const m = MONTH_MAP[lower.trim()];
    return {
      start: new Date(currentYear, m, 1),
      end: new Date(currentYear, m + 1, 0)
    };
  }

  return null;
}

export default function CalendarView({ permanentes, proximos, onSelectItem }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const dateFormat = "d";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const eventsMap = useMemo(() => {
    const map = new Map<string, any[]>();
    
    // Add real date events
    proximos.forEach(ev => {
      if (ev.fechaInicio) {
        try {
          const start = parseISO(ev.fechaInicio);
          const end = ev.fechaFin ? parseISO(ev.fechaFin) : start;
          
          const evDays = eachDayOfInterval({ start, end });
          evDays.forEach(d => {
            const dateKey = format(d, 'yyyy-MM-dd');
            if (!map.has(dateKey)) map.set(dateKey, []);
            map.get(dateKey)!.push({ ...ev, _source: 'proximo' });
          });
        } catch (e) {
          // ignore invalid dates
        }
      }
    });

    // Add permanent/text-based ones
    permanentes.forEach(ev => {
      const parsed = parseFechaString(ev.fecha_inicio);
      if (parsed) {
        const evDays = eachDayOfInterval({ start: parsed.start, end: parsed.end });
        evDays.forEach(d => {
          const dateKey = format(d, 'yyyy-MM-dd');
          if (!map.has(dateKey)) map.set(dateKey, []);
          map.get(dateKey)!.push({ ...ev, _source: 'permanente' });
        });
      }
    });

    return map;
  }, [permanentes, proximos]);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  
  const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
  const selectedEvents = selectedDateStr ? eventsMap.get(selectedDateStr) || [] : [];

  return (
    <div className="flex flex-col flex-1 h-full bg-[var(--color-vibrant-cream)]">
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 md:relative relative">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5 text-[var(--color-vibrant-blue)]" />
          </button>
          <h2 className="text-lg font-bold text-[var(--color-vibrant-blue)] capitalize">
            {format(currentDate, "MMMM yyyy", { locale: es })}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5 text-[var(--color-vibrant-blue)]" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
            <div key={day} className="text-center font-bold text-xs text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, idx) => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsMap.get(dateKey) || [];
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(day)}
                className={`
                  aspect-square flex flex-col items-center justify-start p-1 rounded-lg transition-all relative
                  ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                  ${isSelected ? 'bg-[var(--color-vibrant-blue)] text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                <div className={`
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold
                  ${isToday && !isSelected ? 'bg-[var(--color-vibrant-coral)] text-white' : ''}
                `}>
                  {format(day, dateFormat)}
                </div>
                
                <div className="flex gap-1 mt-1 justify-center">
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${ev._source === 'proximo' ? 'bg-[var(--color-vibrant-mint)]' : 'bg-[var(--color-vibrant-orange)]'}`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-vibrant-orange)]"></div>
            <span>Permanentes / Anuales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[var(--color-vibrant-mint)]"></div>
            <span>Próximos</span>
          </div>
        </div>
      </div>

      {/* Events List for selected day */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-24 md:pb-4">
        {selectedDate && (
          <h3 className="font-bold text-[var(--color-vibrant-blue)] mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[var(--color-vibrant-coral)]" />
            Eventos el {format(selectedDate, "d 'de' MMMM", { locale: es })}
          </h3>
        )}

        {selectedEvents.length > 0 ? (
          <div className="space-y-3">
            {selectedEvents.map((evento, idx) => (
              <button
                key={idx}
                onClick={() => onSelectItem({ ...evento, type: 'evento', nombre_evento: evento.nombre || evento.nombre_evento })}
                className="w-full text-left bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex items-start gap-4"
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${evento._source === 'proximo' ? 'bg-[var(--color-vibrant-mint)]/20' : 'bg-[var(--color-vibrant-orange)]/20'}`}>
                  {evento._source === 'proximo' ? (
                    <Clock className="w-6 h-6 text-[var(--color-vibrant-mint)]" />
                  ) : (
                    <CalendarIcon className="w-6 h-6 text-[var(--color-vibrant-orange)]" />
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 group-hover:text-[var(--color-vibrant-blue)] transition-colors line-clamp-2">
                    {evento.nombre || evento.nombre_evento}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{evento.municipio || 'Pasto'}</span>
                  </div>
                  {(evento.fechaInicio || evento.fecha_inicio) && (
                    <p className="text-xs text-[var(--color-vibrant-blue)] font-medium mt-1">
                      {evento._source === 'proximo' 
                        ? format(parseISO(evento.fechaInicio), "h:mm a", { locale: es }) 
                        : evento.fecha_inicio}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500">No hay eventos para esta fecha.</p>
          </div>
        )}
      </div>
    </div>
  );
}
