import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { InstructorDashboard } from '@/components/instructor/InstructorDashboard';
import { StudentDashboard } from '@/components/student/StudentDashboard';
import { ChatIA } from '@/components/ChatIA';
export function DashboardContent() {
  const { profile } = useAuth();
  
  return (
    <Routes>
      <Route index element={<DashboardHome />} />
      <Route path="profile" element={<div>Perfil em desenvolvimento...</div>} />
      <Route path="workouts" element={<div>Treinos em desenvolvimento...</div>} />
      <Route path="nutrition" element={<div>Nutrição em desenvolvimento...</div>} />
      <Route path="chat" element={<ChatIA />} />
      <Route path="progress" element={<div>Progresso em desenvolvimento...</div>} />
      <Route path="photos" element={<div>Fotos em desenvolvimento...</div>} />
      <Route path="settings" element={<div>Configurações em desenvolvimento...</div>} />
    </Routes>
  );
}

function DashboardHome() {
  const { profile } = useAuth();
  
  // Verificar se é instrutor ou aluno
  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';
  
  if (isInstructor) {
    return <InstructorDashboard />;
  }
  
  return <StudentDashboard />;
}