
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WorkoutRequest {
  userId: string;
  goals: string;
  experience: string;
  equipment: string[];
  timeAvailable: number;
  targetMuscles: string[];
  restrictions?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generate workout function called');
    
    // Get instructor info from auth header
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Extract the JWT token from the Bearer header
    const token = authHeader.replace('Bearer ', '');
    console.log('Token extracted:', !!token);

    // Create Supabase client with the token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    console.log('User authentication result:', { user: !!user, error: authError });
    
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'User not found'}`);
    }

    const requestBody = await req.json();
    console.log('Request body:', requestBody);
    
    const { userId, goals, experience, equipment, timeAvailable, targetMuscles, restrictions } = requestBody as WorkoutRequest;
    
    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check subscription limits
    const { data: subscription, error: subError } = await supabaseAdmin
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

    // Generate prompt for AI
    const prompt = `
Crie um treino personalizado baseado nas seguintes informações:

PERFIL DO USUÁRIO:
- Objetivo: ${goals}
- Nível de experiência: ${experience}
- Equipamentos disponíveis: ${equipment.join(', ')}
- Tempo disponível: ${timeAvailable} minutos
- Músculos alvo: ${targetMuscles.join(', ')}
${restrictions ? `- Restrições/lesões: ${restrictions}` : ''}

INSTRUÇÕES:
1. Crie um treino adequado ao nível e objetivos
2. Use apenas os equipamentos disponíveis
3. Organize em aquecimento, treino principal e alongamento
4. Para cada exercício inclua: nome, séries, repetições, descanso, instruções
5. Mantenha dentro do tempo disponível
6. Foque nos músculos alvo especificados

FORMATO DE RESPOSTA (JSON):
{
  "name": "Nome do Treino",
  "description": "Descrição breve",
  "estimated_duration": número_em_minutos,
  "difficulty_level": 1-5,
  "exercises": [
    {
      "name": "Nome do Exercício",
      "type": "strength/cardio/flexibility",
      "muscle_groups": ["músculo1", "músculo2"],
      "sets": número,
      "reps": "número ou tempo",
      "rest": "tempo_em_segundos",
      "instructions": "instruções detalhadas",
      "equipment": ["equipamento_usado"]
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
            content: 'Você é um personal trainer experiente especializado em criar treinos personalizados. Sempre responda com JSON válido.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
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
    
    let workoutData;
    try {
      workoutData = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      console.error('Raw content:', data.choices[0].message.content);
      throw new Error('Erro ao processar resposta da IA');
    }

    // Save workout to database
    const { data: workoutPlan, error: insertError } = await supabaseAdmin
      .from('workout_plans')
      .insert({
        user_id: userId,
        instructor_id: user.id,
        name: workoutData.name,
        description: workoutData.description,
        exercises: workoutData.exercises,
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

    // Update AI usage counter
    if (subscription) {
      await supabaseAdmin
        .from('user_subscriptions')
        .update({ ai_requests_used: subscription.ai_requests_used + 1 })
        .eq('user_id', userId);
    }

    console.log('Workout generated successfully:', workoutPlan.id);

    return new Response(
      JSON.stringify({ 
        workout: workoutPlan,
        usage: subscription ? {
          used: subscription.ai_requests_used + 1,
          limit: subscription.subscription_plans?.ai_requests_limit || 0
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
