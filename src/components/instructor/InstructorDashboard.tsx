import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  Dumbbell, 
  Apple, 
  TrendingUp,
  MessageCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Student {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
  physical_assessments?: any[];
  workout_plans?: any[];
  diet_plans?: any[];
}

export function InstructorDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      // Buscar todos os perfis de alunos
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          physical_assessments(*),
          workout_plans(*),
          diet_plans(*)
        `)
        .eq('role', 'student');

      if (error) throw error;
      
      // Mapear os dados para o formato correto
      const studentsData = (data || []).map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        created_at: profile.created_at,
        physical_assessments: Array.isArray(profile.physical_assessments) ? profile.physical_assessments : [],
        workout_plans: Array.isArray(profile.workout_plans) ? profile.workout_plans : [],
        diet_plans: Array.isArray(profile.diet_plans) ? profile.diet_plans : []
      }));
      
      setStudents(studentsData);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar lista de alunos"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateWorkoutPlan = async (studentId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: {
          userId: studentId,
          goals: 'Definição muscular e força',
          experience: 'intermediario',
          equipment: ['halteres', 'barra', 'supino'],
          timeAvailable: 60,
          targetMuscles: ['peito', 'costas', 'pernas'],
          restrictions: ''
        }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Plano de treino gerado com sucesso!"
      });
      
      fetchStudents(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao gerar treino:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar plano de treino"
      });
    }
  };

  const generateDietPlan = async (studentId: string) => {
    try {
      const student = students.find(s => s.user_id === studentId);
      const lastAssessment = student?.physical_assessments?.[0];
      
      if (!lastAssessment) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "É necessário ter uma avaliação física do aluno"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-diet', {
        body: {
          userId: studentId,
          weight: lastAssessment.weight,
          height: lastAssessment.height,
          age: 25, // Calcular idade real se necessário
          gender: 'masculino',
          activityLevel: 'moderado',
          goal: 'definicao',
          restrictions: [],
          preferences: []
        }
      });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Plano alimentar gerado com sucesso!"
      });
      
      fetchStudents(); // Recarregar dados
    } catch (error) {
      console.error('Erro ao gerar dieta:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar plano alimentar"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted rounded w-48 animate-pulse"></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-32"></div>
                <div className="h-3 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Painel do Instrutor</h1>
          <p className="text-muted-foreground">Gerencie seus alunos e crie planos personalizados</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Treinos Ativos</CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((acc, student) => acc + (student.workout_plans?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dietas Ativas</CardTitle>
            <Apple className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((acc, student) => acc + (student.diet_plans?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avaliações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {students.reduce((acc, student) => acc + (student.physical_assessments?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar alunos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Lista de alunos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{student.full_name}</CardTitle>
              <CardDescription>{student.email}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Treinos:</span>
                  <Badge variant="secondary">{student.workout_plans?.length || 0}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Dietas:</span>
                  <Badge variant="secondary">{student.diet_plans?.length || 0}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avaliações:</span>
                  <Badge variant="secondary">{student.physical_assessments?.length || 0}</Badge>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => generateWorkoutPlan(student.user_id)}
                    className="flex-1"
                  >
                    <Dumbbell className="mr-1 h-3 w-3" />
                    Treino
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateDietPlan(student.user_id)}
                    className="flex-1"
                  >
                    <Apple className="mr-1 h-3 w-3" />
                    Dieta
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece adicionando alguns alunos ao seu painel'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}