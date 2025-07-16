import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, CreditCard, RefreshCw, Download, Upload, Lock, Activity, Shield, MessageCircle } from "lucide-react";
import type { ActivityLog } from "@shared/schema";
import { useState } from "react";
import { WhatsAppShare } from "./whatsapp-share";
import NewMemberModal from "./new-member-modal";

interface QuickActionsProps {
  activities?: ActivityLog[];
  isLoading: boolean;
}

export default function QuickActions({ activities, isLoading }: QuickActionsProps) {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
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
              <Activity className="w-6 h-6 text-sky" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full h-16 bg-gradient-to-r from-blue-500/20 to-sky/30 hover:from-blue-500/30 hover:to-sky/40 transition-all duration-300 justify-start text-base font-semibold hover:scale-105 border border-blue-200/50 shadow-md"
            onClick={() => setShowNewMemberModal(true)}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-blue-500/20 rounded-full mr-4">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            Adicionar Membro
          </Button>
          <Button 
            className="w-full h-16 bg-gradient-to-r from-green-500/20 to-green-600/30 hover:from-green-500/30 hover:to-green-600/40 transition-all duration-300 justify-start text-base font-semibold hover:scale-105 border border-green-200/50 shadow-md"
            onClick={() => setShowWhatsAppModal(true)}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-green-500/20 rounded-full mr-4">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            Enviar WhatsApp
          </Button>
          <Button className="w-full h-16 bg-gradient-to-r from-purple-500/20 to-indigo-500/30 hover:from-purple-500/30 hover:to-indigo-500/40 transition-all duration-300 justify-start text-base font-semibold hover:scale-105 border border-purple-200/50 shadow-md">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500/20 rounded-full mr-4">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            Novo Programa
          </Button>
          <Button className="w-full bg-sky/20 hover:bg-sky/30 transition-colors justify-start">
            <RefreshCw className="w-5 h-5 mr-3" />
            Atualizar Pontos
          </Button>
        </CardContent>
      </Card>
      
      {/* Latest Activities */}
      <Card className="glass-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Últimas Atividades</h3>
            <Activity className="w-6 h-6 text-sky" />
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
          <Button className="w-full bg-sky/20 hover:bg-sky/30 transition-colors justify-start">
            <Download className="w-5 h-5 mr-3" />
            Exportar Dados
          </Button>
          <Button className="w-full bg-sky/20 hover:bg-sky/30 transition-colors justify-start">
            <Upload className="w-5 h-5 mr-3" />
            Importar Dados
          </Button>
          <Button className="w-full bg-sky/20 hover:bg-sky/30 transition-colors justify-start">
            <Lock className="w-5 h-5 mr-3" />
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
    </>
  );
}
