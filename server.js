import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';
import { GoogleGenAI } from '@google/genai';
import { readFileSync, existsSync, watchFile } from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

// Enable HSTS in production by default (prevents browsers from using http). Skip on localhost.
if (process.env.NODE_ENV === 'production') {
  try {
    app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
  } catch (e) {
    // older helmet versions expose hsts differently; ignore if unavailable
  }
}

// Basic rate limit to protect your API key from accidental abuse in dev
const limiter = rateLimit({ windowMs: 60 * 1000, max: 60 });
app.use('/api/', limiter);

const API_KEY = process.env.GENAI_API_KEY || process.env.API_KEY || null;
let ai = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
  console.log('GENAI API key present; AI client initialized');
} else {
  console.warn('No GENAI_API_KEY found in environment. The /api/generate endpoint will return 500 until you set it.');
}

// load reserved answers once and watch for changes so edits take effect without restarting the server
const reservedFile = path.join(process.cwd(), 'data', 'reserved.json');
let reserved = {};
function loadReserved() {
  try {
    if (existsSync(reservedFile)) {
      const raw = readFileSync(reservedFile, 'utf8');
      reserved = JSON.parse(raw || '{}');
      console.log('Loaded reserved answers from', reservedFile);
    } else {
      reserved = {};
      console.log('No reserved.json found at', reservedFile);
    }
  } catch (e) {
    console.error('Failed to load reserved.json:', e);
    reserved = {};
  }
}
loadReserved();

// --- SMTP / Email transporter setup ---
const smtpHost = process.env.SMTP_HOST || null;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER || null;
const smtpPass = process.env.SMTP_PASS || null;
const gmailUser = process.env.GMAIL_USER || null;
const gmailPass = process.env.GMAIL_PASS || null; // prefer app password or oauth token
const fromEmail = process.env.FROM_EMAIL || (smtpUser || gmailUser) || `no-reply@${process.env.npm_package_name || 'dhruvlibrary'}.local`;
const toEmail = process.env.TO_EMAIL || 'Dhruvlibrary2022@gmail.com';

let transporter = null;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: smtpUser, pass: smtpPass }
  });
  console.log('SMTP transporter configured via SMTP_HOST');
} else if (gmailUser && gmailPass) {
  // Fallback to Gmail SMTP using provided credentials (app password recommended)
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass }
  });
  console.log('SMTP transporter configured via GMAIL_USER (smtp.gmail.com)');
} else {
  console.warn('SMTP not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_PASS to enable /api/enquiry email sending.');
}

// If transporter exists, verify connection (helps surface auth/connectivity issues early)
if (transporter) {
  transporter.verify().then(() => {
    console.log('Email transporter verified ok');
  }).catch((err) => {
    console.error('Email transporter verification failed:', err && err.message ? err.message : err);
  });
}

// watch for edits and reload (uses fs.watchFile polling which is cross-platform)
try {
  watchFile(reservedFile, { interval: 1000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      console.log('reserved.json changed, reloading...');
      loadReserved();
    }
  });
} catch (e) {
  // if watching fails, we still have the loaded data
}

app.post('/api/generate', async (req, res) => {
  try {
    const { query, context } = req.body || {};
    if (!query || typeof query !== 'string') return res.status(400).json({ error: 'Missing query' });
    // normalize the query for fast matching against reserved answers
    const normalize = (s = '') => s.replace(/[^\u0000-\u007F]/g, '').replace(/[^a-z0-9 ]+/gi, '').toLowerCase().trim();
    const q = normalize(query);

    // diagnostic logging
    console.log('Incoming query:', query);
    console.log('Normalized query:', q);
    let usedReserved = false;
    if (reserved[q]) {
      console.log('Reserved match: exact');
      usedReserved = true;
      return res.json({ text: reserved[q] });
    }
    if (/(?:book|seat|reserve|reservation)/.test(q) && reserved['how can i book a seat']) {
      console.log('Reserved match: heuristic -> booking');
      usedReserved = true;
      return res.json({ text: reserved['how can i book a seat'] });
    }
    if (/(?:open|hour|timings|opening)/.test(q) && reserved['what are the opening hours']) {
      console.log('Reserved match: heuristic -> opening hours');
      usedReserved = true;
      return res.json({ text: reserved['what are the opening hours'] });
    }
    if (/(?:locker|store|left luggage)/.test(q) && reserved['do you have lockers available']) {
      console.log('Reserved match: heuristic -> lockers');
      usedReserved = true;
      return res.json({ text: reserved['do you have lockers available'] });
    }
    if (/(?:membership|plan|subscribe)/.test(q) && reserved['tell me about membership plans']) {
      console.log('Reserved match: heuristic -> membership');
      usedReserved = true;
      return res.json({ text: reserved['tell me about membership plans'] });
    }

    console.log('No reserved match; usedReserved =', usedReserved);

    if (!ai) return res.status(500).json({ error: 'Server not configured with GENAI_API_KEY' });

    const model = 'gemini-3-flash-preview';
    console.log('Calling Gemini model...');
    const response = await ai.models.generateContent({
      model,
      contents: query,
      config: {
        systemInstruction: context || "You are 'Dhruv', an advanced AI Librarian for a self-learning futuristic library. Be helpful and concise.",
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    const text = (response && response.text) || null;
    if (!text) console.log('Gemini returned empty text');
    return res.json({ text });
  } catch (err) {
    console.error('/api/generate error', err);
    return res.status(500).json({ error: 'Model error' });
  }
});

// Endpoint to receive enquiry form submissions and send email to the owner
app.post('/api/enquiry', async (req, res) => {
  try {
    const body = req.body || {};
    const firstName = (body.firstName || '').toString().trim();
    const lastName = (body.lastName || '').toString().trim();
    const phone = (body.phone || '').toString().trim();
    const shift = (body.shift || '').toString().trim();
    const duration = (body.duration || '').toString().trim();

  if (!firstName || !phone) return res.status(400).json({ error: 'Missing required fields (firstName, phone)' });
  if (!transporter) return res.status(500).json({ error: 'SMTP not configured on server. Set SMTP or GMAIL credentials in environment.' });

    const subject = `New seat enquiry: ${firstName} ${lastName}`;
    const text = `New enquiry from ${firstName} ${lastName}\nPhone: ${phone}\nShift: ${shift}\nPlan: ${duration}`;
    const html = `<p><strong>New enquiry</strong></p><ul><li><strong>Name:</strong> ${firstName} ${lastName}</li><li><strong>Phone:</strong> ${phone}</li><li><strong>Shift:</strong> ${shift}</li><li><strong>Plan:</strong> ${duration}</li></ul>`;

    // Use the authenticated user as the envelope sender to improve deliverability
    const envelopeFrom = smtpUser || gmailUser || fromEmail;
    const mailOptions = {
      from: `"${firstName} ${lastName}" <${envelopeFrom}>`,
      to: toEmail,
      subject,
      text,
      html,
      // include reply-to so owner can reply to the user (they didn't provide an email; include phone in reply-to name)
      replyTo: `${firstName} ${lastName} <${envelopeFrom}>`
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Enquiry email sent:', info && info.messageId ? info.messageId : info);
      return res.json({ ok: true });
    } catch (sendErr) {
      console.error('/api/enquiry sendMail error:', sendErr && sendErr.message ? sendErr.message : sendErr);
      return res.status(500).json({ error: 'Failed to send enquiry', details: sendErr && sendErr.message ? sendErr.message : undefined });
    }
  } catch (err) {
    console.error('/api/enquiry error', err);
    return res.status(500).json({ error: 'Failed to send enquiry' });
  }
});

// Proxy endpoint to fetch Google Place details (reviews) server-side.
// Requires environment variables: GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID
app.get('/api/google-reviews', async (req, res) => {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || null;
    const placeId = process.env.GOOGLE_PLACE_ID || req.query.place_id || null;
    if (!apiKey || !placeId) return res.status(400).json({ error: 'Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID' });

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=review&key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url);
    if (!resp.ok) return res.status(502).json({ error: 'Failed to fetch from Google Places' });
    const data = await resp.json();
    // Google returns reviews in data.result.reviews
    const reviews = (data && data.result && data.result.reviews) ? data.result.reviews : [];
    // Normalize to our Review shape
    const normalized = reviews.map((r) => ({ id: r.time || r.author_name, name: r.author_name, text: r.text, rating: r.rating, profile_photo_url: r.profile_photo_url }));
    return res.json({ reviews: normalized });
  } catch (err) {
    console.error('/api/google-reviews error', err);
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

const port = parseInt(process.env.PORT, 10) || 4000;

// Optional HTTPS configuration using existing certificate files (recommended for production):
// Set environment variables SSL_KEY_PATH and SSL_CERT_PATH to point to the PEM files.
const sslKeyPath = process.env.SSL_KEY_PATH || null;
const sslCertPath = process.env.SSL_CERT_PATH || null;
const httpsPort = parseInt(process.env.HTTPS_PORT, 10) || 443;

if (sslKeyPath && sslCertPath && existsSync(sslKeyPath) && existsSync(sslCertPath)) {
  try {
    const options = {
      key: readFileSync(sslKeyPath),
      cert: readFileSync(sslCertPath),
    };
    https.createServer(options, app).listen(httpsPort, () => console.log(`HTTPS server listening on https://localhost:${httpsPort}`));

    // Keep an HTTP server to redirect to HTTPS
    http.createServer((req, res) => {
      const host = req.headers.host ? req.headers.host.split(':')[0] : 'localhost';
      const redirectPort = httpsPort === 443 ? '' : `:${httpsPort}`;
      res.writeHead(301, { Location: `https://${host}${redirectPort}${req.url}` });
      res.end();
    }).listen(port, () => console.log(`HTTP redirector listening on http://localhost:${port} -> https`));
  } catch (e) {
    console.error('Failed to start HTTPS server, falling back to HTTP. Error:', e && e.message ? e.message : e);
    app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
  }
} else {
  // No SSL configured — start plain HTTP. For production use a reverse proxy (NGINX/Caddy) or provide SSL files.
  app.listen(port, () => console.log(`Server listening on http://localhost:${port}`));
  if (!sslKeyPath || !sslCertPath) {
    console.warn('SSL not configured. To enable HTTPS set SSL_KEY_PATH and SSL_CERT_PATH (or use a reverse proxy / cloud provider HTTPS).');
  }
}
