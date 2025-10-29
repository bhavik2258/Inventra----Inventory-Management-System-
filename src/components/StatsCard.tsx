import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card className="transition-all hover:shadow-md border-orange-100">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend && (
              <p className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                {trend}
              </p>
            )}
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <Icon className="h-6 w-6 text-orange-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
