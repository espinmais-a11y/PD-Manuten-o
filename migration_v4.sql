-- ==========================================
-- MIGRATION V4: RLS Security Enhancements
-- ==========================================

-- 1. Helper Function to check if user is Employee
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

-- 2. Drop existing over-permissive policies
DROP POLICY IF EXISTS "customers_select_auth" ON public.customers;
DROP POLICY IF EXISTS "machines_select_auth" ON public.machines;
DROP POLICY IF EXISTS "so_employee_assigned" ON public.service_orders;

-- 3. Create tighter policies for Customers
-- Admins and Employees can see all customers. Customers can only see their own record.
CREATE POLICY "customers_read_secure" ON public.customers 
    FOR SELECT USING (
        public.is_admin() 
        OR public.is_employee() 
        OR contact_email = (auth.jwt()->>'email')
    );

-- 4. Create tighter policies for Machines
-- Admins and Employees can see all machines. Customers can only see their own machines.
CREATE POLICY "machines_read_secure" ON public.machines 
    FOR SELECT USING (
        public.is_admin() 
        OR public.is_employee() 
        OR customer_id IN (
            SELECT id FROM public.customers WHERE contact_email = (auth.jwt()->>'email')
        )
    );

-- 5. Secure Service Orders
-- Admin (covered by existing "so_admin_all")
-- Employee sees assigned to them or unassigned.
-- Customer sees their own orders.
CREATE POLICY "so_read_employee_or_customer" ON public.service_orders 
    FOR SELECT USING (
        (public.is_employee() AND (employee_id = auth.uid() OR employee_id IS NULL))
        OR customer_id IN (
            SELECT id FROM public.customers WHERE contact_email = (auth.jwt()->>'email')
        )
    );
