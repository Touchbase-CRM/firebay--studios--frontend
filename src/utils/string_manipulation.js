export function getFullUrl(baseUrl, voiceName, relationshipMapping) {
  return baseUrl + relationshipMapping[voiceName];
}
