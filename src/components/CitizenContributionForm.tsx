import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { X, MapPin, Search } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
const icon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker({ position, setPosition }: { position: {lat: number, lng: number} | null, setPosition: (pos: any) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15);
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position}></Marker>
  )
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface CitizenContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  tiposDeEvento: string[];
}

const validationSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre del evento es obligatorio').max(100, 'Máximo 100 caracteres'),
  descripcion: Yup.string().required('La descripción es obligatoria').max(1000, 'Máximo 1000 caracteres'),
  organizacion: Yup.string().max(100, 'Máximo 100 caracteres'),
  redesOWeb: Yup.string().url('Debe ser una URL válida').max(200, 'Máximo 200 caracteres'),
  fechaInicio: Yup.date().required('La fecha de inicio es obligatoria'),
  fechaFin: Yup.date().min(Yup.ref('fechaInicio'), 'La fecha de fin no puede ser anterior a la de inicio'),
  municipio: Yup.string().required('El municipio es obligatorio').max(50, 'Máximo 50 caracteres'),
  tipoDeEvento: Yup.string().max(50, 'Máximo 50 caracteres'),
  direccion: Yup.string().max(200, 'Máximo 200 caracteres'),
  coordenadas: Yup.object().shape({
    lat: Yup.number().required('Debe seleccionar una ubicación en el mapa'),
    lng: Yup.number().required('Debe seleccionar una ubicación en el mapa')
  }).required('La ubicación es obligatoria')
});

export default function CitizenContributionForm({ isOpen, onClose, tiposDeEvento }: CitizenContributionFormProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleNominatimSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Limit search to Nariño, Colombia
      const query = encodeURIComponent(`${searchQuery}, Nariño, Colombia`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const initialValues = {
    nombre: '',
    descripcion: '',
    organizacion: '',
    redesOWeb: '',
    fechaInicio: '',
    fechaFin: '',
    municipio: '',
    tipoDeEvento: '',
    direccion: '',
    coordenadas: { lat: '', lng: '' },
    imagenPromocional: ''
  };

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    setSubmitError(null);
    try {
      const eventData = {
        ...values,
        fechaInicio: new Date(values.fechaInicio).toISOString(),
        fechaFin: values.fechaFin ? new Date(values.fechaFin).toISOString() : null,
        coordenadas: {
          lat: Number(values.coordenadas.lat),
          lng: Number(values.coordenadas.lng)
        },
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Remove undefined or null values
      if (!eventData.fechaFin) delete eventData.fechaFin;
      if (!eventData.organizacion) delete eventData.organizacion;
      if (!eventData.redesOWeb) delete eventData.redesOWeb;
      if (!eventData.tipoDeEvento) delete eventData.tipoDeEvento;
      if (!eventData.direccion) delete eventData.direccion;
      if (!eventData.imagenPromocional) delete eventData.imagenPromocional;

      await addDoc(collection(db, 'user_events'), eventData);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Error adding document: ', error);
      setSubmitError(error.message || 'Hubo un error al guardar el evento. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Contribución Ciudadana</h2>
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
              <p className="text-gray-600">Gracias por tu contribución. El evento ha sido enviado para revisión.</p>
            </div>
          ) : (
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ isSubmitting, setFieldValue, values }) => (
                <Form className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                      {submitError}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del evento *</label>
                    <Field type="text" name="nombre" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Festival de Teatro" />
                    <ErrorMessage name="nombre" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del evento *</label>
                    <Field as="textarea" name="descripcion" rows={3} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Describe de qué trata el evento..." />
                    <ErrorMessage name="descripcion" component="div" className="text-red-500 text-xs mt-1" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de evento</label>
                      <Field as="select" name="tipoDeEvento" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecciona una opción</option>
                        {tiposDeEvento.map(t => <option key={t} value={t}>{t}</option>)}
                      </Field>
                      <ErrorMessage name="tipoDeEvento" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Municipio *</label>
                      <Field type="text" name="municipio" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Pasto" />
                      <ErrorMessage name="municipio" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de inicio *</label>
                      <Field type="datetime-local" name="fechaInicio" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="fechaInicio" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de fin</label>
                      <Field type="datetime-local" name="fechaFin" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="fechaFin" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Organización / Fundación</label>
                      <Field type="text" name="organizacion" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="¿Quién lo organiza?" />
                      <ErrorMessage name="organizacion" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Redes sociales o Web</label>
                      <Field type="url" name="redesOWeb" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." />
                      <ErrorMessage name="redesOWeb" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Imagen promocional (Poster)</label>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64Image = await compressImage(file);
                            setFieldValue('imagenPromocional', base64Image);
                          } catch (error) {
                            console.error("Error compressing image", error);
                            alert("Hubo un error al procesar la imagen. Intenta con otra.");
                          }
                        } else {
                          setFieldValue('imagenPromocional', '');
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                    />
                    {values.imagenPromocional && (
                      <div className="mt-2">
                        <img src={values.imagenPromocional} alt="Preview" className="h-32 object-contain rounded-md border border-gray-200" />
                      </div>
                    )}
                    <ErrorMessage name="imagenPromocional" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación exacta *</label>
                    <div className="flex gap-2 mb-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="Busca el lugar en Nariño..."
                          className="w-full border border-gray-300 rounded-md p-2 pl-10 focus:ring-blue-500 focus:border-blue-500"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleNominatimSearch();
                            }
                          }}
                        />
                        <MapPin className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={handleNominatimSearch}
                        disabled={isSearching}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        {isSearching ? 'Buscando...' : 'Buscar'}
                      </button>
                    </div>

                    {searchResults.length > 0 && (
                      <div className="mb-4 border border-gray-200 rounded-md shadow-sm max-h-40 overflow-y-auto bg-white">
                        {searchResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0"
                            onClick={() => {
                              setFieldValue('direccion', result.display_name);
                              setFieldValue('coordenadas', {
                                lat: parseFloat(result.lat),
                                lng: parseFloat(result.lon)
                              });
                              setSearchQuery(result.display_name);
                              setSearchResults([]);
                            }}
                          >
                            {result.display_name}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="h-64 w-full rounded-md overflow-hidden border border-gray-300 relative z-0">
                      <MapContainer 
                        center={[1.2136, -77.2811]} // Pasto center
                        zoom={12} 
                        className="w-full h-full"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <LocationMarker 
                          position={values.coordenadas.lat ? { lat: Number(values.coordenadas.lat), lng: Number(values.coordenadas.lng) } : null}
                          setPosition={(pos) => {
                            setFieldValue('coordenadas', { lat: pos.lat, lng: pos.lng });
                            // Optionally, we could do a reverse geocode here to get the address
                            // but for now we just set the coordinates and clear the address if it was manually set
                            if (!values.direccion) {
                              setFieldValue('direccion', `Ubicación seleccionada en el mapa (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
                            }
                          }}
                        />
                      </MapContainer>
                    </div>

                    <ErrorMessage name="coordenadas.lat" component="div" className="text-red-500 text-xs mt-1" />
                    {values.coordenadas.lat && (
                      <p className="text-xs text-green-600 mt-1">Ubicación seleccionada correctamente.</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enviando...
                        </>
                      ) : 'Enviar evento'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          )}
        </div>
      </div>
    </div>
  );
}
