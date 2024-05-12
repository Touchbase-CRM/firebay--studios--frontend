// Captures the current timestamp in its raw numeric form.
export function captureCurrentTimestamp() {
  const now = new Date();
  return now.getTime(); // This returns the timestamp in milliseconds since the Unix Epoch
}

// Formats the captured timestamp into a human-readable form, adhering to your specified format.
export function formatTimestampForDisplay() {
  const rawTimestamp = captureCurrentTimestamp(); // Get the timestamp inside the function
  const date = new Date(rawTimestamp);
  const options = {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  };
  return date
    .toLocaleString("en-US", options)
    .replace(/[\/\s,:]/g, "-") // Replace slashes, spaces, commas, and colons with hyphens
    .replace(/-+/g, "-"); // Collapse multiple consecutive hyphens into one
}

// Generates a unique Pyro Order ID using the raw timestamp.
export function generatePyroOrderIdFromTimestamp() {
  const rawTimestamp = captureCurrentTimestamp(); // Get the timestamp inside the function
  // Create a numeric string from the timestamp for encoding
  const numeric = rawTimestamp.toString();
  // Simple hash to create a 7-digit number from the timestamp
  let hash = 0;
  for (let i = 0; i < numeric.length; i++) {
    hash = (hash * 10 + Number(numeric[i])) % 10000000;
  }
  return `pyro-order--${hash.toString().padStart(7, "0")}`;
}
