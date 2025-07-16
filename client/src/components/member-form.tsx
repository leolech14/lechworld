import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertFamilyMemberSchema, type InsertFamilyMember } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";

interface MemberFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function MemberForm({ onSuccess, onCancel }: MemberFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InsertFamilyMember>({
    resolver: zodResolver(insertFamilyMemberSchema),
    defaultValues: {
      userId: user?.id,
      isActive: true,
      role: "extended",
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: InsertFamilyMember) => {
      const res = await apiRequest("POST", "/api/members", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Membro adicionado com sucesso!",
        description: "O novo membro da família foi criado.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar membro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertFamilyMember) => {
    createMemberMutation.mutate(data);
  };

  const roleValue = watch("role");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          className="bg-navy/50 border-glass-border search-glow"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="bg-navy/50 border-glass-border search-glow"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Função</Label>
        <Select value={roleValue} onValueChange={(value) => setValue("role", value)}>
          <SelectTrigger className="bg-navy/50 border-glass-border search-glow">
            <SelectValue placeholder="Selecione uma função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="primary">Família Principal</SelectItem>
            <SelectItem value="extended">Família Estendida</SelectItem>
            <SelectItem value="view_only">Apenas Visualização</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-400">{errors.role.message}</p>
        )}
      </div>

      <div className="flex space-x-4">
        <Button
          type="button"
          variant="secondary"
          className="flex-1 bg-sky/20 hover:bg-sky/30"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className="flex-1 blue-gradient hover:scale-105 transition-transform"
          disabled={createMemberMutation.isPending}
        >
          {createMemberMutation.isPending ? (
            <div className="loading-dots"></div>
          ) : (
            "Adicionar"
          )}
        </Button>
      </div>
    </form>
  );
}
