import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/store/auth-store";
const logoPath = "/logo.png";

const loginSchema = z.object({
  email: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "lech",
      password: "world",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo de volta, ${data.user.name}!`,
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-float glass-panel">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <img 
              src={logoPath} 
              alt="lech.world logo" 
              className="w-48 h-48 object-contain animate-glow mx-auto"
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-800 font-semibold">Login:</Label>
              <Input
                id="email"
                type="text"
                className="bg-blue-50/30 border-blue-200/50 text-blue-800 placeholder:text-blue-600/60 focus:border-blue-400/70"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-800 font-semibold">Senha:</Label>
              <Input
                id="password"
                type="password"
                className="bg-blue-50/30 border-blue-200/50 text-blue-800 placeholder:text-blue-600/60 focus:border-blue-400/70"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-500">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full blue-gradient hover:scale-105 transition-transform ripple-effect"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="loading-dots"></div>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
