
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { InstructorDashboard } from '@/components/instructor/InstructorDashboard';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { ChatIA } from '@/components/ChatIA';
import { WorkoutPlan } from '@/pages/WorkoutPlan';
import { DietPlan } from '@/pages/DietPlan';
import { WorkoutView } from '@/components/WorkoutView';
import { DietView } from '@/components/DietView';

export function DashboardContent() {
  const { profile } = useAuth();
  
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<div>Perfil em desenvolvimento...</div>} />
      <Route path="workouts" element={<div>Treinos em desenvolvimento...</div>} />
      <Route path="workout/:id" element={<WorkoutView />} />
      <Route path="nutrition" element={<div>Nutrição em desenvolvimento...</div>} />
      <Route path="diet/:id" element={<DietView />} />
      <Route path="chat" element={<ChatIA />} />
      <Route path="progress" element={<div>Progresso em desenvolvimento...</div>} />
      <Route path="photos" element={<div>Fotos em desenvolvimento...</div>} />
      <Route path="settings" element={<div>Configurações em desenvolvimento...</div>} />
    </Routes>
  );
}

function DashboardHome() {
  const { profile } = useAuth();
  
  // Log detalhado para debug
  console.log('DashboardHome - Profile:', profile);
  console.log('DashboardHome - Profile role:', profile?.role);
  console.log('DashboardHome - Profile email:', profile?.email);
  
  // Verificar se é instrutor ou aluno
  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';
  
  console.log('DashboardHome - Is instructor:', isInstructor);
  
  if (isInstructor) {
    console.log('Rendering InstructorDashboard');
    return <InstructorDashboard />;
  }
  
  console.log('Rendering StudentDashboard');
  return <StudentDashboard />;
}
