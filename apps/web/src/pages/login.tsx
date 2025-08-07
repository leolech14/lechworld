import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/auth-store";
import { 
  login as loginUser, 
  setPassword,
  loginSchema, 
  setPasswordSchema,
  type SetPasswordInput 
} from "@/services/auth";
const logoPath = "/lech-world-logo.png";

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { setUser } = useAuthStore();
  const [showPasswordCreation, setShowPasswordCreation] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  
  // Login form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Password creation form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    watch,
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  const newPassword = watch("newPassword");

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      if (data.requiresPasswordCreation) {
        setTempUser(data.user);
        setShowPasswordCreation(true);
        toast({
          title: "Welcome!",
          description: "Please create a password for your first login.",
        });
      } else {
        setUser(data.user);
        toast({
          title: "Login successful!",
          description: `Welcome back, ${data.user.name}!`,
        });
        setLocation("/dashboard");
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Set password mutation
  const setPasswordMutation = useMutation({
    mutationFn: setPassword,
    onSuccess: (data) => {
      setUser(data.user);
      toast({
        title: "Password created!",
        description: "Your account is now secure.",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to set password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    // For first-time users, send any password to trigger the password creation flow
    if (!data.password) {
      data.password = "first-login";
    }
    loginMutation.mutate(data);
  };

  const onPasswordSubmit = (data: SetPasswordInput) => {
    setPasswordMutation.mutate({
      ...data,
      userId: tempUser?.id,
    });
  };

  if (showPasswordCreation && tempUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-float glass-card">
          <CardHeader>
            <CardTitle className="text-center">Create Your Password</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center mb-6">
              <p className="text-sm text-muted-foreground">
                Welcome, {tempUser.name}! Please create a secure password for your account.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password:</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="At least 6 characters"
                  className="glass-card"
                  {...registerPassword("newPassword")}
                />
                {passwordErrors.newPassword && (
                  <p className="text-sm text-red-400">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password:</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repeat your password"
                  className="glass-card"
                  {...registerPassword("confirmPassword")}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-sm text-red-400">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={setPasswordMutation.isPending}
              >
                {setPasswordMutation.isPending ? (
                  <div className="loading-dots"></div>
                ) : (
                  "Create Password"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md animate-float glass-card">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <img 
              src={logoPath} 
              alt="lech.world logo" 
              className="h-24 object-contain mx-auto"
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-semibold">Username:</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                className="glass-card"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-sm text-red-400">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-semibold">Password:</Label>
              <Input
                id="password"
                type="password"
                placeholder={tempUser ? "Leave blank for first login" : "Enter your password"}
                className="glass-card"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>Family members: Leonardo, Graciela, Osvandré, Marilise</p>
              <p className="mt-1">Staff: Denise</p>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <div className="loading-dots"></div>
              ) : (
                "Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}