declare module "bwip-js" {
  export interface ToSvgOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    includetext?: boolean;
  }

  export function toSVG(options: ToSvgOptions): string;
  export function toBuffer(options: ToSvgOptions): Promise<Buffer>;
}
