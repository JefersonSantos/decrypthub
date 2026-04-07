const express = require('express');
const router = express.Router();
const supabase = require('../services/supabase');
const auth = require('../middleware/auth');

router.use(auth);

// GET /api/profile
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, company_name, plan, created_at')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ ...data, email: req.user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/profile
router.put('/', async (req, res) => {
  try {
    const { full_name, company_name } = req.body;

    const { data, error } = await supabase
      .from('profiles')
      .update({ full_name, company_name })
      .eq('id', req.user.id)
      .select('id, full_name, company_name, plan')
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/profile - deleta conta
router.delete('/', async (req, res) => {
  try {
    await supabase.from('webhooks').delete().eq('user_id', req.user.id);
    await supabase.from('profiles').delete().eq('id', req.user.id);
    await supabase.auth.admin.deleteUser(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
