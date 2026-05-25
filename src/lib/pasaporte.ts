import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

export interface Trofeo {
  id: string;
  nombre: string;
  descripcion: string;
  icono: string;
  xp: number;
  req: number;
  tipo?: string;
}

export interface Pasaporte {
  userId: string;
  xp: number;
  eventosAsistidos: { id: string; tipo: string; nombre: string; fecha: string }[];
  trofeosGanados: string[];
}

export const TROFEOS: Trofeo[] = [
  // Trofeos por categoría (1 trofeo por cada categoría de tu app)
  { id: 'sabores_volcanicos', nombre: 'Sabores Volcánicos',    descripcion: 'Recorre las cocinas y fogones nariñenses',         icono: '🍲', req: 2, xp: 40, tipo: 'gastronomia' },
  { id: 'guardian_memoria',   nombre: 'Guardián de la Memoria', descripcion: 'Visita tesoros históricos y patrimoniales',        icono: '🏛️', req: 2, xp: 40, tipo: 'patrimonio' },
  { id: 'eco_andes',          nombre: 'Eco de los Andes',       descripcion: 'Vive los sonidos tradicionales y contemporáneos',  icono: '🎶', req: 2, xp: 40, tipo: 'musica' },
  { id: 'tinta_independiente',nombre: 'Tinta Independiente',    descripcion: 'Explora la producción editorial y clubs de lectura',icono: '📚', req: 2, xp: 40, tipo: 'literatura' },
  { id: 'minga_cultural',     nombre: 'Minga Cultural',         descripcion: 'Participa en encuentros y colaboración ciudadana', icono: '🤝', req: 2, xp: 40, tipo: 'comunidad' },
  { id: 'espiritu_narinense', nombre: 'Espíritu Nariñense',     descripcion: 'Conéctate con festivales e identidad local',       icono: '🎉', req: 2, xp: 40, tipo: 'festivales' },
  { id: 'butaca_critica',     nombre: 'Butaca Crítica',         descripcion: 'Descubre cine independiente y alternativo',        icono: '🎬', req: 2, xp: 40, tipo: 'cine' },
  { id: 'mirada_estetica',    nombre: 'Mirada Estética',        descripcion: 'Aprecia artistas locales en galerías',             icono: '🎨', req: 2, xp: 40, tipo: 'artes_visuales' },
  { id: 'telon_sur',          nombre: 'Telón del Sur',          descripcion: 'Siente la magia de las artes escénicas',          icono: '🎭', req: 2, xp: 40, tipo: 'escénicas' },
  { id: 'pausa_cafetera',     nombre: 'Pausa Cafetera',         descripcion: 'Disfruta del aroma y la tertulia local',          icono: '☕', req: 2, xp: 40, tipo: 'cafe' },

  // Trofeos por progreso general
  { id: 'primer_paso',  nombre: 'Primer paso',         descripcion: 'Asiste a tu primer evento',    icono: '🎟️', req: 1,  xp: 20 },
  { id: 'explorador',   nombre: 'Explorador',           descripcion: 'Asiste a 3 eventos',            icono: '🗺️', req: 3,  xp: 50 },
  { id: 'ciudadano',    nombre: 'Ciudadano cultural',   descripcion: 'Asiste a 5 eventos',            icono: '⭐', req: 5,  xp: 80 },
  { id: 'leyenda',      nombre: 'Leyenda local',        descripcion: 'Asiste a 10 eventos',           icono: '🌟', req: 10, xp: 150 },
];

export async function getPasaporte(userId: string): Promise<Pasaporte> {
  const ref = doc(db, 'pasaportes', userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as Pasaporte;
  const nuevo: Pasaporte = { userId, xp: 0, eventosAsistidos: [], trofeosGanados: [] };
  await setDoc(ref, nuevo);
  return nuevo;
}

export async function registrarAsistencia(
  pasaporte: Pasaporte,
  evento: { id: string; tipo: string; nombre: string }
): Promise<{ pasaporteActualizado: Pasaporte; trofeosNuevos: Trofeo[] }> {
  if (pasaporte.eventosAsistidos.find(e => e.id === evento.id)) {
    return { pasaporteActualizado: pasaporte, trofeosNuevos: [] };
  }

  const nuevaAsistencia = { ...evento, fecha: new Date().toISOString() };
  const asistenciasActualizadas = [...pasaporte.eventosAsistidos, nuevaAsistencia];

  const trofeosNuevos: Trofeo[] = [];
  const trofeosGanadosActualizados = [...pasaporte.trofeosGanados];

  for (const trofeo of TROFEOS) {
    if (trofeosGanadosActualizados.includes(trofeo.id)) continue;
    const conteo = trofeo.tipo
      ? asistenciasActualizadas.filter(e => e.tipo === trofeo.tipo).length
      : asistenciasActualizadas.length;
    if (conteo >= trofeo.req) {
      trofeosNuevos.push(trofeo);
      trofeosGanadosActualizados.push(trofeo.id);
    }
  }

  const xpGanado = 15 + trofeosNuevos.reduce((acc, t) => acc + t.xp, 0);
  const xpTotal = pasaporte.xp + xpGanado;

  await updateDoc(doc(db, 'pasaportes', pasaporte.userId), {
    xp: xpTotal,
    eventosAsistidos: arrayUnion(nuevaAsistencia),
    trofeosGanados: trofeosGanadosActualizados,
  });

  return {
    pasaporteActualizado: { ...pasaporte, xp: xpTotal, eventosAsistidos: asistenciasActualizadas, trofeosGanados: trofeosGanadosActualizados },
    trofeosNuevos,
  };
}
