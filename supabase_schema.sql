-- SQL para Supabase (Atualizado para ser Re-executável)

-- ==========================================
-- MIGRATION: Ensure all columns exist (Prevent Schema Cache Errors)
-- ==========================================
DO $$ 
BEGIN
    -- PROFILES
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;

    -- CUSTOMERS
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tax_id TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS contact_email TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS birth_date DATE;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS cep TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS street TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS number TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS complement TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS neighborhood TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS state TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS discovery_source TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS interests TEXT;
    ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT FALSE;

    -- MACHINES
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS brand TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS model TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS serial_number TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS internal_id TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS mfg_year INTEGER;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS energy_type TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS battery_model TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS charger_model TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS load_capacity_tons DECIMAL(5,2);
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS mast_type TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS max_elevation_meters DECIMAL(5,2);
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS current_hour_meter DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS daily_usage_avg_hours DECIMAL(4,2) DEFAULT 0;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Operational';

    -- SERVICE ORDERS
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS problem_photo_url TEXT;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS hour_meter_at_service DECIMAL(10,2);
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_in_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_in_lat DOUBLE PRECISION;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_in_lng DOUBLE PRECISION;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_out_at TIMESTAMP WITH TIME ZONE;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_out_lat DOUBLE PRECISION;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS check_out_lng DOUBLE PRECISION;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS vibe_signature TEXT;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS technical_notes TEXT;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS total_value DECIMAL(12,2) DEFAULT 0;
    ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE;

EXCEPTION
    WHEN others THEN RAISE NOTICE 'Migration handled with some notices.';
END $$;

-- 1. Tabelas de Base
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('Admin', 'Employee', 'Customer')),
    is_approved BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    tax_id TEXT UNIQUE NOT NULL, -- CPF ou CNPJ
    birth_date DATE,
    contact_email TEXT NOT NULL,
    phone TEXT,
    whatsapp TEXT,
    cep TEXT,
    street TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    gender TEXT,
    discovery_source TEXT,
    interests TEXT,
    terms_accepted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.machines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    serial_number TEXT UNIQUE NOT NULL, -- Chassi
    internal_id TEXT, -- Prefixo
    mfg_year INTEGER,
    energy_type TEXT CHECK (energy_type IN ('GLP', 'Diesel', 'Eletrica')),
    battery_model TEXT,
    charger_model TEXT,
    load_capacity_tons DECIMAL(5,2),
    mast_type TEXT CHECK (mast_type IN ('Simplex', 'Duplex', 'Triplex')),
    max_elevation_meters DECIMAL(5,2),
    current_hour_meter DECIMAL(10,2) DEFAULT 0,
    daily_usage_avg_hours DECIMAL(4,2) DEFAULT 0,
    status TEXT DEFAULT 'Operational',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.service_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.customers(id),
    machine_id UUID REFERENCES public.machines(id),
    employee_id UUID REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    problem_photo_url TEXT,
    hour_meter_at_service DECIMAL(10,2),
    status TEXT CHECK (status IN ('Pending', 'In Route', 'Executing', 'Finished', 'Cancelled')) DEFAULT 'Pending',
    check_in_at TIMESTAMP WITH TIME ZONE,
    check_in_lat DOUBLE PRECISION,
    check_in_lng DOUBLE PRECISION,
    check_out_at TIMESTAMP WITH TIME ZONE,
    check_out_lat DOUBLE PRECISION,
    check_out_lng DOUBLE PRECISION,
    vibe_signature TEXT,
    technical_notes TEXT,
    total_value DECIMAL(12,2) DEFAULT 0,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.used_parts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_order_id UUID REFERENCES public.service_orders(id) ON DELETE CASCADE,
    part_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(brand_id, name)
);

CREATE TABLE IF NOT EXISTS public.battery_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.charger_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- FUNÇÕES DE APOIO (SECURITY DEFINER)
-- ==========================================

-- Função para verificar se é Admin sem causar recursividade
-- Marcada como SECURITY DEFINER para rodar como postgres (ignora RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    -- Verificação direta via metadados do JWT (MUITO RÁPIDO, NÃO RECURSIVO)
    IF (LOWER(auth.jwt() ->> 'email') IN ('raoniespin@gmail.com', 'raopniespin@gmail.com', 'espin.mais@gmail.com')) THEN
        RETURN TRUE;
    END IF;

    -- Verificação no banco (SECURITY DEFINER pula o RLS da tabela profiles)
    SELECT (role = 'Admin') INTO is_admin_user
    FROM public.profiles
    WHERE id = auth.uid();

    RETURN COALESCE(is_admin_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função auxiliar para verificar se é Funcionário
CREATE OR REPLACE FUNCTION public.is_employee()
RETURNS BOOLEAN AS $$
DECLARE
    is_emp BOOLEAN;
BEGIN
    SELECT (role = 'Employee') INTO is_emp
    FROM public.profiles
    WHERE id = auth.uid();
    RETURN COALESCE(is_emp, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==========================================
-- TABELAS E RLS (Configuração Final Consolidada)
-- ==========================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charger_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.used_parts ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza total de políticas para evitar conflitos (Idempotência)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- 3. POLÍTICAS PARA PROFILES (O ponto crítico onde ocorria recursão)
-- IMPORTANTE: Não use a função is_admin() aqui, pois ela consulta a própria tabela profiles.

-- Permissão: Usuário vê seu próprio perfil
CREATE POLICY "profiles_select_own" ON public.profiles 
    FOR SELECT USING (id = auth.uid());

-- Permissão: Admins proprietários podem tudo (identificados pelo email no JWT, sem query extra)
CREATE POLICY "profiles_owner_bypass" ON public.profiles 
    FOR ALL USING (LOWER(auth.jwt() ->> 'email') IN ('raoniespin@gmail.com', 'raopniespin@gmail.com', 'espin.mais@gmail.com'));

-- Permissão: Outros Admins (se houver) via metadados do Auth (visto que profiles é sensível)
CREATE POLICY "profiles_admin_metadata" ON public.profiles
    FOR ALL USING (auth.jwt() -> 'app_metadata' ->> 'role' = 'Admin');

-- 4. POLÍTICAS PARA OUTRAS TABELAS (Aqui podemos usar a função is_admin() com segurança)

-- Marcas e Modelos: Visíveis a todos, editáveis apenas por Admin
CREATE POLICY "brands_public_select" ON public.brands FOR SELECT USING (true);
CREATE POLICY "brands_admin_all" ON public.brands FOR ALL USING (public.is_admin());

CREATE POLICY "models_public_select" ON public.models FOR SELECT USING (true);
CREATE POLICY "models_admin_all" ON public.models FOR ALL USING (public.is_admin());

CREATE POLICY "battery_public_select" ON public.battery_types FOR SELECT USING (true);
CREATE POLICY "battery_admin_all" ON public.battery_types FOR ALL USING (public.is_admin());

CREATE POLICY "charger_public_select" ON public.charger_types FOR SELECT USING (true);
CREATE POLICY "charger_admin_all" ON public.charger_types FOR ALL USING (public.is_admin());

-- Clientes: Admins e Funcionários vêem todos. Clientes vêem apenas seu próprio registro (via email).
CREATE POLICY "customers_read_secure" ON public.customers 
    FOR SELECT USING (public.is_admin() OR public.is_employee() OR contact_email = (auth.jwt()->>'email'));
CREATE POLICY "customers_admin_all" ON public.customers FOR ALL USING (public.is_admin());

-- Máquinas: Admins e Funcionários vêem todas. Clientes vêem apenas as suas.
CREATE POLICY "machines_read_secure" ON public.machines 
    FOR SELECT USING (public.is_admin() OR public.is_employee() OR customer_id IN (SELECT id FROM public.customers WHERE contact_email = (auth.jwt()->>'email')));
CREATE POLICY "machines_admin_all" ON public.machines FOR ALL USING (public.is_admin());

-- Ordens de Serviço:
-- Admin vê tudo.
-- Funcionário vê as atribuídas a ele ou as não atribuídas.
-- Cliente vê apenas as dele.
CREATE POLICY "so_admin_all" ON public.service_orders FOR ALL USING (public.is_admin());
CREATE POLICY "so_read_employee_or_customer" ON public.service_orders 
    FOR SELECT USING (
        (public.is_employee() AND (employee_id = auth.uid() OR employee_id IS NULL))
        OR customer_id IN (SELECT id FROM public.customers WHERE contact_email = (auth.jwt()->>'email'))
    );

-- used_parts: Segue a política da ordem de serviço pai
CREATE POLICY "parts_select_so" ON public.used_parts 
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.service_orders WHERE id = service_order_id AND (employee_id = auth.uid() OR employee_id IS NULL OR public.is_admin() OR customer_id IN (SELECT id FROM public.customers WHERE contact_email = (auth.jwt()->>'email')))));
CREATE POLICY "parts_admin_all" ON public.used_parts FOR ALL USING (public.is_admin());

-- ==========================================
-- TRIGGER DE AUTOMAÇÃO (NEW USER)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_role TEXT;
  is_approved_val BOOLEAN;
BEGIN
  -- Default: Customer não aprovado
  target_role := COALESCE(new.raw_user_meta_data->>'role', 'Customer');
  is_approved_val := FALSE;

  -- Auto-promoção e Aprovação para emails específicos do proprietário
  IF LOWER(new.email) IN ('raoniespin@gmail.com', 'raopniespin@gmail.com', 'espin.mais@gmail.com') THEN
    target_role := 'Admin';
    is_approved_val := TRUE;
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, is_approved)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.email), 
    new.email, 
    target_role,
    is_approved_val
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_approved = EXCLUDED.is_approved;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- COMANDOS ÚTEIS PARA ADMINISTRADORES
-- ==========================================

-- 1. Tornar um usuário Administrador manualmente:
-- Substitua 'seu-email@gmail.com' pelo email do usuário que deseja promover
-- UPDATE public.profiles SET role = 'Admin', is_approved = true WHERE email = 'seu-email@gmail.com';

-- 2. Limpar todas as políticas (se houver erro 42710)
-- DROP POLICY IF EXISTS "Anyone can view brands" ON brands;
-- DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
-- DROP POLICY IF EXISTS "Anyone can view models" ON models;
-- DROP POLICY IF EXISTS "Admins can manage models" ON models;
-- DROP POLICY IF EXISTS "Admins can view and update all profiles" ON profiles;

-- ==========================================
-- TRIGGER: AUTOMATIC MACHINE STATUS UPDATE
-- ==========================================
CREATE OR REPLACE FUNCTION public.update_machine_status()
RETURNS TRIGGER AS $$
DECLARE
    active_orders_count INTEGER;
    target_machine_id UUID;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_machine_id := OLD.machine_id;
    ELSE
        target_machine_id := NEW.machine_id;
    END IF;

    SELECT count(*)
    INTO active_orders_count
    FROM public.service_orders
    WHERE machine_id = target_machine_id
      AND status IN ('Pending', 'In Route', 'Executing');

    IF active_orders_count > 0 THEN
        UPDATE public.machines SET status = 'EM MANUTENÇÃO' WHERE id = target_machine_id;
    ELSE
        UPDATE public.machines SET status = 'OPERACIONAL' WHERE id = target_machine_id;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.machine_id != NEW.machine_id) THEN
        SELECT count(*)
        INTO active_orders_count
        FROM public.service_orders
        WHERE machine_id = OLD.machine_id
          AND status IN ('Pending', 'In Route', 'Executing');

        IF active_orders_count > 0 THEN
            UPDATE public.machines SET status = 'EM MANUTENÇÃO' WHERE id = OLD.machine_id;
        ELSE
            UPDATE public.machines SET status = 'OPERACIONAL' WHERE id = OLD.machine_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_service_order_status_change ON public.service_orders;
CREATE TRIGGER on_service_order_status_change
    AFTER INSERT OR UPDATE OF status, machine_id OR DELETE
    ON public.service_orders
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_machine_status();
