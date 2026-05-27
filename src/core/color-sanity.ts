import { contrastRatio, isNeutralColor } from './color-normalization';
import type { ColorTokens } from './types';

export interface ColorSanityIssue {
  severity: 'info' | 'warning' | 'critical';
  role: string;
  message: string;
}

export function collectColorWarnings(colors: ColorTokens): ColorSanityIssue[] {
  const issues: ColorSanityIssue[] = [];

  if (colors.primary.value && isNeutralColor(colors.primary.value)) {
    issues.push({
      severity: 'warning',
      role: 'primary',
      message: 'Primary color is neutral; review CTA, link, active, and brand evidence.',
    });
  }

  if (colors.textPrimary.value && colors.background.value && contrastRatio(colors.textPrimary.value, colors.background.value) < 3) {
    issues.push({
      severity: 'critical',
      role: 'textPrimary',
      message: 'Text primary has low contrast against the inferred page background.',
    });
  }

  if (!colors.border) {
    issues.push({
      severity: 'info',
      role: 'border',
      message: 'No border color evidence was found.',
    });
  }

  return issues;
}
