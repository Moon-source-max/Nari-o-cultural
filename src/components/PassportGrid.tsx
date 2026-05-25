import React, { useEffect, useState } from 'react';
import { getPasaporte, registrarAsistencia, Pasaporte, TROFEOS, Trofeo } from '../lib/pasaporte';
import { TrofeoModal } from './TrofeoModal';
import { allEventos } from '../App';
import InteractiveButton from './InteractiveButton';

interface PassportGridProps {
  userId: string | null;
}

export default function PassportGrid({ userId }: PassportGridProps) {
  const [pasaporte, setPasaporte] = useState<Pasaporte | null>(null);
  const [loading, setLoading] = useState(true);
  const [trofeoReciente, setTrofeoReciente] = useState<Trofeo | null>(null);
  
  const uid = userId || 'demo-user'; // fallback to demo user

  useEffect(() => {
    getPasaporte(uid).then(p => {
      setPasaporte(p);
      setLoading(false);
    });
  }, [uid]);

  const handleRegistrar = async (eventoData: any) => {
    if (!pasaporte) return;
    
    // Transform the event data into what the passport logic expects
    const evento = {
      id: eventoData.nombre_evento.replace(/\s+/g, '-').toLowerCase() + '-' + eventoData.municipio,
      nombre: eventoData.nombre_evento,
      tipo: eventoData.categoria?.toLowerCase() || 'general'
    };

    const result = await registrarAsistencia(pasaporte, evento);
    setPasaporte(result.pasaporteActualizado);
    
    if (result.trofeosNuevos.length > 0) {
      // Show the first new trophy
      setTrofeoReciente(result.trofeosNuevos[0]);
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
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 shrink-0 rounded-full bg-[var(--color-vibrant-mint)] flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
            <span className="text-2xl">👤</span>
          </div>
          <div>
            <h3 className="font-bold text-xl text-gray-800">Pasaporte Cultural</h3>
            <p className="text-sm text-gray-500 font-bold">Experiencia: <span className="text-[var(--color-vibrant-purple)]">{pasaporte.xp} XP</span></p>
          </div>
        </div>

        <div className="mb-10">
          <h4 className="font-bold text-[var(--color-vibrant-blue)] mb-4">Tus Trofeos Obtenidos</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TROFEOS.map(t => {
              const unlocked = pasaporte.trofeosGanados.includes(t.id);
              return (
                <div key={t.id} className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${unlocked ? 'bg-white shadow-sm border-gray-100' : 'bg-gray-50 border-transparent opacity-60'}`}>
                  <div className="text-4xl mb-3">{t.icono}</div>
                  <h5 className="font-bold text-center text-sm mb-1 text-gray-800">{t.nombre}</h5>
                  <p className="text-[10px] text-center text-gray-500 leading-snug">{t.descripcion}</p>
                  
                  {unlocked ? (
                    <span className="mt-3 text-[10px] font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                      ¡Obtenido!
                    </span>
                  ) : (
                    <span className="mt-3 text-[10px] font-bold bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full">
                      Bloqueado
                    </span>
                  )}
                </div>
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
