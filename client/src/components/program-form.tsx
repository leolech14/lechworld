import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { insertMemberProgramSchema, type InsertMemberProgram } from "@/types/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";

interface ProgramFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProgramForm({ onSuccess, onCancel }: ProgramFormProps) {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members } = useQuery({
    queryKey: ["/api/members", user?.id],
    enabled: !!user?.id,
  });

  const { data: programs } = useQuery({
    queryKey: ["/api/programs"],
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InsertMemberProgram>({
    resolver: zodResolver(insertMemberProgramSchema),
    defaultValues: {
      isActive: true,
      pointsBalance: 0,
    },
  });

  const createMemberProgramMutation = useMutation({
    mutationFn: async (data: InsertMemberProgram) => {
      const res = await apiRequest("POST", "/api/member-programs", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Programa adicionado com sucesso!",
        description: "O programa foi vinculado ao membro.",
        className: "toast-success",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar programa",
        description: error.message,
        variant: "destructive",
        className: "toast-destructive",
      });
    },
  });

  const onSubmit = (data: InsertMemberProgram) => {
    console.log("Form submitted with data:", data);
    createMemberProgramMutation.mutate(data);
  };

  const memberIdValue = watch("memberId");
  const programIdValue = watch("programId");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="member">Membro</Label>
        <Select 
          value={memberIdValue?.toString()} 
          onValueChange={(value) => setValue("memberId", parseInt(value))}
        >
          <SelectTrigger className="bg-navy/50 border-glass-border search-glow">
            <SelectValue placeholder="Selecione um membro" />
          </SelectTrigger>
          <SelectContent>
            {(members as any)?.members?.map((member: any) => (
              <SelectItem key={member.id} value={member.id.toString()}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.memberId && (
          <p className="text-sm text-red-400">{errors.memberId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="program">Programa</Label>
        <Select 
          value={programIdValue?.toString()} 
          onValueChange={(value) => setValue("programId", parseInt(value))}
        >
          <SelectTrigger className="bg-navy/50 border-glass-border search-glow">
            <SelectValue placeholder="Selecione um programa" />
          </SelectTrigger>
          <SelectContent>
            {(programs as any)?.programs?.map((program: any) => (
              <SelectItem key={program.id} value={program.id.toString()}>
                {program.name} - {program.company}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.programId && (
          <p className="text-sm text-red-400">{errors.programId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="accountNumber">Número da Conta</Label>
        <Input
          id="accountNumber"
          className="bg-navy/50 border-glass-border search-glow"
          {...register("accountNumber")}
        />
        {errors.accountNumber && (
          <p className="text-sm text-red-400">{errors.accountNumber.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="pointsBalance">Saldo de Pontos</Label>
        <Input
          id="pointsBalance"
          type="number"
          className="bg-navy/50 border-glass-border search-glow"
          {...register("pointsBalance", { valueAsNumber: true })}
        />
        {errors.pointsBalance && (
          <p className="text-sm text-red-400">{errors.pointsBalance.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimatedValue">Valor Estimado (R$)</Label>
        <Input
          id="estimatedValue"
          placeholder="R$ 0,00"
          className="bg-navy/50 border-glass-border search-glow"
          {...register("estimatedValue")}
        />
        {errors.estimatedValue && (
          <p className="text-sm text-red-400">{errors.estimatedValue.message}</p>
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
          disabled={createMemberProgramMutation.isPending}
        >
          {createMemberProgramMutation.isPending ? (
            <div className="loading-dots"></div>
          ) : (
            "Adicionar"
          )}
        </Button>
      </div>
    </form>
  );
}
