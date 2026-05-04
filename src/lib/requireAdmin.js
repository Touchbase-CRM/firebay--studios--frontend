import { adminAuth } from "./firebaseAdmin";

const ADMIN_DOMAIN = "@firebaystudios.com";

export async function requireAdmin(req, res) {
  const header = req.headers.authorization || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    res.status(401).json({
      error: "Missing auth token",
      hint: "Send your Firebase ID token as 'Authorization: Bearer <token>'.",
    });
    return null;
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(match[1]);
  } catch (e) {
    res.status(401).json({
      error: "Invalid auth token",
      hint: "Sign out and sign back in to refresh your session.",
    });
    return null;
  }

  const email = (decoded.email || "").toLowerCase();
  if (!email.endsWith(ADMIN_DOMAIN) || !decoded.email_verified) {
    res.status(403).json({
      error: "Admin access required",
      hint: `Only verified ${ADMIN_DOMAIN} accounts can manage voices.`,
    });
    return null;
  }

  return decoded;
}
