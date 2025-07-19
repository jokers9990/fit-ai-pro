import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Crown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function DashboardHeader() {
  const { profile } = useAuth();

  const getPlanBadge = () => {
    if (!profile?.user_subscriptions?.[0]) return null;
    
    const plan = profile.user_subscriptions[0].subscription_plans;
    const colors = {
      free: 'bg-gray-500',
      premium: 'bg-primary',
      enterprise: 'bg-purple-500'
    };

    return (
      <Badge className={colors[plan.type as keyof typeof colors] || 'bg-gray-500'}>
        <Crown className="w-3 h-3 mr-1" />
        {plan.name}
      </Badge>
    );
  };

  const getUsageInfo = () => {
    if (!profile?.user_subscriptions?.[0]) return null;
    
    const subscription = profile.user_subscriptions[0];
    const plan = subscription.subscription_plans;
    
    return (
      <div className="text-sm text-muted-foreground">
        IA: {subscription.ai_requests_used}/{plan.ai_requests_limit}
      </div>
    );
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center space-x-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-xl font-semibold">
            Olá, {profile?.full_name?.split(' ')[0] || 'Usuário'}!
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo ao seu painel de controle
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {getUsageInfo()}
        {getPlanBadge()}
        
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}