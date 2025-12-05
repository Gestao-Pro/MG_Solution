import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import Stripe from 'stripe';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const PORT = process.env.PORT || 4001;
const AUTH_JWT_SECRET = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET || '';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
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
const stripe = new Stripe(STRIPE_SECRET_KEY || 'sk_test_');
const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // CSP deve ser configurada no servidor de estáticos em produção
}));
// Restrict CORS to the configured client URL
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','Stripe-Signature'],
}));
app.use(express.json());

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

// Basic login endpoint (email/password placeholder) — recomenda-se Google Sign-In em produção
app.post('/api/auth/login', (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    const { email, password } = req.body || {};
    if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email é obrigatório' });
    // Observação: autenticação real deve validar senha/ID token (ex.: Google). Aqui é apenas placeholder.
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({
      sub: email,
      email,
      iat: now,
      iss: 'gestaopro',
    }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    // Garante existência do usuário no store mínimo
    const db = ensureStoreShape();
    db.users[email] = db.users[email] || { plan: 'free', cycle: 'monthly' };
    writeStore(db);
    return res.json({ token });
  } catch (e) {
    return res.status(500).json({ error: 'Falha ao autenticar' });
  }
});

// Simple file-based store for demo
const storePath = path.join(__dirname, 'data');
const storeFile = path.join(storePath, 'store.json');
if (!fs.existsSync(storePath)) fs.mkdirSync(storePath, { recursive: true });
if (!fs.existsSync(storeFile)) fs.writeFileSync(storeFile, JSON.stringify({ users: {} }, null, 2));
const readStore = () => JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
const writeStore = (obj) => fs.writeFileSync(storeFile, JSON.stringify(obj, null, 2));

// Helpers para garantir forma do store e mapear customer -> email
const ensureStoreShape = () => {
  const db = readStore();
  if (!db.users || typeof db.users !== 'object') db.users = {};
  if (!db.customers || typeof db.customers !== 'object') db.customers = {};
  writeStore(db);
  return db;
};
const setCustomerEmail = (customerId, email) => {
  if (!customerId || !email) return;
  const db = ensureStoreShape();
  db.customers[customerId] = email;
  db.users[email] = db.users[email] || {};
  db.users[email].customerId = customerId;
  writeStore(db);
};
const getEmailForCustomer = (customerId) => {
  if (!customerId) return undefined;
  const db = readStore();
  return db.customers ? db.customers[customerId] : undefined;
};

app.post('/api/checkout/session', requireAuth, async (req, res) => {
  try {
    const { priceId } = req.body || {};
    if (!priceId) return res.status(400).json({ error: 'priceId é obrigatório' });
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${CLIENT_URL}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/`,
      allow_promotion_codes: true
    });
    // Opcional: associar email do usuário à sessão
    try {
      if (req.user?.email) {
        await stripe.checkout.sessions.update(session.id, { customer_email: req.user.email });
      }
    } catch {}
    res.json({ id: session.id, url: session.url });
  } catch (e) {
    console.error('Erro ao criar sessão de checkout:', e);
    res.status(500).json({ error: 'Falha ao criar sessão.' });
  }
});

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

app.post('/api/billing/portal', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body || {};
    if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório' });
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

// Pricing info for Starter/Pro/Premium
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
      if (!id) return null;
      const price = await stripe.prices.retrieve(id, { expand: ['product'] });
      const productObj = typeof price.product === 'string' ? undefined : price.product;
      return {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        nickname: price.nickname || undefined,
        productName: productObj?.name || undefined,
        interval: price.recurring?.interval || undefined,
      };
    };
    const starter = await fetchPrice(STARTER_PRICE);
    const pro = await fetchPrice(PRO_PRICE);
    const premium = await fetchPrice(PREMIUM_PRICE);
    const starter_yearly = await fetchPrice(STARTER_PRICE_YEARLY);
    const pro_yearly = await fetchPrice(PRO_PRICE_YEARLY);
    const premium_yearly = await fetchPrice(PREMIUM_PRICE_YEARLY);
    res.json({ starter, pro, premium, starter_yearly, pro_yearly, premium_yearly });
  } catch (e) {
    console.error('Erro ao obter pricing:', e?.message || e);
    // Graceful fallback in dev environments
    if ((process.env.NODE_ENV || '').toLowerCase() !== 'production') {
      return res.json(buildMockPricing());
    }
    res.status(500).json({ error: 'Falha ao obter pricing.' });
  }
});

// Basic analytics endpoint to record landing events (CTA clicks, toggles)
app.post('/api/analytics/event', async (req, res) => {
  try {
    const { name, payload } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Nome do evento é obrigatório' });
    const who = (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) ? 'auth' : 'anon';
    console.log('[analytics]', new Date().toISOString(), name, { ...(payload || {}), user: who });
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro no analytics:', e);
    res.status(500).json({ error: 'Falha ao registrar evento.' });
  }
});

// Novo endpoint para gerar fala
app.post('/api/generate-speech', requireAuth, async (req, res) => {
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

// Stripe webhook requires raw body for signature verification
app.post('/api/webhooks/stripe', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
  if (!WEBHOOK_SECRET) {
    console.warn('WEBHOOK_SECRET não definido. Ignorando verificação.');
    return res.status(200).send('ok');
  }
  const sig = req.headers['stripe-signature'];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, WEBHOOK_SECRET);
    // Handle subscription and checkout events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email;
      const customerId = session.customer;
      if (email) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].lastCheckoutSessionId = session.id;
        if (customerId) db.users[email].customerId = customerId;
        writeStore(db);
      }
      if (customerId && email) setCustomerEmail(customerId, email);
    }
    if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
      const sub = event.data.object;
      const customerId = sub?.customer;
      let email = sub?.metadata?.email;
      if (!email && customerId) {
        // Tenta mapear via store; se não houver, consulta o Stripe
        email = getEmailForCustomer(customerId);
        if (!email) {
          try {
            const customer = await stripe.customers.retrieve(customerId);
            email = customer?.email || undefined;
            if (email) setCustomerEmail(customerId, email);
          } catch (e) {
            console.warn('Não foi possível obter email do cliente:', e?.message || e);
          }
        }
      }
      if (email) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].subscriptionStatus = sub.status;
        db.users[email].currentPeriodEnd = sub.current_period_end;
        db.users[email].customerId = customerId || db.users[email].customerId;
        // Mapear plano/ciclo pelo priceId
        try {
          const item = Array.isArray(sub?.items?.data) ? sub.items.data[0] : undefined;
          const priceId = item?.price?.id || undefined;
          const interval = item?.price?.recurring?.interval || undefined; // 'month' | 'year'
          let plan = db.users[email].plan || 'free';
          let cycle = db.users[email].cycle || 'monthly';
          if (priceId) {
            if (priceId === STARTER_PRICE || priceId === STARTER_PRICE_YEARLY) {
              plan = 'starter';
              cycle = priceId === STARTER_PRICE_YEARLY ? 'yearly' : (interval === 'year' ? 'yearly' : 'monthly');
            } else if (priceId === PRO_PRICE || priceId === PRO_PRICE_YEARLY) {
              plan = 'pro';
              cycle = priceId === PRO_PRICE_YEARLY ? 'yearly' : (interval === 'year' ? 'yearly' : 'monthly');
            } else if (priceId === PREMIUM_PRICE || priceId === PREMIUM_PRICE_YEARLY) {
              plan = 'premium';
              cycle = priceId === PREMIUM_PRICE_YEARLY ? 'yearly' : (interval === 'year' ? 'yearly' : 'monthly');
            }
          }
          db.users[email].plan = plan;
          db.users[email].cycle = cycle;
          db.users[email].priceId = priceId;
        } catch {}
        writeStore(db);
      }
    }
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.cancelled') {
      const sub = event.data.object;
      const customerId = sub?.customer;
      const email = getEmailForCustomer(customerId);
      if (email) {
        const db = ensureStoreShape();
        db.users[email] = db.users[email] || {};
        db.users[email].subscriptionStatus = sub.status || 'canceled';
        db.users[email].plan = 'free';
        db.users[email].cycle = 'monthly';
        writeStore(db);
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Erro no webhook:', err);
    res.status(400).send(`Webhook error: ${err.message}`);
  }
});

app.get('/api/me/plan', requireAuth, (req, res) => {
  const email = req.user?.email;
  if (!email || typeof email !== 'string') return res.json({ plan: 'free', cycle: 'monthly', status: 'inactive' });
  const db = ensureStoreShape();
  const u = db.users[email] || {};
  const status = u.subscriptionStatus || 'inactive';
  const plan = u.plan || (status === 'active' ? 'starter' : 'free');
  const cycle = u.cycle || 'monthly';
  const currentPeriodEnd = u.currentPeriodEnd || null;
  res.json({ plan, cycle, status, currentPeriodEnd });
});

app.listen(PORT, () => {
  console.log(`Stripe server listening on http://localhost:${PORT}`);
});

// Login via Google Identity Services (recebe idToken do cliente)
app.post('/api/auth/google', async (req, res) => {
  try {
    if (!AUTH_JWT_SECRET) return res.status(500).json({ error: 'AUTH_JWT_SECRET não configurado' });
    if (!GOOGLE_CLIENT_ID || !googleClient) return res.status(500).json({ error: 'GOOGLE_CLIENT_ID ausente no servidor' });
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== 'string') return res.status(400).json({ error: 'idToken é obrigatório' });
    const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ error: 'Token inválido' });
    const email = payload.email || '';
    const sub = payload.sub || email || `anon_${Date.now()}`;
    const name = payload.name || '';
    const picture = payload.picture || '';
    const now = Math.floor(Date.now() / 1000);
    const token = jwt.sign({ sub, email, name, picture, iat: now, iss: 'gestaopro' }, AUTH_JWT_SECRET, { expiresIn: '7d' });
    const db = ensureStoreShape();
    db.users[email] = db.users[email] || { plan: 'free', cycle: 'monthly' };
    writeStore(db);
    return res.json({ token, profile: { email, name, picture } });
  } catch (e) {
    console.error('Falha login Google:', e?.message || e);
    return res.status(401).json({ error: 'Falha ao verificar token Google' });
  }
});