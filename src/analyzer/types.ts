import type {
  ColorTokens,
  ComponentStyles,
  DesignSystemDetection,
  LayoutElementSample,
  ObservedColorToken,
  RadiusTokens,
  ShadowTokens,
  SpacingTokens,
  TypographyTokens,
} from '../core/types';

export interface PageMeta {
  title: string;
  url: string;
  hostname: string;
  analyzedAt: string;
  favicon?: string;
}

export interface VisibleElementSummary {
  tagName: string;
  id?: string;
  className?: string;
}

export interface CssVariableRecord {
  name: string;
  value: string;
  source: string;
}

export interface ElementCounts {
  totalVisible: number;
  limitedTo: number;
  byTag: Record<string, number>;
}

export interface DesignSnapshot {
  meta: PageMeta;
  raw: {
    cssVariables: CssVariableRecord[];
    elementCounts: ElementCounts;
    colorTokens: ObservedColorToken[];
  };
  tokens: {
    colors: ColorTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    radius: RadiusTokens;
    shadows: ShadowTokens;
  };
  components: ComponentStyles;
  designSystem?: DesignSystemDetection;
}

export interface RawPageAnalysis {
  meta: PageMeta;
  raw: {
    cssVariables: CssVariableRecord[];
    elementCounts: ElementCounts;
    colorSamples: import('../core/types').ColorElementSample[];
    layoutSamples: LayoutElementSample[];
  };
}
