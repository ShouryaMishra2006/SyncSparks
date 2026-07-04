export type DrawingStyleKey = "ink";

export type DrawingLineStyle = Readonly<{
  stroke: string;
  strokeWidth: number;
  tension: number;
  lineCap: "round";
}>;

export type DrawingLine = Readonly<{
  id: string;
  styleKey: DrawingStyleKey;
  points: number[];
}>;

const LINE_STYLES: Record<DrawingStyleKey, DrawingLineStyle> = {
  ink: Object.freeze({
    stroke: "black",
    strokeWidth: 2,
    tension: 0.5,
    lineCap: "round",
  }),
};

export class LineStyleFlyweightFactory {
  private static cache = new Map<DrawingStyleKey, DrawingLineStyle>();

  static get(styleKey: DrawingStyleKey): DrawingLineStyle {
    const cached = this.cache.get(styleKey);
    if (cached) return cached;

    const style = LINE_STYLES[styleKey];
    this.cache.set(styleKey, style);
    return style;
  }
}

export class DrawingLineFlyweightFactory {
  static create(points: number[], styleKey: DrawingStyleKey = "ink"): DrawingLine {
    return {
      id: `line-${crypto.randomUUID()}`,
      styleKey,
      points,
    };
  }

  static appendPoint(line: DrawingLine, x: number, y: number): DrawingLine {
    return {
      ...line,
      points: line.points.concat([x, y]),
    };
  }
}
