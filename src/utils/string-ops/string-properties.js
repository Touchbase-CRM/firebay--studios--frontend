export function calculateCharCount(content) {
    // Replace all apostrophes with an empty string before calculating the length
    const contentWithoutApostrophes = content.replace(/'/g, "");
    return contentWithoutApostrophes.trim().length;
}