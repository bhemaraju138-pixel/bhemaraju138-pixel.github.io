export type SourceToken = { character: string; offset: number };

export function utf16Tokens(text: string): SourceToken[] {
  let offset = 0;
  return Array.from(text || " ").map((character) => {
    const token = { character, offset };
    offset += character.length;
    return token;
  });
}

export function featureString(features: Record<string, boolean>): string {
  return Object.entries(features).map(([tag, enabled]) => `${tag}=${enabled ? 1 : 0}`).join(",");
}

