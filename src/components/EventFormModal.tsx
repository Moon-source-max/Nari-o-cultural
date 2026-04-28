import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  tiposDeEspacio: string[];
  tiposDePlan: string[];
  disciplinas: string[];
}

export default function EventFormModal({ isOpen, onClose, tiposDeEspacio, tiposDePlan, disciplinas }: EventFormModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    tipoEspacio: '',
    tipoPlan: '',
    disciplina: '',
    descripcion: '',
    organizacion: '',
    ubicacion: '',
    contacto: '',
    redesSociales: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Aquí iría la lógica para enviar los datos a un backend o a Notion
    // Por ahora simulamos el envío con un timeout
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setFormData({
          nombre: '',
          tipoEspacio: '',
          tipoPlan: '',
          disciplina: '',
          descripcion: '',
          organizacion: '',
          ubicacion: '',
          contacto: '',
          redesSociales: ''
        });
      }, 3000);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Registrar un Evento</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {isSuccess ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Evento registrado con éxito!</h3>
              <p className="text-gray-600">Gracias por compartir tu evento. Lo revisaremos pronto para incluirlo en el mapa.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento *</label>
                <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Festival de Teatro" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de espacio</label>
                  <select name="tipoEspacio" value={formData.tipoEspacio} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecciona una opción</option>
                    {tiposDeEspacio.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de plan</label>
                  <select name="tipoPlan" value={formData.tipoPlan} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Selecciona una opción</option>
                    {tiposDePlan.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <select name="disciplina" value={formData.disciplina} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Selecciona una opción</option>
                  {disciplinas.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del evento *</label>
                <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Describe de qué trata el evento..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organización o Fundación *</label>
                <input required type="text" name="organizacion" value={formData.organizacion} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Fundación Cultural Nariño" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación / Dirección *</label>
                <input required type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Teatro Imperial, Pasto" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datos de contacto</label>
                  <input type="text" name="contacto" value={formData.contacto} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Teléfono o Email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Redes sociales o Web</label>
                  <input type="url" name="redesSociales" value={formData.redesSociales} onChange={handleChange} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." />
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center">
                  {isSubmitting ? 'Enviando...' : 'Enviar Evento'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
