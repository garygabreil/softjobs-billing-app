export type SortDirection = 'asc' | 'desc';

export function filterSuggestions(
  query: string,
  items: (string | number | null | undefined)[],
  limit = 15
): string[] {
  const q = (query || '').trim().toLowerCase();
  const unique = [...new Set(items.map((item) => String(item ?? '').trim()).filter(Boolean))];
  if (!q) {
    return unique.slice(0, limit);
  }
  return unique.filter((item) => item.toLowerCase().includes(q)).slice(0, limit);
}

export function matchesSearch(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  const q = (query || '').trim().toLowerCase();
  if (!q) {
    return true;
  }
  return fields.some((field) => String(field ?? '').toLowerCase().includes(q));
}

export function compareValues(a: unknown, b: unknown, direction: SortDirection): number {
  const av = a ?? '';
  const bv = b ?? '';
  let result = 0;

  if (typeof av === 'number' && typeof bv === 'number') {
    result = av - bv;
  } else {
    result = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
  }

  return direction === 'asc' ? result : -result;
}

export function toggleSortDirection(current: SortDirection): SortDirection {
  return current === 'asc' ? 'desc' : 'asc';
}
