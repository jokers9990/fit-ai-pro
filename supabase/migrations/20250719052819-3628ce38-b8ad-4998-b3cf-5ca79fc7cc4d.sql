
-- Atualizar o role do usuário jokers.producer@gmail.com para instructor
UPDATE public.profiles 
SET role = 'instructor'::user_role 
WHERE email = 'jokers.producer@gmail.com';

-- Criar tabela para vincular instrutores a alunos
CREATE TABLE public.instructor_students (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  instructor_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  UNIQUE(instructor_id, student_id)
);

-- Habilitar RLS na tabela instructor_students
ALTER TABLE public.instructor_students ENABLE ROW LEVEL SECURITY;

-- Política para instrutores gerenciarem seus alunos
CREATE POLICY "Instructors can manage their students" 
  ON public.instructor_students 
  FOR ALL 
  USING (auth.uid() = instructor_id);

-- Política para alunos verem seus instrutores
CREATE POLICY "Students can view their instructors" 
  ON public.instructor_students 
  FOR SELECT 
  USING (auth.uid() = student_id);

-- Atualizar função handle_new_user para identificar instrutores automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
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
                WHEN NEW.email IN ('jokers.producer@gmail.com') OR 
                     NEW.email LIKE '%instructor%' OR 
                     NEW.email LIKE '%admin%' THEN 'instructor'::user_role
                ELSE 'student'::user_role
            END
        );
        
        RAISE LOG 'handle_new_user: Profile created successfully for user %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'handle_new_user: Error creating profile for user %: %', NEW.id, SQLERRM;
    END;
    
    -- Criar assinatura gratuita padrão
    BEGIN
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
    END;

    RAISE LOG 'handle_new_user: Completed successfully for user %', NEW.id;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'handle_new_user: Critical error for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$function$;
