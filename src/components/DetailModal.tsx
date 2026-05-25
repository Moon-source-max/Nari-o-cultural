import React from 'react';
import { X, MapPin, Calendar, Tag, ExternalLink, Clock, Globe, Info, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface DetailModalProps {
  item: any | null;
  onClose: () => void;
}

export default function DetailModal({ item, onClose }: DetailModalProps) {
  if (!item) return null;

  const isEvento = item.type === 'evento';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      if (dateStr.includes('T')) {
        return format(parseISO(dateStr), "d 'de' MMMM, yyyy - h:mm a", { locale: es });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const displayFechaInicio = formatDate(item.fecha_inicio || item.fechaInicio);
  const displayFechaFin = formatDate(item.fecha_fin || item.fechaFin);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className={`p-4 flex justify-between items-center shrink-0 ${isEvento ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
            <h2 className="font-bold text-lg truncate pr-4">
              {isEvento ? 'Detalles del Evento' : 'Detalles del Espacio'}
            </h2>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {isEvento ? item.nombre_evento : item.lugar}
            </h3>

            <div className="space-y-4">
              {/* Main Info */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start">
                  <MapPin className={`w-5 h-5 mr-3 shrink-0 ${isEvento ? 'text-blue-500' : 'text-purple-500'}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Ubicación</p>
                    <p className="text-sm text-gray-600">
                      {isEvento ? item.municipio : item.ubicacion}
                    </p>
                  </div>
                </div>

                {isEvento && (
                  <div className="flex items-start">
                    <Calendar className="w-5 h-5 mr-3 shrink-0 text-blue-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Fecha</p>
                      <p className="text-sm text-gray-600">
                        {displayFechaInicio}{displayFechaFin ? ` - ${displayFechaFin}` : ''}
                      </p>
                    </div>
                  </div>
                )}

                {(isEvento ? item.categoria : item.tipoDeEspacio) && (
                  <div className="flex items-start">
                    <Tag className={`w-5 h-5 mr-3 shrink-0 ${isEvento ? 'text-blue-500' : 'text-purple-500'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Categoría</p>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-xs font-medium ${isEvento ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                        {isEvento ? item.categoria : item.tipoDeEspacio}
                      </span>
                    </div>
                  </div>
                )}

                {!isEvento && item.tipoDePlan && (
                  <div className="flex items-start">
                    <Users className="w-5 h-5 mr-3 shrink-0 text-purple-500" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Tipo de Plan</p>
                      <p className="text-sm text-gray-600">{item.tipoDePlan}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {(isEvento ? item.descripcion : item.disciplina) && (
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start mb-2">
                    <Info className={`w-5 h-5 mr-3 shrink-0 ${isEvento ? 'text-blue-500' : 'text-purple-500'}`} />
                    <p className="text-sm font-semibold text-gray-900">Información Adicional</p>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed italic">
                    {isEvento ? item.descripcion : `Disciplina: ${item.disciplina}`}
                  </p>
                </div>
              )}

              {/* Organization */}
              {item.organizacion && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    <strong className="text-gray-900">Organiza:</strong> {item.organizacion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer / Action */}
          <div className="flex flex-col gap-2 p-4 bg-gray-50 border-t border-gray-100 shrink-0">
            {(isEvento ? item.redesOWeb : item.contacto) && (
              <a 
                href={isEvento ? item.redesOWeb : item.contacto} 
                target="_blank" 
                rel="noopener noreferrer"
                className={`w-full flex items-center justify-center py-3 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md ${
                  isEvento 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver más información oficial
              </a>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
