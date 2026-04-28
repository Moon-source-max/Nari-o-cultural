import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface AchievementLevel {
  level: 'Bronce' | 'Plata' | 'Oro';
  required: number;
}

export type Category = 
  | 'gastronomia' 
  | 'museos'
  | 'musica' 
  | 'editorial' 
  | 'comunidad'
  | 'culturales'
  | 'cineforos'
  | 'exposiciones'
  | 'teatro'
  | 'cafeterias';

export const CATEGORY_DETAILS: Record<Category, { title: string, description: string }> = {
  gastronomia: { title: "Sabores Volcánicos", description: "Recorre las cocinas y fogones que dan vida al paladar nariñense." },
  museos: { title: "Guardián de la Memoria", description: "Un viaje por los tesoros históricos y el patrimonio que resguarda nuestro territorio." },
  musica: { title: "Eco de los Andes", description: "Vive la potencia de nuestros sonidos, desde la tradición hasta las nuevas propuestas." },
  editorial: { title: "Tinta Independiente", description: "Explora fanzines, libros-arte y las narrativas que nacen de la producción editorial local." },
  comunidad: { title: "Minga Cultural", description: "Participa en los encuentros que fortalecen el tejido social y la colaboración ciudadana." },
  culturales: { title: "Espíritu Nariñense", description: "Conéctate con las diversas expresiones y festivales que definen nuestra identidad." },
  cineforos: { title: "Butaca Crítica", description: "Descubre historias y debates a través del lente del cine independiente y alternativo." },
  exposiciones: { title: "Mirada Estética", description: "Aprecia el talento de artistas locales en galerías y espacios de artes visuales." },
  teatro: { title: "Telón del Sur", description: "Siente la magia de las artes escénicas y la interpretación en los escenarios de la ciudad." },
  cafeterias: { title: "Pausa Cafetera", description: "Disfruta del aroma de nuestra tierra en los mejores puntos de encuentro y tertulia." }
};

export const ACHIEVEMENTS_CONFIG: Record<Category, AchievementLevel[]> = {
  gastronomia: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 6 },
  ],
  museos: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 5 },
  ],
  musica: [
    { level: 'Bronce', required: 2 },
    { level: 'Plata', required: 5 },
    { level: 'Oro', required: 10 },
  ],
  editorial: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 4 },
    { level: 'Oro', required: 8 },
  ],
  comunidad: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 7 },
  ],
  culturales: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 4 },
    { level: 'Oro', required: 8 },
  ],
  cineforos: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 6 },
  ],
  exposiciones: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 6 },
  ],
  teatro: [
    { level: 'Bronce', required: 1 },
    { level: 'Plata', required: 3 },
    { level: 'Oro', required: 5 },
  ],
  cafeterias: [
    { level: 'Bronce', required: 2 },
    { level: 'Plata', required: 5 },
    { level: 'Oro', required: 10 },
  ]
};

export interface StampData {
  category: Category;
  visits: number;
  currentLevel: 'Ninguno' | 'Bronce' | 'Plata' | 'Oro';
  nextLevelVisitsRequired: number | null;
  progress: number; // 0 to 1
  isUnlocked: boolean;
  details: { title: string, description: string };
}

export function usePassportLogic(userId: string | null) {
  const [stamps, setStamps] = useState<StampData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Modo visualización: mock data
    const mockVisits: Partial<Record<Category, number>> = {
      gastronomia: 4,
      musica: 1,
      culturales: 8,
      cafeterias: 3
    };

    const processedStamps: StampData[] = (Object.keys(ACHIEVEMENTS_CONFIG) as Category[]).map(category => {
      const visits = mockVisits[category] || 0;
      const config = ACHIEVEMENTS_CONFIG[category];
      
      let currentLevel: StampData['currentLevel'] = 'Ninguno';
      let nextRequired: number | null = config[0].required;
      let progress = visits / config[0].required;

      if (visits >= config[2].required) {
        currentLevel = 'Oro';
        nextRequired = null;
        progress = 1;
      } else if (visits >= config[1].required) {
        currentLevel = 'Plata';
        nextRequired = config[2].required;
        progress = (visits - config[1].required) / (config[2].required - config[1].required);
      } else if (visits >= config[0].required) {
        currentLevel = 'Bronce';
        nextRequired = config[1].required;
        progress = (visits - config[0].required) / (config[1].required - config[0].required);
      }

      return {
        category,
        visits,
        currentLevel,
        nextLevelVisitsRequired: nextRequired,
        progress: Math.min(Math.max(progress, 0), 1),
        isUnlocked: currentLevel !== 'Ninguno',
        details: CATEGORY_DETAILS[category]
      };
    });

    setStamps(processedStamps);
    setLoading(false);

    /* Firebase temporalmente comentado para ver UI
    const effectiveUserId = userId || 'anonymous';
    const q = query(collection(db, 'visitas'), where('userId', '==', effectiveUserId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: Record<Category, number> = {
        gastronomia: 0,
        museos: 0,
        musica: 0,
        editorial: 0,
        comunidad: 0,
        culturales: 0,
        cineforos: 0,
        exposiciones: 0,
        teatro: 0,
        cafeterias: 0
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        const cat = data.categoria?.toLowerCase() || '';
        const tipoEspacio = data.tipoEspacio?.[0]?.toLowerCase() || ''; // may be array
        const combined = cat + " " + tipoEspacio;
        
        if (counts[combined as Category] !== undefined) {
          counts[combined as Category]++;
        } else if (combined) {
          if (combined.includes('gastro') || combined.includes('comida') || combined.includes('restaurant')) counts.gastronomia++;
          else if (combined.includes('museo')) counts.museos++;
          else if (combined.includes('music') || combined.includes('concierto')) counts.musica++;
          else if (combined.includes('edit') || combined.includes('libreria') || combined.includes('lectura')) counts.editorial++;
          else if (combined.includes('comunidad') || combined.includes('publico') || combined.includes('fundacion')) counts.comunidad++;
          else if (combined.includes('cine') || combined.includes('pelicula')) counts.cineforos++;
          else if (combined.includes('exposici') || combined.includes('galeria') || combined.includes('arte')) counts.exposiciones++;
          else if (combined.includes('teatro') || combined.includes('escenic')) counts.teatro++;
          else if (combined.includes('cafe') || combined.includes('bar')) counts.cafeterias++;
          else if (combined.includes('cultur') || combined.includes('festival')) counts.culturales++;
        }
      });

      const processedStamps: StampData[] = (Object.keys(ACHIEVEMENTS_CONFIG) as Category[]).map(category => {
        const visits = counts[category];
        const config = ACHIEVEMENTS_CONFIG[category];
        
        let currentLevel: StampData['currentLevel'] = 'Ninguno';
        let nextRequired: number | null = config[0].required;
        let progress = visits / config[0].required;

        if (visits >= config[2].required) {
          currentLevel = 'Oro';
          nextRequired = null;
          progress = 1;
        } else if (visits >= config[1].required) {
          currentLevel = 'Plata';
          nextRequired = config[2].required;
          progress = (visits - config[1].required) / (config[2].required - config[1].required);
        } else if (visits >= config[0].required) {
          currentLevel = 'Bronce';
          nextRequired = config[1].required;
          progress = (visits - config[0].required) / (config[1].required - config[0].required);
        }

        return {
          category,
          visits,
          currentLevel,
          nextLevelVisitsRequired: nextRequired,
          progress: Math.min(Math.max(progress, 0), 1),
          isUnlocked: currentLevel !== 'Ninguno',
          details: CATEGORY_DETAILS[category]
        };
      });

      setStamps(processedStamps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching passport visits:", error);
      setLoading(false);
    });

    return () => unsubscribe();
    */
  }, [userId]);

  return { stamps, loading };
}
