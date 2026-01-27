import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const prisma = new PrismaClient();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
// Em Vercel, VERCEL_URL traz o domínio do deploy (preview ou produção)
const VERCEL_URL = process.env.VERCEL_URL || '';
const CLIENT_URL = process.env.CLIENT_URL || (VERCEL_URL ? `https://${VERCEL_URL}` : 'http://localhost:3002');
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// Optional price IDs for pricing display
const STARTER_PRICE = process.env.STRIPE_PRICE_STARTER || process.env.VITE_STRIPE_PRICE_STARTER || '';
const PRO_PRICE = process.env.STRIPE_PRICE_PRO || process.env.VITE_STRIPE_PRICE_PRO || '';
const PREMIUM_PRICE = process.env.STRIPE_PRICE_PREMIUM || process.env.VITE_STRIPE_PRICE_PREMIUM || '';
// Optional yearly price IDs
const STARTER_PRICE_YEARLY = process.env.STRIPE_PRICE_STARTER_YEARLY || process.env.VITE_STRIPE_PRICE_STARTER_YEARLY || '';
const PRO_PRICE_YEARLY = process.env.STRIPE_PRICE_PRO_YEARLY || process.env.VITE_STRIPE_PRICE_PRO_YEARLY || '';
const PREMIUM_PRICE_YEARLY = process.env.STRIPE_PRICE_PREMIUM_YEARLY || process.env.VITE_STRIPE_PRICE_PREMIUM_YEARLY || '';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(s => s.trim().replace(/^['"]+|['"]+$/g, '').toLowerCase())
  .filter(Boolean);

if (!STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY não definido. Configure variáveis de ambiente.');
}

// Use SDK default API version to avoid invalid version errors
// const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_');
const app = express();
// Confia em proxy para obter IP real (necessário em ambientes com proxy)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://*.gstatic.com"],
      "script-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com", "https://accounts.google.com/gsi/client", "https://*.gstatic.com"],
      "frame-src": ["'self'", "https://accounts.google.com", "https://accounts.google.com/gsi/"],
      "connect-src": ["'self'", "https://accounts.google.com", "https://accounts.google.com/gsi/"],
    },
  },
}));

// Increase payload limit to support large images (10MB)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3002', 'https://gestaopro-ai.vercel.app'],
  credentials: true
}));

// O webhook do Stripe precisa do corpo raw, então usamos express.raw() para essa rota específica.
// É importante que este middleware seja definido ANTES do express.json() global.
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).send('Webhook Error: Missing stripe-signature');
  }

  let event;

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
    event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Lógica de manipulação de eventos do webhook...
  // (O resto da sua lógica de webhook vai aqui)
  
  res.status(200).json({ received: true });
});


// Para todas as outras rotas, usamos o parser de JSON padrão com limite aumentado.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Utilitário: baixa uma imagem e retorna como data URL base64
const fetchImageAsDataUrl = (url) => new Promise((resolve, reject) => {
  try {
    https.get(url, (res) => {
      const contentType = String(res.headers['content-type'] || '');
      if (!contentType.startsWith('image/')) {
        reject(new Error(`Conteúdo não é imagem: ${contentType}`));
        res.resume();
        return;
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const mime = contentType.split(';')[0].trim();
        const base64 = buffer.toString('base64');
        resolve(`data:${mime};base64,${base64}`);
      });
    }).on('error', (e) => reject(e));
  } catch (e) { reject(e); }
});

// Middleware para garantir que req.body seja um objeto JSON
const ensureJsonBody = (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return next();
    }
    if (Buffer.isBuffer(req.body)) {
      try { req.body = JSON.parse(req.body.toString('utf8')); } catch { req.body = {}; }
      return next();
    }
    if (typeof req.body === 'string') {
      try { req.body = JSON.parse(req.body); } catch { req.body = {}; }
      return next();
    }
    req.body = req.body || {};
    next();
  } catch {
    req.body = {};
    next();
  }
};

// Simple file-based store utilities (used by analytics and graceful fallbacks in dev)
const serverRoot = path.dirname(fileURLToPath(import.meta.url));
const storePath = path.join(serverRoot, 'data');
const storeFile = path.join(storePath, 'store.json');
try {
  if (!fs.existsSync(storePath)) fs.mkdirSync(storePath, { recursive: true });
  if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, JSON.stringify({ users: {}, analytics: [] }, null, 2));
} catch {}

const readStore = () => {
  try {
    const raw = fs.readFileSync(storeFile, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { users: {}, analytics: [] };
  }
};

const writeStore = (db) => {
  try {
    fs.writeFileSync(storeFile, JSON.stringify(db || { users: {}, analytics: [] }, null, 2));
  } catch {}
};

const ensureStoreShape = () => {
  const db = readStore();
  db.users = db.users && typeof db.users === 'object' ? db.users : {};
  db.analytics = Array.isArray(db.analytics) ? db.analytics : [];
  return db;
};


// Simple fixed-window rate limiter (in-memory)
const makeFixedWindowLimiter = (keySelector, max, windowMs) => {
  const buckets = new Map();
  return (req, res, next) => {
    try {
      const key = keySelector(req);
      if (!key) return next();
      const now = Date.now();
      let b = buckets.get(key);
      if (!b || now >= b.resetAt) {
        b = { count: 0, resetAt: now + windowMs };
        buckets.set(key, b);
      }
      b.count += 1;
      if (b.count > max) {
        const retry = Math.max(0, b.resetAt - now);
        return res.status(429).json({ error: 'Limite de requisições excedido', retry_after_ms: retry });
      }
      next();
    } catch {
      // Em caso de erro interno no limiter, não bloquear requisição
      next();
    }
  };
};

// Limites por rota (usar antes da definição das rotas)
const limitAuthGoogle = makeFixedWindowLimiter((req) => req.ip, 5, 60_000); // 5/min por IP
const limitCheckoutCreate = makeFixedWindowLimiter((req) => (req.user && req.user.email) ? req.user.email : req.ip, 10, 60_000); // 10/min por usuário/IP
const limitTTS = makeFixedWindowLimiter((req) => (req.user && req.user.email) ? req.user.email : req.ip, 30, 60_000); // 30/min por usuário/IP
const limitBillingPortal = makeFixedWindowLimiter((req) => (req.user && req.user.email) ? req.user.email : req.ip, 10, 60_000); // 10/min por usuário/IP
const limitAIChat = makeFixedWindowLimiter((req) => (req.user && req.user.email) ? req.user.email : req.ip, 60, 60_000); // 60/min para chat por usuário/IP
const limitSuperBoss = makeFixedWindowLimiter((req) => (req.user && req.user.email) ? req.user.email : req.ip, 30, 60_000); // 30/min para superboss por usuário/IP

// Simple auth middleware using JWT Bearer
const requireAuth = (req, res, next) => {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
    if (!token) return res.status(401).json({ error: 'Não autenticado' });
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET ausente no servidor' });
    const payload = jwt.verify(token, AUTH_JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// Healthcheck estendido: valida DB (Prisma) e Stripe (segredo configurado)
app.get('/api/health', async (req, res) => {
  const details = {
    env: {
      clientUrl: CLIENT_URL,
      hasJwtSecret: !!AUTH_JWT_SECRET,
      hasGoogleClientId: !!GOOGLE_CLIENT_ID,
      stripeKeyConfigured: !!STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.trim() !== '' && STRIPE_SECRET_KEY.trim() !== 'sk_test_',
      nodeEnv: (process.env.NODE_ENV || 'dev')
    },
    database: { ok: null, error: null },
    stripe: { ok: null, error: null },
  };

  // DB check (leve)
  try {
    await prisma.$queryRaw`SELECT 1`;
    details.database.ok = true;
  } catch (e) {
    details.database.ok = false;
    details.database.error = e?.message || String(e);
  }

  // Stripe check (leve)
  if (details.env.stripeKeyConfigured) {
    try {
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
      await stripe.prices.list({ limit: 1 });
      details.stripe.ok = true;
    } catch (e) {
      details.stripe.ok = false;
      details.stripe.error = e?.message || String(e);
    }
  } else {
    details.stripe.ok = null; // não configurado / ambiente de dev
  }

  const okOverall = (details.database.ok !== false) && (details.stripe.ok !== false);
  res.json({ ok: okOverall, ...details });
});

// Pricing (public)
app.get('/api/pricing', async (req, res) => {
  // Debug environment configuration to diagnose incorrect plan values
  const debugEnv = {
    hasSecret: !!STRIPE_SECRET_KEY && STRIPE_SECRET_KEY.trim() !== '' && STRIPE_SECRET_KEY.trim() !== 'sk_test_',
    starter: STARTER_PRICE || null,
    pro: PRO_PRICE || null,
    premium: PREMIUM_PRICE || null,
    starter_yearly: STARTER_PRICE_YEARLY || null,
    pro_yearly: PRO_PRICE_YEARLY || null,
    premium_yearly: PREMIUM_PRICE_YEARLY || null,
    nodeEnv: (process.env.NODE_ENV || 'dev')
  };
  try { console.log('[pricing/env]', debugEnv); } catch {}
  // Simple local fallback pricing for development or error cases
  const buildMockPricing = () => {
    const mk = (id, amount, currency = 'brl', interval = 'month') => ({ id, amount, currency, interval });
    const mkY = (id, amount, currency = 'brl') => mk(id, amount, currency, 'year');
    const starterM = 4900; // R$49,00/mês
    const proM = 9900;     // R$99,00/mês
    const premiumM = 14900; // R$149,00/mês
    const discount = 0.85; // ~15% discount anual
    return {
      starter: mk('price_mock_starter', starterM),
      pro: mk('price_mock_pro', proM),
      premium: mk('price_mock_premium', premiumM),
      starter_yearly: mkY('price_mock_starter_year', Math.round(starterM * 12 * discount)),
      pro_yearly: mkY('price_mock_pro_year', Math.round(proM * 12 * discount)),
      premium_yearly: mkY('price_mock_premium_year', Math.round(premiumM * 12 * discount)),
    };
  };

  const shouldUseMock = () => {
    // Use mock when key is missing or clearly placeholder, or in non-production when IDs are not provided
    const missingSecret = !STRIPE_SECRET_KEY || STRIPE_SECRET_KEY.trim() === '' || STRIPE_SECRET_KEY.trim() === 'sk_test_';
    const noIds = !STARTER_PRICE && !PRO_PRICE && !PREMIUM_PRICE && !STARTER_PRICE_YEARLY && !PRO_PRICE_YEARLY && !PREMIUM_PRICE_YEARLY;
    const notProd = (process.env.NODE_ENV || '').toLowerCase() !== 'production';
    try { console.log('[pricing/mock-check]', { missingSecret, noIds, notProd }); } catch {}
    return missingSecret || (notProd && noIds);
  };

  try {
    if (shouldUseMock()) {
      return res.json(buildMockPricing());
    }
    const fetchPrice = async (id) => {
      if (!id) {
        console.log(`[pricing/fetchPrice] Skipping fetch for null/empty ID.`);
        return null;
      }
      try {
        console.log(`[pricing/fetchPrice] Attempting to retrieve price for ID: ${id}`);
        const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
        const price = await stripe.prices.retrieve(id, { expand: ['product'] });
        console.log(`[pricing/fetchPrice] Successfully retrieved price for ID: ${id}`, price);
        const productObj = typeof price.product === 'string' ? undefined : price.product;
        return {
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          nickname: price.nickname || undefined,
          productName: productObj?.name || undefined,
          interval: price.recurring?.interval || undefined,
        };
      } catch (error) {
        console.error(`[pricing/fetchPrice] Error retrieving price for ID: ${id}`, error);
        return null;
      }
    };
    const starter = await fetchPrice(STARTER_PRICE);
    const pro = await fetchPrice(PRO_PRICE);
    const premium = await fetchPrice(PREMIUM_PRICE);
    const starter_yearly = await fetchPrice(STARTER_PRICE_YEARLY);
    const pro_yearly = await fetchPrice(PRO_PRICE_YEARLY);
    const premium_yearly = await fetchPrice(PREMIUM_PRICE_YEARLY);
    const gotAny = !!(starter || pro || premium || starter_yearly || pro_yearly || premium_yearly);
    if (!gotAny) {
      // Fallback resiliente: se nada foi retornado do Stripe, usa mock
      return res.json(buildMockPricing());
    }
    res.json({ starter, pro, premium, starter_yearly, pro_yearly, premium_yearly });
  } catch (e) {
    console.error('Erro ao obter pricing:', e?.message || e);
    // Fallback resiliente: sempre retorna mock para evitar 500
    return res.json(buildMockPricing());
  }
});

// Checkout session creation
app.post('/api/checkout/session', requireAuth, limitCheckoutCreate, async (req, res) => {
  try {
    const { priceId, cycle } = req.body || {};
    const userEmail = (req.user && req.user.email) ? req.user.email : undefined;
    if (!priceId) return res.status(400).json({ error: 'priceId é obrigatório' });
    const mode = cycle === 'yearly' ? 'subscription' : 'subscription';
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/billing`,
      customer_email: userEmail,
      client_reference_id: userEmail,
      metadata: userEmail ? { user_email: userEmail } : undefined,
    });
    res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('Falha ao criar sessão:', e?.message || e);
    res.status(500).json({ error: 'Falha ao iniciar checkout' });
  }
});

// Portal de cobrança
app.post('/api/billing/portal', requireAuth, limitBillingPortal, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório' });
    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId = session.customer;
    if (!customerId) return res.status(400).json({ error: 'Cliente não encontrado para a sessão.' });
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${CLIENT_URL}/chat`
    });
    res.json({ url: portal.url });
  } catch (e) {
    console.error('Erro ao criar portal de faturamento:', e);
    res.status(500).json({ error: 'Falha ao criar portal de faturamento.' });
  }
});

// Helper: map Stripe price ID to plan and cycle using env vars
const mapPriceToPlanCycle = (priceId) => {
  const id = (priceId || '').trim();
  if (!id) return null;
  if (id === STARTER_PRICE) return { plan: 'starter', cycle: 'monthly' };
  if (id === PRO_PRICE) return { plan: 'pro', cycle: 'monthly' };
  if (id === PREMIUM_PRICE) return { plan: 'premium', cycle: 'monthly' };
  if (id === STARTER_PRICE_YEARLY) return { plan: 'starter', cycle: 'yearly' };
  if (id === PRO_PRICE_YEARLY) return { plan: 'pro', cycle: 'yearly' };
  if (id === PREMIUM_PRICE_YEARLY) return { plan: 'premium', cycle: 'yearly' };
  return null;
};

// (moved) limiter definitions above to avoid temporal dead zone on references

// Analytics capture
app.post('/api/analytics', (req, res) => {
  const body = typeof req.body === 'string' ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : (req.body || {});
  const { event, meta } = body;
  const db = ensureStoreShape();
  db.analytics.push({ event, meta, at: Date.now() });
  writeStore(db);
  res.json({ ok: true });
});

// Basic analytics endpoint to record landing events (CTA clicks, toggles)
app.post('/api/analytics/event', ensureJsonBody, async (req, res) => {
  try {
    try { console.log('[analytics/event] ct=', req.headers['content-type'], 'bodyType=', typeof req.body); } catch {}
    const body = (Buffer.isBuffer(req.body))
      ? (() => { try { return JSON.parse(req.body.toString('utf8')); } catch { return {}; } })()
      : (typeof req.body === 'string'
        ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })()
        : (req.body || {}));
    const { name, payload } = body;
    if (!name) return res.status(400).json({ error: 'Nome do evento é obrigatório' });
    const who = (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) ? 'auth' : 'anon';
    console.log('[analytics]', new Date().toISOString(), name, { ...(payload || {}), user: who });
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro no analytics:', e?.message || e);
    // Evitar 500 para não poluir logs e UI; registrar falha como ok:false
    res.json({ ok: false, error: 'Falha ao registrar evento.' });
  }
});

// Text-to-speech using Google Generative AI (placeholder)
app.post('/api/tts', ensureJsonBody, async (req, res) => {
  try {
    const { input } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY não configurado' });
    const genAI = new GoogleGenerativeAI(apiKey);
    // Placeholder response for demo purposes
    res.json({ audioUrl: 'data:audio/wav;base64,', text: input || '' });
  } catch (e) {
    console.error('Falha TTS:', e?.message || e);
    res.status(500).json({ error: 'Falha TTS' });
  }
});

// Novo endpoint para gerar fala
app.post('/api/generate-speech', ensureJsonBody, requireAuth, limitTTS, async (req, res) => {
  try {
    const { text, voice, languageCode } = req.body;

    if (!text || !voice || !languageCode) {
      return res.status(400).json({ error: 'Texto, voz e código do idioma são obrigatórios.' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!GEMINI_API_KEY) {
      throw new Error("Gemini API key not configured in backend");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Use the correct TTS model variant that supports AUDIO modality in v1beta.
    // See: https://ai.google.dev/gemini-api/docs/speech-generation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" });

    const generateWithVoice = async (voiceName) => {
      return await model.generateContent({
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voiceName }
            }
            // Note: language configuration field is not supported here in v1beta
          }
        }
      });
    };

    let result;
    try {
      result = await generateWithVoice(voice);
    } catch (e) {
      console.warn(`TTS falhou com voz "${voice}", tentando fallback...`, e?.message || e);
      // Fallback genérico
      result = await generateWithVoice("Kore");
    }

    // Safely locate the audio inlineData part and mime type
    const parts = result?.response?.candidates?.[0]?.content?.parts || [];
    const audioPart = parts.find((p) => p && p.inlineData && p.inlineData.data);
    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error("Resposta do modelo não contém dados de áudio.");
    }

    const mimeType = audioPart.inlineData?.mimeType || 'audio/pcm';
    const audioData = audioPart.inlineData.data;
    const rawBuffer = Buffer.from(audioData, 'base64');

    const pcmToWav = (pcm, sampleRate = 24000, channels = 1, bitDepth = 16) => {
      const header = Buffer.alloc(44);
      const dataSize = pcm.length;
      header.write('RIFF', 0);
      header.writeUInt32LE(36 + dataSize, 4);
      header.write('WAVE', 8);
      header.write('fmt ', 12);
      header.writeUInt32LE(16, 16);
      header.writeUInt16LE(1, 20);
      header.writeUInt16LE(channels, 22);
      header.writeUInt32LE(sampleRate, 24);
      const byteRate = (sampleRate * channels * bitDepth) / 8;
      header.writeUInt32LE(byteRate, 28);
      const blockAlign = (channels * bitDepth) / 8;
      header.writeUInt16LE(blockAlign, 32);
      header.writeUInt16LE(bitDepth, 34);
      header.write('data', 36);
      header.writeUInt32LE(dataSize, 40);
      return Buffer.concat([header, pcm]);
    };

    if (mimeType.includes('wav')) {
      // Already WAV; stream directly
      res.set('Content-Type', 'audio/wav');
      res.send(rawBuffer);
    } else if (mimeType.includes('pcm')) {
      // Convert PCM to WAV for browser playback
      const wavBuffer = pcmToWav(rawBuffer, 24000, 1, 16);
      res.set('Content-Type', 'audio/wav');
      res.send(wavBuffer);
    } else {
      // Fallback: send with provided mime type
      res.set('Content-Type', mimeType || 'application/octet-stream');
      res.send(rawBuffer);
    }

  } catch (error) {
    console.error("Failed to generate speech in backend:", error);
    // Include minimal detail for troubleshooting while avoiding sensitive leakage
    res.status(500).json({ error: `Falha ao gerar áudio: ${error?.message || 'erro desconhecido'}` });
  }
});

// Geração de resposta de chat via Gemini (texto)
app.post('/api/ai/chat', ensureJsonBody, requireAuth, limitAIChat, async (req, res) => {
  try {
    const { message, agent, userProfile, chatHistory, guidance, stage, chartData, documentContent, imagePayloads } = req.body || {};
    if (!message || !agent) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes: message e agent.' });
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurado no servidor' });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const systemInstruction = String(agent?.systemInstruction || '').trim() || 'Você é um agente especialista. Responda em português, de forma objetiva e prática, com próximos passos claros e uma pergunta de continuidade apenas quando necessário.';
    
    // Lista de modelos para tentativa de fallback (priorizando o que o usuário pediu "Nano Banana" -> Gemini 2.5 Flash)
    // Se um falhar com 404, 429 ou 503, tentamos o próximo.
    const candidateModels = [
      'gemini-2.5-flash',              // "Nano Banana" family (Text/Multimodal)
      'gemini-2.0-flash-lite-preview-02-05', // Lite/Free preview
      'gemini-flash-latest',           // Alias genérico
      'gemini-2.0-flash'               // Fallback final
    ];

    const sanitize = (v) => {
      try {
        const s = String(v || '').trim();
        return s.length > 2000 ? s.slice(0, 2000) + '...' : s;
      } catch { return ''; }
    };
    const summarizeHistory = (hist = []) => {
      try {
        const last = Array.isArray(hist) ? hist.slice(-6) : [];
        return last.map((m) => {
          const who = m.sender === 'agent' ? 'Agente' : 'Usuário';
          return `- ${who}: ${sanitize(m.text || '')}`;
        }).join('\n');
      } catch { return ''; }
    };
    const attachmentLines = [];
    if (chartData && chartData.labels && chartData.values) {
      attachmentLines.push(`Resumo de dados anexados: ${sanitize(`labels=${JSON.stringify(chartData.labels)} values=${JSON.stringify(chartData.values)}`)}`);
    }
    if (documentContent) {
      attachmentLines.push(`Conteúdo do documento anexado (resumo): ${sanitize(documentContent)}`);
    }

    // Verificamos se o usuário está pedindo explicitamente para GERAR UMA IMAGEM
    const isImageGenerationRequest = message.toLowerCase().includes('crie uma imagem') || 
                                     message.toLowerCase().includes('gerar imagem') ||
                                     message.toLowerCase().includes('create an image') ||
                                     message.toLowerCase().includes('generate an image');

    if (isImageGenerationRequest) {
        console.log("Pedido de geração de imagem detectado. Tentando Gemini 2.5 Flash Image; fallback Pollinations.");
        const msgLower = message.toLowerCase();
        const wantsText = /texto|legenda|título|title|caption/.test(msgLower);
        const wantsLogo = /logo|logomarca|branding|marca/.test(msgLower);
        const hexColors = Array.from((String(message).match(/#([0-9a-fA-F]{3,8})/g) || []));
        const paletteSuffix = hexColors.length ? ` color palette: ${hexColors.join(', ')}` : '';
        if (wantsLogo) {
          try {
            const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: 'Output ONLY valid SVG markup representing a clean, modern logo. No markdown, no explanations.' });
            const svgResp = await textModel.generateContent({
              contents: [{ role: 'user', parts: [{ text: `${message}${paletteSuffix ? ',' + paletteSuffix : ''}. Produce only SVG.` }] }]
            });
            const svgText = String(svgResp?.response?.text() || '').trim();
            if (svgText && svgText.includes('<svg')) {
              const base64 = Buffer.from(svgText, 'utf-8').toString('base64');
              return res.json({ text: 'Logomarca gerada!', imageUrl: `data:image/svg+xml;base64,${base64}`, promptText: svgText });
            }
          } catch (svgErr) {
            console.error("Falha ao gerar SVG via Gemini:", svgErr?.message || svgErr);
          }
        }
        
        try {
            const imageModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' });
            const negatives = 'male, man, beard, moustache, stubble';
            const promptTextBase = String(message || '').trim();
            const commonSuffix = wantsText ? ` include overlay title and captions, high legibility, crisp typography, no watermark, no banners, no QR code${paletteSuffix}` : ` no text, no watermark, no banners, no QR code${paletteSuffix}`;
            const identitySuffix = (imagePayloads && Array.isArray(imagePayloads) && imagePayloads.length > 0) ? ` identity preserved from reference` : '';
            const usedPrompt = `${promptTextBase}, photorealistic studio product photo, 8K, ultra sharp, HDR, cinematic rim light, DSLR depth of field, realistic materials: leather, metal, skin, fabric,${identitySuffix}, negative prompt: (${negatives}),${commonSuffix}`;
            const parts = [];
            if (imagePayloads && Array.isArray(imagePayloads) && imagePayloads.length > 0) {
              const ref = imagePayloads[0];
              if (ref?.data && ref?.mimeType) {
                parts.push({ inlineData: { data: ref.data, mimeType: ref.mimeType } });
              }
            }
            parts.push({ text: usedPrompt });
            const imgResp = await imageModel.generateContent({
                contents: [{ role: 'user', parts }]
            });
            const cand = imgResp?.response?.candidates?.[0];
            let imgPart = null;
            if (cand && cand.content && Array.isArray(cand.content.parts)) {
              for (const p of cand.content.parts) {
                if (p.inlineData && p.inlineData.data) { imgPart = p.inlineData; break; }
              }
            }
            if (imgPart && imgPart.data) {
              const mime = imgPart.mimeType || 'image/png';
              const dataUrl = `data:${mime};base64,${imgPart.data}`;
              const responseText = `Imagem gerada!`;
              return res.json({ text: responseText, imageUrl: dataUrl, promptText: usedPrompt });
            }
        } catch (imgGenErr) {
            console.error("Falha ao gerar imagem via Gemini:", imgGenErr?.message || imgGenErr);
        }
        
        try {
            const promptModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash', systemInstruction: wantsText ? 'You are an expert prompt engineer. Output ONLY the prompt in English for an image with overlay title and captions aligned to the user request. No markdown.' : 'You are an expert prompt engineer. Output ONLY the prompt in English. No markdown.' });
            
            const promptParts = [{ text: `Create a detailed image generation prompt in English for: ${message}` }];
            if (imagePayloads && Array.isArray(imagePayloads) && imagePayloads.length > 0) {
              promptParts.unshift({ text: `You must preserve identity from the reference image. Subject is female. Avoid any male features. Output ONLY the prompt text.` });
              const ref = imagePayloads[0];
              if (ref?.data && ref?.mimeType) {
                promptParts.push({ inlineData: { data: ref.data, mimeType: ref.mimeType } });
              }
            }
            const promptResp = await promptModel.generateContent({
                contents: [{ role: 'user', parts: promptParts }]
            });
            
             let englishPrompt = promptResp.response.text().trim();
             englishPrompt = englishPrompt.replace(/^Here is a prompt: /i, '').replace(/`/g, '');
             const negatives = 'male, man, beard, moustache, stubble';
             const overlaySuffix = wantsText ? ` include overlay title and captions, high legibility, crisp typography, no watermark, no banners, no QR code${paletteSuffix}` : ` no text, no watermark, no banners, no QR code${paletteSuffix}`;
             const identitySuffix2 = (imagePayloads && Array.isArray(imagePayloads) && imagePayloads.length > 0) ? ` female, woman, identity preserved from reference` : '';
             const englishPromptClean = `${englishPrompt},${identitySuffix2}, negative prompt: (${negatives}),${overlaySuffix}`;
            
            console.log(`Prompt gerado para imagem: ${englishPrompt}`);
            
             const seed = Math.floor(Math.random() * 1000000);
             const primaryUrl = `https://pollinations.ai/p/${encodeURIComponent(englishPromptClean)}?model=flux&seed=${seed}&width=1024&height=1024`;
             const altUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPromptClean)}?model=flux&nologo=true&seed=${seed}&width=1024&height=1024`;
            
             const responseText = `Imagem gerada!`;
             
             try {
               const imageDataUrl = await fetchImageAsDataUrl(altUrl);
               return res.json({ text: responseText, imageUrl: imageDataUrl, promptText: englishPromptClean });
             } catch {
               return res.json({ text: responseText, imageUrl: altUrl, promptText: englishPromptClean });
             }
            
        } catch (imgError) {
            console.error("Erro ao preparar prompt de imagem:", imgError);
             const fallbackPrompt = `${String(message || '').trim()}${wantsText ? ', include overlay title and captions, high legibility, crisp typography' : ', no text'}, no watermark, no banners, no QR code${paletteSuffix}`;
             const primaryUrl = `https://pollinations.ai/p/${encodeURIComponent(fallbackPrompt)}?model=flux`;
             const altUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?model=flux&nologo=true`;
             try {
               const imageDataUrl = await fetchImageAsDataUrl(altUrl);
               return res.json({ text: `Imagem gerada com base no seu pedido.`, imageUrl: imageDataUrl, promptText: fallbackPrompt });
             } catch {
               return res.json({ text: `Imagem gerada com base no seu pedido.`, imageUrl: altUrl, promptText: fallbackPrompt });
             }
        }
    }

    let result = null;
    let lastError = null;
    let generatedImageBase64 = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Tentando gerar resposta com modelo: ${modelName}`);
        
        // Se for pedido de imagem, tentamos injetar instrução de output (embora a API de texto não retorne imagem binária diretamente no content parts padrão sem tool use).
        // A melhor aposta aqui é manter o fluxo de texto, mas se o usuário quer imagem, o modelo vai dizer que criou o prompt.
        // SE quisermos realmente gerar imagem, precisaríamos de uma chamada de API diferente (ex: DALL-E ou Vertex Imagen).
        // Dado o ambiente "Google Gemini Free Tier", a geração de imagem direta (blob) não é garantida na mesma resposta de texto.
        
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });
        
        // Reconstruindo userParts para cada tentativa (necessário pois o objeto pode ser consumido/modificado internamente)
        const currentContextual = [
          `Perfil do usuário: ${sanitize([
            userProfile?.userName, userProfile?.userRole, userProfile?.companyName,
            userProfile?.companyField, userProfile?.companySize, userProfile?.companyStage,
            userProfile?.mainProduct, userProfile?.targetAudience, userProfile?.mainChallenge
          ].filter(Boolean).join(' · '))}`,
          `Agente: ${sanitize(`${agent?.name || ''} — ${agent?.area || ''} (${agent?.specialty || ''})`)}`,
          stage ? `Estágio atual: ${sanitize(stage)}` : '',
          guidance ? `Orientação sugerida: ${sanitize(guidance)}` : '',
          summarizeHistory(chatHistory) ? `Histórico recente:\n${summarizeHistory(chatHistory)}` : '',
          attachmentLines.length ? attachmentLines.join('\n') : '',
          `Mensagem do usuário: ${sanitize(message)}`,
          `Instruções de resposta: Responda em português. Se o usuário pedir para CRIAR/GERAR uma imagem, explique que como modelo de linguagem você cria o PROMPT PERFEITO para ferramentas como Midjourney/DALL-E/Imagen, pois a geração direta de pixels via chat ainda é experimental nesta interface. Dê o prompt em bloco de código.`
        ].filter(Boolean).join('\n\n');

        const currentUserParts = [{ text: currentContextual }];
        if (imagePayloads && Array.isArray(imagePayloads)) {
          for (const img of imagePayloads) {
            if (img.data && img.mimeType) {
              currentUserParts.push({
                inlineData: { data: img.data, mimeType: img.mimeType }
              });
            }
          }
        }

        result = await model.generateContent({
          contents: [{ role: 'user', parts: currentUserParts }]
        });
        
        if (result && result.response) break; // Sucesso
      } catch (e) {
        console.warn(`Falha com modelo ${modelName}: ${e.message}`);
        lastError = e;
        // Se for erro de permissão (403) ou não encontrado (404) ou cota (429) ou server (503), continua.
        // Se for erro de chave inválida, paramos.
        if (String(e.message).includes('API_KEY')) throw e; 
      }
    }

    if (!result) {
        throw lastError || new Error('Todos os modelos falharam.');
    }

    const parts = result?.response?.candidates?.[0]?.content?.parts || [];
    const textParts = parts.map((p) => p?.text || '').filter(Boolean);
    const text = textParts.join('\n').trim();
    
    // Se tivéssemos geração de imagem real, retornaríamos { text, image: base64 }
    if (!text) {
      return res.status(500).json({ error: 'Resposta vazia do modelo' });
    }
    res.json({ text });
  } catch (e) {
    console.error('Falha em /api/ai/chat:', e?.message || e);
    res.status(500).json({ error: 'Falha ao gerar resposta de chat' });
  }
});

// Geração de análise do SuperBoss via Gemini (texto com bloco JSON embutido)
app.post('/api/ai/superboss', ensureJsonBody, requireAuth, limitSuperBoss, async (req, res) => {
  try {
    const { message, userProfile, chatHistory, systemInstruction } = req.body || {};
    if (!message || !systemInstruction) {
      return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes: message e systemInstruction.' });
    }
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurado no servidor' });
    }
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    // Usando gemini-2.0-flash (disponível na conta do usuário).
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', systemInstruction });

    const sanitize = (v) => {
      try { const s = String(v || '').trim(); return s.length > 2500 ? s.slice(0, 2500) + '...' : s; } catch { return ''; }
    };
    const summarizeHistory = (hist = []) => {
      try {
        const last = Array.isArray(hist) ? hist.slice(-8) : [];
        return last.map((m) => {
          const who = m.sender === 'agent' ? (m.agent?.name || 'Agente') : 'Usuário';
          return `- ${who}: ${sanitize(m.text || '')}`;
        }).join('\n');
      } catch { return ''; }
    };

    const contextual = [
      `Perfil do usuário: ${sanitize([
        userProfile?.userName, userProfile?.userRole, userProfile?.companyName,
        userProfile?.companyField, userProfile?.companySize, userProfile?.companyStage,
        userProfile?.mainProduct, userProfile?.targetAudience, userProfile?.mainChallenge
      ].filter(Boolean).join(' · '))}`,
      summarizeHistory(chatHistory) ? `Histórico recente:\n${summarizeHistory(chatHistory)}` : '',
      `Entrada do usuário: ${sanitize(message)}`,
      `Após sua resposta, inclua ao final um bloco JSON mínimo com as chaves "summary" (resumo do problema e linha de ação) e "areas" (lista de áreas recomendadas entre: Estratégia, Vendas, Marketing, Pessoas, Processos, Finanças).`
    ].filter(Boolean).join('\n\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: contextual }]}]
    });
    const parts = result?.response?.candidates?.[0]?.content?.parts || [];
    const textParts = parts.map((p) => p?.text || '').filter(Boolean);
    const text = textParts.join('\n').trim();
    if (!text) {
      return res.status(500).json({ error: 'Resposta vazia do modelo' });
    }
    res.json({ text });
  } catch (e) {
    console.error('Falha em /api/ai/superboss:', e?.message || e);
    res.status(500).json({ error: 'Falha ao gerar análise do SuperBoss' });
  }
});

// Rota de webhook do Stripe movida para o topo do ficheiro com parser correto
// app.post('/api/stripe/webhook', bodyParser.raw({ type: 'application/json' }), async (req, res) => { ... });

// Parser JSON para demais rotas (o webhook acima precisa do corpo "raw")
app.use(express.json());

// Plano do usuário
app.get('/api/user/plan', requireAuth, async (req, res) => {
  try {
    const { email } = req.user || {};
    if (!email) {
      return res.status(400).json({ error: 'Email não encontrado no token' });
    }

    const lower = String(email).toLowerCase();
    const isAdmin = ADMIN_EMAILS.includes(lower);
    if (isAdmin) {
      return res.json({ plan: 'premium', cycle: 'yearly' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      // Fallback leve ao store local para ambientes sem DB ou usuário não presente
      try {
        const db = ensureStoreShape();
        const u = db.users[email];
        if (u && (u.plan || u.cycle)) {
          return res.json({ plan: u.plan || 'free', cycle: u.cycle || 'monthly' });
        }
      } catch {}
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.subscription) {
      res.json({
        plan: user.subscription.plan,
        cycle: user.subscription.billingCycle,
      });
    } else {
      // Fallback: checa o store local
      try {
        const db = ensureStoreShape();
        const u = db.users[email];
        if (u && (u.plan || u.cycle)) {
          return res.json({ plan: u.plan || 'free', cycle: u.cycle || 'monthly' });
        }
      } catch {}
      res.json({ plan: 'free', cycle: 'monthly' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Falha ao obter plano' });
  }
});

// Email/password login with security check
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email é obrigatório' });
    if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Senha é obrigatória' });

    let prismaAvailable = true;
    try { await prisma.$queryRaw`SELECT 1`; } catch { prismaAvailable = false; }
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch {
      prismaAvailable = false;
    }

    let user;

    if (existingUser) {
      if (!existingUser.password) {
        return res.status(400).json({ error: 'Este email está vinculado ao Google Login ou não possui senha definida.' });
      }

      const isValid = await bcrypt.compare(password, existingUser.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha incorreta.' });
      }
      user = existingUser;
    } else {
      if (!prismaAvailable) {
        const db = ensureStoreShape();
        const u = db.users[email];
        if (!u || !u.passwordHash) {
          return res.status(404).json({ error: 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.' });
        }
        const isValid = await bcrypt.compare(password, u.passwordHash);
        if (!isValid) {
          return res.status(401).json({ error: 'Senha incorreta.' });
        }
        user = { id: email, email };
      } else {
        return res.status(404).json({ error: 'Usuário não encontrado. Verifique o e-mail ou crie uma conta.' });
      }
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ sub: user.id, email: user.email, iat: now, iss: 'gestaopro' }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
    try {
      if (isAdmin) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].plan = 'premium';
        db.users[email].cycle = 'yearly';
        writeStore(db);
      }
    } catch {}
    return res.json({ token, isAdmin, plan: isAdmin ? 'premium' : undefined, cycle: isAdmin ? 'yearly' : undefined });
  } catch (e) {
    console.error('Login error:', e?.message || e);
    return res.status(500).json({ error: 'Falha ao autenticar', detail: e?.message || String(e) });
  }
});

// Email/password registration
app.post('/api/auth/register', async (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email é obrigatório' });
    if (!password || typeof password !== 'string') return res.status(400).json({ error: 'Senha é obrigatória' });

    let prismaAvailable = true;
    try { await prisma.$queryRaw`SELECT 1`; } catch { prismaAvailable = false; }
    let existingUser = null;
    try {
      existingUser = await prisma.user.findUnique({ where: { email } });
    } catch {
      prismaAvailable = false;
    }

    if (existingUser) {
      return res.status(409).json({ error: 'Este email já está cadastrado. Faça login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let user;
    if (prismaAvailable) {
      try {
        user = await prisma.user.create({
          data: { email, password: hashedPassword },
        });
      } catch {
        prismaAvailable = false;
      }
    }
    if (!user) {
      const db = ensureStoreShape();
      if (db.users[email]) {
        return res.status(409).json({ error: 'Este email já está cadastrado. Faça login.' });
      }
      db.users[email] = { passwordHash: hashedPassword, plan: 'free', cycle: 'monthly' };
      writeStore(db);
      user = { id: email, email };
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ sub: user.id, email: user.email, iat: now, iss: 'gestaopro' }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
    try {
      if (isAdmin) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].plan = 'premium';
        db.users[email].cycle = 'yearly';
        writeStore(db);
      }
    } catch {}
    return res.json({ token, isAdmin, plan: isAdmin ? 'premium' : undefined, cycle: isAdmin ? 'yearly' : undefined });
  } catch (e) {
    console.error('Register error:', e?.message || e);
    return res.status(500).json({ error: 'Falha ao registrar usuário', detail: e?.message || String(e) });
  }
});

// Login via Google Identity Services (recebe idToken do cliente)
app.post('/api/auth/google', limitAuthGoogle, async (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID ausente no servidor' });
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== 'string') return res.status(400).json({ error: 'idToken é obrigatório' });
    const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch (ve) {
      try { console.warn('Falha na verificação do idToken do Google:', ve?.message || ve); } catch {}
      return res.status(401).json({ error: 'Token inválido', details: ve?.message || 'Verificação de token falhou' });
    }

    if (!payload) return res.status(401).json({ error: 'Token inválido' });

    const { email, name, picture } = payload;
    if (!email) return res.status(400).json({ error: 'Email não encontrado no token do Google' });
    let user;
    try {
      // Upsert usuário com campos válidos do schema Prisma
      user = await prisma.user.upsert({
        where: { email },
        update: { name: name || undefined, picture: picture || undefined },
        create: { email, name: name || undefined, picture: picture || undefined },
      });
    } catch (dbErr) {
      // Fallback leve para ambientes sem DB: mantém login funcional
      try { console.warn('Prisma indisponível, usando fallback leve de usuário.', dbErr?.message || dbErr); } catch {}
      user = { id: email, email, name: name || 'Usuário', picture: picture || undefined };
    }

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ sub: user.id, email: user.email, iat: now, iss: 'gestaopro' }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    const isAdmin = ADMIN_EMAILS.includes((user.email || '').toLowerCase());
    try {
      if (isAdmin) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].plan = 'premium';
        db.users[email].cycle = 'yearly';
        writeStore(db);
      }
    } catch {}
    res.json({ token, user, isAdmin, plan: isAdmin ? 'premium' : undefined, cycle: isAdmin ? 'yearly' : undefined });
  } catch (e) {
    console.error('Google Auth Error:', e);
    res.status(500).json({ error: 'Falha na autenticação com Google', details: e.message });
  }
});

// Retrieve a checkout session info (used by frontend)
app.get('/api/checkout/session/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const session = await stripe.checkout.sessions.retrieve(id, { expand: ['line_items', 'line_items.data.price.product'] });
    const lineItems = session.line_items?.data || [];
    res.json({
      id: session.id,
      customer: session.customer,
      customer_email: session.customer_details?.email,
      line_items: lineItems.map(item => ({
        price: { id: item.price?.id, product: { id: item.price?.product?.id } },
        quantity: item.quantity
      }))
    });
  } catch (e) {
    console.error('Erro ao obter sessão:', e);
    res.status(500).json({ error: 'Falha ao obter sessão.' });
  }
});

export default app;
