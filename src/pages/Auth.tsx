
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const getErrorMessage = (error: any) => {
    if (!error) return null;
    
    if (typeof error === 'string') return error;
    
    const message = error?.message || 'Erro desconhecido';
    
    // Customizar mensagens de erro específicas
    if (message.includes('Email not confirmed')) {
      return 'Por favor, verifique seu email e clique no link de confirmação antes de fazer login.';
    }
    
    if (message.includes('Invalid login credentials')) {
      return 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
    }
    
    if (message.includes('User already registered')) {
      return 'Este email já está cadastrado. Tente fazer login ou usar outro email.';
    }
    
    if (message.includes('Password should be at least 6 characters')) {
      return 'A senha deve ter pelo menos 6 caracteres.';
    }
    
    return message;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    if (!email.trim() || !password.trim()) {
      toast.error('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    
    if (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');

    if (!fullName.trim()) {
      toast.error('Nome completo é obrigatório');
      setLoading(false);
      return;
    }

    if (!email.trim() || !password.trim()) {
      toast.error('Por favor, preencha todos os campos');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName);
    
    if (error) {
      const errorMessage = getErrorMessage(error);
      toast.error(errorMessage);
    } else {
      setSuccess('Conta criada com sucesso! Verifique seu email para confirmar sua conta.');
      toast.success('Conta criada com sucesso!');
      
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
    }
    
    setLoading(false);
  };

  if (user) {
    return null; // Evita flash de conteúdo antes do redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-primary">FitAI</h1>
          <p className="text-muted-foreground mt-2">
            Sua jornada fitness começa aqui
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesse sua conta</CardTitle>
            <CardDescription>
              Entre ou crie uma nova conta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Criar Conta</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Seu nome completo"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      minLength={6}
                      disabled={loading}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Mínimo de 6 caracteres
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      'Criar Conta'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground mt-4 space-y-2">
          <p>
            Ao continuar, você aceita nossos termos de serviço e política de privacidade.
          </p>
          <Alert className="text-left">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Dica:</strong> Para testes mais rápidos, você pode desabilitar a confirmação por email 
              nas configurações de autenticação do Supabase.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Auth;
