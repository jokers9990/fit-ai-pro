import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Target, Dumbbell, Play } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Exercise {
  name: string;
  type: string;
  muscle_groups: string[];
  sets: number;
  reps: string;
  rest: string;
  instructions: string;
  equipment?: string[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  start_date: string;
  end_date?: string;
  generated_by_ai: boolean;
  ai_prompt?: string;
  created_at: string;
}

export function WorkoutPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchWorkout();
    }
  }, [id]);

  const fetchWorkout = async () => {
    try {
      const { data, error } = await supabase
        .from('workout_plans')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching workout:', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar plano de treino"
        });
        navigate('/dashboard');
        return;
      }

      setWorkout({
        ...data,
        exercises: Array.isArray(data.exercises) ? data.exercises as unknown as Exercise[] : []
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar plano de treino"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-muted rounded w-64"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Treino não encontrado</h2>
        <Button onClick={() => navigate('/dashboard')}>
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">{workout.name}</h1>
          <p className="text-muted-foreground">{workout.description}</p>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workout.exercises?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Estimada</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workout.exercises?.length ? Math.round(workout.exercises.length * 4) : 0}min
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Criado com</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workout.generated_by_ai ? 'IA' : 'Manual'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Exercícios</h2>
        {workout.exercises?.map((exercise, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{exercise.name}</CardTitle>
                <Badge variant="secondary">
                  {exercise.type}
                </Badge>
              </div>
              <CardDescription>
                Músculos: {exercise.muscle_groups?.join(', ')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{exercise.sets}</div>
                  <p className="text-sm text-muted-foreground">Séries</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{exercise.reps}</div>
                  <p className="text-sm text-muted-foreground">Repetições</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{exercise.rest}</div>
                  <p className="text-sm text-muted-foreground">Descanso</p>
                </div>
              </div>
              
              {exercise.equipment && exercise.equipment.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Equipamentos:</h4>
                  <div className="flex flex-wrap gap-2">
                    {exercise.equipment.map((eq, idx) => (
                      <Badge key={idx} variant="outline">{eq}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-2">Instruções:</h4>
                <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {workout.exercises?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum exercício encontrado</h3>
            <p className="text-muted-foreground text-center">
              Este plano de treino ainda não possui exercícios
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}