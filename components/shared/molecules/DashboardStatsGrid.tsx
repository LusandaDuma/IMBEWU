/**
 * @fileoverview Two-column stat tiles for role dashboards (matches admin / achievements patterns).
 */

import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';

export type DashboardStatItem = {
  label: string;
  value: string;
  sublabel?: string;
  change?: string;
  icon: LucideIcon;
  iconColor: string;
};

export type DashboardStatsGridProps = {
  title?: string;
  items: DashboardStatItem[];
  isLoading?: boolean;
  /** e.g. primary green vs cyan for independent */
  accent?: 'green' | 'cyan';
};

export function DashboardStatsGrid({ title, items, isLoading, accent = 'green' }: DashboardStatsGridProps) {
  const changeColor = accent === 'cyan' ? 'text-cyan-900' : 'text-primary-800';
  return (
    <View className="mb-4">
      {title ? (
        <Text className="text-earth-600 text-xs font-medium uppercase tracking-[0.2em] mb-3">
          {title}
        </Text>
      ) : null}
      <View className="flex-row flex-wrap -mx-2">
        {items.map((stat) => {
          const Icon = stat.icon;
          return (
            <View key={stat.label} className="w-1/2 px-2 mb-4">
              <View className="pt-1 pb-4 border-b border-earth-400/30">
                <View className="flex-row items-start justify-between">
                  <View className="w-10 h-10 items-center justify-center">
                    <Icon size={22} color={stat.iconColor} />
                  </View>
                  <Text className={`${changeColor} text-xs font-bold`}>
                    {isLoading ? '…' : (stat.change ?? '—')}
                  </Text>
                </View>
                <Text className="text-2xl font-light text-black mt-2 tracking-tight" numberOfLines={1}>
                  {isLoading ? '—' : stat.value}
                </Text>
                <Text className="text-earth-700 text-xs font-light mt-1 tracking-wide" numberOfLines={2}>
                  {stat.label}
                </Text>
                {stat.sublabel && !isLoading ? (
                  <Text className="text-earth-500 text-[11px] font-light mt-0.5">{stat.sublabel}</Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
