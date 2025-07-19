import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dumbbell, 
  Clock, 
  Target, 
  CheckCircle,
  Circle,
  Download,
  ArrowLeft,
  Timer,
  Repeat
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Exercise {
  name: string;
  type: 'strength' | 'cardio' | 'flexibility';
  muscle_groups: string[];
  sets: number;
  reps: string;
  rest: string;
  instructions: string;
  equipment: string[];
}

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  start_date: string;
  generated_by_ai: boolean;
  ai_prompt?: string;
  instructor_id: string;
  user_id: string;
}

export function WorkoutView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<WorkoutPlan | null>(null);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
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
        .single();

      if (error) throw error;
      
      // Parse exercises from JSON
      const workoutData = {
        ...data,
        exercises: Array.isArray(data.exercises) ? data.exercises : JSON.parse(data.exercises as string)
      };
      setWorkout(workoutData);
    } catch (error) {
      console.error('Error fetching workout:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar o treino"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExerciseCompletion = (index: number) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedExercises(newCompleted);
  };

  const generatePDF = () => {
    // Simple implementation - in a real app you'd use a proper PDF library
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${workout?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .exercise { margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
            .exercise-name { font-weight: bold; font-size: 18px; }
            .exercise-details { margin: 10px 0; }
            .muscle-groups { color: #666; }
          </style>
        </head>
        <body>
          <h1>${workout?.name}</h1>
          <p><strong>Descrição:</strong> ${workout?.description}</p>
          <p><strong>Data de início:</strong> ${new Date(workout?.start_date || '').toLocaleDateString('pt-BR')}</p>
          
          <h2>Exercícios</h2>
          ${workout?.exercises.map((exercise, index) => `
            <div class="exercise">
              <div class="exercise-name">${index + 1}. ${exercise.name}</div>
              <div class="exercise-details">
                <strong>Séries:</strong> ${exercise.sets} | 
                <strong>Repetições:</strong> ${exercise.reps} | 
                <strong>Descanso:</strong> ${exercise.rest}s
              </div>
              <div class="muscle-groups">
                <strong>Músculos:</strong> ${exercise.muscle_groups.join(', ')}
              </div>
              <div><strong>Instruções:</strong> ${exercise.instructions}</div>
              ${exercise.equipment.length > 0 ? `<div><strong>Equipamentos:</strong> ${exercise.equipment.join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-32"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!workout) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Dumbbell className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Treino não encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              O treino que você está procurando não existe ou foi removido
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = (completedExercises.size / workout.exercises.length) * 100;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{workout.name}</h1>
            <p className="text-muted-foreground">{workout.description}</p>
          </div>
        </div>
        <Button onClick={generatePDF} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Workout Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercícios</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workout.exercises.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedExercises.size}/{workout.exercises.length}
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.round(completionPercentage)}% concluído
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Estimado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">60min</div>
            <div className="text-xs text-muted-foreground">aproximadamente</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gerado com</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {workout.generated_by_ai ? 'IA' : 'Manual'}
            </div>
            <div className="text-xs text-muted-foreground">
              {workout.generated_by_ai ? 'Groq API' : 'Instrutor'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Exercícios</h2>
        {workout.exercises.map((exercise, index) => (
          <Card 
            key={index} 
            className={`cursor-pointer transition-all ${
              completedExercises.has(index) ? 'bg-green-50 border-green-200' : ''
            }`}
            onClick={() => toggleExerciseCompletion(index)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  {completedExercises.has(index) ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>{index + 1}. {exercise.name}</span>
                </CardTitle>
                <Badge variant={exercise.type === 'strength' ? 'default' : exercise.type === 'cardio' ? 'secondary' : 'outline'}>
                  {exercise.type === 'strength' ? 'Força' : exercise.type === 'cardio' ? 'Cardio' : 'Flexibilidade'}
                </Badge>
              </div>
              {exercise.muscle_groups.length > 0 && (
                <CardDescription>
                  <strong>Músculos:</strong> {exercise.muscle_groups.join(', ')}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Séries:</strong> {exercise.sets}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Reps:</strong> {exercise.reps}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <span><strong>Descanso:</strong> {exercise.rest}s</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-1">Instruções:</h4>
                  <p className="text-sm text-muted-foreground">{exercise.instructions}</p>
                </div>
                
                {exercise.equipment.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-1">Equipamentos:</h4>
                    <div className="flex flex-wrap gap-1">
                      {exercise.equipment.map((equipment, equipIndex) => (
                        <Badge key={equipIndex} variant="outline" className="text-xs">
                          {equipment}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Completion Actions */}
      {completionPercentage === 100 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Parabéns! Treino Concluído!
            </h3>
            <p className="text-green-700 text-center mb-4">
              Você completou todos os exercícios deste treino. Continue assim!
            </p>
            <Button onClick={() => navigate('/dashboard')} className="bg-green-600 hover:bg-green-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}