import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth-store";
import { useLocation } from "wouter";
import { Search, Bell, Settings } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
const logoPath = "/lech-world-logo.png";

interface NavigationProps {
  onSettingsClick?: () => void;
}

export default function Navigation({ onSettingsClick }: NavigationProps) {
  const { user, logout } = useAuthStore();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    setLocation("/login");
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSearchClick = () => {
    toast({
      title: "Pesquisa",
      description: "Função de pesquisa global será implementada em breve!",
    });
  };

  const handleNotificationClick = () => {
    toast({
      title: "Notificações",
      description: "Você não tem notificações no momento.",
    });
  };

  const handleSettingsClick = () => {
    if (onSettingsClick) {
      onSettingsClick();
    } else {
      toast({
        title: "Configurações",
        description: "Painel de configurações será implementado em breve!",
      });
    }
  };

  return (
    <nav className="glass-nav px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <img 
            src={logoPath} 
            alt="lech.world logo" 
            className="h-16 object-contain nav-logo"
            id="main-logo"
            style={{ display: 'block', visibility: 'visible' }}
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-liquid-glass-hover transition-colors"
            onClick={handleSearchClick}
          >
            <Search className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-liquid-glass-hover transition-colors"
            onClick={handleNotificationClick}
          >
            <Bell className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="hover:bg-liquid-glass-hover transition-colors"
            onClick={handleSettingsClick}
          >
            <Settings className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center space-x-3">
            <div 
              className="w-8 h-8 blue-gradient rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
              onClick={handleLogout}
            >
              <span className="text-sm font-semibold text-white">
                {user ? getInitials(user.name) : "U"}
              </span>
            </div>
            <span className="text-sm text-gray-700">{user?.name}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
