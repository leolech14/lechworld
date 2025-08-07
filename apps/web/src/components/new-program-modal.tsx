import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface NewProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProgramModal({ isOpen, onClose }: NewProgramModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    website: "",
    logoColor: "#0078D2",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.company) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e empresa são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create program");
      }

      toast({
        title: "Programa criado!",
        description: `${formData.name} foi adicionado com sucesso.`,
      });

      queryClient.invalidateQueries();
      onClose();
      setFormData({ name: "", company: "", website: "", logoColor: "#0078D2" });
    } catch (error) {
      toast({
        title: "Erro ao criar programa",
        description: "Não foi possível criar o programa. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Adicionar Novo Programa
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome do Programa *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: LATAM Pass"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Ex: LATAM Airlines"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.exemplo.com"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="color">Cor do Logo</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.logoColor}
                  onChange={(e) => setFormData({ ...formData, logoColor: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={formData.logoColor}
                  onChange={(e) => setFormData({ ...formData, logoColor: e.target.value })}
                  placeholder="#0078D2"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar Programa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}