
-- Atualizar função handle_new_user com melhor tratamento de erros e logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, auth
AS $$
BEGIN
    -- Log início da função
    RAISE LOG 'handle_new_user: Starting for user ID %', NEW.id;
    
    -- Verificar se o usuário já tem perfil (evitar duplicatas)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = NEW.id) THEN
        RAISE LOG 'handle_new_user: Profile already exists for user %', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Criar entrada no perfil
    BEGIN
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
        
        RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Continua mesmo com erro no perfil
    END;
    
    -- Criar assinatura gratuita padrão
    BEGIN
        -- Verificar se existe plano gratuito
        IF NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE type = 'free'::subscription_plan_type) THEN
            RAISE WARNING 'handle_new_user: No free subscription plan found';
        ELSE
            INSERT INTO public.user_subscriptions (user_id, plan_id, status)
            SELECT NEW.id, id, 'active'::subscription_status
            FROM public.subscription_plans 
            WHERE type = 'free'::subscription_plan_type
            LIMIT 1;
            
            RAISE LOG 'handle_new_user: Free subscription created for user %', NEW.id;
        END IF;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: Error creating subscription for user %: %', NEW.id, SQLERRM;
            -- Continua mesmo com erro na assinatura
    END;

    RAISE LOG 'handle_new_user: Completed successfully for user %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log erro crítico mas não bloqueia criação do usuário
        RAISE WARNING 'handle_new_user: Critical error for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recriar trigger para garantir que está usando a versão correta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar função get_user_role com search_path seguro
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Atualizar função is_instructor com search_path seguro
CREATE OR REPLACE FUNCTION public.is_instructor(user_uuid UUID)
RETURNS BOOLEAN 
LANGUAGE SQL 
SECURITY DEFINER 
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = user_uuid AND role IN ('instructor', 'admin')
    );
$$;

-- Adicionar políticas RLS faltantes para tabelas sem políticas

-- RLS para gyms
CREATE POLICY "Gym owners can manage their gyms" ON public.gyms
    FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Everyone can view active gyms" ON public.gyms
    FOR SELECT USING (true);

-- RLS para gym_members
CREATE POLICY "Gym owners can manage members" ON public.gym_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.gyms 
            WHERE id = gym_id AND owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can view their own gym memberships" ON public.gym_members
    FOR SELECT USING (auth.uid() = user_id);

-- RLS para body_measurements
CREATE POLICY "Users can manage their own measurements" ON public.body_measurements
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view student measurements" ON public.body_measurements
    FOR SELECT USING (
        auth.uid() = user_id OR public.is_instructor(auth.uid())
    );

-- RLS para meals
CREATE POLICY "Users can view meals from their diet plans" ON public.meals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.diet_plans 
            WHERE id = diet_plan_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can manage meals for their students" ON public.meals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.diet_plans 
            WHERE id = diet_plan_id AND 
            (user_id = auth.uid() OR instructor_id = auth.uid() OR public.is_instructor(auth.uid()))
        )
    );

-- RLS para nutrition_goals
CREATE POLICY "Users can manage their own nutrition goals" ON public.nutrition_goals
    FOR ALL USING (auth.uid() = user_id);

-- RLS para workout_templates
CREATE POLICY "Users can view public workout templates" ON public.workout_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage their own workout templates" ON public.workout_templates
    FOR ALL USING (auth.uid() = created_by);

CREATE POLICY "Instructors can view all templates" ON public.workout_templates
    FOR SELECT USING (public.is_instructor(auth.uid()));

-- Garantir que planos de assinatura existem (caso não tenham sido criados)
INSERT INTO public.subscription_plans (name, type, price, ai_requests_limit, features) 
SELECT * FROM (VALUES 
    ('Plano Gratuito', 'free'::subscription_plan_type, 0.00, 10, '["Avaliação física básica", "IMC automático", "10 consultas IA/mês", "1 treino básico"]'::jsonb),
    ('Plano Premium', 'premium'::subscription_plan_type, 29.90, 100, '["Tudo do gratuito", "Treinos personalizados com IA", "Dietas personalizadas", "100 consultas IA/mês", "Fotos de progresso", "Relatórios avançados"]'::jsonb),
    ('Plano Enterprise', 'enterprise'::subscription_plan_type, 99.90, 500, '["Tudo do premium", "IA ilimitada", "Múltiplas academias", "Dashboard instrutor", "Suporte prioritário", "API access"]'::jsonb)
) AS v(name, type, price, ai_requests_limit, features)
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans WHERE type = v.type);
