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
    const { userId, goals, experience, equipment, timeAvailable, targetMuscles, restrictions } = await req.json() as WorkoutRequest;
    
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

    // Gerar prompt para IA
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

    if (!response.ok) {
      throw new Error('Erro na API do Groq');
    }

    const data = await response.json();
    const workoutData = JSON.parse(data.choices[0].message.content);

    // Salvar treino no banco
    const { data: workoutPlan, error: insertError } = await supabase
      .from('workout_plans')
      .insert({
        user_id: userId,
        name: workoutData.name,
        description: workoutData.description,
        exercises: workoutData.exercises,
        start_date: new Date().toISOString().split('T')[0],
        generated_by_ai: true,
        ai_prompt: prompt
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Incrementar contador de IA
    await supabase
      .from('user_subscriptions')
      .update({ ai_requests_used: subscription.ai_requests_used + 1 })
      .eq('user_id', userId);

    console.log('Treino gerado com sucesso:', workoutPlan.id);

    return new Response(
      JSON.stringify({ 
        workout: workoutPlan,
        usage: {
          used: subscription.ai_requests_used + 1,
          limit: subscription.subscription_plans.ai_requests_limit
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro ao gerar treino:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});