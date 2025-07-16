import { Card, CardContent } from "@/components/ui/card";
import { Users, CreditCard, Star, TrendingUp } from "lucide-react";
import type { DashboardStats } from "@shared/schema";

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
      color: "text-blue-600",
    },
    {
      title: "Programas Ativos",
      value: stats?.activePrograms || 0,
      change: "+8%",
      icon: CreditCard,
      color: "text-blue-600",
    },
    {
      title: "Pontos Totais",
      value: stats?.totalPoints?.toLocaleString('pt-BR') || "0",
      change: "+24%",
      icon: Star,
      color: "text-blue-600",
    },
    {
      title: "Valor Estimado",
      value: stats?.estimatedValue || "R$ 0,00",
      change: "+18%",
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={index} className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-sky/20 rounded-lg flex items-center justify-center">
                  <Icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <span className="text-xs text-powder">{card.change}</span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{card.value}</h3>
              <p className="text-sm text-powder">{card.title}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
