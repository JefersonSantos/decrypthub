const express = require('express');
const router = express.Router();
const axios = require('axios');
const supabase = require('../services/supabase');
const { decryptClickBank, decryptSecretKey } = require('../services/decrypt');
const { PLANS } = require('../services/stripe');

// POST /webhook/:slug - recebe notificação do ClickBank
router.post('/:slug', async (req, res) => {
  const startTime = Date.now();

  // Sempre retorna 200 para o ClickBank
  res.status(200).json({ received: true });

  try {
    // Busca webhook pelo slug
    const { data: webhook, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('slug', req.params.slug)
      .single();

    if (error || !webhook) {
      console.warn(`[RECEIVER] Webhook não encontrado: ${req.params.slug}`);
      return;
    }

    if (!webhook.is_active) {
      console.warn(`[RECEIVER] Webhook inativo: ${req.params.slug}`);
      return;
    }

    // Verifica limite de requisições do plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', webhook.user_id)
      .single();

    const plan = profile?.plan || 'free';
    const limits = PLANS[plan];

    if (limits.requestsPerMonth !== -1) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('webhook_logs')
        .select('id', { count: 'exact', head: true })
        .eq('webhook_id', webhook.id)
        .gte('received_at', startOfMonth.toISOString());

      if (count >= limits.requestsPerMonth) {
        await supabase.from('webhook_logs').insert({
          webhook_id: webhook.id,
          status: 'error',
          error_message: `Limite mensal de ${limits.requestsPerMonth} requisições atingido`,
          payload: req.body,
          processing_time_ms: Date.now() - startTime
        });
        return;
      }
    }

    // Descriptografa payload
    const body = req.body;
    const secretKey = decryptSecretKey(webhook.secret_key);
    let payload;

    // Verifica se veio criptografado ou não
    if (body.notification && body.iv) {
      payload = decryptClickBank(body.notification, body.iv, secretKey);
    } else {
      payload = body;
    }

    // Repassa para URL de destino
    let destinationStatus = null;
    try {
      const response = await axios.post(webhook.destination_url, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      destinationStatus = response.status;
    } catch (fwdErr) {
      destinationStatus = fwdErr.response?.status || 0;
      console.error(`[RECEIVER] Erro ao repassar para ${webhook.destination_url}:`, fwdErr.message);
    }

    // Salva log de sucesso
    await supabase.from('webhook_logs').insert({
      webhook_id: webhook.id,
      status: 'success',
      payload,
      destination_response_status: destinationStatus,
      processing_time_ms: Date.now() - startTime
    });

  } catch (err) {
    console.error('[RECEIVER] Erro:', err.message);

    // Tenta salvar log de erro
    try {
      const { data: webhook } = await supabase
        .from('webhooks')
        .select('id')
        .eq('slug', req.params.slug)
        .single();

      if (webhook) {
        await supabase.from('webhook_logs').insert({
          webhook_id: webhook.id,
          status: 'error',
          error_message: err.message,
          payload: req.body,
          processing_time_ms: Date.now() - startTime
        });
      }
    } catch (logErr) {
      console.error('[RECEIVER] Erro ao salvar log:', logErr.message);
    }
  }
});

module.exports = router;
