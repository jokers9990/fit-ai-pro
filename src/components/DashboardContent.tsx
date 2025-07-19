import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Apple, 
  Dumbbell, 
  MessageCircle, 
  TrendingUp, 
  Zap,
  Plus,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalWorkouts: number;
  activeDiet: boolean;
  aiUsage: number;
  aiLimit: number;
  lastAssessment: any;
  recentProgress: any[];
}

export function DashboardContent() {
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<div>Perfil em desenvolvimento...</div>} />
      <Route path="workouts" element={<div>Treinos em desenvolvimento...</div>} />
      <Route path="nutrition" element={<div>Nutrição em desenvolvimento...</div>} />
      <Route path="chat" element={<div>Chat IA em desenvolvimento...</div>} />
      <Route path="progress" element={<div>Progresso em desenvolvimento...</div>} />
      <Route path="photos" element={<div>Fotos em desenvolvimento...</div>} />
      <Route path="settings" element={<div>Configurações em desenvolvimento...</div>} />
    </Routes>
  );
}

function DashboardHome() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalWorkouts: 0,
    activeDiet: false,
    aiUsage: 0,
    aiLimit: 0,
    lastAssessment: null,
    recentProgress: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      // Buscar estatísticas do usuário
      const [workoutsRes, dietsRes, assessmentRes] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('diet_plans').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('physical_assessments').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(1)
      ]);

      const subscription = profile?.user_subscriptions?.[0];
      
      setStats({
        totalWorkouts: workoutsRes.data?.length || 0,
        activeDiet: (dietsRes.data?.length || 0) > 0,
        aiUsage: subscription?.ai_requests_used || 0,
        aiLimit: subscription?.subscription_plans?.ai_requests_limit || 0,
        lastAssessment: assessmentRes.data?.[0] || null,
        recentProgress: []
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = (weight?: number, height?: number) => {
    if (!weight || !height) return null;
    const heightInM = height / 100;
    return (weight / (heightInM * heightInM)).toFixed(1);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Abaixo do peso', color: 'text-blue-600' };
    if (bmi < 25) return { label: 'Peso normal', color: 'text-green-600' };
    if (bmi < 30) return { label: 'Sobrepeso', color: 'text-yellow-600' };
    return { label: 'Obesidade', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const bmi = stats.lastAssessment ? calculateBMI(stats.lastAssessment.weight, stats.lastAssessment.height) : null;
  const bmiCategory = bmi ? getBMICategory(parseFloat(bmi)) : null;

  return (
    <div className="space-y-6">
      {/* Estatísticas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
            <p className="text-xs text-muted-foreground">
              planos de treino em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dieta Ativa</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeDiet ? 'Sim' : 'Não'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeDiet ? 'plano alimentar ativo' : 'sem plano ativo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IA Disponível</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.aiLimit - stats.aiUsage}
            </div>
            <p className="text-xs text-muted-foreground">
              de {stats.aiLimit} consultas restantes
            </p>
            <Progress 
              value={(stats.aiUsage / stats.aiLimit) * 100} 
              className="mt-2 h-1"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IMC Atual</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bmi || '--'}
            </div>
            <p className={`text-xs ${bmiCategory?.color || 'text-muted-foreground'}`}>
              {bmiCategory?.label || 'Faça sua avaliação'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Avaliação física */}
      {stats.lastAssessment && (
        <Card>
          <CardHeader>
            <CardTitle>Última Avaliação Física</CardTitle>
            <CardDescription>
              Realizada em {new Date(stats.lastAssessment.assessment_date).toLocaleDateString('pt-BR')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.lastAssessment.weight}kg
                </div>
                <p className="text-sm text-muted-foreground">Peso</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.lastAssessment.height}cm
                </div>
                <p className="text-sm text-muted-foreground">Altura</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.lastAssessment.body_fat_percentage || '--'}%
                </div>
                <p className="text-sm text-muted-foreground">% Gordura</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {stats.lastAssessment.muscle_mass || '--'}kg
                </div>
                <p className="text-sm text-muted-foreground">Massa Muscular</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ações rápidas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Dumbbell className="h-5 w-5" />
              <span>Gerar Treino com IA</span>
            </CardTitle>
            <CardDescription>
              Crie um plano de treino personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar Treino
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Apple className="h-5 w-5" />
              <span>Gerar Dieta com IA</span>
            </CardTitle>
            <CardDescription>
              Crie um plano alimentar personalizado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Criar Dieta
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat com IA</span>
            </CardTitle>
            <CardDescription>
              Tire suas dúvidas sobre fitness
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">
              <MessageCircle className="mr-2 h-4 w-4" />
              Iniciar Chat
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Plano atual */}
      <Card>
        <CardHeader>
          <CardTitle>Seu Plano Atual</CardTitle>
          <CardDescription>
            Gerencie sua assinatura e funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">
                {profile?.user_subscriptions?.[0]?.subscription_plans?.name || 'Plano Gratuito'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stats.aiUsage}/{stats.aiLimit} consultas de IA utilizadas
              </p>
            </div>
            <Button variant="outline">
              Gerenciar Plano
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}