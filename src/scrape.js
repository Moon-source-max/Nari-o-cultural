import https from 'https';
import * as cheerio from 'cheerio';

const options = {
  hostname: 'situr.narino.gov.co',
  port: 443,
  path: '/calendario-de-eventos',
  method: 'GET',
  rejectUnauthorized: false
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const $ = cheerio.load(data);
    const events = [];
    $('.evento, .event-item, .card, article, .item').each((i, el) => {
      events.push($(el).text().replace(/\s+/g, ' ').trim());
    });
    console.log(events);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
