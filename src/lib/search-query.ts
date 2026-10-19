/**
 * Sanitize user text before embedding it in PostgREST's raw .or() filter grammar.
 * This is input hardening, not SQL escaping; Supabase still parameterizes values.
 */
export function sanitizeListingSearchTerm(value: string): string {
  return value
    .replace(/[%,()*\\\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}
