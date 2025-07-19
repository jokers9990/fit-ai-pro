import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Apple, 
  Clock, 
  Target, 
  CheckCircle,
  Circle,
  Download,
  ArrowLeft,
  Utensils,
  Zap
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Ingredient {
  name: string;
  quantity: string;
  unit: string;
}

interface Meal {
  category: 'breakfast' | 'morning_snack' | 'lunch' | 'afternoon_snack' | 'dinner' | 'before_bed_snack';
  name: string;
  suggested_time: string;
  ingredients: Ingredient[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  preparation_time: number;
  instructions: string;
}

interface DietPlan {
  id: string;
  name: string;
  description: string;
  daily_calories: number;
  daily_protein: number;
  daily_carbs: number;
  daily_fat: number;
  start_date: string;
  generated_by_ai: boolean;
  user_id: string;
  instructor_id: string;
  meals?: Meal[];
}

const mealCategoryNames = {
  breakfast: 'Café da Manhã',
  morning_snack: 'Lanche da Manhã',
  lunch: 'Almoço',
  afternoon_snack: 'Lanche da Tarde',
  dinner: 'Jantar',
  before_bed_snack: 'Antes de Dormir'
};

export function DietView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diet, setDiet] = useState<DietPlan | null>(null);
  const [completedMeals, setCompletedMeals] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDiet();
    }
  }, [id]);

  const fetchDiet = async () => {
    try {
      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Parse meals from JSON if needed  
      const dietData = {
        ...data,
        meals: (data as any).meals ? (Array.isArray((data as any).meals) ? (data as any).meals : JSON.parse((data as any).meals as string)) : []
      };
      setDiet(dietData);
    } catch (error) {
      console.error('Error fetching diet:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar a dieta"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMealCompletion = (index: number) => {
    const newCompleted = new Set(completedMeals);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedMeals(newCompleted);
  };

  const generatePDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>${diet?.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .meal { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            .meal-name { font-weight: bold; font-size: 18px; color: #2563eb; }
            .meal-details { margin: 10px 0; }
            .ingredients { margin: 15px 0; }
            .nutrient-info { background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>${diet?.name}</h1>
          <p><strong>Descrição:</strong> ${diet?.description}</p>
          
          <div class="nutrient-info">
            <h3>Informações Nutricionais Diárias</h3>
            <p><strong>Calorias:</strong> ${diet?.daily_calories} kcal</p>
            <p><strong>Proteínas:</strong> ${diet?.daily_protein}g | <strong>Carboidratos:</strong> ${diet?.daily_carbs}g | <strong>Gorduras:</strong> ${diet?.daily_fat}g</p>
          </div>
          
          <h2>Refeições</h2>
          ${diet?.meals?.map((meal, index) => `
            <div class="meal">
              <div class="meal-name">${mealCategoryNames[meal.category]} - ${meal.name}</div>
              <div class="meal-details">
                <strong>Horário sugerido:</strong> ${meal.suggested_time} | 
                <strong>Preparo:</strong> ${meal.preparation_time} min | 
                <strong>Calorias:</strong> ${meal.calories} kcal
              </div>
              <div class="ingredients">
                <strong>Ingredientes:</strong>
                <ul>
                  ${meal.ingredients.map(ing => `<li>${ing.quantity} ${ing.unit} de ${ing.name}</li>`).join('')}
                </ul>
              </div>
              <div><strong>Modo de preparo:</strong> ${meal.instructions}</div>
              <div class="nutrient-info">
                <strong>Nutrientes:</strong> 
                Proteína: ${meal.protein}g | Carboidratos: ${meal.carbs}g | Gordura: ${meal.fat}g
              </div>
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

  if (!diet) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Dieta não encontrada</h3>
            <p className="text-muted-foreground text-center mb-4">
              A dieta que você está procurando não existe ou foi removida
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

  const mealsData = diet.meals || [];
  const completionPercentage = mealsData.length > 0 ? (completedMeals.size / mealsData.length) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{diet.name}</h1>
            <p className="text-muted-foreground">{diet.description}</p>
          </div>
        </div>
        <Button onClick={generatePDF} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Diet Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calorias Diárias</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_calories}</div>
            <div className="text-xs text-muted-foreground">kcal/dia</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proteínas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_protein}g</div>
            <div className="text-xs text-muted-foreground">por dia</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Carboidratos</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_carbs}g</div>
            <div className="text-xs text-muted-foreground">por dia</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gorduras</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{diet.daily_fat}g</div>
            <div className="text-xs text-muted-foreground">por dia</div>
          </CardContent>
        </Card>
      </div>

      {/* Meals List */}
      {mealsData.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Refeições do Dia</h2>
          {mealsData.map((meal, index) => (
            <Card 
              key={index} 
              className={`cursor-pointer transition-all ${
                completedMeals.has(index) ? 'bg-green-50 border-green-200' : ''
              }`}
              onClick={() => toggleMealCompletion(index)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-3">
                    {completedMeals.has(index) ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span>{mealCategoryNames[meal.category]} - {meal.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{meal.suggested_time}</Badge>
                    <Badge variant="secondary">{meal.calories} kcal</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Preparo:</strong> {meal.preparation_time}min</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Proteína:</strong> {meal.protein}g</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Apple className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Carbs:</strong> {meal.carbs}g</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Circle className="h-4 w-4 text-muted-foreground" />
                      <span><strong>Gordura:</strong> {meal.fat}g</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Ingredientes:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {meal.ingredients.map((ingredient, ingIndex) => (
                        <div key={ingIndex} className="flex items-center space-x-1">
                          <Utensils className="h-3 w-3 text-muted-foreground" />
                          <span>{ingredient.quantity} {ingredient.unit} de {ingredient.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Modo de Preparo:</h4>
                    <p className="text-sm text-muted-foreground">{meal.instructions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Apple className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sem refeições detalhadas</h3>
            <p className="text-muted-foreground text-center">
              Este plano alimentar contém apenas informações gerais sobre macronutrientes
            </p>
          </CardContent>
        </Card>
      )}

      {/* Completion Message */}
      {completionPercentage === 100 && mealsData.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Parabéns! Dia Alimentar Concluído!
            </h3>
            <p className="text-green-700 text-center mb-4">
              Você seguiu todas as refeições planejadas para hoje. Excelente trabalho!
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