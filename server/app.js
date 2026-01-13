import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

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
      "style-src": ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
      "script-src": ["'self'", "https://accounts.google.com/gsi/client"],
      "frame-src": ["'self'", "https://accounts.google.com/gsi/"],
      "connect-src": ["'self'", "https://accounts.google.com/gsi/"],
    },
  },
}));

// Restrict CORS to the configured client URL
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Stripe-Signature'],
  credentials: true,
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


// Para todas as outras rotas, usamos o parser de JSON padrão.
app.use(express.json());


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

    const user = await prisma.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user) {
      // This case should ideally not happen if requireAuth and login work correctly
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.subscription) {
      res.json({
        plan: user.subscription.plan,
        cycle: user.subscription.billingCycle,
      });
    } else {
      res.json({ plan: 'free', cycle: 'monthly' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Falha ao obter plano' });
  }
});

// Email/password placeholder login (for demo only)
app.post('/api/auth/login', async (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email é obrigatório' });

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email },
    });

    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ sub: user.id, email: user.email, iat: now, iss: 'gestaopro' }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao autenticar' });
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
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: 'Token inválido' });

    const { email, name, picture } = payload;
    if (!email) return res.status(400).json({ error: 'Email não encontrado no token do Google' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: name || 'Usuário',
          avatarUrl: picture,
          plan: 'FREE',
        },
      });
    }

    const token = jwt.sign({ id: user.id, email: user.email, plan: user.plan }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
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