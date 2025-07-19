import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DietRequest {
  userId: string;
  goal: string;
  weight: number;
  height: number;
  age: number;
  gender: string;
  activityLevel: string;
  restrictions?: string;
  preferences?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, goal, weight, height, age, gender, activityLevel, restrictions, preferences } = await req.json() as DietRequest;
    
    // Verificar limite de IA do usuário
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('ai_requests_used, subscription_plans(ai_requests_limit)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (!subscription || subscription.ai_requests_used >= subscription.subscription_plans.ai_requests_limit) {
      return new Response(
        JSON.stringify({ error: 'Limite de IA atingido. Faça upgrade do seu plano.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calcular TMB (Taxa Metabólica Basal)
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    }

    // Calcular calorias totais baseado no nível de atividade
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9
    };

    const totalCalories = Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.2));

    // Ajustar calorias baseado no objetivo
    let targetCalories = totalCalories;
    if (goal === 'weight_loss') {
      targetCalories = Math.round(totalCalories * 0.85); // Déficit de 15%
    } else if (goal === 'weight_gain') {
      targetCalories = Math.round(totalCalories * 1.15); // Superávit de 15%
    }

    // Gerar prompt para IA
    const prompt = `
Crie um plano alimentar personalizado baseado nas seguintes informações:

PERFIL DO USUÁRIO:
- Objetivo: ${goal}
- Peso: ${weight}kg
- Altura: ${height}cm
- Idade: ${age} anos
- Gênero: ${gender}
- Nível de atividade: ${activityLevel}
- Calorias alvo: ${targetCalories} kcal/dia
${restrictions ? `- Restrições alimentares: ${restrictions}` : ''}
${preferences ? `- Preferências: ${preferences}` : ''}

INSTRUÇÕES:
1. Crie um plano de 7 dias com 5-6 refeições por dia
2. Distribua as calorias de forma equilibrada
3. Inclua macronutrientes balanceados (proteína, carboidratos, gorduras)
4. Considere as restrições e preferências mencionadas
5. Adicione horários sugeridos para as refeições
6. Inclua opções de lanches saudáveis

FORMATO DE RESPOSTA (JSON):
{
  "name": "Plano Alimentar - [Objetivo]",
  "description": "Descrição do plano",
  "daily_calories": ${targetCalories},
  "daily_protein": valor_em_gramas,
  "daily_carbs": valor_em_gramas,
  "daily_fat": valor_em_gramas,
  "meals": [
    {
      "category": "breakfast/lunch/dinner/snack",
      "name": "Nome da Refeição",
      "suggested_time": "HH:MM",
      "ingredients": [
        {
          "name": "ingrediente",
          "quantity": "quantidade",
          "unit": "unidade"
        }
      ],
      "calories": número,
      "protein": valor_em_gramas,
      "carbs": valor_em_gramas,
      "fat": valor_em_gramas,
      "preparation_time": minutos,
      "instructions": "instruções de preparo"
    }
  ]
}

Responda APENAS com o JSON válido, sem texto adicional.`;

    // Chamar Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é um nutricionista experiente especializado em criar planos alimentares personalizados. Sempre responda com JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro na API do Groq');
    }

    const data = await response.json();
    const dietData = JSON.parse(data.choices[0].message.content);

    // Salvar dieta no banco
    const { data: dietPlan, error: insertError } = await supabase
      .from('diet_plans')
      .insert({
        user_id: userId,
        name: dietData.name,
        description: dietData.description,
        daily_calories: dietData.daily_calories,
        daily_protein: dietData.daily_protein,
        daily_carbs: dietData.daily_carbs,
        daily_fat: dietData.daily_fat,
        start_date: new Date().toISOString().split('T')[0],
        generated_by_ai: true,
        ai_prompt: prompt
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Salvar refeições
    const mealsToInsert = dietData.meals.map((meal: any) => ({
      diet_plan_id: dietPlan.id,
      category: meal.category,
      name: meal.name,
      description: meal.instructions,
      ingredients: meal.ingredients,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      preparation_time: meal.preparation_time,
      instructions: meal.instructions
    }));

    await supabase.from('meals').insert(mealsToInsert);

    // Incrementar contador de IA
    await supabase
      .from('user_subscriptions')
      .update({ ai_requests_used: subscription.ai_requests_used + 1 })
      .eq('user_id', userId);

    console.log('Dieta gerada com sucesso:', dietPlan.id);

    return new Response(
      JSON.stringify({ 
        diet: { ...dietPlan, meals: dietData.meals },
        usage: {
          used: subscription.ai_requests_used + 1,
          limit: subscription.subscription_plans.ai_requests_limit
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar dieta:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});