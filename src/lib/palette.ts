export const CATEGORY_PALETTE = [
  "#F7C6D9", // pastel pink
  "#C3EFE0", // pastel mint
  "#D9CBF2", // pastel lavender
  "#FBD8B0", // pastel peach
  "#BFE1F6", // pastel sky
  "#D3E4C5", // pastel sage
  "#F6C9C0", // pastel coral
  "#E3D9F0", // pastel lilac-gray
] as const;

export function nextPaletteColor(existingCount: number): string {
  return CATEGORY_PALETTE[existingCount % CATEGORY_PALETTE.length];
}

/** Neutral gray for notes with no category — deliberately not a palette pastel,
 * so "uncategorized" reads distinctly from any real category on both light and
 * dark (board/graph) backgrounds. */
export const UNCATEGORIZED_COLOR = "#9CA3AF";
