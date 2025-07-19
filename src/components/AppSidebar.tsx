import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  User, 
  Dumbbell, 
  Apple, 
  MessageCircle, 
  TrendingUp, 
  Camera,
  Settings,
  LogOut
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const getMenuItems = (isInstructor: boolean) => {
  if (isInstructor) {
    return [
      { title: 'Dashboard', url: '/dashboard', icon: Home },
      { title: 'Alunos', url: '/dashboard/students', icon: User },
      { title: 'Planos', url: '/dashboard/plans', icon: Dumbbell },
      { title: 'Chat IA', url: '/dashboard/chat', icon: MessageCircle },
      { title: 'Relatórios', url: '/dashboard/reports', icon: TrendingUp },
    ];
  }
  
  return [
    { title: 'Dashboard', url: '/dashboard', icon: Home },
    { title: 'Perfil', url: '/dashboard/profile', icon: User },
    { title: 'Treinos', url: '/dashboard/workouts', icon: Dumbbell },
    { title: 'Dietas', url: '/dashboard/nutrition', icon: Apple },
    { title: 'Chat IA', url: '/dashboard/chat', icon: MessageCircle },
    { title: 'Progresso', url: '/dashboard/progress', icon: TrendingUp },
    { title: 'Fotos', url: '/dashboard/photos', icon: Camera },
  ];
};

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { signOut, profile } = useAuth();
  
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const collapsed = state === 'collapsed';
  const isInstructor = profile?.role === 'instructor' || profile?.role === 'admin';
  const menuItems = getMenuItems(isInstructor);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Jonatasafado</h2>
              <p className="text-xs text-muted-foreground">
                {profile?.role === 'instructor' ? 'Instrutor' : 'Aluno'}
              </p>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) =>
                        isActive 
                          ? "bg-primary text-primary-foreground font-medium" 
                          : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configurações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/dashboard/settings"
                    className={({ isActive }) =>
                      isActive 
                        ? "bg-primary text-primary-foreground font-medium" 
                        : "hover:bg-muted/50"
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Configurações</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          onClick={handleSignOut}
          className="w-full justify-start"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}