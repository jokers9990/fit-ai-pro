
-- Create missing enum types that weren't created properly
CREATE TYPE public.user_role AS ENUM ('admin', 'instructor', 'student');
CREATE TYPE public.subscription_plan_type AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'canceled', 'trial');

-- Ensure the handle_new_user function works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile entry
    INSERT INTO public.profiles (user_id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', 'Usuário'),
        NEW.email,
        CASE 
            WHEN NEW.email LIKE '%instructor%' OR NEW.email LIKE '%admin%' THEN 'instructor'::user_role
            ELSE 'student'::user_role
        END
    );

    -- Create free subscription for new users
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    SELECT NEW.id, id, 'active'::subscription_status
    FROM public.subscription_plans 
    WHERE type = 'free'::subscription_plan_type
    LIMIT 1;

    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't block user creation
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default subscription plans if they don't exist
INSERT INTO public.subscription_plans (name, type, price, ai_requests_limit, features) 
SELECT * FROM (VALUES 
    ('Plano Gratuito', 'free'::subscription_plan_type, 0.00, 10, '["Avaliação física básica", "IMC automático", "10 consultas IA/mês", "1 treino básico"]'::jsonb),
    ('Plano Premium', 'premium'::subscription_plan_type, 29.90, 100, '["Tudo do gratuito", "Treinos personalizados com IA", "Dietas personalizadas", "100 consultas IA/mês", "Fotos de progresso", "Relatórios avançados"]'::jsonb),
    ('Plano Enterprise', 'enterprise'::subscription_plan_type, 99.90, 500, '["Tudo do premium", "IA ilimitada", "Múltiplas academias", "Dashboard instrutor", "Suporte prioritário", "API access"]'::jsonb)
) AS v(name, type, price, ai_requests_limit, features)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE type = v.type);
