const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { Client } = require("@notionhq/client");

// Configurar el cliente de Notion usando la variable de entorno
const notion = new Client({ auth: process.env.NOTION_TOKEN });

exports.syncToNotion = onDocumentCreated("user_events/{docId}", async (event) => {
  const snapshot = event.data;
  
  if (!snapshot) {
    logger.info("No hay datos asociados a este evento de creación.");
    return;
  }

  const data = snapshot.data();
  const docId = event.params.docId;

  // Manejo de la categoría (multi_select) asumiendo que viene de 'tipoDeEvento'
  let categoryArray = [];
  if (Array.isArray(data.tipoDeEvento)) {
    categoryArray = data.tipoDeEvento.map(c => ({ name: String(c) }));
  } else if (data.tipoDeEvento) {
    categoryArray = [{ name: String(data.tipoDeEvento) }];
  }

  // Parseo de la fecha (Notion requiere formato ISO 8601)
  let isoStartDate = null;
  let isoEndDate = null;

  if (data.fechaInicio) {
    try {
      if (typeof data.fechaInicio.toDate === 'function') { 
        isoStartDate = data.fechaInicio.toDate().toISOString();
      } else {
        isoStartDate = new Date(data.fechaInicio).toISOString();
      }
    } catch (e) {
      logger.warn(`No se pudo interpretar la fecha de inicio para el doc ${docId}`);
    }
  }

  if (data.fechaFin) {
    try {
      if (typeof data.fechaFin.toDate === 'function') { 
        isoEndDate = data.fechaFin.toDate().toISOString();
      } else {
        isoEndDate = new Date(data.fechaFin).toISOString();
      }
    } catch (e) {
      logger.warn(`No se pudo interpretar la fecha de fin para el doc ${docId}`);
    }
  }

  // Construcción de las propiedades para mapear a Notion
  const properties = {
    "Nombre del Evento": {
      title: [
        {
          text: {
            content: data.nombre || "Sin nombre",
          },
        },
      ],
    },
    "Estado": {
      select: {
        name: "Pendiente", // Valor por defecto
      },
    },
    "Descripción Corta": {
      rich_text: [
        {
          text: {
            content: data.descripcion || "",
          },
        },
      ],
    },
    "Firebase ID": {
      rich_text: [
        {
          text: {
            content: docId,
          },
        },
      ],
    },
  };

  if (categoryArray.length > 0) {
    properties["Categoría"] = {
      multi_select: categoryArray,
    };
  }

  // Configurar campos de fecha. Notion permite start y end.
  if (isoStartDate) {
    properties["Fecha"] = {
      date: { 
        start: isoStartDate,
        ...(isoEndDate && { end: isoEndDate })
      },
    };
  }

  // Si envían un email de contacto en el futuro, o usamos otro campo
  if (data.email) {
    properties["Contacto"] = {
      email: data.email,
    };
  }

  try {
    // Petición a la API de Notion
    const response = await notion.pages.create({
      parent: { database_id: process.env.NOTION_DATABASE_ID },
      properties: properties,
    });
    
    logger.info(`Página creada exitosamente en Notion para el doc ${docId}. ID de página: ${response.id}`);
  } catch (error) {
    logger.error(`Error al crear la página en Notion para el doc ${docId}:`, error);
  }
});
