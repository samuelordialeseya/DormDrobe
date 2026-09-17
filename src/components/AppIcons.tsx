import React from 'react';
import {
  Home,
  Building2,
  GraduationCap,
  Briefcase,
  Luggage,
  Shirt,
  Footprints,
  Watch,
  Shield,
  Layers,
  Sparkles,
  Waves,
  Plus,
  Lock,
  Unlock,
  Shuffle,
  Camera,
  Search,
  Check,
  RotateCcw,
  BarChart3,
  Cloud,
  ChevronRight,
  ArrowRight,
  Sliders,
  Settings,
  Flame,
  X,
  Smartphone,
  Monitor,
} from 'lucide-react-native';
import { Category, Location } from '../types/wardrobe';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/**
 * Clean vector icon for wardrobe categories.
 */
export function CategoryIcon({
  category,
  size = 20,
  color = '#FFFFFF',
  strokeWidth = 2,
}: { category: Category } & IconProps) {
  switch (category) {
    case 'tops':
      return <Shirt size={size} color={color} strokeWidth={strokeWidth} />;
    case 'bottoms':
      return <Layers size={size} color={color} strokeWidth={strokeWidth} />;
    case 'footwear':
      return <Footprints size={size} color={color} strokeWidth={strokeWidth} />;
    case 'outerwear':
      return <Flame size={size} color={color} strokeWidth={strokeWidth} />;
    case 'accessories':
      return <Watch size={size} color={color} strokeWidth={strokeWidth} />;
    case 'underwear':
      return <Shield size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return <Shirt size={size} color={color} strokeWidth={strokeWidth} />;
  }
}

/**
 * Clean vector icon for physical wardrobe locations.
 */
export function LocationIcon({
  location,
  size = 18,
  color = '#FFFFFF',
  strokeWidth = 2,
}: { location: Location | null } & IconProps) {
  switch (location) {
    case 'batangas_dorm':
      return <GraduationCap size={size} color={color} strokeWidth={strokeWidth} />;
    case 'calamba_home':
      return <Home size={size} color={color} strokeWidth={strokeWidth} />;
    case 'in_transit_bag':
      return <Luggage size={size} color={color} strokeWidth={strokeWidth} />;
    default:
      return <Layers size={size} color={color} strokeWidth={strokeWidth} />;
  }
}

export {
  Home,
  Building2,
  GraduationCap,
  Briefcase,
  Luggage,
  Shirt,
  Footprints,
  Watch,
  Shield,
  Layers,
  Sparkles,
  Waves,
  Plus,
  Lock,
  Unlock,
  Shuffle,
  Camera,
  Search,
  Check,
  RotateCcw,
  BarChart3,
  Cloud,
  ChevronRight,
  ArrowRight,
  Sliders,
  Settings,
  X,
  Smartphone,
  Monitor,
};
