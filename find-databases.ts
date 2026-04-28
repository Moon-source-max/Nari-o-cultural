import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.NOTION_API_KEY;
const notion = new Client({ auth: apiKey });
async function find() {
  const response = await notion.blocks.children.list({ block_id: '32d147021936804f9382ddb93a910e43' });
  console.log(JSON.stringify(response.results, null, 2));
}
find();
