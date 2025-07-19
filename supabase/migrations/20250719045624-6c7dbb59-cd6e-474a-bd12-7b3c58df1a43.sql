-- Criar enum para tipos de usuário
CREATE TYPE public.user_role AS ENUM ('admin', 'instructor', 'student');

-- Criar enum para planos de assinatura
CREATE TYPE public.subscription_plan_type AS ENUM ('free', 'premium', 'enterprise');

-- Criar enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'canceled', 'trial');

-- Criar enum para tipos de exercício
CREATE TYPE public.exercise_type AS ENUM ('strength', 'cardio', 'flexibility', 'balance', 'sports');

-- Criar enum para categorias de refeição
CREATE TYPE public.meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'student',
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    profile_picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de planos de assinatura
CREATE TABLE public.subscription_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type subscription_plan_type NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    ai_requests_limit INTEGER NOT NULL DEFAULT 0,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de assinaturas de usuário
CREATE TABLE public.user_subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
    status subscription_status NOT NULL DEFAULT 'trial',
    ai_requests_used INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de academias
CREATE TABLE public.gyms (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    email TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de membros da academia
CREATE TABLE public.gym_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES auth.users(id),
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(gym_id, user_id)
);

-- Tabela de avaliações físicas
CREATE TABLE public.physical_assessments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES auth.users(id),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    bmi DECIMAL(5,2),
    notes TEXT,
    assessment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de medidas corporais
CREATE TABLE public.body_measurements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES public.physical_assessments(id),
    chest DECIMAL(5,2),
    waist DECIMAL(5,2),
    hip DECIMAL(5,2),
    bicep_right DECIMAL(5,2),
    bicep_left DECIMAL(5,2),
    thigh_right DECIMAL(5,2),
    thigh_left DECIMAL(5,2),
    measured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de exercícios
CREATE TABLE public.exercises (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    exercise_type exercise_type NOT NULL,
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT[],
    instructions TEXT,
    video_url TEXT,
    created_by UUID REFERENCES auth.users(id),
    is_public BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de templates de treino
CREATE TABLE public.workout_templates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    target_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 5),
    estimated_duration INTEGER, -- em minutos
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de planos de treino
CREATE TABLE public.workout_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES auth.users(id),
    template_id UUID REFERENCES public.workout_templates(id),
    name TEXT NOT NULL,
    description TEXT,
    exercises JSONB NOT NULL DEFAULT '[]', -- Array de exercícios com sets, reps, peso
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    generated_by_ai BOOLEAN NOT NULL DEFAULT false,
    ai_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de planos de dieta
CREATE TABLE public.diet_plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    daily_calories INTEGER,
    daily_protein DECIMAL(5,2),
    daily_carbs DECIMAL(5,2),
    daily_fat DECIMAL(5,2),
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    generated_by_ai BOOLEAN NOT NULL DEFAULT false,
    ai_prompt TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de refeições
CREATE TABLE public.meals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    diet_plan_id UUID NOT NULL REFERENCES public.diet_plans(id) ON DELETE CASCADE,
    category meal_category NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]',
    calories INTEGER,
    protein DECIMAL(5,2),
    carbs DECIMAL(5,2),
    fat DECIMAL(5,2),
    preparation_time INTEGER, -- em minutos
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de objetivos nutricionais
CREATE TABLE public.nutrition_goals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal_type TEXT NOT NULL CHECK (goal_type IN ('weight_loss', 'weight_gain', 'muscle_gain', 'maintenance')),
    target_weight DECIMAL(5,2),
    target_body_fat DECIMAL(5,2),
    weekly_goal DECIMAL(5,2), -- kg por semana
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conversas com IA
CREATE TABLE public.ai_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    conversation_type TEXT NOT NULL CHECK (conversation_type IN ('general', 'workout', 'nutrition', 'progress')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens de IA
CREATE TABLE public.ai_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fotos de progresso
CREATE TABLE public.progress_photos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT CHECK (photo_type IN ('front', 'side', 'back')),
    description TEXT,
    taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de histórico de peso
CREATE TABLE public.weight_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    weight DECIMAL(5,2) NOT NULL,
    body_fat_percentage DECIMAL(5,2),
    muscle_mass DECIMAL(5,2),
    notes TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Função para obter role do usuário (Security Definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Função para verificar se usuário é instrutor
CREATE OR REPLACE FUNCTION public.is_instructor(user_uuid UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = user_uuid AND role IN ('instructor', 'admin')
    );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view student profiles" ON public.profiles
    FOR SELECT USING (
        public.is_instructor(auth.uid()) OR auth.uid() = user_id
    );

-- RLS Policies para subscription_plans
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans
    FOR SELECT USING (is_active = true);

-- RLS Policies para user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies para physical_assessments
CREATE POLICY "Users can view their own assessments" ON public.physical_assessments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Instructors can view and create assessments" ON public.physical_assessments
    FOR ALL USING (
        auth.uid() = user_id OR 
        public.is_instructor(auth.uid())
    );

-- RLS Policies para workout_plans
CREATE POLICY "Users can view their own workout plans" ON public.workout_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Instructors can manage workout plans" ON public.workout_plans
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() = instructor_id OR
        public.is_instructor(auth.uid())
    );

-- RLS Policies para diet_plans
CREATE POLICY "Users can view their own diet plans" ON public.diet_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Instructors can manage diet plans" ON public.diet_plans
    FOR ALL USING (
        auth.uid() = user_id OR 
        auth.uid() = instructor_id OR
        public.is_instructor(auth.uid())
    );

-- RLS Policies para ai_conversations
CREATE POLICY "Users can manage their own AI conversations" ON public.ai_conversations
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies para ai_messages
CREATE POLICY "Users can view messages from their conversations" ON public.ai_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert messages in their conversations" ON public.ai_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- RLS Policies para progress_photos
CREATE POLICY "Users can manage their own progress photos" ON public.progress_photos
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies para weight_history
CREATE POLICY "Users can manage their own weight history" ON public.weight_history
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies para exercises (públicos e próprios)
CREATE POLICY "Everyone can view public exercises" ON public.exercises
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view and manage their own exercises" ON public.exercises
    FOR ALL USING (auth.uid() = created_by);

-- Função para criar perfil automaticamente após signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
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

    -- Criar assinatura gratuita por padrão
    INSERT INTO public.user_subscriptions (user_id, plan_id, status)
    SELECT NEW.id, id, 'active'::subscription_status
    FROM public.subscription_plans 
    WHERE type = 'free'::subscription_plan_type
    LIMIT 1;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gyms_updated_at
    BEFORE UPDATE ON public.gyms
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at
    BEFORE UPDATE ON public.workout_templates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workout_plans_updated_at
    BEFORE UPDATE ON public.workout_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
    BEFORE UPDATE ON public.diet_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at
    BEFORE UPDATE ON public.nutrition_goals
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON public.ai_conversations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir planos de assinatura padrão
INSERT INTO public.subscription_plans (name, type, price, ai_requests_limit, features) VALUES
(
    'Plano Gratuito',
    'free',
    0.00,
    10,
    '["Avaliação física básica", "IMC automático", "10 consultas IA/mês", "1 treino básico"]'
),
(
    'Plano Premium',
    'premium',
    29.90,
    100,
    '["Tudo do gratuito", "Treinos personalizados com IA", "Dietas personalizadas", "100 consultas IA/mês", "Fotos de progresso", "Relatórios avançados"]'
),
(
    'Plano Enterprise',
    'enterprise',
    99.90,
    500,
    '["Tudo do premium", "IA ilimitada", "Múltiplas academias", "Dashboard instrutor", "Suporte prioritário", "API access"]'
);

-- Função para calcular IMC
CREATE OR REPLACE FUNCTION public.calculate_bmi(weight DECIMAL, height DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
    IF height > 0 THEN
        RETURN ROUND((weight / (height * height)) * 10000, 2);
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;