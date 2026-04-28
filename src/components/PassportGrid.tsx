import React from 'react';
import { usePassportLogic, StampData, Category } from '../hooks/usePassportLogic';
import { 
  Award, Lock, Coffee, Music, BookOpen, Users, 
  Landmark, Ticket, Film, Frame, Drama, CupSoda
} from 'lucide-react';
import { motion } from 'motion/react';

interface PassportGridProps {
  userId: string | null;
}

const CATEGORY_ICONS: Record<Category, React.ElementType> = {
  gastronomia: CupSoda,
  museos: Landmark,
  musica: Music,
  editorial: BookOpen,
  comunidad: Users,
  culturales: Ticket,
  cineforos: Film,
  exposiciones: Frame,
  teatro: Drama,
  cafeterias: Coffee,
};

const CATEGORY_COLORS: Record<Category, string> = {
  gastronomia: 'text-orange-500 bg-orange-100 border-orange-200',
  museos: 'text-stone-500 bg-stone-100 border-stone-200',
  musica: 'text-purple-500 bg-purple-100 border-purple-200',
  editorial: 'text-blue-500 bg-blue-100 border-blue-200',
  comunidad: 'text-green-500 bg-green-100 border-green-200',
  culturales: 'text-rose-500 bg-rose-100 border-rose-200',
  cineforos: 'text-indigo-500 bg-indigo-100 border-indigo-200',
  exposiciones: 'text-cyan-500 bg-cyan-100 border-cyan-200',
  teatro: 'text-red-500 bg-red-100 border-red-200',
  cafeterias: 'text-amber-700 bg-amber-100 border-amber-200',
};

const LEVEL_COLORS = {
  Bronce: 'text-amber-600 bg-amber-100 border-amber-300',
  Plata: 'text-gray-500 bg-gray-100 border-gray-300',
  Oro: 'text-yellow-600 bg-yellow-100 border-yellow-400',
};

export default function PassportGrid({ userId }: PassportGridProps) {
  const { stamps, loading } = usePassportLogic(userId);

  if (loading) {
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
            <h3 className="font-bold text-xl text-gray-800">Pasaporte Ciudadano</h3>
            <p className="text-sm text-gray-500 leading-tight">Colecciona sellos verificados asistiendo a eventos y visitando lugares locales.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stamps.map((stamp) => (
            <StampCard key={stamp.category} stamp={stamp} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StampCard({ stamp }: { stamp: StampData }) {
  const Icon = CATEGORY_ICONS[stamp.category];
  const colorClass = CATEGORY_COLORS[stamp.category];
  const isLocked = !stamp.isUnlocked;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-300 ${isLocked ? 'bg-[var(--color-vibrant-cream)] border-transparent opacity-90' : 'bg-white shadow-sm border-gray-100'}`}
    >
      <div className="absolute top-3 right-3">
        {isLocked ? (
          <Lock className="w-4 h-4 text-[#c5b58e]" />
        ) : (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-bold ${LEVEL_COLORS[stamp.currentLevel as keyof typeof LEVEL_COLORS]}`}>
            <Award className="w-3 h-3" />
            {stamp.currentLevel}
          </div>
        )}
      </div>

      <div className={`w-16 h-16 mt-4 opacity-90 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-3 ${isLocked ? 'bg-[#efe5ce] text-[#b8a77f]' : colorClass.split(' ')[1] + ' ' + colorClass.split(' ')[0]}`}>
        <Icon className="w-8 h-8" />
      </div>

      <h4 className={`font-bold text-center text-sm leading-tight mb-1 ${isLocked ? 'text-[#968352]' : 'text-gray-900'}`}>{stamp.details.title}</h4>
      <p className={`text-[10px] text-center leading-snug mb-3 min-h-[30px] ${isLocked ? 'text-[#a89566]' : 'text-gray-500'}`}>{stamp.details.description}</p>
      
      {!isLocked && stamp.nextLevelVisitsRequired === null ? (
        <p className="text-xs text-yellow-600 font-bold mb-3 px-2 py-1 bg-yellow-50 rounded-md">¡Nivel Máximo Alcanzado!</p>
      ) : (
        <p className={`text-[11px] font-bold mb-2 ${isLocked ? 'text-[#b09e70]' : 'text-gray-600'}`}>
          {stamp.visits} {stamp.visits === 1 ? 'visita' : 'visitas'}
          {stamp.nextLevelVisitsRequired && ` / ${stamp.nextLevelVisitsRequired} sig. nivel`}
        </p>
      )}

      {/* Progress Bar */}
      {stamp.nextLevelVisitsRequired !== null && (
        <div className={`w-full h-2 rounded-full overflow-hidden mt-auto ${isLocked ? 'bg-[#e2d6ba]' : 'bg-gray-100'}`}>
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${isLocked ? 'bg-[#c5b58e]' : 'bg-gradient-to-r from-blue-400 to-blue-500'}`}
            style={{ width: `${stamp.progress * 100}%` }}
          />
        </div>
      )}
    </motion.div>
  );
}
