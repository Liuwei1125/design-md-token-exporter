type Rgb = {
  r: number;
  g: number;
  b: number;
  a?: number;
};

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const FUNCTION_NAME = /^([a-z-]+)\(/i;
const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#FFFFFF',
  red: '#FF0000',
  green: '#008000',
  blue: '#0000FF',
  currentcolor: 'currentcolor',
};

export function normalizeColor(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const input = value.trim();
  if (!input || isTransparentColor(input)) return undefined;

  const lower = input.toLowerCase();
  if (NAMED_COLORS[lower]) return NAMED_COLORS[lower];

  const hex = normalizeHex(input);
  if (hex) return hex;

  const rgb = parseRgb(input);
  if (rgb) return rgbToHex(rgb);

  const hsl = parseHsl(input);
  if (hsl) return rgbToHex(hsl);

  const srgb = parseColorSrgb(input);
  if (srgb) return rgbToHex(srgb);

  if (FUNCTION_NAME.test(input)) {
    return input;
  }

  return undefined;
}

export function isTransparentColor(value: string | null | undefined): boolean {
  if (!value) return true;

  const input = value.trim().toLowerCase();
  if (!input || input === 'transparent') return true;

  const rgb = parseRgb(input);
  if (rgb?.a !== undefined) return rgb.a <= 0;

  const hsl = parseHsl(input);
  if (hsl?.a !== undefined) return hsl.a <= 0;

  const hex = HEX.exec(input);
  if (hex?.[1]?.length === 4 || hex?.[1]?.length === 8) {
    const alpha = hex[1].length === 4 ? hex[1][3] + hex[1][3] : hex[1].slice(6, 8);
    return Number.parseInt(alpha, 16) <= 0;
  }

  return false;
}

export function relativeLuminance(value: string): number {
  const rgb = hexToRgb(normalizeColor(value));
  if (!rgb) return 0;

  const r = luminanceChannel(rgb.r);
  const g = luminanceChannel(rgb.g);
  const b = luminanceChannel(rgb.b);

  return round(0.2126 * r + 0.7152 * g + 0.0722 * b, 4);
}

export function contrastRatio(foreground: string, background: string): number {
  const light = Math.max(relativeLuminance(foreground), relativeLuminance(background));
  const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background));
  return round((light + 0.05) / (dark + 0.05), 2);
}

export function saturationScore(value: string): number {
  const rgb = hexToRgb(normalizeColor(value));
  if (!rgb) return 0;
  return round(rgbToHsl(rgb).s, 4);
}

export function isNeutralColor(value: string): boolean {
  const normalized = normalizeColor(value);
  if (!normalized || !normalized.startsWith('#')) return false;

  const saturation = saturationScore(normalized);
  const luminance = relativeLuminance(normalized);
  return saturation < 0.08 || (luminance > 0.72 && saturation < 0.32) || (luminance > 0.9 && saturation < 0.38);
}

export function isDarkColor(value: string): boolean {
  return relativeLuminance(value) < 0.42;
}

export function isNearWhite(value: string): boolean {
  return relativeLuminance(value) > 0.92;
}

function normalizeHex(input: string): string | undefined {
  const match = HEX.exec(input);
  if (!match?.[1]) return undefined;

  const raw = match[1];
  if (raw.length === 3 || raw.length === 4) {
    return `#${raw
      .split('')
      .map((char) => char + char)
      .join('')
      .toUpperCase()}`;
  }

  return `#${raw.toUpperCase()}`;
}

function parseRgb(input: string): Rgb | undefined {
  const match = /^rgba?\((.*)\)$/i.exec(input.trim());
  if (!match?.[1]) return undefined;

  const parts = splitColorFunctionArgs(match[1]);
  if (parts.length < 3) return undefined;

  return {
    r: parseRgbChannel(parts[0]),
    g: parseRgbChannel(parts[1]),
    b: parseRgbChannel(parts[2]),
    ...(parts[3] !== undefined ? { a: parseAlpha(parts[3]) } : {}),
  };
}

function parseHsl(input: string): Rgb | undefined {
  const match = /^hsla?\((.*)\)$/i.exec(input.trim());
  if (!match?.[1]) return undefined;

  const parts = splitColorFunctionArgs(match[1]);
  if (parts.length < 3) return undefined;

  return {
    ...hslToRgb(Number.parseFloat(parts[0]), parsePercent(parts[1]), parsePercent(parts[2])),
    ...(parts[3] !== undefined ? { a: parseAlpha(parts[3]) } : {}),
  };
}

function splitColorFunctionArgs(input: string): string[] {
  if (input.includes(',')) {
    return input.split(',').map((part) => part.trim()).filter(Boolean);
  }

  const slashParts = input.split('/').map((part) => part.trim());
  const channels = slashParts[0]?.split(/\s+/).filter(Boolean) ?? [];
  return slashParts[1] ? [...channels, slashParts[1]] : channels;
}

function parseRgbChannel(value: string): number {
  if (value.endsWith('%')) {
    return clampByte((Number.parseFloat(value) / 100) * 255);
  }

  return clampByte(Number.parseFloat(value));
}

function parseAlpha(value: string): number {
  if (value.endsWith('%')) {
    return clampUnit(Number.parseFloat(value) / 100);
  }

  return clampUnit(Number.parseFloat(value));
}

function parsePercent(value: string): number {
  return clampUnit(Number.parseFloat(value) / 100);
}

function rgbToHex(rgb: Rgb): string {
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => clampByte(channel).toString(16).padStart(2, '0'));
  if (rgb.a !== undefined && rgb.a < 1) {
    channels.push(clampByte(rgb.a * 255).toString(16).padStart(2, '0'));
  }
  return `#${channels.join('').toUpperCase()}`;
}

function hexToRgb(value: string | undefined): Rgb | undefined {
  if (!value) return undefined;
  const normalized = normalizeHex(value);
  if (!normalized || normalized.length < 7) return undefined;

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const h = (((hue % 360) + 360) % 360) / 360;
  const s = clampUnit(saturation);
  const l = clampUnit(lightness);

  if (s === 0) {
    const channel = clampByte(l * 255);
    return { r: channel, g: channel, b: channel };
  }

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: clampByte(hueToRgb(p, q, h + 1 / 3) * 255),
    g: clampByte(hueToRgb(p, q, h) * 255),
    b: clampByte(hueToRgb(p, q, h - 1 / 3) * 255),
  };
}

function hueToRgb(p: number, q: number, t: number): number {
  let localT = t;
  if (localT < 0) localT += 1;
  if (localT > 1) localT -= 1;
  if (localT < 1 / 6) return p + (q - p) * 6 * localT;
  if (localT < 1 / 2) return q;
  if (localT < 2 / 3) return p + (q - p) * (2 / 3 - localT) * 6;
  return p;
}

function rgbToHsl(rgb: Rgb): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  if (max === g) h = (b - r) / d + 2;
  if (max === b) h = (r - g) / d + 4;

  return { h: h / 6, s, l };
}

function luminanceChannel(channel: number): number {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(255, Math.round(value)));
}

function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function round(value: number, precision: number): number {
  const multiplier = 10 ** precision;
  return Math.round(value * multiplier) / multiplier;
}

function parseColorSrgb(input: string): Rgb | undefined {
  const match = /^color\((?:srgb|display-p3)\s+([0-9.-]+%?)\s+([0-9.-]+%?)\s+([0-9.-]+%?)(?:\s*\/\s*([0-9.-]+%?))?\)$/i.exec(input.trim());
  if (!match) return undefined;

  const r = parseSrgbChannel(match[1]);
  const g = parseSrgbChannel(match[2]);
  const b = parseSrgbChannel(match[3]);
  const a = match[4] !== undefined ? parseAlpha(match[4]) : undefined;

  return { r, g, b, ...(a !== undefined ? { a } : {}) };
}

function parseSrgbChannel(value: string): number {
  if (value.endsWith('%')) {
    return clampByte((Number.parseFloat(value) / 100) * 255);
  }
  return clampByte(Number.parseFloat(value) * 255);
}
