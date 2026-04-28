import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { X, MapPin, Search } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

interface SpaceContributionFormProps {
  isOpen: boolean;
  onClose: () => void;
  tiposDeEspacio: string[];
  tiposDePlan: string[];
  disciplinas: string[];
}

const validationSchema = Yup.object().shape({
  nombreEspacio: Yup.string().required('El nombre del espacio es obligatorio').max(150, 'Máximo 150 caracteres'),
  nombreAportante: Yup.string().required('Tu nombre es obligatorio').max(150, 'Máximo 150 caracteres'),
  cedulaAportante: Yup.string().required('Tu cédula es obligatoria').max(50, 'Máximo 50 caracteres'),
  correoAportante: Yup.string().email('Correo inválido').required('El correo es obligatorio').max(150, 'Máximo 150 caracteres'),
  esDuenioOTrabajador: Yup.string().required('Debes seleccionar una opción').max(10, 'Máximo 10 caracteres'),
  numeroContactoAportante: Yup.string().required('Tu número de contacto es obligatorio').max(50, 'Máximo 50 caracteres'),
  tipoDeEspacio: Yup.string().required('El tipo de espacio es obligatorio').max(100, 'Máximo 100 caracteres'),
  otroTipoDeEspacio: Yup.string().max(100, 'Máximo 100 caracteres'),
  actividades: Yup.string().max(1000, 'Máximo 1000 caracteres'),
  experienciasRecomendadas: Yup.array().of(Yup.string()),
  redesSociales: Yup.string().max(200, 'Máximo 200 caracteres'),
  aptoPara: Yup.array().of(Yup.string()),
  fotos: Yup.array().of(Yup.string()).max(3, 'Máximo 3 fotos'),
  horarios: Yup.string().max(200, 'Máximo 200 caracteres'),
  rangoPrecios: Yup.string().max(100, 'Máximo 100 caracteres'),
  ubicacion: Yup.string().required('La dirección o ubicación es obligatoria').max(200, 'Máximo 200 caracteres'),
  coordenadas: Yup.object().shape({
    lat: Yup.number().required('Debe seleccionar una ubicación en el mapa'),
    lng: Yup.number().required('Debe seleccionar una ubicación en el mapa')
  }).required('La ubicación es obligatoria')
});

const EXPERIENCIAS_OPCIONES = [
  'Plan con amiguis',
  'Para ir solx',
  'Conexión con la naturaleza',
  'Para aprender algo nuevo',
  'Cita romántica',
  'Plan familiar',
  'Experiencia creativa',
  'Amantes de la música'
];

const APTO_PARA_OPCIONES = [
  'Toda la familia',
  'Solo mayores de 18 años',
  'Pet Friendly'
];

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

export default function SpaceContributionForm({ isOpen, onClose, tiposDeEspacio, tiposDePlan, disciplinas }: SpaceContributionFormProps) {
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
    nombreEspacio: '',
    nombreAportante: '',
    cedulaAportante: '',
    correoAportante: '',
    esDuenioOTrabajador: '',
    numeroContactoAportante: '',
    tipoDeEspacio: '',
    otroTipoDeEspacio: '',
    actividades: '',
    experienciasRecomendadas: [],
    redesSociales: '',
    aptoPara: [],
    fotos: [],
    horarios: '',
    rangoPrecios: '',
    ubicacion: '',
    coordenadas: { lat: '', lng: '' }
  };

  const handleSubmit = async (values: any, { setSubmitting, resetForm }: any) => {
    setSubmitError(null);
    try {
      const spaceData = {
        ...values,
        coordenadas: {
          lat: Number(values.coordenadas.lat),
          lng: Number(values.coordenadas.lng)
        },
        status: 'pending',
        createdAt: serverTimestamp()
      };

      // Remove undefined or empty values
      if (!spaceData.otroTipoDeEspacio) delete spaceData.otroTipoDeEspacio;
      if (!spaceData.actividades) delete spaceData.actividades;
      if (!spaceData.redesSociales) delete spaceData.redesSociales;
      if (!spaceData.horarios) delete spaceData.horarios;
      if (!spaceData.rangoPrecios) delete spaceData.rangoPrecios;
      if (spaceData.experienciasRecomendadas.length === 0) delete spaceData.experienciasRecomendadas;
      if (spaceData.aptoPara.length === 0) delete spaceData.aptoPara;
      if (spaceData.fotos.length === 0) delete spaceData.fotos;

      await addDoc(collection(db, 'user_spaces'), spaceData);
      
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        resetForm();
        onClose();
      }, 3000);
    } catch (error: any) {
      console.error('Error adding document: ', error);
      setSubmitError(error.message || 'Hubo un error al guardar el espacio. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="bg-white border-b border-gray-100 p-4 flex justify-between items-center shrink-0 rounded-t-xl">
          <h2 className="text-xl font-bold text-gray-900">Añadir Espacio Cultural</h2>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">¡Espacio registrado con éxito!</h3>
              <p className="text-gray-600">Gracias por tu contribución. El lugar ha sido enviado para revisión.</p>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del espacio *</label>
                    <Field type="text" name="nombreEspacio" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Teatro Imperial" />
                    <ErrorMessage name="nombreEspacio" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre persona que hace el aporte *</label>
                      <Field type="text" name="nombreAportante" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="nombreAportante" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cédula de la persona *</label>
                      <Field type="text" name="cedulaAportante" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="cedulaAportante" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Correo (para notificarte) *</label>
                      <Field type="email" name="correoAportante" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="correoAportante" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tu número de contacto *</label>
                      <Field type="text" name="numeroContactoAportante" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                      <ErrorMessage name="numeroContactoAportante" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Eres dueñx o trabajas en este espacio? *</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <Field type="radio" name="esDuenioOTrabajador" value="Sí" className="mr-2" />
                        Sí
                      </label>
                      <label className="flex items-center">
                        <Field type="radio" name="esDuenioOTrabajador" value="No" className="mr-2" />
                        No
                      </label>
                    </div>
                    <ErrorMessage name="esDuenioOTrabajador" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de espacio *</label>
                      <Field as="select" name="tipoDeEspacio" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500">
                        <option value="">Selecciona una opción</option>
                        {tiposDeEspacio.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="Otro">Otro</option>
                      </Field>
                      <ErrorMessage name="tipoDeEspacio" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    {values.tipoDeEspacio === 'Otro' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">¿Cuál es? *</label>
                        <Field type="text" name="otroTipoDeEspacio" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                        <ErrorMessage name="otroTipoDeEspacio" component="div" className="text-red-500 text-xs mt-1" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué actividades encuentras en este espacio?</label>
                    <Field as="textarea" rows={3} name="actividades" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" />
                    <ErrorMessage name="actividades" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">¿Para qué tipo de experiencias recomendarías este espacio?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {EXPERIENCIAS_OPCIONES.map(opcion => (
                        <label key={opcion} className="flex items-center text-sm">
                          <Field type="checkbox" name="experienciasRecomendadas" value={opcion} className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
                          {opcion}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Es apto para:</label>
                    <div className="flex flex-wrap gap-4">
                      {APTO_PARA_OPCIONES.map(opcion => (
                        <label key={opcion} className="flex items-center text-sm">
                          <Field type="checkbox" name="aptoPara" value={opcion} className="mr-2 rounded text-blue-600 focus:ring-blue-500" />
                          {opcion}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Redes sociales de la marca o proyecto</label>
                    <Field type="text" name="redesSociales" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. @teatroimperial" />
                    <ErrorMessage name="redesSociales" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horarios</label>
                      <Field type="text" name="horarios" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. Lunes a Viernes 8am - 5pm" />
                      <ErrorMessage name="horarios" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rango de precios</label>
                      <Field type="text" name="rangoPrecios" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Ej. $10.000 - $50.000" />
                      <ErrorMessage name="rangoPrecios" component="div" className="text-red-500 text-xs mt-1" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fotos del espacio (hasta 3 imágenes)</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple
                      onChange={async (event) => {
                        const files = Array.from(event.currentTarget.files || []);
                        if (files.length > 3) {
                          alert('Solo puedes subir un máximo de 3 imágenes.');
                          event.currentTarget.value = '';
                          return;
                        }
                        try {
                          const base64Images = await Promise.all(files.map(file => compressImage(file)));
                          setFieldValue('fotos', base64Images);
                        } catch (error) {
                          console.error("Error compressing images", error);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                    {values.fotos && values.fotos.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {values.fotos.map((foto: string, idx: number) => (
                          <img key={idx} src={foto} alt={`Preview ${idx}`} className="h-16 w-16 object-cover rounded-md border border-gray-200" />
                        ))}
                      </div>
                    )}
                    <ErrorMessage name="fotos" component="div" className="text-red-500 text-xs mt-1" />
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
                              setFieldValue('ubicacion', result.display_name);
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
                            if (!values.ubicacion) {
                              setFieldValue('ubicacion', `Ubicación seleccionada en el mapa (${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`);
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
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar espacio'}
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
