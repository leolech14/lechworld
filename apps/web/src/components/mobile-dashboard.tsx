import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Home, User, CreditCard, Settings, Plus, TrendingUp, Sparkles, Monitor, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MemberWithPrograms, DashboardStats } from "@/types/schema";
import { WhatsAppShare } from "./whatsapp-share";
import NewMemberModal from "./new-member-modal";
import { getMemberColor, getMemberEmoji } from "@/lib/member-colors";

const mobileVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 20 }
  },
  tap: { scale: 0.95 }
};

const navTabs = [
  { id: "home", label: "Início", icon: Home },
  { id: "members", label: "Família", icon: User },
  { id: "programs", label: "Programas", icon: CreditCard },
  { id: "settings", label: "Config", icon: Settings },
];


interface MobileDashboardProps {
  onReturnToWebView?: () => void;
}

export default function MobileDashboard({ onReturnToWebView }: MobileDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState("home");
  const [isLoading, setIsLoading] = useState(true);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);

  const { data: members = [] } = useQuery<MemberWithPrograms[]>({
    queryKey: ["/api/dashboard/members-with-programs/1"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats/1"],
  });

  useEffect(() => {
    // Simulate loading animation
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <motion.div
          className="mobile-pulse w-16 h-16 rounded-full"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 pb-20">
      {/* Mobile Header */}
      <motion.div 
        className="mobile-header mobile-slide-down"
        initial="hidden"
        animate="visible"
        variants={mobileVariants}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">MilhasLech</h1>
            <p className="text-sm text-blue-600">Família Conectada</p>
          </div>
          <div className="flex items-center space-x-2">
            {onReturnToWebView && (
              <motion.button
                className="mobile-tap-feedback p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                whileTap={{ scale: 0.9 }}
                onClick={onReturnToWebView}
              >
                <Monitor className="w-5 h-5 text-gray-600" />
              </motion.button>
            )}
            <motion.div
              className="mobile-tap-feedback p-2 rounded-full bg-blue-100"
              whileTap={{ scale: 0.9 }}
            >
              <Sparkles className="w-6 h-6 text-blue-600" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="mobile-container">
        <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
              className="space-y-6"
            >
              {/* Stats Cards */}
              <div className="mobile-grid-2">
                <motion.div variants={cardVariants} whileTap="tap">
                  <Card className="mobile-card mobile-bounce-in">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{stats?.totalMembers || 0}</p>
                          <p className="text-sm text-gray-600">Membros</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div variants={cardVariants} whileTap="tap">
                  <Card className="mobile-card mobile-bounce-in">
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-800">{stats?.activePrograms || 0}</p>
                          <p className="text-sm text-gray-600">Programas</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Quick Actions */}
              <motion.div 
                className="mobile-card p-4"
                variants={cardVariants}
                whileTap="tap"
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Ações Rápidas</h3>
                <div className="space-y-3">
                  <motion.button
                    className="mobile-button w-full flex items-center justify-center space-x-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowNewMemberModal(true)}
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Adicionar Membro</span>
                  </motion.button>
                  
                  <motion.button
                    className="mobile-button w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-green-600"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowWhatsAppModal(true)}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Envie pelo WhatsApp</span>
                  </motion.button>
                </div>
              </motion.div>

              {/* Family Members */}
              <motion.div variants={cardVariants}>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Família</h3>
                <div className="space-y-3">
                  {members.slice(0, 3).map((member, index) => (
                    <motion.div
                      key={member.id}
                      className="mobile-card p-4 mobile-tap-feedback"
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: index * 0.1 }}
                      whileTap="tap"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getMemberEmoji(member)}</span>
                            <div 
                              className="px-3 py-1 rounded-lg inline-block"
                              style={{ 
                                backgroundColor: getMemberColor(member).bg,
                                border: `2px solid ${getMemberColor(member).border}`
                              }}
                            >
                              <p className="font-medium text-gray-800">{member.name}</p>
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700">
                          {(member.programs || []).length} programas
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === "members" && (
            <motion.div
              key="members"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-800">Membros da Família</h2>
              <div className="space-y-3">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    className="mobile-card p-4 mobile-tap-feedback"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileTap="tap"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {member.profileEmoji && (
                              <span className="text-xl">{member.profileEmoji}</span>
                            )}
                            <div 
                              className="px-3 py-1 rounded-lg inline-block"
                              style={{ 
                                backgroundColor: getMemberColor(member).bg,
                                border: `2px solid ${getMemberColor(member).border}`
                              }}
                            >
                              <p className="font-semibold text-gray-800">{member.name}</p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{member.email}</p>
                          <p className="text-xs text-blue-600">{member.role}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {(member.programs || []).map((program) => (
                        <div
                          key={program.id}
                          className="p-2 bg-gray-50 rounded-lg text-center"
                        >
                          <div 
                            className="w-4 h-4 rounded mx-auto mb-1"
                            style={{ backgroundColor: 
                              program.program_name.includes('American') ? '#E53935' :
                              program.program_name.includes('Delta') ? '#003366' :
                              program.program_name.includes('United') ? '#005DAA' :
                              program.program_name.includes('LATAM') ? '#E50051' :
                              program.program_name.includes('Marriott') ? '#D01E3A' :
                              '#666' 
                            }}
                          />
                          <p className="text-xs font-medium text-gray-700">
                            {program.program_name.replace(' Pass', '').replace('Gol ', '')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {program.current_points?.toLocaleString() || '0'} pts
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "members" && (
            <motion.div
              key="members"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-800">Família</h2>
              <div className="space-y-4">
                {members.map((member, index) => (
                  <motion.div
                    key={member.id}
                    className="mobile-card p-4"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileTap="tap"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            {member.profileEmoji && (
                              <span className="text-xl">{member.profileEmoji}</span>
                            )}
                            <div 
                              className="px-3 py-1 rounded-lg inline-block"
                              style={{ 
                                backgroundColor: getMemberColor(member).bg,
                                border: `2px solid ${getMemberColor(member).border}`
                              }}
                            >
                              <h3 className="text-lg font-semibold text-gray-800">{member.name}</h3>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">
                        {member.programs.length} programas
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {(member.programs || []).slice(0, 4).map((program) => (
                        <div 
                          key={program.id}
                          className="p-3 bg-gray-50 rounded-lg"
                        >
                          <p className="text-xs font-medium text-gray-700">
                            {program.program_name.replace(' Pass', '').replace('Gol ', '')}
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {program.current_points?.toLocaleString() || '0'}
                          </p>
                          <p className="text-xs text-gray-500">pontos</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "programs" && (
            <motion.div
              key="programs"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-800">Programas de Fidelidade</h2>
              <div className="space-y-4">
                {["LATAM Pass", "Gol Smiles", "TudoAzul"].map((program, index) => (
                  <motion.div
                    key={program}
                    className="mobile-card p-4"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileTap="tap"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{program}</h3>
                      <div 
                        className="w-8 h-8 rounded"
                        style={{ 
                          backgroundColor: index === 0 ? '#E53935' : index === 1 ? '#FF6B00' : '#007CB0' 
                        }}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Total de Pontos</p>
                        <p className="text-xl font-bold text-gray-800">
                          {members.reduce((acc, member) => {
                            const programData = (member.programs || []).find(p => p.program_name === program);
                            return acc + (programData?.current_points || 0);
                          }, 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Membros Ativos</p>
                        <p className="text-xl font-bold text-gray-800">
                          {members.filter(member => 
                            (member.programs || []).some(p => p.program_name === program)
                          ).length}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={mobileVariants}
              className="space-y-4"
            >
              <h2 className="text-xl font-bold text-gray-800">Configurações</h2>
              <div className="space-y-3">
                {[
                  { title: "Notificações", desc: "Gerenciar alertas e lembretes" },
                  { title: "Privacidade", desc: "Controlar acesso aos dados" },
                  { title: "Sobre", desc: "Informações do aplicativo" }
                ].map((item, index) => (
                  <motion.div
                    key={item.title}
                    className="mobile-card p-4 mobile-tap-feedback"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                    whileTap="tap"
                  >
                    <h3 className="font-medium text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation */}
      <motion.div 
        className="mobile-bottom-nav"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="flex justify-around">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                className={`mobile-nav-tab flex flex-col items-center ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 w-1 h-1 bg-white rounded-full"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
      
      {/* Modals */}
      {showWhatsAppModal && (
        <WhatsAppShare 
          trigger={<div style={{ display: 'none' }} />}
          isMobile={true}
        />
      )}
      <NewMemberModal 
        open={showNewMemberModal} 
        onClose={() => setShowNewMemberModal(false)} 
      />
    </div>
  );
}