import { useMemo } from 'react';
import { eachDayOfInterval, parseISO, isValid, startOfDay, endOfDay } from 'date-fns';

export interface RawEvent {
  id: string | number;
  title: string;
  startDate: string | Date; 
  endDate?: string | Date; 
  [key: string]: any;
}

export interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  dateKey?: string; // Útil si necesitas agrupar por día (ej: '2024-01-05')
  originalEvent: RawEvent;
}

/**
 * Hook para transformar eventos a un formato de calendario compatible
 * con librerías estándar (start y end).
 * Además, si necesitas renderizar manualmente cada día en un grid propio,
 * expande los eventos de varios días para que aparezcan en todos los días del rango.
 */
export function useFormatEvents(events: RawEvent[]): CalendarEvent[] {
  return useMemo(() => {
    const formattedEvents: CalendarEvent[] = [];

    events.forEach((evento) => {
      // 1. Convertir a Date
      const startDate = typeof evento.startDate === 'string' ? parseISO(evento.startDate) : evento.startDate;
      const endDate = evento.endDate 
        ? (typeof evento.endDate === 'string' ? parseISO(evento.endDate) : evento.endDate)
        : startDate; // Si no hay endDate, es de un solo día

      if (!isValid(startDate) || !isValid(endDate)) {
        return; // Ignorar eventos con fechas inválidas
      }

      // -- OPCIÓN A: Formato estándar para librerías (react-big-calendar, FullCalendar)
      // Solo requieren un evento de inicio y fin, la librería se encarga de extenderlo visualmente.
      formattedEvents.push({
        id: evento.id,
        title: evento.title,
        start: startOfDay(startDate),
        end: endOfDay(endDate),
        originalEvent: evento,
      });

      /* 
       * -- OPCIÓN B: Expansión por día (Grid propio manual) --
       * Si tu calendario requiere que inyectes manualmente el evento
       * en cada celda (cada día), puedes usar date-fns para expandirlo:
       * 
       * const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
       * daysInRange.forEach(day => {
       *   formattedEvents.push({
       *     id: `${evento.id}-${day.getTime()}`, // id único por aparición
       *     title: evento.title,
       *     start: startOfDay(day),
       *     end: endOfDay(day),
       *     dateKey: format(day, 'yyyy-MM-dd'),
       *     originalEvent: evento,
       *   });
       * });
       */
    });

    return formattedEvents;
  }, [events]);
}
