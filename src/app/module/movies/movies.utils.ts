/* ================= FormatTags ================= */
export const formatTags = (tags: string[]) =>
  tags
    .map(tag => {
      const trimmed = tag.trim();
      if (!trimmed) return '';
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
    })
    .filter(Boolean);
