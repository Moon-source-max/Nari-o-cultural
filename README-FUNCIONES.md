# Instrucciones de Despliegue - Sincronización Firebase a Notion

He creado la carpeta `functions/` en la raíz de tu proyecto. Esta carpeta contiene todo lo necesario para desplegar tu webhook de Firebase conectado a Notion.

## Dependencias que se han añadido

El archivo `functions/package.json` ya está configurado con las dependencias necesarias:

```json
"dependencies": {
  "@notionhq/client": "^2.2.15",
  "firebase-admin": "^12.1.0",
  "firebase-functions": "^5.0.1"
}
```

* **`@notionhq/client`**: Es la librería oficial de Notion para interactuar con la API crear la página.
* **`firebase-functions` y `firebase-admin`**: Son requeridas para crear triggers nativos de Firestore y utilizar los logs.

## 🚀 Pasos para Desplegar:

1. **Inicia sesión en Firebase CLI** (si no lo has hecho):
```bash
firebase login
```

2. **Ve a la carpeta de dependencias e instálalas:**
```bash
cd functions
npm install
```

3. **Configura las variables de entorno de Firebase:**
Para las funciones de 2da generación (v2), se manejan las variables mediante el archivo `.env` en la carpeta `functions`, o bien configurando secretos (recomendado para tokens):

```bash
firebase functions:secrets:set NOTION_TOKEN
# Te pedirá pegar el token generado desde tu área de integraciones de Notion

firebase functions:secrets:set NOTION_DATABASE_ID
# Te pedirá pegar el ID de la base de datos (se extrae del link de la base de Notion)
```
*(Nota: Asegúrate también de que la integración en Notion esté agregada a la base de datos que deseas modificar).*

4. **Desplegar la función en la nube:**
```bash
firebase deploy --only functions
```

¡Una vez desplegado!, cada vez que insertes en `red_colaboradores` se verá reflejado directamente en tu base de Notion.
