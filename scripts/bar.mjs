import http from 'node:http';
import https from 'node:https';

// Busy Bar 1.3.1 pads Content-Length with spaces, which Node's fetch (undici) rejects as a length
// mismatch on every response. node:http tolerates it, so all requests to the Bar go through here.
export function barFetch(url, { method = 'GET', headers = {}, body, timeoutMs = 8000 } = {}) {
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = client.request(target, { method, headers, timeout: timeoutMs }, res => {
      const parts = [];
      res.on('data', part => parts.push(part));
      res.on('error', reject);
      res.on('end', () => {
        const text = Buffer.concat(parts).toString('utf8');
        resolve({
          status: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          text: async () => text,
          json: async () => JSON.parse(text),
        });
      });
    });
    req.on('timeout', () => req.destroy(new Error('Busy Bar did not answer in time')));
    req.on('error', reject);
    req.end(body);
  });
}

export function barBase() {
  return process.env.BUSY_BAR_URL || 'http://10.0.4.20';
}

export function barHeaders(extra = {}) {
  return {
    ...(process.env.BUSY_BAR_TOKEN ? { 'X-API-Token': process.env.BUSY_BAR_TOKEN } : {}),
    ...extra,
  };
}
