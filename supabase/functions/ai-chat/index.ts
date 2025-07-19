import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  userId: string;
  conversationId?: string;
  message: string;
  conversationType: 'general' | 'workout' | 'nutrition' | 'progress';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, conversationId, message, conversationType } = await req.json() as ChatRequest;
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar limite de IA do usuário
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

    // Buscar ou criar conversa
    let conversation;
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();
      conversation = data;
    } else {
      const { data } = await supabase
        .from('ai_conversations')
        .insert({
          user_id: userId,
          title: message.substring(0, 50) + '...',
          conversation_type: conversationType
        })
        .select()
        .single();
      conversation = data;
    }

    // Buscar histórico da conversa
    const { data: messages } = await supabase
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(20);

    // Buscar contexto do usuário para personalizar respostas
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: latestAssessment } = await supabase
      .from('physical_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Definir contexto do sistema baseado no tipo de conversa
    let systemPrompt = '';
    switch (conversationType) {
      case 'workout':
        systemPrompt = `Você é um personal trainer experiente da Academia Jonatasafado. Responda dúvidas sobre treinos, exercícios, técnicas e progressão. 
        ${latestAssessment ? `Dados do usuário: Peso: ${latestAssessment.weight}kg, Altura: ${latestAssessment.height}cm, IMC: ${latestAssessment.bmi}` : ''}`;
        break;
      case 'nutrition':
        systemPrompt = `Você é um nutricionista experiente da Academia Jonatasafado. Responda dúvidas sobre alimentação, dietas, suplementação e nutrição esportiva.
        ${latestAssessment ? `Dados do usuário: Peso: ${latestAssessment.weight}kg, Altura: ${latestAssessment.height}cm` : ''}`;
        break;
      case 'progress':
        systemPrompt = `Você é um especialista em acompanhamento de progresso da Academia Jonatasafado. Ajude a analisar evolução, metas e ajustes necessários.
        ${latestAssessment ? `Dados atuais: Peso: ${latestAssessment.weight}kg, BF: ${latestAssessment.body_fat_percentage}%, Massa muscular: ${latestAssessment.muscle_mass}kg` : ''}`;
        break;
      default:
        systemPrompt = `Você é um assistente da Academia Jonatasafado especializado em fitness e bem-estar. Responda de forma amigável e profissional sobre qualquer dúvida relacionada à academia, treinos, nutrição e saúde.`;
    }

    // Preparar mensagens para a IA
    const chatMessages = [
      { role: 'system', content: systemPrompt },
      ...messages || [],
      { role: 'user', content: message }
    ];

    // Chamar Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('GROQ_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: chatMessages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error('Erro na API do Groq');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Salvar mensagem do usuário
    await supabase.from('ai_messages').insert({
      conversation_id: conversation.id,
      role: 'user',
      content: message
    });

    // Salvar resposta da IA
    await supabase.from('ai_messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: aiResponse
    });

    // Incrementar contador de IA
    await supabase
      .from('user_subscriptions')
      .update({ ai_requests_used: subscription.ai_requests_used + 1 })
      .eq('user_id', userId);

    console.log('Chat AI processado:', conversation.id);

    return new Response(
      JSON.stringify({
        conversationId: conversation.id,
        response: aiResponse,
        usage: {
          used: subscription.ai_requests_used + 1,
          limit: subscription.subscription_plans.ai_requests_limit
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro no chat AI:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});