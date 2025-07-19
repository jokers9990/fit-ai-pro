import { Bot, Calculator, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";
import heroImage from "@/assets/gym-hero.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent leading-tight">
              Academia do Futuro
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transforme sua academia com IA avançada. Treinos personalizados, dietas inteligentes e acompanhamento automatizado.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gym-button text-lg px-8 py-4" asChild>
              <Link to="/auth">
                <Zap className="mr-2 h-5 w-5" />
                Começar Grátis
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-primary/50 hover:bg-primary/10">
              Ver Demo
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <Card className="gym-card p-6 text-center space-y-4 hover:scale-105 transition-transform">
              <div className="gradient-primary p-3 rounded-full w-fit mx-auto">
                <Bot className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">IA Personalizada</h3>
              <p className="text-muted-foreground">
                Treinos e dietas criados por inteligência artificial baseados no perfil de cada aluno
              </p>
            </Card>

            <Card className="gym-card p-6 text-center space-y-4 hover:scale-105 transition-transform">
              <div className="gradient-primary p-3 rounded-full w-fit mx-auto">
                <Calculator className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Cálculos Automáticos</h3>
              <p className="text-muted-foreground">
                IMC, percentual de gordura e métricas de progresso calculadas automaticamente
              </p>
            </Card>

            <Card className="gym-card p-6 text-center space-y-4 hover:scale-105 transition-transform">
              <div className="gradient-primary p-3 rounded-full w-fit mx-auto">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Acompanhamento</h3>
              <p className="text-muted-foreground">
                Gráficos de evolução e relatórios detalhados do progresso dos alunos
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 rounded-full gradient-primary opacity-20 animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 rounded-full gradient-accent opacity-10 animate-pulse" />
    </section>
  );
};

export default Hero;