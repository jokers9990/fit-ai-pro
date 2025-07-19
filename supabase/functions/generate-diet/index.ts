
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DietRequest {
  userId: string;
  goal: string;
  weight?: number;
  height?: number;
  age?: number;
  gender?: string;
  activityLevel: string;
  restrictions?: string;
  preferences?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate diet function called');
    
    // Get instructor info from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    console.log('User authentication result:', { user: !!user, error: authError });
    
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`);
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { userId, goal, weight, height, age, gender, activityLevel, restrictions, preferences } = requestBody as DietRequest;
    
    // Use service role for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check subscription limits
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('ai_requests_used, subscription_plans(ai_requests_limit)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    console.log('Subscription check:', { subscription, error: subError });

    if (subError) {
      console.error('Subscription error:', subError);
      // Continue without subscription check for now
    }

    if (subscription && subscription.ai_requests_used >= subscription.subscription_plans?.ai_requests_limit) {
      return new Response(
        JSON.stringify({ error: 'Limite de IA atingido. Faça upgrade do seu plano.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use default values if physical assessment data is not available
    const defaultWeight = weight || 70;
    const defaultHeight = height || 170;
    const defaultAge = age || 30;
    const defaultGender = gender || 'masculino';

    // Calculate BMR (Basal Metabolic Rate)
    let bmr;
    if (defaultGender === 'masculino' || defaultGender === 'male') {
      bmr = 88.362 + (13.397 * defaultWeight) + (4.799 * defaultHeight) - (5.677 * defaultAge);
    } else {
      bmr = 447.593 + (9.247 * defaultWeight) + (3.098 * defaultHeight) - (4.330 * defaultAge);
    }

    // Calculate total calories based on activity level
    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly_active': 1.375,
      'moderately_active': 1.55,
      'very_active': 1.725,
      'extremely_active': 1.9,
      'sedentario': 1.2,
      'levemente_ativo': 1.375,
      'moderadamente_ativo': 1.55,
      'muito_ativo': 1.725,
      'extremamente_ativo': 1.9
    };

    const totalCalories = Math.round(bmr * (activityMultipliers[activityLevel as keyof typeof activityMultipliers] || 1.55));

    // Adjust calories based on goal
    let targetCalories = totalCalories;
    if (goal === 'weight_loss' || goal === 'emagrecimento' || goal === 'perda_peso') {
      targetCalories = Math.round(totalCalories * 0.85); // 15% deficit
    } else if (goal === 'weight_gain' || goal === 'ganho_peso' || goal === 'ganho_massa') {
      targetCalories = Math.round(totalCalories * 1.15); // 15% surplus
    }

    // Generate prompt for AI
    const prompt = `
Crie um plano alimentar personalizado baserado nas seguintes informações:

PERFIL DO USUÁRIO:
- Objetivo: ${goal}
- Peso: ${defaultWeight}kg
- Altura: ${defaultHeight}cm
- Idade: ${defaultAge} anos
- Gênero: ${defaultGender}
- Nível de atividade: ${activityLevel}
- Calorias alvo: ${targetCalories} kcal/dia
${restrictions ? `- Restrições alimentares: ${restrictions}` : ''}
${preferences ? `- Preferências: ${preferences}` : ''}

INSTRUÇÕES:
1. Crie um plano de 1 dia com 5-6 refeições
2. Distribua as calorias de forma equilibrada
3. Inclua macronutrientes balanceados (proteína, carboidratos, gorduras)
4. Considere as restrições e preferências mencionadas
5. Adicione horários sugeridos para as refeições
6. Inclua opções nutritivas e saudáveis

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
      "category": "breakfast/lunch/dinner/morning_snack/afternoon_snack",
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

    console.log('Calling Groq API...');

    // Call Groq API
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
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

    console.log('Groq API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error(`Erro na API do Groq: ${response.status}`);
    }

    const data = await response.json();
    console.log('Groq API response received');
    
    let dietData;
    try {
      dietData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Save diet to database
    const { data: dietPlan, error: insertError } = await supabase
      .from('diet_plans')
      .insert({
        user_id: userId,
        instructor_id: user.id,
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

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw insertError;
    }

    // Save meals
    if (dietData.meals && dietData.meals.length > 0) {
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

      const { error: mealsError } = await supabase.from('meals').insert(mealsToInsert);
      if (mealsError) {
        console.error('Error inserting meals:', mealsError);
      }
    }

    // Update AI usage counter
    if (subscription) {
      await supabase
        .from('user_subscriptions')
        .update({ ai_requests_used: subscription.ai_requests_used + 1 })
        .eq('user_id', userId);
    }

    console.log('Diet generated successfully:', dietPlan.id);

    return new Response(
      JSON.stringify({ 
        diet: { ...dietPlan, meals: dietData.meals },
        usage: subscription ? {
          used: subscription.ai_requests_used + 1,
          limit: subscription.subscription_plans?.ai_requests_limit || 0
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar dieta:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
