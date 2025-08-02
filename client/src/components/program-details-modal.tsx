/**
 * @purpose Modal for displaying program details with login info and edit tabs
 * @connects-to components/edit-program-modal.tsx
 * @connects-to store/auth-store.ts
 * @api-endpoints PUT /api/member-programs/:id
 */
import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ExternalLink, DollarSign, Key, Globe, Plus, X, Save, Loader2, CheckCircle2 } from "lucide-react";
import { LoyaltyProgram, MemberProgram, FamilyMember } from "@/types/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import EditProgramModal from "./edit-program-modal";
import { useDebounce } from "@/hooks/use-debounce";
import { useAutoSave } from "@/hooks/use-auto-save";

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
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Debug log
  console.log('ProgramDetailsModal props:', { program, memberProgram, memberId, memberName });
  
  // Get member program data (now simplified structure)
  const mpId = memberProgram?.id;
  
  // Initialize account data from custom_fields
  const getInitialAccountData = () => {
    console.log('Getting initial account data:', {
      memberProgram,
      customFields: memberProgram?.customFields
    });
    
    // If we have customFields, use them
    if (memberProgram?.customFields && Array.isArray(memberProgram.customFields) && memberProgram.customFields.length > 0) {
      return memberProgram.customFields;
    }
    
    // Default fields for new programs
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
  
  // Auto-save function
  const autoSave = useCallback(async (data: any) => {
    setIsSaving(true);
    
    try {
      // Check if we need to create or update
      const isNewProgram = !mpId && !memberProgram?.id;
      
      if (isNewProgram && program) {
        console.log('Creating new member-program relationship:', {
          program,
          programId: program.id,
          memberId,
          memberName,
          data
        });
        
        if (!memberId) {
          throw new Error('Member ID não encontrado');
        }
        
        console.log('🔍 Creating program with custom fields:', {
          programId: program.id,
          customFields: data
        });
        
        // Create new member-program
        const response = await fetch('/api/programs/member/' + memberId, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            airlineId: program.id,
            memberNumber: '', // Will be stored in customFields
            statusLevel: 'basic',
            currentMiles: 0,
            customFields: data // Send the entire data array as-is
          }),
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Created new member-program:', result);
          
          // Refresh the data
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
          
          setLastSaved(new Date());
          toast({
            title: "Programa adicionado!",
            description: "Suas credenciais foram salvas com sucesso",
            duration: 3000,
          });
          
          // Close modal to refresh with new data
          setTimeout(() => onClose(), 1000);
        } else {
          const errorText = await response.text();
          console.error('Failed to create member-program:', errorText);
          throw new Error(`Falha ao criar programa: ${response.status}`);
        }
      } else {
        // Update existing member-program
        const programId = mpId || memberProgram?.id;
        console.log('Updating existing member-program:', {
          programId,
          mpId,
          memberProgram,
          hasId: !!programId
        });
        
        if (!programId) {
          console.error('No program ID for update, this should have been a create!');
          throw new Error('ID do programa não encontrado');
        }
        
        console.log('🔍 Saving custom fields:', {
          programId,
          customFields: data
        });
        
        const response = await fetch(`/api/programs/${programId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            memberNumber: memberProgram?.memberNumber || '',
            currentMiles: memberProgram?.pointsBalance || 0,
            statusLevel: memberProgram?.statusLevel || 'basic',
            customFields: data // Send the entire data array as-is
          }),
        });

        console.log('Update response:', response.status, response.statusText);

        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
          queryClient.invalidateQueries({ queryKey: ["/api/member-programs"] });
          
          const data = await response.json();
          queryClient.setQueryData(["/api/member-programs", programId], data);
          
          setLastSaved(new Date());
          toast({
            title: "Salvo com sucesso!",
            description: "Dados da conta foram atualizados",
            duration: 3000,
          });
        } else {
          const errorText = await response.text();
          console.error('Update failed - Status:', response.status);
          console.error('Error details:', errorText);
          console.error('Request URL:', `/api/programs/${programId}`);
          throw new Error(`Falha ao atualizar: ${response.status} ${response.statusText}`);
        }
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
  }, [mpId, memberProgram, queryClient, toast, program, memberId]);

  // Use auto-save hook
  useAutoSave({
    data: accountData,
    onSave: autoSave,
    delay: 300, // Save after 300ms of inactivity
    enabled: isOpen && (!!mpId || !!memberProgram?.id), // Only auto-save when modal is open and has valid ID
  });

  // Calculate value per thousand points (pointValue is already per point in the database)
  const valuePerThousand = program.pointValue ? 
    (parseFloat(program.pointValue) * 1000).toFixed(2) : '30.00';

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
            Conta {program.company || program.name || program.programName} {memberName ? `- ${memberName}` : ''}
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
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isSaving && (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    )}
                    {!isSaving && lastSaved && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Salvo automaticamente</span>
                      </>
                    )}
                    {!isSaving && !lastSaved && (
                      <span className="text-xs">As alterações são salvas automaticamente</span>
                    )}
                  </div>
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