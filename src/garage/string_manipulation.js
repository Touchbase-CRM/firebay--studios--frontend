export function getFullUrl(baseUrl, mappingKey, relationshipMapping) {
  return baseUrl + relationshipMapping[mappingKey];
}
