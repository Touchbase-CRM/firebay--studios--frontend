export function getCurrentTimestamp() {
  const now = new Date();
  const options = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };

  // Replace slashes, commas, spaces, and colons with hyphens
  return now
    .toLocaleString("en-US", options)
    .replace(/[\/\s,:]/g, "-") // Use a regex to target slashes, spaces, commas, and colons
    .replace(/-+/g, "-"); // Collapse multiple consecutive hyphens into one
}
