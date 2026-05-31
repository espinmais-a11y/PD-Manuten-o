-- ==========================================
-- MIGRATION V6: Preventive Maintenance, Photos, Created By
-- ==========================================

DO $$
BEGIN
    -- SERVICE ORDERS: new columns
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS is_preventive BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS work_hours DECIMAL(6,2) DEFAULT 0;
EXCEPTION
    WHEN others THEN RAISE NOTICE 'service_orders columns already exist or error: %', SQLERRM;
END $$;

-- Tabela de itens do checklist de manutenção preventiva
CREATE TABLE IF NOT EXISTS public.preventive_checklist_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    label TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de respostas do checklist por OS
CREATE TABLE IF NOT EXISTS public.preventive_checklist_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.preventive_checklist_items(id) ON DELETE CASCADE NOT NULL,
    answer TEXT CHECK (answer IN ('ok', 'pending')) NOT NULL,
    answered_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(service_order_id, item_id)
);

-- Tabela de fotos da OS
CREATE TABLE IF NOT EXISTS public.service_order_photos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- POPULAR ITENS PADRÃO DO CHECKLIST
-- ==========================================
INSERT INTO public.preventive_checklist_items (label, display_order, is_active) VALUES
    ('Verificação do nível de óleo do motor', 1, TRUE),
    ('Verificação do nível de óleo hidráulico', 2, TRUE),
    ('Verificação do nível da água do radiador', 3, TRUE),
    ('Lubrificação de mastro e correntes', 4, TRUE),
    ('Verificação das palhetas de borracha dos garfos', 5, TRUE),
    ('Verificação e limpeza do filtro de ar', 6, TRUE),
    ('Verificação do sistema de freios', 7, TRUE),
    ('Verificação do sistema elétrico (fusíveis e cabos)', 8, TRUE),
    ('Teste de funcionamento do buzzer e sinalizações', 9, TRUE),
    ('Verificação do estado e calibragem dos pneus', 10, TRUE)
ON CONFLICT DO NOTHING;

-- ==========================================
-- RLS POLICIES
-- ==========================================

ALTER TABLE public.preventive_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preventive_checklist_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_order_photos ENABLE ROW LEVEL SECURITY;

-- Checklist items: todos podem ler, só admin pode editar
DROP POLICY IF EXISTS "checklist_items_read" ON public.preventive_checklist_items;
DROP POLICY IF EXISTS "checklist_items_admin" ON public.preventive_checklist_items;
CREATE POLICY "checklist_items_read" ON public.preventive_checklist_items FOR SELECT USING (true);
CREATE POLICY "checklist_items_admin" ON public.preventive_checklist_items FOR ALL USING (public.is_admin());

-- Checklist answers: técnico e admin
DROP POLICY IF EXISTS "checklist_answers_read" ON public.preventive_checklist_answers;
DROP POLICY IF EXISTS "checklist_answers_write" ON public.preventive_checklist_answers;
DROP POLICY IF EXISTS "checklist_answers_update" ON public.preventive_checklist_answers;
DROP POLICY IF EXISTS "checklist_answers_admin" ON public.preventive_checklist_answers;
CREATE POLICY "checklist_answers_read" ON public.preventive_checklist_answers FOR SELECT USING (public.is_admin() OR public.is_employee());
CREATE POLICY "checklist_answers_write" ON public.preventive_checklist_answers FOR INSERT WITH CHECK (public.is_admin() OR public.is_employee());
CREATE POLICY "checklist_answers_update" ON public.preventive_checklist_answers FOR UPDATE USING (public.is_admin() OR public.is_employee());
CREATE POLICY "checklist_answers_admin" ON public.preventive_checklist_answers FOR DELETE USING (public.is_admin());

-- Service order photos: técnico e admin
DROP POLICY IF EXISTS "so_photos_read" ON public.service_order_photos;
DROP POLICY IF EXISTS "so_photos_write" ON public.service_order_photos;
DROP POLICY IF EXISTS "so_photos_admin" ON public.service_order_photos;
CREATE POLICY "so_photos_read" ON public.service_order_photos FOR SELECT USING (public.is_admin() OR public.is_employee());
CREATE POLICY "so_photos_write" ON public.service_order_photos FOR INSERT WITH CHECK (public.is_admin() OR public.is_employee());
CREATE POLICY "so_photos_admin" ON public.service_order_photos FOR ALL USING (public.is_admin());

-- Política de update/delete para employees na tabela service_orders
DROP POLICY IF EXISTS "so_employee_update" ON public.service_orders;
CREATE POLICY "so_employee_update" ON public.service_orders
    FOR UPDATE USING (
        public.is_employee() AND (employee_id = auth.uid() OR employee_id IS NULL)
    );
