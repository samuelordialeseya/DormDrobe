import React from 'react';
import {
  House,
  CoatHanger,
  TShirt,
  Pants,
  Sneaker,
  Tote,
  ShieldCheck,
  GraduationCap,
  SuitcaseRolling,
  Sparkle,
  GearSix,
  Plus as PhosphorPlus,
  LockKey,
  LockKeyOpen,
  Shuffle as PhosphorShuffle,
  Camera as PhosphorCamera,
  MagnifyingGlass,
  Check as PhosphorCheck,
  ArrowCounterClockwise,
  ChartBar,
  CloudCheck,
  CaretRight,
  ArrowRight as PhosphorArrowRight,
  SlidersHorizontal,
  X as PhosphorX,
  DeviceMobile,
  Desktop,
  Drop,
  IconWeight,
} from 'phosphor-react-native';
import { Category, Location } from '../types/wardrobe';

export interface AppIconProps {
  size?: number;
  color?: string;
  weight?: IconWeight;
  style?: any;
  strokeWidth?: number; // gracefully accepted for backwards-compatibility
}

const DEFAULT_WEIGHT: IconWeight = 'light';

/**
 * Editorial fashion boutique icons for wardrobe categories.
 */
export function CategoryIcon({
  category,
  size = 20,
  color = '#1C1C1E',
  weight = DEFAULT_WEIGHT,
  style,
}: { category: Category } & AppIconProps) {
  switch (category) {
    case 'tops':
      return <CoatHanger size={size} color={color} weight={weight} style={style} />;
    case 'bottoms':
      return <Pants size={size} color={color} weight={weight} style={style} />;
    case 'footwear':
      return <Sneaker size={size} color={color} weight={weight} style={style} />;
    case 'outerwear':
      return <TShirt size={size} color={color} weight={weight} style={style} />;
    case 'accessories':
      return <Tote size={size} color={color} weight={weight} style={style} />;
    case 'underwear':
      return <ShieldCheck size={size} color={color} weight={weight} style={style} />;
    default:
      return <CoatHanger size={size} color={color} weight={weight} style={style} />;
  }
}

/**
 * Physical wardrobe location icons.
 */
export function LocationIcon({
  location,
  size = 20,
  color = '#1C1C1E',
  weight = DEFAULT_WEIGHT,
  style,
}: { location: Location | null } & AppIconProps) {
  switch (location) {
    case 'batangas_dorm':
      return <GraduationCap size={size} color={color} weight={weight} style={style} />;
    case 'calamba_home':
      return <House size={size} color={color} weight={weight} style={style} />;
    case 'in_transit_bag':
      return <SuitcaseRolling size={size} color={color} weight={weight} style={style} />;
    default:
      return <CoatHanger size={size} color={color} weight={weight} style={style} />;
  }
}

// ─── Phosphor Light-Weight Icon Aliases ──────────────────────────────

export const Home = (props: AppIconProps) => (
  <House size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Shirt = (props: AppIconProps) => (
  <CoatHanger size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Luggage = (props: AppIconProps) => (
  <SuitcaseRolling size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Sparkles = (props: AppIconProps) => (
  <Sparkle size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Settings = (props: AppIconProps) => (
  <GearSix size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Waves = (props: AppIconProps) => (
  <Drop size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Plus = (props: AppIconProps) => (
  <PhosphorPlus size={props.size ?? 20} color={props.color ?? '#1C1C1E'} weight={props.weight ?? 'regular'} style={props.style} />
);

export const Lock = (props: AppIconProps) => (
  <LockKey size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Unlock = (props: AppIconProps) => (
  <LockKeyOpen size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Shuffle = (props: AppIconProps) => (
  <PhosphorShuffle size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Camera = (props: AppIconProps) => (
  <PhosphorCamera size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Search = (props: AppIconProps) => (
  <MagnifyingGlass size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Check = (props: AppIconProps) => (
  <PhosphorCheck size={props.size ?? 16} color={props.color ?? '#1C1C1E'} weight={props.weight ?? 'bold'} style={props.style} />
);

export const RotateCcw = (props: AppIconProps) => (
  <ArrowCounterClockwise size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const BarChart3 = (props: AppIconProps) => (
  <ChartBar size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Cloud = (props: AppIconProps) => (
  <CloudCheck size={props.size ?? 22} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const ChevronRight = (props: AppIconProps) => (
  <CaretRight size={props.size ?? 16} color={props.color ?? '#1C1C1E'} weight={props.weight ?? 'bold'} style={props.style} />
);

export const ArrowRight = (props: AppIconProps) => (
  <PhosphorArrowRight size={props.size ?? 18} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Sliders = (props: AppIconProps) => (
  <SlidersHorizontal size={props.size ?? 20} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const X = (props: AppIconProps) => (
  <PhosphorX size={props.size ?? 16} color={props.color ?? '#1C1C1E'} weight={props.weight ?? 'bold'} style={props.style} />
);

export const Smartphone = (props: AppIconProps) => (
  <DeviceMobile size={props.size ?? 16} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Monitor = (props: AppIconProps) => (
  <Desktop size={props.size ?? 16} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);

export const Layers = (props: AppIconProps) => (
  <CoatHanger size={props.size ?? 20} color={props.color ?? '#1C1C1E'} weight={props.weight ?? DEFAULT_WEIGHT} style={props.style} />
);
