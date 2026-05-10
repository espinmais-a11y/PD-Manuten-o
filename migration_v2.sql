-- ==========================================
-- MIGRAÇÃO V2 - PD Manutenção
-- Execute este script no SQL Editor do Supabase
-- ==========================================

-- 1. Novo campo work_hours na tabela service_orders
ALTER TABLE public.service_orders 
  ADD COLUMN IF NOT EXISTS work_hours DECIMAL(10,2) DEFAULT 0;

-- 2. Atualizar CHECK constraint do status (removido 'Finished', adicionado 'Maintenance Done')
ALTER TABLE public.service_orders 
  DROP CONSTRAINT IF EXISTS service_orders_status_check;
ALTER TABLE public.service_orders 
  ADD CONSTRAINT service_orders_status_check 
  CHECK (status IN ('Pending', 'In Route', 'Executing', 'Maintenance Done', 'Cancelled'));

-- 3. Migrar OS existentes com status 'Finished' para 'Maintenance Done'
UPDATE public.service_orders 
  SET status = 'Maintenance Done' 
  WHERE status = 'Finished';

-- 4. Nova tabela admin_settings (chave-valor para configurações globais)
CREATE TABLE IF NOT EXISTS public.admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Inserir valor padrão da hora de serviço (R$ 150,00)
INSERT INTO public.admin_settings (key, value) 
VALUES ('hourly_rate', '150.00')
ON CONFLICT (key) DO NOTHING;

-- 6. Habilitar RLS na tabela admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- 7. Políticas de acesso para admin_settings
-- Todos podem ler (para o front calcular valores)
DROP POLICY IF EXISTS "settings_public_select" ON public.admin_settings;
CREATE POLICY "settings_public_select" ON public.admin_settings 
  FOR SELECT USING (true);

-- Apenas Admin pode inserir/atualizar/deletar
DROP POLICY IF EXISTS "settings_admin_all" ON public.admin_settings;
CREATE POLICY "settings_admin_all" ON public.admin_settings 
  FOR ALL USING (public.is_admin());

-- ==========================================
-- FIM DA MIGRAÇÃO V2
-- ==========================================
