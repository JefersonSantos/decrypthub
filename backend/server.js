const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const webhooksRouter = require('./routes/webhooks');
const billingRouter = require('./routes/billing');
const profileRouter = require('./routes/profile');
const receiverRouter = require('./routes/receiver');
const stripeWebhookRouter = require('./routes/stripeWebhook');

const app = express();

// Stripe webhook precisa do body raw
app.use('/stripe/webhook', express.raw({ type: 'application/json' }));

// Middlewares globais
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500,
  message: { error: 'Too many requests' }
});
app.use('/api/', limiter);

// Rotas
app.use('/api/webhooks', webhooksRouter);
app.use('/api/billing', billingRouter);
app.use('/api/profile', profileRouter);
app.use('/stripe/webhook', stripeWebhookRouter);

// Rota pública de recebimento de webhooks ClickBank
app.use('/webhook', receiverRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'DecryptHub' }));

// Handler de erros global
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DecryptHub backend rodando na porta ${PORT}`));
