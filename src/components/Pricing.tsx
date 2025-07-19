import { Check, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const Pricing = () => {
  const plans = [
    {
      name: "Gratuito",
      price: "R$ 0",
      period: "/mês",
      description: "Perfeito para começar",
      features: [
        "Até 10 alunos",
        "Cálculo básico de IMC",
        "Relatórios simples",
        "Suporte por email",
        "Interface responsiva"
      ],
      disabled: [
        "IA para treinos",
        "IA para dietas", 
        "Chat inteligente",
        "Relatórios avançados",
        "API Groq"
      ],
      button: "Começar Grátis",
      popular: false
    },
    {
      name: "Premium",
      price: "R$ 49",
      period: "/mês",
      description: "IA completa desbloqueada",
      features: [
        "Alunos ilimitados",
        "IA para treinos personalizados",
        "IA para dietas balanceadas",
        "Chat inteligente 24/7",
        "Relatórios em PDF",
        "Analytics avançado",
        "API Groq incluída",
        "Suporte prioritário",
        "Gamificação completa"
      ],
      disabled: [],
      button: "Assinar Premium",
      popular: true
    },
    {
      name: "Enterprise",
      price: "R$ 199",
      period: "/mês",
      description: "Para redes de academias",
      features: [
        "Múltiplas unidades",
        "Todos os recursos Premium",
        "White-label personalizado",
        "Integração com sistemas",
        "Treinamento da equipe",
        "Suporte 24/7",
        "API personalizada",
        "Consultoria exclusiva"
      ],
      disabled: [],
      button: "Contatar Vendas",
      popular: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-card via-background to-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Planos que Cabem no Seu Bolso
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o plano ideal para sua academia. Comece grátis e evolua conforme seu crescimento.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`gym-card p-8 relative ${plan.popular ? 'ring-2 ring-primary scale-105' : ''} hover:scale-105 transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="gradient-primary px-4 py-2 rounded-full flex items-center space-x-2">
                    <Star className="h-4 w-4 text-primary-foreground" />
                    <span className="text-sm font-semibold text-primary-foreground">Mais Popular</span>
                  </div>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
                {plan.disabled.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-3 opacity-50">
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground line-through">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full ${plan.popular ? 'gym-button' : ''}`}
                variant={plan.popular ? "default" : "outline"}
                size="lg"
              >
                {plan.popular && <Zap className="mr-2 h-4 w-4" />}
                {plan.button}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Precisa de algo personalizado? Fale conosco!
          </p>
          <Button variant="outline" size="lg">
            Contato Personalizado
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;