import React, { useEffect, useState } from 'react';
import { subscribeToPasaporte, registrarAsistencia, resetPasaporte, Pasaporte, TROFEOS, Trofeo } from '../lib/pasaporte';
import { TrofeoModal } from './TrofeoModal';
import { allEventos } from '../App';
import InteractiveButton from './InteractiveButton';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface PassportGridProps {
  userId: string | null;
}

export default function PassportGrid({ userId }: PassportGridProps) {
  const [pasaporteReal, setPasaporteReal] = useState<Pasaporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [trofeoReciente, setTrofeoReciente] = useState<Trofeo | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  // Fake state for demo
  const [demoPasaporte, setDemoPasaporte] = useState<Pasaporte>({
    userId: 'demo-user',
    xp: 0,
    eventosAsistidos: [],
    trofeosGanados: [] // Todos empiezan bloqueados
  });
  
  const uid = userId || 'demo-user'; // fallback to demo user

  useEffect(() => {
    const unsubscribe = subscribeToPasaporte(uid, (p) => {
      setPasaporteReal(p);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (trofeoReciente) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFC107', '#FF5252', '#4CAF50', '#03A9F4', '#E040FB'],
        zIndex: 10000
      });
    }
  }, [trofeoReciente]);

  const pasaporte = isDemoMode ? demoPasaporte : pasaporteReal;

  const handleRegistrar = async (eventoData: any) => {
    if (!pasaporte) return;
    
    // Transform the event data into what the passport logic expects
    const evento = {
      id: eventoData.nombre_evento.replace(/\s+/g, '-').toLowerCase() + '-' + eventoData.municipio,
      nombre: eventoData.nombre_evento,
      tipo: eventoData.categoria?.toLowerCase() || 'general'
    };

    if (isDemoMode) {
      // Logic simulated for frontend only
      if (demoPasaporte.eventosAsistidos.some(e => e.id === evento.id)) return;
      
      const nuevosEventos = [...demoPasaporte.eventosAsistidos, { ...evento, fecha: new Date().toISOString() }];
      const trofeosNuevos: Trofeo[] = [];
      const trofeosActuales = new Set(demoPasaporte.trofeosGanados);
      let xpGanada = 20;

      TROFEOS.forEach(t => {
        if (!trofeosActuales.has(t.id)) {
          const count = t.tipo ? nuevosEventos.filter(e => e.tipo === t.tipo).length : nuevosEventos.length;
          if (count >= t.req) {
            trofeosNuevos.push(t);
            trofeosActuales.add(t.id);
            xpGanada += t.xp || 0;
          }
        }
      });

      const nuevo: Pasaporte = {
        ...demoPasaporte,
        xp: demoPasaporte.xp + xpGanada,
        eventosAsistidos: nuevosEventos,
        trofeosGanados: Array.from(trofeosActuales)
      };

      setDemoPasaporte(nuevo);
      if (trofeosNuevos.length > 0) {
        setTrofeoReciente(trofeosNuevos[0]);
      }
    } else {
      const result = await registrarAsistencia(pasaporte, evento);
      setPasaporteReal(result.pasaporteActualizado);
      if (result.trofeosNuevos.length > 0) {
        setTrofeoReciente(result.trofeosNuevos[0]);
      }
    }
  };

  const handleReset = async () => {
    if (confirm('¿Estás seguro de que quieres reiniciar todo tu progreso y trofeos?')) {
      if (isDemoMode) {
        setDemoPasaporte({
          userId: 'demo-user',
          xp: 0,
          eventosAsistidos: [],
          trofeosGanados: []
        });
      } else {
        const nuevo = await resetPasaporte(uid);
        setPasaporteReal(nuevo);
      }
    }
  };

  if (loading || !pasaporte) {
    return (
      <div className="flex justify-center items-center h-48 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-vibrant-coral)]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[var(--color-vibrant-yellow)] p-4 md:p-6 overflow-y-auto items-center custom-scrollbar">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-sm border border-[var(--color-vibrant-mint)] mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[var(--color-vibrant-mint)] rounded-full flex items-center justify-center shadow-inner shrink-0">
            <span className="text-2xl">👤</span>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="font-bold text-xl text-gray-800">Pasaporte Cultural</h3>
            <p className="text-sm text-gray-500 font-bold">Experiencia: <span className="text-[var(--color-vibrant-purple)]">{pasaporte.xp} XP</span></p>
          </div>
          <button 
            onClick={handleReset}
            className="text-xs text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0"
          >
            Reiniciar progreso
          </button>
          
          <button 
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={`text-xs ml-2 px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 border ${isDemoMode ? 'bg-[var(--color-vibrant-purple)] text-white border-transparent' : 'bg-transparent text-gray-500 border-gray-300'}`}
            title="Activar o desactivar simulación sin base de datos"
          >
            {isDemoMode ? 'Demo ON' : 'Demo OFF'}
          </button>
        </div>

        <div className="mb-10">
          <h4 className="font-bold text-[var(--color-vibrant-blue)] mb-4">Tus Trofeos Obtenidos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TROFEOS.map((t, index) => {
              const unlocked = pasaporte.trofeosGanados.includes(t.id);
              const progressCount = t.tipo 
                ? pasaporte.eventosAsistidos.filter(e => e.tipo === t.tipo).length
                : pasaporte.eventosAsistidos.length;
              const currentProgress = Math.min(progressCount, t.req);
              const progressPercentage = Math.round((currentProgress / t.req) * 100);

              return (
                <motion.div 
                  key={t.id} 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${unlocked ? 'bg-white shadow-sm border-gray-100' : 'bg-gray-50 border-gray-100/50'}`}
                >
                  <div className={`text-4xl mb-3 transition-opacity duration-300 ${unlocked ? '' : 'grayscale opacity-30'}`}>{t.icono}</div>
                  <h5 className={`font-bold text-center text-sm mb-1 ${unlocked ? 'text-gray-800' : 'text-gray-400'}`}>{t.nombre}</h5>
                  <p className={`text-[10px] text-center leading-snug ${unlocked ? 'text-gray-500' : 'text-gray-400'}`}>{t.descripcion}</p>
                  
                  <div className="w-full mt-3">
                    <div className="flex justify-between text-[10px] font-bold mb-1">
                      <span className={unlocked ? 'text-green-600' : 'text-gray-500'}>
                        {unlocked ? '¡Desbloqueado!' : 'En progreso'}
                      </span>
                      <span className={unlocked ? 'text-green-600' : 'text-gray-500'}>
                        {currentProgress}/{t.req}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-500 ${unlocked ? 'bg-green-500' : 'bg-[var(--color-vibrant-coral)]'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-[var(--color-vibrant-blue)] mb-2">Asistir a Eventos</h4>
          <p className="text-xs text-gray-500 mb-4">Haz clic en los eventos para registrar tu asistencia y ganar XP. (Entorno de prueba)</p>
          
          <div className="space-y-3">
            {allEventos.slice(0, 5).map((ev, idx) => {
              const eventoId = ev.nombre_evento.replace(/\s+/g, '-').toLowerCase() + '-' + ev.municipio;
              const yaAsistio = pasaporte.eventosAsistidos.some(e => e.id === eventoId);
              
              return (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 border border-gray-100 p-4 rounded-xl hover:bg-gray-100/50 transition-colors gap-3">
                  <div>
                    <p className="font-bold text-sm text-gray-800 leading-tight mb-1">{ev.nombre_evento}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                       <span className="bg-gray-200 px-2 py-0.5 rounded-md">{ev.categoria}</span> 
                       {ev.municipio}
                    </p>
                  </div>
                  <div>
                    {yaAsistio ? (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full flex justify-center items-center">
                         ✓ Asistido
                      </span>
                    ) : (
                      <InteractiveButton 
                        color="var(--color-vibrant-coral)" 
                        className="w-full sm:w-auto !text-xs py-2 px-4 shadow-sm"
                        onClick={() => handleRegistrar(ev)}
                      >
                        Registrar Asistencia
                      </InteractiveButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TrofeoModal trofeo={trofeoReciente} onClose={() => setTrofeoReciente(null)} />
    </div>
  );
}
