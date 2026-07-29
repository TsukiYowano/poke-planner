export function formatCandidateDisplayName(
  pokemonName: string,
  label: string | undefined,
): string {
  const normalizedLabel = label?.trim() ?? "";
  if (!normalizedLabel || normalizedLabel === pokemonName) {
    return pokemonName;
  }
  return `${pokemonName}（${normalizedLabel}）`;
}
