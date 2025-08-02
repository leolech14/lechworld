import { useState } from "react";
import { X, Users, CreditCard, Bell, Shield, HelpCircle, Palette, Database, Trash2, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import NewMemberModal from "./new-member-modal";
import NewProgramModal from "./new-program-modal";
import EditMemberModal from "./edit-member-modal";
import EditProgramModal from "./edit-program-modal";
import ProgramIconModal from "./program-icon-modal";
import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";
import { getProgramIcon } from "@/lib/program-icons";
import MemberFrame from "./member-frame";
import type { FamilyMember, LoyaltyProgram } from "@/types/schema";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
}

type SettingsCategory = {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
};

const categories: SettingsCategory[] = [
  {
    id: "members",
    label: "Membros da Família",
    icon: <Users className="w-4 h-4" />,
    description: "Gerencie os membros da sua família"
  },
  {
    id: "programs",
    label: "Programas de Fidelidade",
    icon: <CreditCard className="w-4 h-4" />,
    description: "Configure novos programas de milhas"
  },
  {
    id: "notifications",
    label: "Notificações",
    icon: <Bell className="w-4 h-4" />,
    description: "Configure alertas e lembretes"
  },
  {
    id: "security",
    label: "Segurança",
    icon: <Shield className="w-4 h-4" />,
    description: "Configurações de segurança e privacidade"
  },
  {
    id: "appearance",
    label: "Aparência",
    icon: <Palette className="w-4 h-4" />,
    description: "Personalize a interface do aplicativo"
  },
  {
    id: "data",
    label: "Dados",
    icon: <Database className="w-4 h-4" />,
    description: "Importar, exportar e fazer backup"
  },
  {
    id: "help",
    label: "Ajuda",
    icon: <HelpCircle className="w-4 h-4" />,
    description: "Suporte e documentação"
  }
];

export default function SettingsModal({ isOpen, onClose, userId }: SettingsModalProps) {
  const [selectedCategory, setSelectedCategory] = useState("members");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const [editingProgramIcon, setEditingProgramIcon] = useState<LoyaltyProgram | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);
  const [deletingProgramId, setDeletingProgramId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch family members
  const { data: members = [] } = useQuery<FamilyMember[]>({
    queryKey: ["/api/members"],
  });
  
  // Fetch loyalty programs
  const { data: programs = [] } = useQuery<LoyaltyProgram[]>({
    queryKey: ["/api/programs"],
  });

  const filteredCategories = categories.filter(cat =>
    cat.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleDeleteMember = async (memberId: number) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete member');
      }
      
      toast({
        title: "Membro excluído",
        description: "O membro foi removido com sucesso.",
      });
      
      queryClient.invalidateQueries();
      setDeletingMemberId(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o membro.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteProgram = async (programId: number) => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete program');
      }
      
      toast({
        title: "Programa excluído",
        description: "O programa foi removido com sucesso.",
      });
      
      queryClient.invalidateQueries();
      setDeletingProgramId(null);
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o programa.",
        variant: "destructive",
      });
    }
  };

  const renderContent = () => {
    switch (selectedCategory) {
      case "members":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Membros da Família</h2>
              <p className="text-gray-500 mb-6">
                Adicione e gerencie os membros da sua família para acompanhar os programas de fidelidade de todos.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowNewMemberModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Adicionar Novo Membro
            </Button>

            {/* Lista de membros */}
            {members.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold mb-3">Membros Atuais</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border"
                    >
                      <div className="flex items-center gap-3">
                        <MemberFrame member={member} variant="settings" />
                        <div>
                          <p className="text-sm text-gray-500">{member.email || 'Sem email'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingMember(member)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir ${member.name}?`)) {
                              handleDeleteMember(member.id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-6">
              <h3 className="font-semibold mb-3">Configurações de Membros</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Permitir membros editarem seus próprios dados</span>
                  <input type="checkbox" className="toggle" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Notificar sobre atualizações de milhas</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        );

      case "programs":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Programas de Fidelidade</h2>
              <p className="text-gray-500 mb-6">
                Configure novos programas de milhas e gerencie os existentes.
              </p>
            </div>
            
            <Button 
              onClick={() => setShowNewProgramModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Adicionar Novo Programa
            </Button>

            {/* Lista de programas */}
            {programs.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <h3 className="font-semibold mb-3">Programas Existentes</h3>
                <div className="space-y-2">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border"
                    >
                      <div className="flex items-center gap-3">
                        {(() => {
                          const icon = getProgramIcon(program);
                          return icon.type === 'png' ? (
                            <img 
                              src={icon.value} 
                              alt={program.name}
                              className="w-10 h-10 rounded-lg object-contain cursor-pointer hover:opacity-80"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProgramIcon(program);
                              }}
                            />
                          ) : (
                            <div
                              className="w-10 h-10 rounded-lg cursor-pointer hover:opacity-80"
                              style={{ backgroundColor: icon.value }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingProgramIcon(program);
                              }}
                            />
                          );
                        })()}
                        <div>
                          <p className="font-medium">{program.name}</p>
                          <p className="text-sm text-gray-500">{program.company}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditingProgram(program)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`Tem certeza que deseja excluir ${program.name}?`)) {
                              handleDeleteProgram(program.id!);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4 mt-6">
              <h3 className="font-semibold mb-3">Configurações de Programas</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Atualização automática de pontos</span>
                  <input type="checkbox" className="toggle" />
                </label>
                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                  <span className="text-sm">Alertas de expiração de milhas</span>
                  <input type="checkbox" className="toggle" defaultChecked />
                </label>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Notificações</h2>
              <p className="text-gray-500 mb-6">
                Configure quando e como você deseja receber alertas.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Alertas de Milhas</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Milhas prestes a expirar (30 dias)</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Novas promoções de transferência</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Mudanças de status elite</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Métodos de Notificação</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Email</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">WhatsApp</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Notificações no navegador</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Segurança</h2>
              <p className="text-gray-500 mb-6">
                Proteja suas informações e controle o acesso.
              </p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                Alterar Senha
              </Button>
              
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Autenticação</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Autenticação de dois fatores</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Lembrar dispositivo por 30 dias</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Aparência</h2>
              <p className="text-gray-500 mb-6">
                Personalize como o lechworld aparece para você.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-3">Tema</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button className="p-4 border-2 border-blue-500 rounded-lg text-center">
                    <span className="text-sm">Claro</span>
                  </button>
                  <button className="p-4 border rounded-lg text-center hover:border-gray-400">
                    <span className="text-sm">Escuro</span>
                  </button>
                  <button className="p-4 border rounded-lg text-center hover:border-gray-400">
                    <span className="text-sm">Automático</span>
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Exibição</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Modo compacto</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Mostrar avatares dos membros</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Dados</h2>
              <p className="text-gray-500 mb-6">
                Gerencie seus dados, faça backup e importe informações.
              </p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Exportar Dados (CSV)
              </Button>
              
              <Button variant="outline" className="w-full">
                <Database className="w-4 h-4 mr-2" />
                Importar Dados
              </Button>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Backup Automático</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Backup semanal automático</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <span className="text-sm">Enviar backup por email</span>
                    <input type="checkbox" className="toggle" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case "help":
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">Ajuda</h2>
              <p className="text-gray-500 mb-6">
                Encontre respostas e entre em contato com o suporte.
              </p>
            </div>

            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Central de Ajuda
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <HelpCircle className="w-4 h-4 mr-2" />
                Tutorial de Início Rápido
              </Button>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Contato</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Precisa de ajuda? Entre em contato:
                </p>
                <p className="text-sm">
                  Email: suporte@lech.world<br />
                  WhatsApp: +55 11 99999-9999
                </p>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Sobre</h3>
                <p className="text-sm text-gray-600">
                  lechworld v1.0.0<br />
                  © 2025 Família Lech
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl w-[95vw] md:w-[90vw] max-h-[90vh] md:max-h-[85vh] p-0 gap-0 overflow-hidden">
          <div className="flex flex-col md:flex-row h-full min-h-[400px] md:min-h-[500px]">
            {/* Sidebar */}
            <div className="w-full md:w-72 bg-gray-50 border-b md:border-b-0 md:border-r flex flex-col settings-modal-sidebar">
              <div className="p-4 border-b bg-gray-100">
                <h2 className="text-lg font-semibold mb-3">Configurações</h2>
                <Input
                  type="search"
                  placeholder="Buscar configurações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-0"
                />
              </div>
              
              <ScrollArea className="flex-1 max-h-[150px] md:max-h-full">
                <div className="px-2 py-4">
                  {filteredCategories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors mb-1",
                        selectedCategory === category.id
                          ? "bg-blue-500 text-white"
                          : "hover:bg-gray-200 text-gray-700"
                      )}
                    >
                      <span className={cn(
                        selectedCategory === category.id ? "text-white" : "text-gray-500"
                      )}>
                        {category.icon}
                      </span>
                      <span className="text-sm font-medium">{category.label}</span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 settings-modal-content">
              <ScrollArea className="flex-1 h-full">
                <div className="p-6 md:p-8">
                  {renderContent()}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      <NewMemberModal
        open={showNewMemberModal}
        onClose={() => setShowNewMemberModal(false)}
      />
      
      <NewProgramModal
        isOpen={showNewProgramModal}
        onClose={() => setShowNewProgramModal(false)}
      />
      
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          open={!!editingMember}
          onClose={async () => {
            setEditingMember(null);
            // Force refresh of members data
            await queryClient.invalidateQueries({
              queryKey: ["/api/members"],
              refetchType: 'all'
            });
          }}
        />
      )}
      
      {editingProgram && (
        <EditProgramModal
          program={editingProgram}
          open={true}
          onClose={() => setEditingProgram(null)}
        />
      )}
      
      {editingProgramIcon && (
        <ProgramIconModal
          program={editingProgramIcon}
          open={!!editingProgramIcon}
          onClose={() => setEditingProgramIcon(null)}
          onUpdate={async () => {
            // Force refresh of programs data
            await queryClient.invalidateQueries({ 
              queryKey: [`/api/programs`],
              refetchType: 'all'
            });
          }}
        />
      )}
    </>
  );
}