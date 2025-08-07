import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { apiRequest } from "@/lib/queryClient";
import { UserPlus } from "lucide-react";

interface NewMemberModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewMemberModal({ open, onClose }: NewMemberModalProps) {
  const [name, setName] = useState("");
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMemberMutation = useMutation({
    mutationFn: async (memberData: { name: string; userId: number; email: string; role: string }) => {
      return await apiRequest("POST", "/api/members", memberData);
    },
    onSuccess: (data) => {
      toast({
        title: "Membro criado com sucesso!",
        description: `${name} foi adicionado à família.`,
        className: "toast-success",
      });
      
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      
      // Reset form and close with slight delay to ensure smooth animation
      setTimeout(() => {
        setName("");
        onClose();
      }, 100);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar membro",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
        className: "toast-destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;

    // Generate email based on name (simple approach)
    const email = `${name.trim().toLowerCase().replace(/\s+/g, '.')}@lech.world`;

    createMemberMutation.mutate({
      name: name.trim(),
      userId: user.id,
      email: email,
      role: "primary",
    });
  };

  const handleClose = () => {
    if (!createMemberMutation.isPending) {
      setName("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-white/95 backdrop-blur-lg border border-blue-200/30 shadow-xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-800">
            <UserPlus className="w-5 h-5" />
            Adicionar Novo Membro
          </DialogTitle>
          <DialogDescription className="text-blue-600">
            Adicione um novo membro da família ao sistema. Todos os programas de fidelidade serão automaticamente criados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="memberName" className="text-blue-700 font-semibold">
              Nome do Membro
            </Label>
            <Input
              id="memberName"
              type="text"
              placeholder="Digite o nome do membro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-blue-50/30 border-blue-200/50 text-blue-800 placeholder:text-blue-600/60 focus:border-blue-400/70"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
              disabled={createMemberMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="blue-gradient hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={createMemberMutation.isPending || !name.trim()}
            >
              {createMemberMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Criando...
                </div>
              ) : (
                "Criar Membro"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}