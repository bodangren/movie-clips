/// <reference types="vite/client" />

declare module 'chroma-js' {
  type ChromaStatic = {
    (color?: string): ChromaColor;
    mix(color1: string, color2: string, ratio?: number): ChromaColor;
    valid(color: string): boolean;
    version: string;
    cmyk(c: number, m: number, y: number, k: number): ChromaColor;
    css(color: string): ChromaColor;
    gl(r: number, g: number, b: number, a?: number): ChromaColor;
    hcg(h: number, c: number, g: number): ChromaColor;
    hex(color: string): ChromaColor;
    hsi(h: number, s: number, i: number): ChromaColor;
    hsl(h: number, s: number, l: number): ChromaColor;
    hsv(h: number, s: number, v: number): ChromaColor;
    lab(l: number, a: number, b: number): ChromaColor;
    lch(l: number, c: number, h: number): ChromaColor;
    hcl(h: number, c: number, l: number): ChromaColor;
    num(n: number): ChromaColor;
    rgb(r: number, g: number, b: number, a?: number): ChromaColor;
    temperature(k: number): ChromaColor;
    kelvin(k: number): ChromaColor;
    temp(k: number): ChromaColor;
    oklab(l: number, a: number, b: number): ChromaColor;
    oklch(l: number, c: number, h: number): ChromaColor;
    average(colors: string[], mode?: string): ChromaColor;
    bezier(colors: string[]): (t: number) => ChromaColor;
    blend(color1: string, color2: string, mode: string): ChromaColor;
    cubehelix(): unknown;
    interpolate(color1: string, color2: string, mode?: string): (t: number) => ChromaColor;
    random(): ChromaColor;
    scale(colors?: string[]): unknown;
    analyze: unknown;
    contrast(color1: string, color2: string): number;
    deltaE(color1: string, color2: string): number;
    distance(color1: string, color2: string, mode?: string): number;
    limits: unknown;
    scales: unknown;
    colors: unknown;
    brewer: Record<string, string[]>;
  };

  interface ChromaColor {
    alpha(a: number): ChromaColor;
    css(): string;
    hex(): string;
    rgb(): [number, number, number];
    rgba(): [number, number, number, number];
    hsl(): [number, number, number];
    hsv(): [number, number, number];
    lab(): [number, number, number];
    luminance(): number;
    mix(color: string, ratio?: number): ChromaColor;
    saturate(amount?: number): ChromaColor;
    desaturate(amount?: number): ChromaColor;
    darken(amount?: number): ChromaColor;
    brighten(amount?: number): ChromaColor;
  }

  const chroma: ChromaStatic;
  export = chroma;
}
