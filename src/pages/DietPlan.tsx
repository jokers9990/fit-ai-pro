import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Apple, Clock, Target, Utensils } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Meal {
  id: string;
  name: string;
  category: string;
  description?: string;
  ingredients: any[];
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  preparation_time?: number;
  instructions?: string;
}

interface DietPlan {
  id: string;
  name: string;
  description?: string;
  daily_calories?: number;
  daily_protein?: number;
  daily_carbs?: number;
  daily_fat?: number;
  start_date: string;
  end_date?: string;
  generated_by_ai: boolean;
  ai_prompt?: string;
  created_at: string;
  meals?: Meal[];
}

export function DietPlan() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDiet();
    }
  }, [id]);

  const fetchDiet = async () => {
    try {
      const [dietRes, mealsRes] = await Promise.all([
        supabase
          .from('diet_plans')
          .select('*')
          .eq('id', id)
          .eq('user_id', user?.id)
          .single(),
        supabase
          .from('meals')
          .select('*')
          .eq('diet_plan_id', id)
          .order('category')
      ]);

      if (dietRes.error) {
        console.error('Error fetching diet:', dietRes.error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao carregar plano alimentar"
        });
        navigate('/dashboard');
        return;
      }

      setDiet({
        ...dietRes.data,
        meals: (mealsRes.data || []).map(meal => ({
          ...meal,
          ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : []
        }))
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar plano alimentar"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getMealCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      'breakfast': 'Café da Manhã',
      'morning_snack': 'Lanche da Manhã',
      'lunch': 'Almoço',
      'afternoon_snack': 'Lanche da Tarde',
      'dinner': 'Jantar',
      'evening_snack': 'Lanche da Noite'
    };
    return labels[category] || category;
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

  if (!diet) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Plano alimentar não encontrado</h2>
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
          <h1 className="text-3xl font-bold">{diet.name}</h1>
          <p className="text-muted-foreground">{diet.description}</p>
        </div>
      </div>

      {/* Macros */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calorias</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_calories || 0}</div>
            <p className="text-xs text-muted-foreground">kcal/dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proteína</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_protein || 0}g</div>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carboidratos</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_carbs || 0}g</div>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gorduras</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_fat || 0}g</div>
            <p className="text-xs text-muted-foreground">por dia</p>
          </CardContent>
        </Card>
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Refeições</h2>
        {diet.meals?.map((meal) => (
          <Card key={meal.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{meal.name}</CardTitle>
                <Badge variant="secondary">
                  {getMealCategoryLabel(meal.category)}
                </Badge>
              </div>
              <CardDescription>
                {meal.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{meal.calories || 0}</div>
                  <p className="text-sm text-muted-foreground">Calorias</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{meal.protein || 0}g</div>
                  <p className="text-sm text-muted-foreground">Proteína</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{meal.carbs || 0}g</div>
                  <p className="text-sm text-muted-foreground">Carboidratos</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{meal.fat || 0}g</div>
                  <p className="text-sm text-muted-foreground">Gorduras</p>
                </div>
              </div>
              
              {meal.ingredients && meal.ingredients.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Ingredientes:</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    {meal.ingredients.map((ingredient: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>{ingredient.name}</span>
                        <span className="text-muted-foreground">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {meal.instructions && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Modo de Preparo:</h4>
                  <p className="text-sm text-muted-foreground">{meal.instructions}</p>
                </div>
              )}

              {meal.preparation_time && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="mr-2 h-4 w-4" />
                  Tempo de preparo: {meal.preparation_time} minutos
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {(!diet.meals || diet.meals.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma refeição encontrada</h3>
            <p className="text-muted-foreground text-center">
              Este plano alimentar ainda não possui refeições
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}