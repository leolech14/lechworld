import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { User, Palette, Phone, Calendar, CreditCard, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import type { FamilyMember } from "@shared/schema";
import MemberFrame from "./member-frame";

interface EditMemberModalProps {
  member: FamilyMember;
  open: boolean;
  onClose: () => void;
}

const colorPresets = [
  { bg: '#FED7E2', border: '#F687B3', name: 'Rosa' },
  { bg: '#BEE3F8', border: '#63B3ED', name: 'Azul' },
  { bg: '#C6F6D5', border: '#68D391', name: 'Verde' },
  { bg: '#E9D8FD', border: '#B794F4', name: 'Roxo' },
  { bg: '#FEFCBF', border: '#F6E05E', name: 'Amarelo' },
  { bg: '#FED7AA', border: '#F6AD55', name: 'Laranja' },
  { bg: '#FBB6CE', border: '#F687B3', name: 'Rosa Claro' },
  { bg: '#A7F3D0', border: '#34D399', name: 'Verde Menta' },
];

const emojiOptions = [
  '👤', '👨', '👩', '👦', '👧', '🧑', '👴', '👵',
  '😀', '😎', '🤓', '😊', '🥰', '🤗', '🌟', '✨',
  '🎯', '🎨', '🎭', '🎪', '🎸', '🎮', '⚽', '🏀',
  '🦁', '🦊', '🐻', '🐼', '🐨', '🐯', '🦄', '🐉'
];

export default function EditMemberModal({ member, open, onClose }: EditMemberModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: member.name || "",
    email: member.email || "",
    cpf: member.cpf || "",
    phone: member.phone || "",
    birthdate: member.birthdate || "",
    frameColor: member.frameColor || member.frame_color || "#FED7E2",
    frameBorderColor: member.frameBorderColor || member.frame_border_color || "#F687B3",
    profileEmoji: member.profileEmoji || member.profile_emoji || "👤",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/members/${member.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update member");
      }

      toast({
        title: "Perfil atualizado!",
        description: `As informações de ${formData.name} foram atualizadas.`,
      });

      // Invalidate and refetch all queries that might contain member data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/members"], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/members-with-programs"], refetchType: 'all' })
      ]);
      
      onClose();
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o perfil.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleColorSelect = (color: { bg: string; border: string }) => {
    setFormData({
      ...formData,
      frameColor: color.bg,
      frameBorderColor: color.border,
    });
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    return value;
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <MemberFrame 
              member={{
                name: formData.name,
                frameColor: formData.frameColor,
                frameBorderColor: formData.frameBorderColor,
                profileEmoji: formData.profileEmoji
              }} 
              variant="compact"
            />
            <span className="text-gray-600">• Editar Perfil</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="profile">Informações Pessoais</TabsTrigger>
            <TabsTrigger value="appearance">Aparência</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="cpf">
                    <CreditCard className="w-4 h-4 inline mr-2" />
                    CPF
                  </Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Telefone
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="birthdate">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Data de Nascimento
                  </Label>
                  <Input
                    id="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Palette className="w-4 h-4" />
                    Cor do Destaque
                  </Label>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleColorSelect(color)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          formData.frameColor === color.bg
                            ? 'ring-2 ring-blue-500 ring-offset-2'
                            : 'hover:scale-105'
                        }`}
                        style={{
                          backgroundColor: color.bg,
                          borderColor: color.border,
                        }}
                      >
                        <span className="text-xs font-medium text-gray-700">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <span className="text-lg">😊</span>
                    Ícone do Perfil
                  </Label>
                  <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                    {emojiOptions.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData({ ...formData, profileEmoji: emoji })}
                        className={`p-2 text-2xl rounded-lg transition-all ${
                          formData.profileEmoji === emoji
                            ? 'bg-blue-100 ring-2 ring-blue-500'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Label>Prévia</Label>
                  <div className="mt-2 p-4 bg-gray-50 rounded-lg flex justify-center">
                    <MemberFrame 
                      member={{
                        name: formData.name,
                        frameColor: formData.frameColor,
                        frameBorderColor: formData.frameBorderColor,
                        profileEmoji: formData.profileEmoji
                      }} 
                      variant="settings"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}