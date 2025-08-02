/**
 * @purpose Modal for displaying member details with programs, info, and appearance tabs
 * @connects-to components/edit-member-modal.tsx
 * @connects-to components/program-details-modal.tsx
 * @connects-to store/auth-store.ts
 * @api-endpoints GET /api/member-programs/:memberId
 */
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trophy, User, Palette, CreditCard, Building2 } from "lucide-react";
import { MemberWithPrograms, LoyaltyProgram } from "@/types/schema";
import { useQuery } from "@tanstack/react-query";
import { getProgramIcon } from "@/lib/program-icons";
import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";
import MemberFrame from "./member-frame";
import EditMemberModal from "./edit-member-modal";
import ProgramDetailsModal from "./program-details-modal";
import { formatEstimatedValue } from "@/lib/miles-values";

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: MemberWithPrograms;
}

export default function MemberDetailsModal({ 
  isOpen, 
  onClose, 
  member 
}: MemberDetailsModalProps) {
  const [selectedProgram, setSelectedProgram] = useState<{
    program: LoyaltyProgram;
    memberProgram?: any;
  } | null>(null);
  const [editingAppearance, setEditingAppearance] = useState(false);

  // Get member's programs
  const { data: memberPrograms } = useQuery({
    queryKey: ["/api/member-programs", member.id],
    enabled: !!member.id,
  });

  // Calculate total points across all programs
  const totalPoints = member.programs?.reduce(
    (sum, p) => sum + (p.pointsBalance || 0), 
    0
  ) || 0;

  const handleProgramClick = (program: LoyaltyProgram, memberProgram?: any) => {
    console.log('handleProgramClick - program:', program, 'memberProgram:', memberProgram);
    setSelectedProgram({ program, memberProgram });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <MemberFrame 
                member={member} 
                variant="compact"
                clickable={false}
              />
              <div>
                <h3 className="text-xl font-semibold">{member.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {member.role === 'primary' ? 'Membro Principal' : 
                   member.role === 'extended' ? 'Família Estendida' : 'Visualização'}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="programs" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="programs" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Programas
              </TabsTrigger>
              <TabsTrigger value="info" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Informações
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Aparência
              </TabsTrigger>
            </TabsList>

            <TabsContent value="programs" className="space-y-4">
              {/* Total Points Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Resumo de Pontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {totalPoints.toLocaleString()} pontos
                  </p>
                  <p className="text-sm text-muted-foreground">
                    em {member.programs?.length || 0} programas
                  </p>
                </CardContent>
              </Card>

              {/* Programs List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Programas Cadastrados</h4>
                </div>

                <ScrollArea className="h-[300px] pr-4">
                  {member.programs?.map((item) => {
                    const icon = getProgramIcon(item.program);
                    return (
                      <Card 
                        key={item.id} 
                        className="mb-3 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleProgramClick(item.program, item)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback 
                                  style={{ backgroundColor: item.program.logoColor || '#3B82F6' }}
                                  className="text-white"
                                >
                                  {icon.type === 'png' ? (
                                    <img src={icon.value} alt={item.program.name} className="w-6 h-6" />
                                  ) : (
                                    item.program.company.charAt(0).toUpperCase()
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{item.program.company}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.program.name}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {item.pointsBalance?.toLocaleString() || '0'}
                              </p>
                              <p className="text-sm text-muted-foreground">pontos</p>
                            </div>
                          </div>
                          {item.accountNumber && (
                            <div className="mt-2 pt-2 border-t">
                              <p className="text-xs text-muted-foreground">
                                Conta: {item.accountNumber}
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {(!member.programs || member.programs.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum programa cadastrado</p>
                      <p className="text-sm mt-2">Use o botão "Adicionar Programa" na tela principal</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informações Pessoais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nome</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  {member.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="font-medium">{member.email}</p>
                    </div>
                  )}
                  {member.cpf && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">CPF</p>
                      <p className="font-medium">{member.cpf}</p>
                    </div>
                  )}
                  {member.phone && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                      <p className="font-medium">{member.phone}</p>
                    </div>
                  )}
                  {member.birthdate && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">{member.birthdate}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Tipo de Membro</p>
                    <Badge variant={member.role === 'primary' ? 'default' : 'secondary'}>
                      {member.role === 'primary' ? 'Principal' : 
                       member.role === 'extended' ? 'Família Estendida' : 'Visualização'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personalização Visual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center py-4">
                    <MemberFrame 
                      member={member} 
                      variant="large"
                      clickable={false}
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Emoji</p>
                      <p className="text-2xl">{getMemberEmoji(member)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Cor da Moldura</p>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded border-2"
                          style={{ 
                            backgroundColor: member.frameColor || getMemberColor(member).background,
                            borderColor: member.frameBorderColor || getMemberColor(member).border
                          }}
                        />
                        <p className="text-sm">
                          {member.frameColor || 'Cor padrão'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => setEditingAppearance(true)}
                  >
                    Editar Aparência
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Program Details Modal */}
      {selectedProgram && (
        <ProgramDetailsModal
          isOpen={true}
          onClose={() => setSelectedProgram(null)}
          program={selectedProgram.program}
          memberProgram={selectedProgram.memberProgram}
          memberId={member.id}
          memberName={member.name}
        />
      )}

      {/* Edit Member Modal for Appearance */}
      {editingAppearance && (
        <EditMemberModal
          member={member}
          open={true}
          onClose={() => setEditingAppearance(false)}
          appearanceOnly={true}
        />
      )}
    </>
  );
}