import * as cheerio from 'cheerio';

async function fetchEvents() {
  try {
    const response = await fetch('https://situr.narino.gov.co/calendario-de-eventos');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Let's just print the text of the body to see what's there
    console.log($('body').text().replace(/\s+/g, ' ').substring(0, 2000));
  } catch (error) {
    console.error(error);
  }
}

fetchEvents();
