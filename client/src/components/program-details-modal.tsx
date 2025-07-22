/**
 * @purpose Modal for displaying program details with login info and edit tabs
 * @connects-to components/edit-program-modal.tsx
 * @connects-to store/auth-store.ts
 * @api-endpoints PUT /api/member-programs/:id
 */
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, DollarSign, Key, Globe, Plus, X, Save } from "lucide-react";
import { LoyaltyProgram, MemberProgram, FamilyMember } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import EditProgramModal from "./edit-program-modal";
import { useDebounce } from "@/hooks/use-debounce";

interface ProgramDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  program: LoyaltyProgram;
  memberProgram?: MemberProgram;
  memberId: number;
  memberName?: string;
}


export default function ProgramDetailsModal({ 
  isOpen, 
  onClose, 
  program, 
  memberProgram,
  memberId,
  memberName 
}: ProgramDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProgram, setEditingProgram] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Debug log
  console.log('ProgramDetailsModal props:', { program, memberProgram, memberId, memberName });
  
  // Get member program data (now simplified structure)
  const mpId = memberProgram?.id;
  
  // Initialize account data from custom_fields
  const getInitialAccountData = () => {
    console.log('Getting initial account data:', {
      memberProgram,
      customFields: memberProgram?.customFields,
      accountData: memberProgram?.customFields?.accountData
    });
    
    if (memberProgram?.customFields?.accountData) {
      return memberProgram.customFields.accountData;
    }
    // Migrate from old fields if they exist
    if (memberProgram?.login || memberProgram?.password) {
      return [
        { id: '1', label: 'Login / Email', value: memberProgram.login || '' },
        { id: '2', label: 'Senha', value: memberProgram.password || '' }
      ];
    }
    return [
      { id: '1', label: 'Login / Email', value: '' },
      { id: '2', label: 'Senha', value: '' }
    ];
  };
  
  const [accountData, setAccountData] = useState(getInitialAccountData());
  
  // Debounced account data for auto-save
  const debouncedAccountData = useDebounce(accountData, 1000);

  useEffect(() => {
    setAccountData(getInitialAccountData());
  }, [memberProgram]);

  // Auto-save when debounced values change
  useEffect(() => {
    if (!mpId) return;
    
    // Don't save if data hasn't changed
    const hasChanges = JSON.stringify(debouncedAccountData) !== JSON.stringify(getInitialAccountData());
    if (!hasChanges) {
      console.log('No changes detected, skipping save');
      return;
    }
    
    const updateData = async () => {
      try {
        console.log('Saving account data:', {
          id: mpId,
          accountData: debouncedAccountData
        });
        
        const response = await fetch(`/api/member-programs/${mpId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customFields: { accountData: debouncedAccountData },
            accountNumber: memberProgram?.accountNumber,
            pointsBalance: memberProgram?.pointsBalance || 0,
          }),
        });

        if (response.ok) {
          // Invalidate all relevant queries to ensure fresh data
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/member-programs"] });
          
          // Also update the specific member program in cache
          const data = await response.json();
          queryClient.setQueryData(
            ["/api/member-programs", mpId],
            data
          );
          
          toast({
            title: "Salvo automaticamente",
            description: "Dados da conta atualizados",
            duration: 2000,
          });
        }
      } catch (error) {
        console.error('Error saving account data:', error);
      }
    };
    
    updateData();
  }, [debouncedAccountData, mpId]);
  
  // Field management functions
  const updateField = (id: string, key: 'label' | 'value', newValue: string) => {
    setAccountData(prev => 
      prev.map(field => 
        field.id === id ? { ...field, [key]: newValue } : field
      )
    );
  };
  
  const addField = () => {
    const newField = {
      id: Date.now().toString(),
      label: '',
      value: ''
    };
    setAccountData(prev => [...prev, newField]);
  };
  
  const removeField = (id: string) => {
    setAccountData(prev => prev.filter(field => field.id !== id));
  };
  
  // Manual save function
  const handleManualSave = async () => {
    console.log('Manual save - mpId:', mpId, 'memberProgram:', memberProgram);
    
    if (!mpId) {
      toast({
        title: "Erro",
        description: "ID do programa não encontrado",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const payload = {
        customFields: { accountData },
        accountNumber: memberProgram?.accountNumber,
        pointsBalance: memberProgram?.pointsBalance || 0,
      };
      
      console.log('Saving with payload:', payload);
      
      const response = await fetch(`/api/member-programs/${mpId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      console.log('Save response:', response.status, response.statusText);

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
        queryClient.invalidateQueries({ queryKey: ["/api/member-programs"] });
        
        const data = await response.json();
        queryClient.setQueryData(["/api/member-programs", mpId], data);
        
        toast({
          title: "Salvo com sucesso!",
          description: "Dados da conta foram salvos",
          duration: 3000,
        });
      } else {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        throw new Error(`Falha ao salvar: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving account data:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate value per thousand points
  const valuePerThousand = program.pointValue ? 
    (parseFloat(program.pointValue) * 1000).toFixed(2) : '10.00';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback 
                style={{ backgroundColor: program.logoColor || '#3B82F6' }}
                className="text-white font-bold"
              >
                {program.iconUrl ? (
                  <img src={program.iconUrl} alt={program.company} className="w-6 h-6" />
                ) : (
                  program.company.charAt(0).toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>
            Conta {program.company} {memberName ? `- ${memberName}` : ''}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Informações de Login</TabsTrigger>
            <TabsTrigger value="edit">Editar Companhia</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {/* Program Info Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {memberProgram?.pointsBalance?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    ≈ R$ {memberProgram?.estimatedValue || '0,00'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Valor do Milheiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">R$ {valuePerThousand}</p>
                  <p className="text-sm text-muted-foreground">por 1.000 pontos</p>
                </CardContent>
              </Card>
            </div>

            {/* Account Data Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Dados da Conta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {accountData.map((field, index) => (
                  <div key={field.id} className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        value={field.label}
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                        placeholder="Nome do campo"
                        className="w-1/3"
                      />
                      {index > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeField(field.id)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateField(field.id, 'value', e.target.value)}
                      placeholder="Valor"
                      className="font-mono"
                    />
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addField}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Campo
                </Button>

                {/* Program Website */}
                {program.website && (
                  <div className="pt-4 border-t">
                    <Label>Site para Login</Label>
                    <Button
                      variant="outline"
                      className="w-full justify-start mt-2"
                      onClick={() => window.open(program.website, '_blank')}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {program.website}
                      <ExternalLink className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground italic">
                    As alterações são salvas automaticamente após 1 segundo
                  </p>
                  
                  <Button
                    onClick={handleManualSave}
                    disabled={isSaving || !mpId}
                    className="w-full"
                    variant="outline"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Salvando...' : 'Salvar Agora'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="edit">
            <EditProgramModal
              program={program}
              isOpen={true}
              onClose={() => {}}
              embedded={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}