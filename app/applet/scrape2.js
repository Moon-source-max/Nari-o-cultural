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
    $('.event-item, .evento, .item, article, .card').each((i, el) => {
      events.push($(el).text().replace(/\s+/g, ' ').trim());
    });
    console.log("Events found:", events.length);
    if (events.length === 0 || events.length > 50) {
      console.log($('body').text().replace(/\s+/g, ' ').substring(0, 2000));
    } else {
      console.log(events.slice(0, 10));
    }
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
