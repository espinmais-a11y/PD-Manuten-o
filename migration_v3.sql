-- ==========================================
-- MIGRATION V3: Automation for Machine Status
-- ==========================================

-- Function to update the machine status based on active service orders
CREATE OR REPLACE FUNCTION public.update_machine_status()
RETURNS TRIGGER AS $$
DECLARE
    active_orders_count INTEGER;
    target_machine_id UUID;
BEGIN
    -- Determine which machine ID we need to check
    IF (TG_OP = 'DELETE') THEN
        target_machine_id := OLD.machine_id;
    ELSE
        target_machine_id := NEW.machine_id;
    END IF;

    -- Count how many active orders exist for this machine
    SELECT count(*)
    INTO active_orders_count
    FROM public.service_orders
    WHERE machine_id = target_machine_id
      AND status IN ('Pending', 'In Route', 'Executing');

    -- Update the machine status based on the active orders count
    IF active_orders_count > 0 THEN
        UPDATE public.machines
        SET status = 'EM MANUTENÇÃO'
        WHERE id = target_machine_id;
    ELSE
        UPDATE public.machines
        SET status = 'OPERACIONAL'
        WHERE id = target_machine_id;
    END IF;

    -- If it's an UPDATE where the machine_id changed, we need to check the old machine too
    IF (TG_OP = 'UPDATE' AND OLD.machine_id != NEW.machine_id) THEN
        SELECT count(*)
        INTO active_orders_count
        FROM public.service_orders
        WHERE machine_id = OLD.machine_id
          AND status IN ('Pending', 'In Route', 'Executing');

        IF active_orders_count > 0 THEN
            UPDATE public.machines
            SET status = 'EM MANUTENÇÃO'
            WHERE id = OLD.machine_id;
        ELSE
            UPDATE public.machines
            SET status = 'OPERACIONAL'
            WHERE id = OLD.machine_id;
        END IF;
    END IF;

    RETURN NULL; -- AFTER triggers can return NULL
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop trigger if it exists to allow re-running
DROP TRIGGER IF EXISTS on_service_order_status_change ON public.service_orders;

-- Create the trigger on INSERT, UPDATE, and DELETE
CREATE TRIGGER on_service_order_status_change
    AFTER INSERT OR UPDATE OF status, machine_id OR DELETE
    ON public.service_orders
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_machine_status();

-- ==========================================
-- Retroactive Update for existing machines
-- ==========================================
UPDATE public.machines m
SET status = CASE 
    WHEN EXISTS (
        SELECT 1 FROM public.service_orders so 
        WHERE so.machine_id = m.id AND so.status IN ('Pending', 'In Route', 'Executing')
    ) THEN 'EM MANUTENÇÃO'
    ELSE 'OPERACIONAL'
END;
