/**
 * @purpose Display and manage family members and their loyalty programs
 * @connects-to server/routes.ts (DELETE /api/members/:id)
 * @connects-to components/edit-member-modal.tsx
 * @connects-to components/edit-program-modal.tsx
 * @connects-to components/new-member-modal.tsx
 * @connects-to components/new-program-modal.tsx
 * @connects-to components/member-frame.tsx
 * @connects-to components/points-display.tsx
 * @connects-to components/program-details-modal.tsx
 * @connects-to components/member-details-modal.tsx
 * @api-endpoints DELETE /api/members/:id
 */
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, UserPlus, Plus } from "lucide-react";
import type { MemberWithPrograms, LoyaltyProgram } from "@/types/schema";
import EditMemberModal from "./edit-member-modal";
import EditProgramModal from "./edit-program-modal";
import NewMemberModal from "./new-member-modal";
import NewProgramModal from "./new-program-modal";
import ProgramDetailsModal from "./program-details-modal";
import MemberDetailsModal from "./member-details-modal";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";
import { getProgramIcon } from "@/lib/program-icons";
import MemberFrame from "./member-frame";
import PointsDisplay from "./points-display";
import { formatEstimatedValue } from "@/lib/miles-values";

interface MembersTableProps {
  data?: MemberWithPrograms[];
  isLoading: boolean;
  sortBy: 'name' | 'company' | 'points';
  sortOrder: 'asc' | 'desc';
}

export default function MembersTable({ 
  data, 
  isLoading, 
  sortBy, 
  sortOrder 
}: MembersTableProps) {
  const [editingMember, setEditingMember] = useState<MemberWithPrograms | null>(null);
  const [editingProgram, setEditingProgram] = useState<LoyaltyProgram | null>(null);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
  const [deletingMember, setDeletingMember] = useState<{ id: number, name: string } | null>(null);
  const [viewingMember, setViewingMember] = useState<MemberWithPrograms | null>(null);
  const [programDetails, setProgramDetails] = useState<{ 
    program: LoyaltyProgram; 
    memberProgram?: any;
    memberId: number;
    memberName: string;
  } | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sortedData = useMemo(() => {
    if (!data) return [];
    
    const flatData = data.flatMap(member => 
      member.programs.map(program => ({
        member,
        program: program.program,
        memberProgram: program,
      }))
    );

    // Sort the data based on sortBy and sortOrder
    return flatData.sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      switch (sortBy) {
        case 'name':
          valueA = a.member.name.toLowerCase();
          valueB = b.member.name.toLowerCase();
          break;
        case 'company':
          valueA = a.program.company.toLowerCase();
          valueB = b.program.company.toLowerCase();
          break;
        case 'points':
          valueA = parseInt(a.memberProgram.pointsBalance?.toString() || '0');
          valueB = parseInt(b.memberProgram.pointsBalance?.toString() || '0');
          break;
        default:
          return 0;
      }

      if (valueA < valueB) {
        return sortOrder === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortBy, sortOrder]);



  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    
    try {
      const response = await fetch(`/api/members/${deletingMember.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete member');
      }
      
      toast({
        title: "Membro excluído",
        description: `${deletingMember.name} foi removido com sucesso.`,
      });
      
      // Refresh the data
      queryClient.invalidateQueries();
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o membro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setDeletingMember(null);
    }
  };

  const formatLastUpdated = (date: string | Date) => {
    const now = new Date();
    const updated = new Date(date);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 dia atrás";
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} semana${Math.ceil(diffDays / 7) > 1 ? 's' : ''} atrás`;
    return `${Math.ceil(diffDays / 30)} mês${Math.ceil(diffDays / 30) > 1 ? 'es' : ''} atrás`;
  };


  if (isLoading) {
    return (
      <Card className="glass-card mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-sky/20 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-card mb-8 overflow-hidden">
        <CardHeader className="p-6 border-b border-sky/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Contas de Pontos</h3>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowNewMemberModal(true)}
                className="text-sm btn-primary"
              >
                <UserPlus className="w-4 h-4 mr-2 icon-primary" />
                Adicionar Membro
              </Button>
              <Button 
                onClick={() => setShowNewProgramModal(true)}
                className="text-sm btn-accent"
              >
                <Plus className="w-4 h-4 mr-2 icon-secondary" />
                Adicionar Programa
              </Button>
            </div>
          </div>
        </CardHeader>
      
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-navy/30">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Membro
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Programa
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Pontos
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Valor Estimado
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Última Atualização
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-powder uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky/10">
              {sortedData.map((item, index) => (
                <tr key={index} className="data-row hover:bg-sky/5 transition-colors">
                  <td className="px-6 py-4">
                    <div style={{ minWidth: '140px', display: 'inline-block' }}>
                      <MemberFrame 
                        member={item.member} 
                        variant="compact" 
                        clickable={true}
                        onClick={() => setViewingMember(item.member)}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        console.log('Setting program details:', {
                          item,
                          program: item.program,
                          memberProgram: item.memberProgram,
                          memberId: item.member.id,
                          memberName: item.member.name
                        });
                        setProgramDetails({
                          program: item.program,
                          memberProgram: item.memberProgram,
                          memberId: item.member.id,
                          memberName: item.member.name
                        });
                      }}
                      title={`Clique para ver detalhes de ${item.program.company}`}
                    >
                      {(() => {
                        const icon = getProgramIcon(item.program);
                        return icon.type === 'png' ? (
                          <img 
                            src={icon.value} 
                            alt={item.program.name}
                            className="w-12 h-12 rounded mr-3 object-contain"
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded mr-3"
                            style={{ backgroundColor: icon.value }}
                          />
                        );
                      })()}
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate hover:underline">{item.program.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        console.log('Setting program details:', {
                          item,
                          program: item.program,
                          memberProgram: item.memberProgram,
                          memberId: item.member.id,
                          memberName: item.member.name
                        });
                        setProgramDetails({
                          program: item.program,
                          memberProgram: item.memberProgram,
                          memberId: item.member.id,
                          memberName: item.member.name
                        });
                      }}
                      title={`Clique para ver detalhes da conta de ${item.member.name} em ${item.program.company}`}
                    >
                      <PointsDisplay points={item.memberProgram.pointsBalance || 0} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-lg font-semibold text-cyber-green-pastel">
                      {formatEstimatedValue(item.memberProgram.pointsBalance || 0, item.program.company)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-powder">
                    {formatLastUpdated(item.memberProgram.lastUpdated!)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-pastel-blue/20"
                        onClick={() => setEditingMember(item.member)}
                      >
                        <Edit className="w-4 h-4 icon-primary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-pastel-purple/20"
                        onClick={() => {
                          toast({
                            title: "Visualização em desenvolvimento",
                            description: "A visualização detalhada será implementada em breve.",
                          });
                        }}
                      >
                        <Eye className="w-4 h-4 icon-secondary" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-pastel-pink/20"
                        onClick={() => setDeletingMember({ id: item.member.id, name: item.member.name })}
                      >
                        <Trash2 className="w-4 h-4 icon-accent" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedData.length === 0 && (
            <div className="p-8 text-center text-powder">
              Nenhum dado disponível.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    
    {editingMember && (
      <EditMemberModal 
        member={editingMember}
        open={!!editingMember}
        onClose={() => setEditingMember(null)} 
      />
    )}
    
    {editingProgram && (
      <EditProgramModal
        program={editingProgram}
        open={!!editingProgram}
        onClose={() => setEditingProgram(null)}
      />
    )}
    
    {programDetails && (
      <ProgramDetailsModal
        isOpen={true}
        onClose={() => setProgramDetails(null)}
        program={programDetails.program}
        memberProgram={programDetails.memberProgram}
        memberId={programDetails.memberId}
        memberName={programDetails.memberName}
      />
    )}
    
    {viewingMember && (
      <MemberDetailsModal
        isOpen={true}
        onClose={() => setViewingMember(null)}
        member={viewingMember}
      />
    )}
    
    <NewMemberModal
      open={showNewMemberModal}
      onClose={() => setShowNewMemberModal(false)}
    />
    
    <NewProgramModal
      isOpen={showNewProgramModal}
      onClose={() => setShowNewProgramModal(false)}
    />
    
    <AlertDialog open={!!deletingMember} onOpenChange={() => setDeletingMember(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir o membro <strong>{deletingMember?.name}</strong>? 
            Esta ação também removerá todos os programas associados e não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteMember}
            className="btn-accent"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
