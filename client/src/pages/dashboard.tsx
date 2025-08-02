/**
 * @purpose Main dashboard page component for managing loyalty programs
 * @connects-to components/navigation.tsx
 * @connects-to components/stats-cards.tsx
 * @connects-to components/members-table.tsx
 * @connects-to components/quick-actions.tsx
 * @connects-to components/new-member-modal.tsx
 * @connects-to components/mobile-dashboard.tsx
 * @connects-to components/whatsapp-share.tsx
 * @connects-to components/mobile-whatsapp-button.tsx
 * @connects-to components/settings-modal.tsx
 * @connects-to components/theme-toggle.tsx
 * @connects-to store/auth-store.ts
 * @api-endpoints GET /api/dashboard/stats/:userId, GET /api/dashboard/members-with-programs/:userId, GET /api/activity/:userId
 */
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import StatsCards from "@/components/stats-cards";
import MembersTable from "@/components/members-table";
import QuickActions from "@/components/quick-actions";
import NewMemberModal from "@/components/new-member-modal";
import MobileDashboard from "@/components/mobile-dashboard";
import { WhatsAppShare, MobileWhatsAppGesture } from "@/components/whatsapp-share";
import { MobileWhatsAppButton } from "@/components/mobile-whatsapp-button";
import { useAuthStore } from "@/store/auth-store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, Filter, MessageCircle, Smartphone, Monitor, ArrowUpDown, ArrowUp, ArrowDown, User, Building2, Trophy, Settings } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import SettingsModal from "@/components/settings-modal";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDashboardStats, getFamilyOverview } from "@/services/dashboard";
import { getMembers } from "@/services/members";

export default function Dashboard() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'points'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (newSortBy: 'name' | 'company' | 'points') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };



  // Listen for mobile gesture events
  useEffect(() => {
    const handleOpenWhatsAppModal = () => {
      setShowWhatsAppModal(true);
    };

    window.addEventListener('openWhatsAppModal', handleOpenWhatsAppModal);
    return () => {
      window.removeEventListener('openWhatsAppModal', handleOpenWhatsAppModal);
    };
  }, []);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    enabled: !!user?.id,
  });

  const { data: familyOverview, isLoading: membersLoading } = useQuery({
    queryKey: ['family-overview'],
    queryFn: getFamilyOverview,
    enabled: !!user?.id,
  });

  const { data: members } = useQuery({
    queryKey: ['members'],
    queryFn: getMembers,
    enabled: !!user?.id,
  });


  // If mobile view is enabled, render the mobile dashboard
  if (isMobileView) {
    return <MobileDashboard onReturnToWebView={() => setIsMobileView(false)} />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation onSettingsClick={() => setShowSettingsModal(true)} />
      
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xl text-blue-600 italic font-medium">"Quem ta ponto ta ponto, quem não ta ponto não ta ponto... Nenê junto!"</p>
              <p className="text-blue-500 text-sm mt-1">— João Lech, um viajante</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              {/* Mobile View Toggle */}
              <div className="flex items-center space-x-3 p-3 bg-white/50 rounded-lg border border-blue-200">
                <Monitor className="w-5 h-5 text-blue-600" />
                <Switch 
                  checked={isMobileView}
                  onCheckedChange={setIsMobileView}
                  className="data-[state=checked]:bg-blue-600"
                />
                <Smartphone className="w-5 h-5 text-blue-600" />
                <Label className="text-sm font-medium text-blue-700">
                  Mobile App
                </Label>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Sorting Options */}
        <Card className="glass-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-blue-800 mb-0">Ordenar por:</h3>
              <div className="flex gap-3">
                <Button 
                  variant={sortBy === 'name' ? 'default' : 'outline'}
                  className={`${sortBy === 'name' 
                    ? 'blue-gradient text-white' 
                    : 'bg-white/60 hover:bg-blue-50 text-blue-700 border-blue-200'
                  } transition-all duration-200 hover:scale-105`}
                  onClick={() => handleSort('name')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Nome
                  {sortBy === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
                
                <Button 
                  variant={sortBy === 'company' ? 'default' : 'outline'}
                  className={`${sortBy === 'company' 
                    ? 'blue-gradient text-white' 
                    : 'bg-white/60 hover:bg-blue-50 text-blue-700 border-blue-200'
                  } transition-all duration-200 hover:scale-105`}
                  onClick={() => handleSort('company')}
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Companhia
                  {sortBy === 'company' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
                
                <Button 
                  variant={sortBy === 'points' ? 'default' : 'outline'}
                  className={`${sortBy === 'points' 
                    ? 'blue-gradient text-white' 
                    : 'bg-white/60 hover:bg-blue-50 text-blue-700 border-blue-200'
                  } transition-all duration-200 hover:scale-105`}
                  onClick={() => handleSort('points')}
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Pontos
                  {sortBy === 'points' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-4 h-4 ml-2" /> : <ArrowDown className="w-4 h-4 ml-2" />
                  ) : (
                    <ArrowUpDown className="w-4 h-4 ml-2" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Members and Programs Table */}
        <MembersTable 
          data={familyOverview || []} 
          isLoading={membersLoading || !familyOverview}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />

        {/* Quick Actions */}
        <QuickActions activities={[]} isLoading={false} />
      </main>

      {/* Mobile WhatsApp Components */}
      <MobileWhatsAppGesture />
      <MobileWhatsAppButton />
      
      {/* WhatsApp Modal triggered by mobile gesture */}
      {showWhatsAppModal && (
        <WhatsAppShare
          trigger={<div style={{ display: 'none' }} />}
          isMobile={true}
        />
      )}
      
      {/* New Member Modal */}
      <NewMemberModal 
        open={showNewMemberModal} 
        onClose={() => setShowNewMemberModal(false)} 
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        userId={user?.id || 1}
      />
    </div>
  );
}
