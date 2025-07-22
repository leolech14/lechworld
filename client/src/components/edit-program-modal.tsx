import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Palette } from "lucide-react";
import type { LoyaltyProgram } from "@shared/schema";

interface EditProgramModalProps {
  program: LoyaltyProgram;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: "LATAM", color: "#E53935" },
  { name: "GOL", color: "#FF6B00" },
  { name: "Azul", color: "#007CB0" },
  { name: "United", color: "#0033A0" },
  { name: "American", color: "#0D2240" },
  { name: "Delta", color: "#003366" },
  { name: "Copa", color: "#1B3A6B" },
  { name: "Avianca", color: "#D71921" },
  { name: "Air France", color: "#002157" },
  { name: "Lufthansa", color: "#00005E" },
];

export default function EditProgramModal({ program, onClose }: EditProgramModalProps) {
  const [formData, setFormData] = useState({
    name: program.name,
    company: program.company,
    programType: program.programType,
    logoColor: program.logoColor || "#3B82F6",
    category: program.category || "airline",
    website: program.website || "",
    phoneNumber: program.phoneNumber || "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/programs/${program.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          company: data.company,
          program_type: data.programType,
          logo_color: data.logoColor,
          category: data.category,
          website: data.website,
          phone_number: data.phoneNumber,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update program");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Programa atualizado",
        description: "As informações do programa foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries();
      onClose();
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o programa. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Programa de Fidelidade</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Programa</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: LATAM Pass"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Companhia</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ex: LATAM"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="programType">Tipo de Programa</Label>
              <Select
                value={formData.programType}
                onValueChange={(value) => setFormData({ ...formData, programType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="miles">Milhas</SelectItem>
                  <SelectItem value="points">Pontos</SelectItem>
                  <SelectItem value="cashback">Cashback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="airline">Companhia Aérea</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="retail">Varejo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logoColor">Cor do Logo</Label>
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2 items-center">
                <Input
                  id="logoColor"
                  type="color"
                  value={formData.logoColor}
                  onChange={(e) => setFormData({ ...formData, logoColor: e.target.value })}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={formData.logoColor}
                  onChange={(e) => setFormData({ ...formData, logoColor: e.target.value })}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <div
                className="w-10 h-10 rounded border-2 border-gray-300"
                style={{ backgroundColor: formData.logoColor }}
              />
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {PRESET_COLORS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => setFormData({ ...formData, logoColor: preset.color })}
                  className="flex items-center gap-2 px-3 py-1 rounded-lg border hover:bg-gray-100 transition-colors"
                  title={preset.name}
                >
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="text-xs">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website (opcional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://exemplo.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Telefone (opcional)</Label>
              <Input
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="0800 123 4567"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}