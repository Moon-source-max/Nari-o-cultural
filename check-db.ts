import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.NOTION_API_KEY;
const notion = new Client({ auth: apiKey });
async function check() {
  const response = await notion.databases.retrieve({ database_id: '32d14702-1936-801e-bc02-c89846a5df22' });
  console.log(JSON.stringify(response.properties, null, 2));
}
check();
