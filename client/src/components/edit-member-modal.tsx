import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, X, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { MemberWithPrograms } from "@shared/schema";

interface EditMemberModalProps {
  member: MemberWithPrograms;
  onClose: () => void;
}

interface MemberProgramData {
  login?: string;
  password?: string;
  cpf?: string;
  card_number?: string;
  current_balance?: number;
  elite_tier?: string;
  notes?: string;
  custom_fields?: Record<string, string>;
}

interface MemberBasicData {
  name: string;
  role: string;
  email: string;
}

export default function EditMemberModal({ member, onClose }: EditMemberModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [newCustomFields, setNewCustomFields] = useState<Record<number, { key: string; value: string }>>({});
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
  const [saveTimeouts, setSaveTimeouts] = useState<Record<string, NodeJS.Timeout>>({});
  const [basicData, setBasicData] = useState<MemberBasicData>({
    name: member.name,
    role: member.role,
    email: member.email
  });

  // Initialize form state for each program
  const [programData, setProgramData] = useState<Record<number, MemberProgramData>>(() => {
    const data: Record<number, MemberProgramData> = {};
    member.programs.forEach((program) => {
      let loginData = { username: "", password: "" };
      try {
        if (program.loginCredentials) {
          loginData = JSON.parse(program.loginCredentials);
        }
      } catch (e) {
        console.error("Error parsing login credentials:", e);
      }

      data[program.program.id] = {
        login: loginData.username || "",
        password: loginData.password || "",
        cpf: "",
        card_number: program.accountNumber || "",
        current_balance: program.pointsBalance || 0,
        elite_tier: program.statusLevel || "",
        notes: "",
        custom_fields: (() => {
          try {
            if (program.estimatedValue && program.estimatedValue.startsWith('{')) {
              return JSON.parse(program.estimatedValue);
            }
          } catch (e) {
            console.error("Error parsing custom fields:", e);
          }
          return {};
        })(),
      };
    });
    return data;
  });

  const updateProgramMutation = useMutation({
    mutationFn: async ({ programId, data }: { programId: number; data: MemberProgramData }) => {
      // Map our internal program ID to the expected company ID format
      const programIdMap: Record<number, string> = {
        1: "latam",
        2: "azul", 
        3: "smiles"
      };
      
      const companyId = programIdMap[programId];
      if (!companyId) {
        throw new Error("Invalid program ID");
      }

      return apiRequest("PUT", `/api/members/${member.id}/programs/${companyId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar automaticamente",
        variant: "destructive",
      });
      console.error("Auto-save error:", error);
    },
  });

  const updateCustomFieldsMutation = useMutation({
    mutationFn: async ({ programId, customFields }: { programId: number; customFields: Record<string, string> }) => {
      const programIdMap: Record<number, string> = {
        1: "latam",
        2: "azul",
        3: "smiles"
      };
      
      const companyId = programIdMap[programId];
      if (!companyId) {
        throw new Error("Invalid program ID");
      }

      return apiRequest("PUT", `/api/members/${member.id}/programs/${companyId}/fields`, customFields);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar campo personalizado",
        variant: "destructive",
      });
      console.error("Custom fields update error:", error);
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async (data: MemberBasicData) => {
      return apiRequest("PUT", `/api/members/${member.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao salvar dados básicos",
        variant: "destructive",
      });
      console.error("Member update error:", error);
    },
  });

  // Auto-save function with debouncing
  const autoSave = useCallback((programId: number, field: string, value: any) => {
    const timeoutKey = `${programId}-${field}`;
    
    // Clear existing timeout
    if (saveTimeouts[timeoutKey]) {
      clearTimeout(saveTimeouts[timeoutKey]);
    }
    
    // Set new timeout for auto-save
    const newTimeout = setTimeout(async () => {
      const data = programData[programId];
      if (!data) return;
      
      try {
        await updateProgramMutation.mutateAsync({ programId, data });
      } catch (error) {
        console.error("Auto-save error:", error);
      }
    }, 1000); // 1 second delay
    
    setSaveTimeouts(prev => ({ ...prev, [timeoutKey]: newTimeout }));
  }, [programData, updateProgramMutation, saveTimeouts]);

  // Auto-save function for basic member data
  const autoSaveBasic = useCallback((field: string, value: any) => {
    const timeoutKey = `basic-${field}`;
    
    // Clear existing timeout
    if (saveTimeouts[timeoutKey]) {
      clearTimeout(saveTimeouts[timeoutKey]);
    }
    
    // Set new timeout for auto-save
    const newTimeout = setTimeout(async () => {
      try {
        await updateMemberMutation.mutateAsync(basicData);
      } catch (error) {
        console.error("Auto-save basic data error:", error);
      }
    }, 1000); // 1 second delay
    
    setSaveTimeouts(prev => ({ ...prev, [timeoutKey]: newTimeout }));
  }, [basicData, updateMemberMutation, saveTimeouts]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeouts).forEach(clearTimeout);
    };
  }, [saveTimeouts]);

  const updateField = (programId: number, field: keyof MemberProgramData, value: any) => {
    setProgramData(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        [field]: value,
      },
    }));
    
    // Trigger auto-save
    autoSave(programId, field, value);
  };

  const updateBasicField = (field: keyof MemberBasicData, value: string) => {
    setBasicData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Trigger auto-save
    autoSaveBasic(field, value);
  };

  const togglePasswordVisibility = (programId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [programId]: !prev[programId]
    }));
  };

  const addCustomField = async (programId: number) => {
    const currentField = newCustomFields[programId];
    if (!currentField?.key.trim() || !currentField?.value.trim()) return;

    const updatedCustomFields = {
      ...programData[programId]?.custom_fields,
      [currentField.key]: currentField.value,
    };

    setProgramData(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        custom_fields: updatedCustomFields,
      },
    }));

    // Auto-save custom fields
    try {
      await updateCustomFieldsMutation.mutateAsync({
        programId,
        customFields: updatedCustomFields,
      });
      
      toast({
        title: "Sucesso",
        description: "Campo personalizado adicionado com sucesso",
        className: "toast-success",
      });
    } catch (error) {
      console.error("Error saving custom field:", error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar campo personalizado",
        variant: "destructive",
        className: "toast-destructive",
      });
    }

    // Clear the form for this specific program
    setNewCustomFields(prev => ({
      ...prev,
      [programId]: { key: "", value: "" }
    }));
  };

  const removeCustomField = async (programId: number, fieldKey: string) => {
    const newCustomFields = { ...programData[programId]?.custom_fields };
    delete newCustomFields[fieldKey];
    
    setProgramData(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        custom_fields: newCustomFields,
      },
    }));

    // Auto-save after deletion
    try {
      await updateCustomFieldsMutation.mutateAsync({
        programId,
        customFields: newCustomFields,
      });
      
      toast({
        title: "Sucesso",
        description: "Campo personalizado removido com sucesso",
        className: "toast-success",
      });
    } catch (error) {
      console.error("Error deleting custom field:", error);
      toast({
        title: "Erro",
        description: "Falha ao remover campo personalizado",
        variant: "destructive",
        className: "toast-destructive",
      });
    }
  };

  // Helper function to get or initialize custom field for specific program
  const getNewCustomField = (programId: number) => {
    return newCustomFields[programId] || { key: "", value: "" };
  };

  const updateNewCustomField = (programId: number, field: 'key' | 'value', value: string) => {
    setNewCustomFields(prev => ({
      ...prev,
      [programId]: {
        ...getNewCustomField(programId),
        [field]: value
      }
    }));
  };

  const updateCustomFieldValue = (programId: number, fieldKey: string, newValue: string) => {
    const updatedCustomFields = {
      ...programData[programId]?.custom_fields,
      [fieldKey]: newValue,
    };

    setProgramData(prev => ({
      ...prev,
      [programId]: {
        ...prev[programId],
        custom_fields: updatedCustomFields,
      },
    }));

    // Auto-save custom field changes with debouncing
    const timeoutKey = `custom-${programId}-${fieldKey}`;
    
    // Clear existing timeout
    if (saveTimeouts[timeoutKey]) {
      clearTimeout(saveTimeouts[timeoutKey]);
    }
    
    // Set new timeout for auto-save
    const newTimeout = setTimeout(async () => {
      try {
        await updateCustomFieldsMutation.mutateAsync({
          programId,
          customFields: updatedCustomFields,
        });
      } catch (error) {
        console.error("Error updating custom field:", error);
        toast({
          title: "Erro",
          description: "Falha ao salvar campo personalizado",
          variant: "destructive",
          className: "toast-destructive",
        });
      }
    }, 1000); // 1 second delay
    
    setSaveTimeouts(prev => ({ ...prev, [timeoutKey]: newTimeout }));
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={true}>
      <DialogContent 
        className="glass-card max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col [&>button]:hidden" 
        aria-describedby="edit-member-description"
        onPointerDownOutside={() => onClose()}
        onEscapeKeyDown={() => onClose()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {getInitials(member.name)}
                </span>
              </div>
              <div>
                <div className="text-lg font-semibold">{member.name}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(updateProgramMutation.isPending || updateCustomFieldsMutation.isPending || updateMemberMutation.isPending) && (
                <div className="flex items-center gap-2 text-sm text-powder">
                  <div className="w-2 h-2 bg-sky rounded-full animate-pulse"></div>
                  Salvando...
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-powder hover:text-white hover:bg-sky/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div id="edit-member-description" className="sr-only">
          Modal para editar dados do membro da família e seus programas de fidelidade
        </div>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
              <TabsTrigger value="programs">Programas</TabsTrigger>
              <TabsTrigger value="custom">Campos Personalizados</TabsTrigger>
            </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Informações do Membro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="member-name">Nome</Label>
                    <Input
                      id="member-name"
                      value={basicData.name}
                      onChange={(e) => updateBasicField("name", e.target.value)}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="member-role">Função</Label>
                    <Select
                      value={basicData.role}
                      onValueChange={(value) => updateBasicField("role", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pai">Pai</SelectItem>
                        <SelectItem value="Mãe">Mãe</SelectItem>
                        <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                        <SelectItem value="Avô/Avó">Avô/Avó</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="member-email">Email</Label>
                  <Input
                    id="member-email"
                    type="email"
                    value={basicData.email}
                    onChange={(e) => updateBasicField("email", e.target.value)}
                    placeholder="email@exemplo.com"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4">
            {member.programs.map((program) => {
              const data = programData[program.program.id] || {};
              
              return (
                <Card key={program.program.id} className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded"
                          style={{ backgroundColor: program.program.logoColor }}
                        />
                        <div>
                          <div className="text-lg font-semibold">{program.program.name}</div>
                          <div className="text-sm text-powder">{program.program.company}</div>
                        </div>
                      </div>
                      <Badge className="points-badge">
                        {program.pointsBalance?.toLocaleString('pt-BR') || '0'} pontos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`login-${program.program.id}`}>Login/Email</Label>
                        <Input
                          id={`login-${program.program.id}`}
                          value={data.login || ""}
                          onChange={(e) => updateField(program.program.id, "login", e.target.value)}
                          placeholder="usuario@email.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`password-${program.program.id}`}>Senha</Label>
                        <div className="relative">
                          <Input
                            id={`password-${program.program.id}`}
                            type={showPasswords[program.program.id] ? "text" : "password"}
                            value={data.password || ""}
                            onChange={(e) => updateField(program.program.id, "password", e.target.value)}
                            placeholder="••••••••"
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility(program.program.id)}
                          >
                            {showPasswords[program.program.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`cpf-${program.program.id}`}>CPF</Label>
                        <Input
                          id={`cpf-${program.program.id}`}
                          value={data.cpf || ""}
                          onChange={(e) => updateField(program.program.id, "cpf", e.target.value)}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`card-${program.program.id}`}>Número do Cartão</Label>
                        <Input
                          id={`card-${program.program.id}`}
                          value={data.card_number || ""}
                          onChange={(e) => updateField(program.program.id, "card_number", e.target.value)}
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`balance-${program.program.id}`}>Saldo Atual</Label>
                        <Input
                          id={`balance-${program.program.id}`}
                          type="number"
                          value={data.current_balance || 0}
                          onChange={(e) => updateField(program.program.id, "current_balance", parseInt(e.target.value) || 0)}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`tier-${program.program.id}`}>Status</Label>
                        <Select
                          value={data.elite_tier || ""}
                          onValueChange={(value) => updateField(program.program.id, "elite_tier", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic">Básico</SelectItem>
                            <SelectItem value="silver">Prata</SelectItem>
                            <SelectItem value="gold">Ouro</SelectItem>
                            <SelectItem value="platinum">Platina</SelectItem>
                            <SelectItem value="diamond">Diamante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`notes-${program.program.id}`}>Observações</Label>
                      <Textarea
                        id={`notes-${program.program.id}`}
                        value={data.notes || ""}
                        onChange={(e) => updateField(program.program.id, "notes", e.target.value)}
                        placeholder="Observações sobre este programa..."
                        rows={3}
                      />
                    </div>


                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            {member.programs.map((program) => {
              const data = programData[program.program.id] || {};
              const customFields = data.custom_fields || {};
              
              return (
                <Card key={program.program.id} className="glass-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ backgroundColor: program.program.logoColor }}
                      />
                      <div>
                        <div className="text-lg font-semibold">{program.program.name}</div>
                        <div className="text-sm text-powder">Campos Personalizados</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(customFields).length > 0 ? (
                      <div className="space-y-3">
                        <div className="text-sm font-medium text-powder mb-2">Campos Existentes:</div>
                        {Object.entries(customFields).map(([key, value]) => (
                          <div key={key} className="grid grid-cols-4 gap-3 items-end p-3 bg-navy/10 rounded-lg">
                            <div>
                              <Label className="text-sm font-medium">{key}</Label>
                              <div className="text-xs text-powder mt-1">Nome do campo</div>
                            </div>
                            <div className="col-span-2">
                              <Label className="text-sm font-medium">Valor</Label>
                              <Input
                                value={value}
                                onChange={(e) => updateCustomFieldValue(program.program.id, key, e.target.value)}
                                placeholder="Valor do campo"
                                className="text-sm mt-1"
                              />
                            </div>
                            <div className="flex justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomField(program.program.id, key)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/20 h-8 px-2"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-powder text-sm py-4">
                        Nenhum campo personalizado adicionado ainda.
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="text-sm font-medium text-powder mb-2">Adicionar Novo Campo:</div>
                      <div className="text-xs text-powder/70 mb-3">Preencha ambos os campos e clique em "Salvar" ou pressione Enter</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`new-field-name-${program.program.id}`} className="text-sm font-medium">
                            Nome do Campo
                          </Label>
                          <Input
                            id={`new-field-name-${program.program.id}`}
                            placeholder="Ex: Preferência de assento"
                            value={getNewCustomField(program.program.id).key}
                            onChange={(e) => updateNewCustomField(program.program.id, 'key', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && getNewCustomField(program.program.id).key.trim() && getNewCustomField(program.program.id).value.trim()) {
                                addCustomField(program.program.id);
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor={`new-field-value-${program.program.id}`} className="text-sm font-medium">
                            Valor
                          </Label>
                          <Input
                            id={`new-field-value-${program.program.id}`}
                            placeholder="Ex: Janela"
                            value={getNewCustomField(program.program.id).value}
                            onChange={(e) => updateNewCustomField(program.program.id, 'value', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && getNewCustomField(program.program.id).key.trim() && getNewCustomField(program.program.id).value.trim()) {
                                addCustomField(program.program.id);
                              }
                            }}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={() => addCustomField(program.program.id)}
                        disabled={!getNewCustomField(program.program.id).key.trim() || !getNewCustomField(program.program.id).value.trim() || updateCustomFieldsMutation.isPending}
                        className="bg-royal hover:bg-sky transition-colors mt-3 w-full"
                      >
                        {updateCustomFieldsMutation.isPending ? (
                          <>
                            <div className="w-4 h-4 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-2" />
                            Salvar Campo Personalizado
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
          </Tabs>
        </div>


      </DialogContent>
    </Dialog>
  );
}