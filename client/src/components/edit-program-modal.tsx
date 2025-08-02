import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, X, Building2, Globe, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getProgramIcon } from "@/lib/program-icons";
import type { LoyaltyProgram } from "@shared/schema";

interface EditProgramModalProps {
  program: LoyaltyProgram;
  open: boolean;
  onClose: () => void;
  embedded?: boolean;
}

export default function EditProgramModal({ program, open, onClose, embedded = false }: EditProgramModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: program.name || "",
    company: program.company || "",
    website: program.website || "",
    phoneNumber: program.phoneNumber || "",
  });
  
  // Get default icon if no custom icon exists
  const defaultIcon = getProgramIcon(program);
  const [previewIcon, setPreviewIcon] = useState<string | null>(
    program.iconUrl || (defaultIcon.type === 'png' ? defaultIcon.value : null)
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "O arquivo deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewIcon(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        ...formData,
        iconUrl: previewIcon,
      };

      const response = await fetch(`/api/programs/${program.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update program");
      }

      toast({
        title: "Programa atualizado!",
        description: `As informações de ${formData.company} foram atualizadas.`,
      });

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ["/api/programs"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o programa.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveIcon = () => {
    setPreviewIcon(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const content = (
    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Icon Upload Section */}
          <div className="space-y-4">
            <Label>Ícone do Programa</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 relative overflow-hidden">
                {previewIcon ? (
                  <>
                    <img 
                      src={previewIcon} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                    {/* Show badge if it's default icon */}
                    {!program.iconUrl && defaultIcon.type === 'png' && previewIcon === defaultIcon.value && (
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500 text-white text-xs py-1 text-center">
                        Ícone Padrão
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveIcon}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="Remover ícone"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Upload className="w-8 h-8 text-gray-400" />
                )}
              </div>
              
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="icon-upload"
                />
                <Label 
                  htmlFor="icon-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Imagem
                </Label>
                <p className="mt-1 text-sm text-gray-500">
                  PNG, JPG ou GIF (máx. 5MB)
                </p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nome do Programa
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="company">
                <Building2 className="w-4 h-4 inline mr-2" />
                Companhia
              </Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="website">
                <Globe className="w-4 h-4 inline mr-2" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-2" />
                Telefone
              </Label>
              <Input
                id="phone"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>

          {!embedded && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          )}
          {embedded && (
            <div className="flex justify-end gap-2 mt-6">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          )}
        </form>
  );

  if (embedded) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Building2 className="w-5 h-5" />
            Editar Programa - {program.company}
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}