const urlSchemePattern = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;

export function resolvePublicAssetPath(
  assetPath: string,
  baseUrl = import.meta.env.BASE_URL,
): string {
  const trimmedPath = assetPath.trim();

  if (!trimmedPath || urlSchemePattern.test(trimmedPath)) {
    return trimmedPath;
  }

  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedAssetPath = trimmedPath.replace(/^\/+/, "");

  return `${normalizedBaseUrl}${normalizedAssetPath}`;
}
