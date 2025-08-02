import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, MessageCircle, Users, CreditCard, Globe, Smartphone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useQuery } from "@tanstack/react-query";
import type { MemberWithPrograms } from "@/types/schema";

interface WhatsAppShareProps {
  trigger?: React.ReactNode;
  isMobile?: boolean;
}

export function WhatsAppShare({ trigger, isMobile = false }: WhatsAppShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'all' | 'member' | 'program' | null>(null);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const { data: members = [] } = useQuery<MemberWithPrograms[]>({
    queryKey: ['/api/dashboard/members-with-programs/1'],
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['/api/programs'],
  });

  const formatMemberData = (member: MemberWithPrograms) => {
    let text = `*${member.name}*\n`;
    text += `Status: ${member.isActive ? 'Ativo' : 'Inativo'}\n\n`;
    
    if (member.programs && member.programs.length > 0) {
      text += `*Programas de Fidelidade:*\n`;
      member.programs.forEach(mp => {
        text += `\n${mp.program.name}\n`;
        text += `Conta: ${mp.accountNumber || 'N/A'}\n`;
        text += `Saldo: ${(mp.pointsBalance ?? 0).toLocaleString()} pontos\n`;
        text += `Valor: ${mp.estimatedValue || 'N/A'}\n`;
        text += `Status: ${mp.statusLevel}\n`;
        if (mp.expirationDate) {
          text += `Expira: ${new Date(mp.expirationDate).toLocaleDateString('pt-BR')}\n`;
        }
      });
    }
    
    return text;
  };

  const formatAllData = () => {
    let text = `*MilhasLech - Relatório Familiar*\n`;
    text += `${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `═════════════════════════════\n\n`;
    
    const totalPoints = members.reduce((sum, member) => 
      sum + (member.programs?.reduce((memberSum, mp) => memberSum + mp.pointsBalance, 0) || 0), 0
    );
    
    text += `*RESUMO GERAL*\n`;
    text += `Total de membros: ${members.length}\n`;
    text += `Total de pontos: ${totalPoints.toLocaleString()}\n`;
    text += `Programas ativos: ${members.reduce((sum, m) => sum + (m.programs?.length || 0), 0)}\n\n`;
    
    members.forEach((member, index) => {
      text += `${index + 1}. ${formatMemberData(member)}\n`;
      if (index < members.length - 1) {
        text += `─────────────────────────────\n`;
      }
    });
    
    text += `\nGerado por lech.world`;
    return text;
  };

  const formatProgramData = (programName: string) => {
    const programMembers = members.filter(member => 
      member.programs?.some(mp => mp.program.name === programName)
    );
    
    let text = `*${programName} - Relatório*\n`;
    text += `${new Date().toLocaleDateString('pt-BR')}\n`;
    text += `═════════════════════════════\n\n`;
    
    programMembers.forEach((member, index) => {
      const memberProgram = member.programs?.find(mp => mp.program.name === programName);
      if (memberProgram) {
        text += `${index + 1}. *${member.name}*\n`;
        text += `Conta: ${memberProgram.accountNumber || 'N/A'}\n`;
        text += `Saldo: ${(memberProgram.pointsBalance ?? 0).toLocaleString()} pontos\n`;
        text += `Valor: ${memberProgram.estimatedValue || 'N/A'}\n`;
        text += `Status: ${memberProgram.statusLevel}\n`;
        if (memberProgram.expirationDate) {
          text += `Expira: ${new Date(memberProgram.expirationDate).toLocaleDateString('pt-BR')}\n`;
        }
        text += `\n`;
      }
    });
    
    text += `Gerado por lech.world`;
    return text;
  };

  const handleShare = () => {
    let shareText = '';
    
    if (selectedOption === 'all') {
      shareText = formatAllData();
    } else if (selectedOption === 'member' && selectedMember) {
      const member = members.find(m => m.id === selectedMember);
      if (member) {
        shareText = formatMemberData(member);
      }
    } else if (selectedOption === 'program' && selectedProgram) {
      shareText = formatProgramData(selectedProgram);
    }
    
    if (shareText) {
      const encodedText = encodeURIComponent(shareText);
      const whatsappUrl = `https://wa.me/?text=${encodedText}`;
      window.open(whatsappUrl, '_blank');
      setIsOpen(false);
      setSelectedOption(null);
      setSelectedMember(null);
      setSelectedProgram(null);
    }
  };

  const DefaultTrigger = React.forwardRef<HTMLButtonElement>((props, ref) => (
    <Button 
      ref={ref}
      size="sm" 
      className="bg-green-500 hover:bg-green-600 text-white transition-all hover:scale-105"
      {...props}
    >
      <FaWhatsapp className="w-4 h-4 mr-2" />
      {isMobile ? 'WhatsApp' : 'Compartilhar'}
    </Button>
  ));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || <DefaultTrigger />}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] glass-panel border-glass-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-glass-text">
            <FaWhatsapp className="w-5 h-5 text-green-500" />
            Compartilhar no WhatsApp
          </DialogTitle>
          <DialogDescription>
            Escolha o tipo de relatório para compartilhar via WhatsApp
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!selectedOption ? (
            <div className="space-y-3">
              <p className="text-sm text-glass-text/70">
                Escolha o que deseja compartilhar:
              </p>
              
              <div className="grid gap-3">
                <Card 
                  className="glass-card hover:glass-card-hover cursor-pointer transition-all"
                  onClick={() => setSelectedOption('all')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-sky-400" />
                      Relatório Completo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-glass-text/70">
                      Todos os membros da família e seus programas
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="glass-card hover:glass-card-hover cursor-pointer transition-all"
                  onClick={() => setSelectedOption('member')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-blue-400" />
                      Por Membro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-glass-text/70">
                      Dados específicos de um membro da família
                    </p>
                  </CardContent>
                </Card>
                
                <Card 
                  className="glass-card hover:glass-card-hover cursor-pointer transition-all"
                  onClick={() => setSelectedOption('program')}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <CreditCard className="w-4 h-4 text-purple-400" />
                      Por Programa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-glass-text/70">
                      Todos os membros de um programa específico
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : selectedOption === 'member' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  className="p-1 h-auto"
                >
                  ←
                </Button>
                <p className="text-sm text-glass-text/70">
                  Selecione um membro:
                </p>
              </div>
              
              <div className="grid gap-2">
                {members.map(member => (
                  <Card 
                    key={member.id}
                    className={`glass-card hover:glass-card-hover cursor-pointer transition-all ${
                      selectedMember === member.id ? 'ring-2 ring-sky-400' : ''
                    }`}
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-glass-text">{member.name}</p>
                          <p className="text-xs text-glass-text/70">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-glass-text/70">
                            {member.programs?.length || 0} programas
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : selectedOption === 'program' ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  className="p-1 h-auto"
                >
                  ←
                </Button>
                <p className="text-sm text-glass-text/70">
                  Selecione um programa:
                </p>
              </div>
              
              <div className="grid gap-2">
                {Array.from(new Set(members.flatMap(m => m.programs?.map(p => p.program.name) || []))).map(programName => (
                  <Card 
                    key={programName}
                    className={`glass-card hover:glass-card-hover cursor-pointer transition-all ${
                      selectedProgram === programName ? 'ring-2 ring-sky-400' : ''
                    }`}
                    onClick={() => setSelectedProgram(programName)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-glass-text">{programName}</p>
                        <p className="text-xs text-glass-text/70">
                          {members.filter(m => m.programs?.some(p => p.program.name === programName)).length} membros
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedOption(null)}
                  className="p-1 h-auto"
                >
                  ←
                </Button>
                <p className="text-sm text-glass-text/70">
                  Pronto para compartilhar relatório completo
                </p>
              </div>
            </div>
          )}
          
          {(selectedOption === 'all' || selectedMember || selectedProgram) && (
            <div className="flex gap-2 pt-4">
              <Button 
                variant="secondary" 
                onClick={() => {
                  setSelectedOption(null);
                  setSelectedMember(null);
                  setSelectedProgram(null);
                }}
                className="flex-1 bg-sky/20 hover:bg-sky/30"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleShare}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Enviar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mobile WhatsApp pull-up gesture component
export function MobileWhatsAppGesture() {
  const [isVisible, setIsVisible] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const screenHeight = window.innerHeight;
      const startPosition = touch.clientY;
      
      // Only activate if touch starts in bottom 20% of screen
      if (startPosition > screenHeight * 0.8) {
        setStartY(startPosition);
        setIsActive(true);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isActive) return;
      
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = startY - currentY;
      const screenHeight = window.innerHeight;
      const threshold = screenHeight * 0.4; // 40% of screen height
      
      if (deltaY > 0) {
        const progress = Math.min(deltaY / threshold, 1);
        setPullProgress(progress);
        setIsVisible(progress > 0.1);
        
        if (progress > 0.3) {
          // Haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }
      }
    };

    const handleTouchEnd = () => {
      if (isActive && pullProgress > 0.5) {
        // Trigger WhatsApp modal
        const event = new CustomEvent('openWhatsAppModal');
        window.dispatchEvent(event);
      }
      
      setIsActive(false);
      setPullProgress(0);
      setIsVisible(false);
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isActive, startY, pullProgress]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none"
      style={{
        opacity: Math.min(pullProgress * 2, 1),
        transform: `translateX(-50%) translateY(${(1 - pullProgress) * 100}px)`
      }}
    >
      <div className="bg-green-500 text-white p-4 rounded-t-2xl shadow-lg flex items-center gap-3">
        <MessageCircle className="w-6 h-6" />
        <div>
          <p className="text-sm font-medium">WhatsApp</p>
          <p className="text-xs opacity-75">
            {pullProgress < 0.5 ? 'Continue puxando...' : 'Solte para compartilhar'}
          </p>
        </div>
        <div className="ml-4">
          <div className="w-8 h-8 rounded-full border-2 border-white relative">
            <div 
              className="absolute inset-0 rounded-full bg-white"
              style={{
                transform: `scale(${pullProgress})`,
                transformOrigin: 'center'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}