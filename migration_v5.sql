-- ==========================================
-- MIGRATION V5: Fix Machine Status Strings
-- ==========================================

-- A aplicação frontend espera os valores 'Operational', 'Maintenance' e 'Down'.
-- O trigger anterior estava inserindo 'EM MANUTENÇÃO' e 'OPERACIONAL', causando o problema visual "FORA DE SERVIÇO".

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
        UPDATE public.machines SET status = 'Maintenance' WHERE id = target_machine_id;
    ELSE
        UPDATE public.machines SET status = 'Operational' WHERE id = target_machine_id;
    END IF;

    IF (TG_OP = 'UPDATE' AND OLD.machine_id != NEW.machine_id) THEN
        SELECT count(*)
        INTO active_orders_count
        FROM public.service_orders
        WHERE machine_id = OLD.machine_id
          AND status IN ('Pending', 'In Route', 'Executing');

        IF active_orders_count > 0 THEN
            UPDATE public.machines SET status = 'Maintenance' WHERE id = OLD.machine_id;
        ELSE
            UPDATE public.machines SET status = 'Operational' WHERE id = OLD.machine_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Correção retroativa dos status existentes que ficaram em português
UPDATE public.machines SET status = 'Operational' WHERE status = 'OPERACIONAL';
UPDATE public.machines SET status = 'Maintenance' WHERE status = 'EM MANUTENÇÃO';

-- Forçar reavaliação de todos baseados nas ordens atuais
UPDATE public.machines m
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM public.service_orders so 
        WHERE so.machine_id = m.id AND so.status IN ('Pending', 'In Route', 'Executing')
    ) THEN 'Maintenance'
    ELSE 'Operational'
END
WHERE status != 'Down'; -- Se foi marcado como DOWN manualmente, não mexe se não tiver ordem, a menos que ele volte.
