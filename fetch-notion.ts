import { Client } from '@notionhq/client';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.NOTION_API_KEY;
const DB_ESPACIOS = '32d14702-1936-801e-bc02-c89846a5df22';
const DB_EVENTOS_PASTO = '32d14702-1936-80e8-be36-f0ce59d4240d';
const DB_EVENTOS_NARINO = '32d14702-1936-8081-a4da-e58dbb7c8b71';

if (!apiKey) {
  console.error('Error: NOTION_API_KEY environment variable is required.');
  console.error('Please add it to tu .env file.');
  process.exit(1);
}

const notion = new Client({ auth: apiKey });

// Función para obtener coordenadas reales usando OpenStreetMap (Nominatim)
async function geocodeAddress(address: string, placeName: string, municipio: string = 'Pasto') {
  // Intentamos primero con la dirección, si no, con el nombre del lugar
  const queries = [];
  const suffix = `${municipio}, Nariño, Colombia`;
  
  if (address && address.trim() !== '') queries.push(`${address}, ${suffix}`);
  if (placeName && placeName.trim() !== '') queries.push(`${placeName}, ${suffix}`);
  if (municipio && municipio.trim() !== '') queries.push(suffix);

  for (const query of queries) {
    try {
      console.log(`Buscando coordenadas para: ${query}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
        headers: { 'User-Agent': 'MapaCulturalPastoApp/1.0' }
      });
      const data = await res.json();
      
      // Esperar 1.1 segundos para respetar el límite de la API gratuita (1 petición por segundo)
      await new Promise(resolve => setTimeout(resolve, 1100));

      if (data && data.length > 0) {
        console.log(`✅ Coordenadas encontradas: ${data[0].lat}, ${data[0].lon}`);
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.error(`Error buscando coordenadas para ${query}`);
    }
  }
  console.log(`❌ No se encontraron coordenadas para: ${placeName} en ${municipio}`);
  return null;
}

async function fetchDatabase(databaseId: string, type: 'espacios' | 'eventos_pasto' | 'eventos_narino') {
  console.log(`Obteniendo datos de la base de datos de Notion (${type})...`);
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
    });

    const items = [];

    // Procesamos secuencialmente para no saturar la API de geocodificación
    for (const page of response.results as any[]) {
      const props = page.properties;
      
      const getTitle = (prop: any) => prop?.title?.[0]?.plain_text || '';
      const getRichText = (prop: any) => prop?.rich_text?.[0]?.plain_text || '';
      const getSelect = (prop: any) => prop?.select?.name || '';
      const getMultiSelect = (prop: any) => prop?.multi_select?.map((x: any) => x.name) || [];
      const getUrl = (prop: any) => prop?.url || '';

      if (type === 'espacios') {
        let lugarTitle = '';
        let lugarLocation = '';

        for (const key in props) {
          if (props[key].type === 'title') {
            lugarTitle = getTitle(props[key]);
          } else if (key === 'Lugar' && props[key].type === 'rich_text') {
            lugarLocation = getRichText(props[key]);
          }
        }

        if (!lugarTitle) lugarTitle = getTitle(props['Lugar']);
        if (!lugarLocation && props['Lugar']?.type !== 'title') lugarLocation = getRichText(props['Lugar']);

        let coordenadas = null;
        
        // Intentar leer columnas explícitas de Latitud y Longitud primero
        const latitud = props['Latitud']?.number || parseFloat(getRichText(props['Latitud']));
        const longitud = props['Longitud']?.number || parseFloat(getRichText(props['Longitud']));
        
        const placeProp = props['Lugar 1']?.place;
        
        if (latitud && longitud && !isNaN(latitud) && !isNaN(longitud)) {
          coordenadas = [latitud, longitud];
          console.log(`✅ Coordenadas desde columnas Latitud/Longitud para: ${lugarTitle}`);
        } else if (placeProp && placeProp.lat && placeProp.lon) {
          coordenadas = [placeProp.lat, placeProp.lon];
          console.log(`✅ Coordenadas desde propiedad Place para: ${lugarTitle}`);
        } else {
          coordenadas = await geocodeAddress(lugarLocation, lugarTitle, 'Pasto');
        }

        items.push({
          id: page.id,
          lugar: lugarTitle,
          tipoDeEspacio: getSelect(props['Tipo de espacio']),
          tipoDePlan: getSelect(props['Tipo de plan']) || getMultiSelect(props['Tipo de plan']).join(', '),
          disciplina: props['Disciplina']?.type === 'multi_select' 
            ? getMultiSelect(props['Disciplina']).join(', ') 
            : (props['Disciplina']?.type === 'select' ? getSelect(props['Disciplina']) : getRichText(props['Disciplina'])),
          organizacion: getSelect(props['Organizacion']),
          ubicacion: lugarLocation,
          contacto: getUrl(props['Contacto - Redes sociales']),
          coordenadas: coordenadas
        });
      } else if (type === 'eventos_pasto') {
        const nombre = getTitle(props['Nombre']);
        let coordenadas = null;
        const placeProp = props['Ubicación']?.place;
        if (placeProp && placeProp.lat && placeProp.lon) {
          coordenadas = [placeProp.lat, placeProp.lon];
          console.log(`✅ Coordenadas desde Notion para: ${nombre}`);
        } else {
          coordenadas = await geocodeAddress('', nombre, 'Pasto');
        }
        items.push({
          id: page.id,
          nombre: nombre,
          tipoDeEvento: getSelect(props['Tipo de evento']),
          fechas: getRichText(props['Fechas']),
          organizacion: getRichText(props['Organización']),
          redesOWeb: getUrl(props['Redes o web']),
          descripcion: getRichText(props['Descripción']) || getRichText(props['Descripcion']) || getRichText(props['Descripción de eventos anuales']) || getRichText(props['Descripcion de eventos anuales']) || getRichText(props['Descripción del evento']) || getRichText(props['Descripcion del evento']),
          coordenadas: coordenadas,
          municipio: 'Pasto'
        });
      } else if (type === 'eventos_narino') {
        const evento = getTitle(props['Evento']);
        const ciudad = getSelect(props['Ciudad']) || 'Nariño';
        let coordenadas = await geocodeAddress('', `${evento}`, ciudad);
        items.push({
          id: page.id,
          nombre: evento,
          tipoDeEvento: getSelect(props['Tipo de Evento']),
          fechas: getRichText(props['Fechas']),
          organizacion: getRichText(props['Organización']),
          redesOWeb: getUrl(props['Redes o web']),
          descripcion: getRichText(props['Descripción']) || getRichText(props['Descripcion']) || getRichText(props['Descripción de eventos anuales']) || getRichText(props['Descripcion de eventos anuales']) || getRichText(props['Descripción del evento']) || getRichText(props['Descripcion del evento']),
          municipio: ciudad,
          coordenadas: coordenadas
        });
      }
    }

    let filename = '';
    if (type === 'espacios') filename = 'notion-places.json';
    if (type === 'eventos_pasto') filename = 'notion-events-pasto.json';
    if (type === 'eventos_narino') filename = 'notion-events-narino.json';

    const outputPath = path.join(process.cwd(), 'src', 'data', filename);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(items, null, 2), 'utf-8');
    
    console.log(`\n¡Éxito! Se obtuvieron ${items.length} items para ${type}.`);
    console.log(`Datos guardados en ${outputPath}`);
    
    return items;
  } catch (error) {
    console.error(`Error obteniendo datos de Notion (${type}):`, error);
    throw error;
  }
}

export async function fetchNotionData() {
  await fetchDatabase(DB_ESPACIOS, 'espacios');
  await fetchDatabase(DB_EVENTOS_PASTO, 'eventos_pasto');
  await fetchDatabase(DB_EVENTOS_NARINO, 'eventos_narino');
}

// Run the function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fetchNotionData();
}
