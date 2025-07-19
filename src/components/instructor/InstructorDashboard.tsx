import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
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
  const [studentEmail, setStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('Fetching students for instructor:', user?.id);
      
      const { data: instructorStudents, error } = await supabase
        .from('instructor_students')
        .select(`
          student_id,
          profiles!instructor_students_student_id_fkey (
            id,
            user_id,
            full_name,
            email,
            created_at
          )
        `)
        .eq('instructor_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching instructor students:', error);
        throw error;
      }

      console.log('Instructor students data:', instructorStudents);

      if (!instructorStudents || instructorStudents.length === 0) {
        console.log('No students found for this instructor');
        setStudents([]);
        setLoading(false);
        return;
      }

      // Transform data to match expected format
      const studentsData = instructorStudents.map(item => {
        const profile = item.profiles;
        if (!profile) {
          console.warn('Profile not found for student:', item.student_id);
          return null;
        }
        
        return {
          id: profile.id,
          user_id: profile.user_id,
          full_name: profile.full_name,
          email: profile.email,
          created_at: profile.created_at,
          physical_assessments: [],
          workout_plans: [],
          diet_plans: []
        };
      }).filter(Boolean) as Student[];

      console.log('Processed students data:', studentsData);

      // Fetch additional data for each student
      const studentsWithCounts = await Promise.all(
        studentsData.map(async (student) => {
          try {
            // Fetch physical assessments count
            const { data: assessments, error: assessError } = await supabase
              .from('physical_assessments')
              .select('id')
              .eq('user_id', student.user_id);

            if (assessError) {
              console.error('Error fetching assessments for student:', student.user_id, assessError);
            }

            // Fetch workout plans count
            const { data: workouts, error: workoutError } = await supabase
              .from('workout_plans')
              .select('id')
              .eq('user_id', student.user_id);

            if (workoutError) {
              console.error('Error fetching workouts for student:', student.user_id, workoutError);
            }

            // Fetch diet plans count
            const { data: diets, error: dietError } = await supabase
              .from('diet_plans')
              .select('id')
              .eq('user_id', student.user_id);

            if (dietError) {
              console.error('Error fetching diets for student:', student.user_id, dietError);
            }

            return {
              ...student,
              physical_assessments: assessments || [],
              workout_plans: workouts || [],
              diet_plans: diets || []
            };
          } catch (error) {
            console.error('Error fetching additional data for student:', student.user_id, error);
            return student;
          }
        })
      );

      setStudents(studentsWithCounts);
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

  const addStudent = async () => {
    if (!studentEmail.trim()) return;
    
    try {
      setAddingStudent(true);
      console.log('Adding student with email:', studentEmail);
      
      // Find the student by email
      const { data: studentProfile, error: findError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .eq('email', studentEmail.toLowerCase().trim())
        .eq('role', 'student')
        .single();

      if (findError || !studentProfile) {
        console.error('Student not found:', findError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Aluno não encontrado ou não é um estudante válido"
        });
        return;
      }

      console.log('Student profile found:', studentProfile);

      // Check if student is already in the list
      const { data: existingRelation, error: checkError } = await supabase
        .from('instructor_students')
        .select('id')
        .eq('instructor_id', user?.id)
        .eq('student_id', studentProfile.user_id)
        .eq('is_active', true)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing relation:', checkError);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Erro ao verificar relação existente"
        });
        return;
      }

      if (existingRelation) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Este aluno já está na sua lista"
        });
        return;
      }

      // Add the student to instructor's list
      const { error: addError } = await supabase
        .from('instructor_students')
        .insert({
          instructor_id: user?.id,
          student_id: studentProfile.user_id
        });

      if (addError) {
        console.error('Error adding student:', addError);
        toast({
          variant: "destructive",
          title: "Erro", 
          description: "Erro ao adicionar aluno"
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: `Aluno ${studentProfile.full_name} adicionado com sucesso!`
      });
      
      setStudentEmail('');
      fetchStudents(); // Refresh the list
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao adicionar aluno"
      });
    } finally {
      setAddingStudent(false);
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
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Aluno</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email do Aluno</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="aluno@email.com"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                />
              </div>
              <Button 
                onClick={addStudent} 
                disabled={addingStudent || !studentEmail.trim()}
                className="w-full"
              >
                {addingStudent ? 'Adicionando...' : 'Adicionar Aluno'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
