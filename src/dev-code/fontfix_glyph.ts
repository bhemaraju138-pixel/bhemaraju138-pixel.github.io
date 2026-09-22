import type { PathCommand } from 'opentype.js';
import type { ParsedFont } from './parser';

export interface ScreenPoint {
  id: string;
  x: number;
  y: number;
  kind: 'on-curve' | 'control';
}

export interface HandleLine {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GlyphView {
  character: string;
  glyphName: string;
  pathData: string;
  commands: PathCommand[];
  points: ScreenPoint[];
  handles: HandleLine[];
  contours: number;
  advanceWidth: number;
  leftSideBearing: number;
  rightSideBearing: number;
  advanceX: number;
  originX: number;
  baselineY: number;
  ascenderY: number;
  descenderY: number;
  xHeightY: number | null;
}

const STAGE_WIDTH = 720;
const STAGE_HEIGHT = 620;
const HORIZONTAL_PADDING = 92;
const VERTICAL_PADDING = 78;

function fixed(value: number) {
  return Number(value.toFixed(2));
}

export function createGlyphView(parsed: ParsedFont, character: string): GlyphView {
  const glyph = parsed.font.charToGlyph(character);
  const metrics = glyph.getMetrics();
  const advanceWidth = glyph.advanceWidth ?? parsed.unitsPerEm;
  const designHeight = parsed.ascender - parsed.descender;
  const horizontalExtent = Math.max(advanceWidth, metrics.xMax - Math.min(0, metrics.xMin));
  const scale = Math.min(
    (STAGE_WIDTH - HORIZONTAL_PADDING * 2) / Math.max(horizontalExtent, 1),
    (STAGE_HEIGHT - VERTICAL_PADDING * 2) / Math.max(designHeight, 1),
  );
  const originX = (STAGE_WIDTH - advanceWidth * scale) / 2;
  const baselineY = VERTICAL_PADDING + parsed.ascender * scale;
  const mapX = (x: number) => originX + x * scale;
  const mapY = (y: number) => baselineY - y * scale;

  const parts: string[] = [];
  const points: ScreenPoint[] = [];
  const handles: HandleLine[] = [];
  let current: { x: number; y: number } | null = null;
  let pointIndex = 0;
  let handleIndex = 0;
  let contours = 0;

  function addPoint(x: number, y: number, kind: ScreenPoint['kind']) {
    points.push({ id: `point-${pointIndex++}`, x: mapX(x), y: mapY(y), kind });
  }

  function addHandle(a: { x: number; y: number }, b: { x: number; y: number }) {
    handles.push({
      id: `handle-${handleIndex++}`,
      x1: mapX(a.x),
      y1: mapY(a.y),
      x2: mapX(b.x),
      y2: mapY(b.y),
    });
  }

  const commands = glyph.path.commands as PathCommand[];

  for (const command of commands) {
    if (command.type === 'Z') {
      parts.push('Z');
      continue;
    }

    const end = { x: command.x, y: command.y };
    if (command.type === 'M') {
      contours += 1;
      parts.push(`M ${fixed(mapX(command.x))} ${fixed(mapY(command.y))}`);
      addPoint(command.x, command.y, 'on-curve');
    } else if (command.type === 'L') {
      parts.push(`L ${fixed(mapX(command.x))} ${fixed(mapY(command.y))}`);
      addPoint(command.x, command.y, 'on-curve');
    } else if (command.type === 'C') {
      parts.push(
        `C ${fixed(mapX(command.x1))} ${fixed(mapY(command.y1))} ${fixed(mapX(command.x2))} ${fixed(mapY(command.y2))} ${fixed(mapX(command.x))} ${fixed(mapY(command.y))}`,
      );
      addPoint(command.x1, command.y1, 'control');
      addPoint(command.x2, command.y2, 'control');
      addPoint(command.x, command.y, 'on-curve');
      if (current) addHandle(current, { x: command.x1, y: command.y1 });
      addHandle({ x: command.x2, y: command.y2 }, end);
    } else if (command.type === 'Q') {
      parts.push(
        `Q ${fixed(mapX(command.x1))} ${fixed(mapY(command.y1))} ${fixed(mapX(command.x))} ${fixed(mapY(command.y))}`,
      );
      addPoint(command.x1, command.y1, 'control');
      addPoint(command.x, command.y, 'on-curve');
      if (current) addHandle(current, { x: command.x1, y: command.y1 });
      addHandle({ x: command.x1, y: command.y1 }, end);
    }
    current = end;
  }

  return {
    character,
    glyphName: glyph.name ?? `glyph-${glyph.index}`,
    pathData: parts.join(' '),
    commands,
    points,
    handles,
    contours,
    advanceWidth,
    leftSideBearing: metrics.leftSideBearing,
    rightSideBearing: metrics.rightSideBearing ?? advanceWidth - metrics.xMax,
    advanceX: mapX(advanceWidth),
    originX,
    baselineY,
    ascenderY: mapY(parsed.ascender),
    descenderY: mapY(parsed.descender),
    xHeightY: parsed.xHeight === null ? null : mapY(parsed.xHeight),
  };
}
