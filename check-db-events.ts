import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.NOTION_API_KEY;
const notion = new Client({ auth: apiKey });
async function check() {
  const response1 = await notion.databases.retrieve({ database_id: '32d14702-1936-80e8-be36-f0ce59d4240d' });
  console.log("Eventos anuales Pasto:", JSON.stringify(response1.properties, null, 2));
  const response2 = await notion.databases.retrieve({ database_id: '32d14702-1936-8081-a4da-e58dbb7c8b71' });
  console.log("Eventos anuales Nariño:", JSON.stringify(response2.properties, null, 2));
}
check();
