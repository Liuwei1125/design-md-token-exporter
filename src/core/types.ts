export interface ColorRect {
  width: number;
  height: number;
  top: number;
  left: number;
}

export interface ColorStyleSample {
  color: string;
  backgroundColor: string;
  backgroundImage: string;
  borderTopColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderLeftColor: string;
  outlineColor: string;
  textDecorationColor: string;
}

export interface ColorElementSample {
  tagName: string;
  id?: string;
  className?: string;
  role?: string | null;
  text?: string;
  ariaSelected?: boolean;
  ariaCurrent?: string | null;
  rect: ColorRect;
  styles: ColorStyleSample;
}

export type ColorEvidenceProperty =
  | 'color'
  | 'backgroundColor'
  | 'borderTopColor'
  | 'borderRightColor'
  | 'borderBottomColor'
  | 'borderLeftColor'
  | 'borderColor'
  | 'outlineColor'
  | 'textDecorationColor';

export interface ColorEvidence {
  value: string;
  property: ColorEvidenceProperty;
  originalValue: string;
  tagName: string;
  id?: string;
  className?: string;
  role?: string;
  text?: string;
  rect: ColorRect;
  isInteractive: boolean;
  isActionIntent: boolean;
  isActiveState: boolean;
  isAboveFold: boolean;
  score: number;
  weightReason: string[];
}

export interface ObservedColorToken {
  value: string;
  score: number;
  frequency: number;
  usage: string[];
  evidence: ColorEvidence[];
  warnings: string[];
}

export type ColorRoleName =
  | 'primary'
  | 'primaryForeground'
  | 'background'
  | 'surface'
  | 'textPrimary'
  | 'textSecondary'
  | 'border'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export interface ColorRoleToken {
  value: string;
  confidence: number;
  evidence: string[];
  warnings: string[];
}

export type ColorTokens = Partial<Record<ColorRoleName, ColorRoleToken>> & {
  primary: ColorRoleToken;
  background: ColorRoleToken;
  textPrimary: ColorRoleToken;
  warnings: string[];
};

export interface LayoutStyleSample {
  color: string;
  backgroundColor: string;
  borderTopColor: string;
  borderRightColor: string;
  borderBottomColor: string;
  borderLeftColor: string;
  borderTopWidth: string;
  borderRightWidth: string;
  borderBottomWidth: string;
  borderLeftWidth: string;
  cursor: string;
  width: string;
  height: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  paddingTop: string;
  paddingRight: string;
  paddingBottom: string;
  paddingLeft: string;
  marginTop: string;
  marginRight: string;
  marginBottom: string;
  marginLeft: string;
  gap: string;
  rowGap: string;
  columnGap: string;
  borderTopLeftRadius: string;
  borderTopRightRadius: string;
  borderBottomRightRadius: string;
  borderBottomLeftRadius: string;
  borderRadius?: string;
  boxShadow: string;
  textShadow: string;
}

export interface LayoutElementSample {
  tagName: string;
  id?: string;
  className?: string;
  role?: string | null;
  href?: string;
  inputType?: string;
  isContentEditable?: boolean;
  hasHeading?: boolean;
  hasImage?: boolean;
  hasButton?: boolean;
  text?: string;
  rect: ColorRect;
  styles: LayoutStyleSample;
}

export interface ClusterToken<TValue extends number | string> {
  value: TValue;
  frequency: number;
  usage: string[];
  evidence: string[];
}

export type TypographyRoleName = 'heading' | 'body' | 'caption' | 'button' | 'input';

export interface TypographyStyleToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  frequency: number;
  evidence: string[];
}

export interface TypographyRoleToken {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: number;
  confidence: number;
  evidence: string[];
}

export interface TypographyTokens {
  fontFamilies: ClusterToken<string>[];
  fontSizes: ClusterToken<number>[];
  fontWeights: ClusterToken<number>[];
  lineHeights: ClusterToken<number>[];
  letterSpacings: ClusterToken<number>[];
  styles: TypographyStyleToken[];
  roles: Partial<Record<TypographyRoleName, TypographyRoleToken>>;
}

export type SpacingScaleName = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SpacingTokens {
  baseUnit: 4 | 8 | 10;
  values: ClusterToken<number>[];
  scale: Partial<Record<SpacingScaleName, ClusterToken<number>>>;
}

export type RadiusScaleName = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface RadiusTokens {
  values: ClusterToken<number>[];
  scale: Partial<Record<RadiusScaleName, ClusterToken<number>>>;
}

export type ShadowScaleName = 'sm' | 'md' | 'lg' | 'card' | 'floating';
export type ShadowType = 'boxShadow' | 'textShadow';

export interface ShadowToken extends ClusterToken<string> {
  type: ShadowType;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  score: number;
}

export interface ShadowTokens {
  values: ShadowToken[];
  scale: Partial<Record<ShadowScaleName, ShadowToken>>;
}

export type DesignSystemId = 'generic' | 'shadcn' | 'bootstrap' | 'material' | 'antd' | 'primer';

export interface DesignSystemDetection {
  id: DesignSystemId;
  label: string;
  confidence: number;
  evidence: string[];
}

export type ComponentKind = 'button' | 'card' | 'input';

export interface ComponentStyleCandidate {
  kind: ComponentKind;
  selectorHint?: string;
  count: number;
  confidence: number;
  style: {
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderRadius?: string;
    padding?: string;
    height?: string;
    fontSize?: string;
    fontWeight?: string;
    boxShadow?: string;
  };
  evidence: string[];
}

export type ComponentStyles = Partial<Record<ComponentKind, ComponentStyleCandidate[]>>;
