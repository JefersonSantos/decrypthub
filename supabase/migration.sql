-- ============================================================
-- DecryptHub - Supabase Migration
-- Execute no SQL Editor do Supabase
-- ============================================================

-- Tabela de perfis (complementa auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  company_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  secret_key TEXT NOT NULL, -- armazenada criptografada
  destination_url TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  payload JSONB,
  error_message TEXT,
  destination_response_status INTEGER,
  processing_time_ms INTEGER,
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Índices para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_slug ON webhooks(slug);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_received_at ON webhook_logs(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- ============================================================
-- Trigger: cria perfil automaticamente ao registrar usuário
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário vê/edita apenas o próprio
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Webhooks: usuário vê/gerencia apenas os próprios
CREATE POLICY "webhooks_select" ON webhooks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "webhooks_insert" ON webhooks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "webhooks_update" ON webhooks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "webhooks_delete" ON webhooks FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs: usuário vê logs dos próprios webhooks
CREATE POLICY "logs_select" ON webhook_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM webhooks WHERE webhooks.id = webhook_logs.webhook_id AND webhooks.user_id = auth.uid()
  ));

-- Subscriptions: usuário vê apenas as próprias
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- Limpeza automática de logs antigos por plano
-- Executar via pg_cron (opcional) ou cron job externo
-- ============================================================
-- DELETE FROM webhook_logs
-- WHERE received_at < NOW() - INTERVAL '1 day'
-- AND webhook_id IN (
--   SELECT w.id FROM webhooks w
--   JOIN profiles p ON p.id = w.user_id
--   WHERE p.plan = 'free'
-- );
