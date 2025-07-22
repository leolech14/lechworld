import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, Star, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@shared/schema";
import PointsDisplay from "./points-display";

interface StatsCardsProps {
  stats?: DashboardStats;
  isLoading: boolean;
}

export default function StatsCards({ stats, isLoading }: StatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-card">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="w-12 h-12 bg-orange-200 rounded-lg mb-4"></div>
                <div className="h-8 bg-orange-200 rounded mb-2"></div>
                <div className="h-4 bg-blue-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Membros da Família",
      value: stats?.totalMembers || 0,
      change: "+12%",
      icon: Users,
      color: "text-[#5A9FDB]",
    },
    {
      title: "Programas Ativos",
      value: stats?.activePrograms || 0,
      change: "+8%",
      icon: CreditCard,
      color: "text-[#A875DB]",
    },
    {
      title: "Pontos Totais",
      value: stats?.totalPoints?.toLocaleString('pt-BR') || "0",
      change: "+24%",
      icon: Star,
      color: "text-[#E5B84B]",
    },
    {
      title: "Valor Estimado",
      value: stats?.estimatedValue || "R$ 0,00",
      change: "+18%",
      icon: TrendingUp,
      color: "text-[#E5A14B]",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isPointsCard = card.title === "Pontos Totais";
        const pointsValue = stats?.totalPoints || 0;
        
        return (
          <div key={index} className="stats-card-enhanced glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 rounded-lg bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-sm border border-white/30">
                <Icon className={`w-7 h-7 ${card.color}`} />
              </div>
              <span className="text-sm font-semibold text-[#5AC89F]">{card.change}</span>
            </div>
            <div>
              {isPointsCard ? (
                <div className="stats-number">
                  <PointsDisplay points={pointsValue} />
                </div>
              ) : (
                <h3 className="stats-number">{card.value}</h3>
              )}
              <p className="stats-label">{card.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
