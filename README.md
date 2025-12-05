<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1V_-lBjsV6HER8GQv6VteJfgypenJ854Z

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Configure billing (Stripe):
   - Create a `.env` file based on `.env.example`.
   - Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `CLIENT_URL`.
   - Set `VITE_STRIPE_PRICE_STARTER`, `VITE_STRIPE_PRICE_PRO`, `VITE_STRIPE_PRICE_PREMIUM`.
   - Optionally, set yearly IDs: `VITE_STRIPE_PRICE_STARTER_YEARLY`, `VITE_STRIPE_PRICE_PRO_YEARLY`, `VITE_STRIPE_PRICE_PREMIUM_YEARLY`.
   - Optional daily limits used in the UI: `VITE_CHAT_DAILY_LIMIT_*` e `VITE_TTS_DAILY_LIMIT_*` (Free/Starter/Pro/Premium).
4. Start the backend server:
   `npm run server`
5. Run the app:
   `npm run dev`
   Por padrão, o servidor de desenvolvimento ficará disponível em `http://localhost:3002/` (configurado em `vite.config.ts`).

Routes:
- `/` Landing com seções de recursos, planos e FAQ.
- `/login` Fluxo de autenticação.
- `/billing` Cobrança e upgrade de plano (usa Stripe).
- `/stripe-success` Retorno de sucesso do Stripe e aplicação do plano.

## Notas
- A landing page oficial está integrada no app raiz. Utilize apenas o app na porta `3002`.
