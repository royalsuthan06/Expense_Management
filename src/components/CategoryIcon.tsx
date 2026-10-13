import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size = 20 }) => {
  // @ts-ignore
  const IconComponent = Icons[name] || Icons.HelpCircle;
  return <IconComponent size={size} className={className} />;
};

export const AVAILABLE_ICONS = [
  'Utensils', 'Car', 'Smartphone', 'GraduationCap', 'ShoppingBag',
  'Film', 'HeartPulse', 'Cpu', 'Home', 'Briefcase', 'Laptop',
  'Coins', 'Gift', 'RotateCcw', 'TrendingUp', 'Coffee', 'Plane',
  'BookOpen', 'Camera', 'Dumbbell', 'Gamepad2', 'Music', 'Shirt',
  'Wrench', 'Fuel', 'Receipt', 'Tv', 'MoreHorizontal'
];

export const CATEGORY_COLORS = [
  '#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899',
  '#06B6D4', '#EF4444', '#F59E0B', '#14B8A6', '#6366F1',
  '#A855F7', '#64748B', '#0EA5E9', '#84CC16'
];
