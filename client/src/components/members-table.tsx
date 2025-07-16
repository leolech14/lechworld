import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2, UserPlus, Plus } from "lucide-react";
import type { MemberWithPrograms } from "@shared/schema";
import EditMemberModal from "./edit-member-modal";
import NewMemberModal from "./new-member-modal";
import NewProgramModal from "./new-program-modal";

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
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showNewProgramModal, setShowNewProgramModal] = useState(false);
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
          valueA = parseInt(a.memberProgram.points?.toString() || '0');
          valueB = parseInt(b.memberProgram.points?.toString() || '0');
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
            <h3 className="text-xl font-semibold">Membros e Programas</h3>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowNewMemberModal(true)}
                className="bg-sky/20 hover:bg-sky/30 transition-colors text-sm"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Adicionar Membro
              </Button>
              <Button 
                onClick={() => setShowNewProgramModal(true)}
                className="bg-royal hover:bg-sky transition-colors text-sm"
              >
                <Plus className="w-4 h-4 mr-2" />
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
                  Status
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
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium">{item.member.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded mr-3"
                        style={{ backgroundColor: item.program.logoColor }}
                      ></div>
                      <div>
                        <div className="text-sm font-medium">{item.program.name}</div>
                        <div className="text-xs text-powder">{item.program.company}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className="points-badge">
                      {item.memberProgram.pointsBalance?.toLocaleString('pt-BR') || '0'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      className={item.memberProgram.isActive ? "status-active" : "status-inactive"}
                    >
                      {item.memberProgram.isActive ? "Ativo" : "Inativo"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-powder">
                    {formatLastUpdated(item.memberProgram.lastUpdated!)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:bg-sky/20"
                        onClick={() => setEditingMember(item.member)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-sky/20">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-red-500/20">
                        <Trash2 className="w-4 h-4" />
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
        onClose={() => setEditingMember(null)} 
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
