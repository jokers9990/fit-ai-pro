import { Brain, MessageSquare, FileText, Users, BarChart3, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/card";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "IA com Groq API",
      description: "Integração com LLaMA3 para geração inteligente de treinos e dietas personalizadas",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: MessageSquare,
      title: "Chat Inteligente",
      description: "Alunos podem tirar dúvidas sobre nutrição e exercícios com assistente IA 24/7",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: FileText,
      title: "Relatórios Automáticos",
      description: "PDFs gerados automaticamente com progresso, medidas e recomendações",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Users,
      title: "Gestão de Alunos",
      description: "Sistema completo para instrutores gerenciarem seus alunos e avaliações",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BarChart3,
      title: "Analytics Avançado",
      description: "Gráficos de evolução, métricas de performance e insights de progresso",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: Smartphone,
      title: "App Responsivo",
      description: "Interface otimizada para desktop, tablet e mobile com PWA support",
      color: "from-teal-500 to-green-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-background via-background to-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Funcionalidades Revolucionárias
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Descubra como nossa plataforma SaaS está transformando a gestão de academias com tecnologia de ponta
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="gym-card p-8 group hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} p-4 mb-6 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Technology Stack */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold mb-8 text-foreground">
            Tecnologias Utilizadas
          </h3>
          <div className="flex flex-wrap justify-center gap-6">
            {["React", "TypeScript", "Tailwind CSS", "Groq API", "LLaMA3", "Supabase"].map((tech) => (
              <div key={tech} className="gym-card px-6 py-3 hover:scale-105 transition-transform">
                <span className="font-semibold text-foreground">{tech}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;