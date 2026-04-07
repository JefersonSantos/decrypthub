const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../services/supabase');
const auth = require('../middleware/auth');
const { encryptSecretKey, decryptSecretKey } = require('../services/decrypt');
const { PLANS } = require('../services/stripe');

// Todos os endpoints exigem autenticação
router.use(auth);

// GET /api/webhooks - lista webhooks do usuário
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, name, slug, destination_url, is_active, created_at, updated_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks/:id - detalhe de um webhook
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('id, name, slug, destination_url, is_active, created_at, updated_at')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Webhook não encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/webhooks - cria novo webhook
router.post('/', async (req, res) => {
  try {
    const { name, secret_key, destination_url } = req.body;

    if (!name || !secret_key || !destination_url) {
      return res.status(400).json({ error: 'name, secret_key e destination_url são obrigatórios' });
    }

    // Verifica limite do plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', req.user.id)
      .single();

    const plan = profile?.plan || 'free';
    const limits = PLANS[plan];

    if (limits.webhooks !== -1) {
      const { count } = await supabase
        .from('webhooks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', req.user.id);

      if (count >= limits.webhooks) {
        return res.status(403).json({
          error: `Limite de ${limits.webhooks} webhook(s) atingido para o plano ${plan}. Faça upgrade para continuar.`
        });
      }
    }

    const slug = uuidv4().replace(/-/g, '').slice(0, 16);
    const encryptedKey = encryptSecretKey(secret_key);

    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        user_id: req.user.id,
        name,
        secret_key: encryptedKey,
        destination_url,
        slug,
        is_active: true
      })
      .select('id, name, slug, destination_url, is_active, created_at')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/webhooks/:id - atualiza webhook
router.put('/:id', async (req, res) => {
  try {
    const { name, secret_key, destination_url, is_active } = req.body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (destination_url !== undefined) updates.destination_url = destination_url;
    if (is_active !== undefined) updates.is_active = is_active;
    if (secret_key !== undefined) updates.secret_key = encryptSecretKey(secret_key);

    const { data, error } = await supabase
      .from('webhooks')
      .update(updates)
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .select('id, name, slug, destination_url, is_active, updated_at')
      .single();

    if (error || !data) return res.status(404).json({ error: 'Webhook não encontrado' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/webhooks/:id - deleta webhook
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/webhooks/:id/logs - logs de um webhook
router.get('/:id/logs', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    // Verifica se o webhook pertence ao usuário
    const { data: webhook } = await supabase
      .from('webhooks')
      .select('id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single();

    if (!webhook) return res.status(404).json({ error: 'Webhook não encontrado' });

    let query = supabase
      .from('webhook_logs')
      .select('*', { count: 'exact' })
      .eq('webhook_id', req.params.id)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
