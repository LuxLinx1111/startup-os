import crypto from "crypto";

// AES-256-GCM encryption for vault items. The raw VAULT_ENCRYPTION_KEY env var can be any
// string/length — we hash it down to a stable 32-byte key so key rotation is just "generate
// a new random secret and re-save vault items" rather than fussing with byte lengths.
function getKey(): Buffer {
  const secret = process.env.VAULT_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("VAULT_ENCRYPTION_KEY is not set. Add it to your .env before using the Vault.");
  }
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(":");
}

export function decryptSecret(payload: string): string {
  const key = getKey();
  const [ivB64, authTagB64, dataB64] = payload.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}

export function maskSecret(plaintext: string): string {
  if (plaintext.length <= 4) return "••••";
  return `••••${plaintext.slice(-4)}`;
}
