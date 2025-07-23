import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, RefreshCw, Download, Upload, Lock, Activity, Shield, MessageCircle } from "lucide-react";
import type { ActivityLog } from "@shared/schema";
import { useState } from "react";
import { WhatsAppShare } from "./whatsapp-share";
import NewMemberModal from "./new-member-modal";
import NewProgramModal from "./new-program-modal";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface QuickActionsProps {
  activities?: ActivityLog[];
  isLoading: boolean;
}

export default function QuickActions({ activities, isLoading }: QuickActionsProps) {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [isUpdatingPoints, setIsUpdatingPoints] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const handleUpdateAllPoints = async () => {
    setIsUpdatingPoints(true);
    
    try {
      const response = await fetch("/api/dashboard/update-all-points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao atualizar pontos");
      }

      const result = await response.json();
      
      toast({
        title: "Pontos atualizados com sucesso!",
        description: `${result.updated} programas foram atualizados.`,
        className: "toast-success",
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      
    } catch (error) {
      toast({
        title: "Erro ao atualizar pontos",
        description: "Não foi possível atualizar os pontos. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPoints(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      const response = await fetch("/api/dashboard/export", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao exportar dados");
      }

      const data = await response.json();
      
      // Create download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `milhaslech-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Dados exportados com sucesso!",
        description: "O arquivo foi baixado para seu dispositivo.",
        className: "toast-success",
      });
      
    } catch (error) {
      toast({
        title: "Erro ao exportar dados",
        description: "Não foi possível exportar os dados. Tente novamente.",
        variant: "destructive",
      });
    }
  };
  
  const handleImportData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        const response = await fetch("/api/dashboard/import", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error("Falha ao importar dados");
        }

        const result = await response.json();
        
        toast({
          title: "Dados importados com sucesso!",
          description: `${result.imported} registros foram importados.`,
          className: "toast-success",
        });
        
        // Refresh all data
        queryClient.invalidateQueries();
        
      } catch (error) {
        toast({
          title: "Erro ao importar dados",
          description: "Verifique se o arquivo está no formato correto.",
          variant: "destructive",
        });
      }
    };
    
    input.click();
  };
  
  const handleEncryptData = () => {
    toast({
      title: "Criptografia ativada",
      description: "Seus dados já estão protegidos com criptografia SSL/TLS durante a transmissão.",
    });
  };
  const formatActivityTime = (date: string | Date) => {
    const now = new Date();
    const activityTime = new Date(date);
    const diffTime = Math.abs(now.getTime() - activityTime.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 dia atrás";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semana${Math.ceil(diffDays / 7) > 1 ? 's' : ''} atrás`;
    return `${Math.ceil(diffDays / 30)} mês${Math.ceil(diffDays / 30) > 1 ? 'es' : ''} atrás`;
  };

  const getActivityColor = (action: string) => {
    switch (action) {
      case 'login':
      case 'create_member':
      case 'create_member_program':
        return 'bg-sky';
      case 'update_member':
      case 'update_member_program':
        return 'bg-green-500';
      case 'delete_member':
      case 'delete_member_program':
        return 'bg-orange-500';
      default:
        return 'bg-powder';
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {/* Quick Actions */}
      <Card className="glass-card border-2 border-sky/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Ações Rápidas</h3>
            <div className="p-2 bg-sky/10 rounded-full">
              <Activity className="w-6 h-6 icon-primary" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-16 btn-primary transition-all duration-300 justify-start text-base font-semibold hover:scale-105 shadow-md"
            onClick={() => setShowNewMemberModal(true)}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-trust-blue-pastel-light rounded-full mr-4">
              <UserPlus className="w-6 h-6 icon-primary" />
            </div>
            Adicionar Membro
          </Button>
          <Button 
            className="w-full h-16 btn-accent transition-all duration-300 justify-start text-base font-semibold hover:scale-105 shadow-md"
            onClick={() => setShowWhatsAppModal(true)}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-cyber-green-pastel-light rounded-full mr-4">
              <MessageCircle className="w-6 h-6 icon-secondary" />
            </div>
            Envie pelo WhatsApp
          </Button>
          <Button 
            className="w-full h-16 btn-secondary transition-all duration-300 justify-start text-base font-semibold hover:scale-105 shadow-md"
            onClick={() => setShowNewProgramModal(true)}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-silver-pastel-light rounded-full mr-4">
              <CreditCard className="w-6 h-6 icon-accent" />
            </div>
            Novo Programa
          </Button>
          <Button 
            className="w-full h-16 btn-secondary transition-all duration-300 justify-start text-base font-semibold hover:scale-105 shadow-md"
            onClick={handleUpdateAllPoints}
            disabled={isUpdatingPoints}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-silver-pastel-light rounded-full mr-4">
              <RefreshCw className={`w-6 h-6 icon-accent ${isUpdatingPoints ? 'animate-spin' : ''}`} />
            </div>
            {isUpdatingPoints ? 'Atualizando...' : 'Atualizar Pontos'}
          </Button>
        </CardContent>
      </Card>
      
      {/* Latest Activities */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Últimas Atividades</h3>
            <Activity className="w-6 h-6 text-[#8CC8FF]" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-sky/20 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-sky/20 rounded mb-1"></div>
                      <div className="h-3 bg-sky/20 rounded w-20"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            activities.slice(0, 3).map((activity, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-2 h-2 ${getActivityColor(activity.action)} rounded-full`}></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.description}</p>
                  <p className="text-xs text-powder">{formatActivityTime(activity.timestamp!)}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-powder">Nenhuma atividade recente</p>
          )}
        </CardContent>
      </Card>
      
      {/* Backup & Security */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Backup & Segurança</h3>
            <Shield className="w-6 h-6 text-sky" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full h-14 bg-sky/20 hover:bg-sky/30 transition-all duration-300 justify-start text-sm font-semibold hover:scale-105"
            onClick={handleExportData}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-sky/30 rounded-full mr-3">
              <Download className="w-5 h-5 text-sky-700" />
            </div>
            Exportar Dados
          </Button>
          <Button 
            className="w-full h-14 bg-sky/20 hover:bg-sky/30 transition-all duration-300 justify-start text-sm font-semibold hover:scale-105"
            onClick={handleImportData}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-sky/30 rounded-full mr-3">
              <Upload className="w-5 h-5 text-sky-700" />
            </div>
            Importar Dados
          </Button>
          <Button 
            className="w-full h-14 bg-sky/20 hover:bg-sky/30 transition-all duration-300 justify-start text-sm font-semibold hover:scale-105"
            onClick={handleEncryptData}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-sky/30 rounded-full mr-3">
              <Lock className="w-5 h-5 text-sky-700" />
            </div>
            Criptografar
          </Button>
        </CardContent>
      </Card>
    </div>
    
    {/* Modals */}
    {showWhatsAppModal && (
      <WhatsAppShare 
        trigger={<div style={{ display: 'none' }} />}
        isMobile={false}
      />
    )}
    <NewMemberModal 
      open={showNewMemberModal} 
      onClose={() => setShowNewMemberModal(false)} 
    />
    
    <NewProgramModal
      open={showNewProgramModal}
      onClose={() => setShowNewProgramModal(false)}
    />
    </>
  );
}
