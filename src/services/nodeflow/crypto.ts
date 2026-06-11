// WebCrypto helpers for the NodeFlow SDK session handshake.
//
// The backend verifies an RSA-PSS (SHA-256) signature over
// `challenge + timestamp` where the timestamp is the current UTC time
// rounded DOWN to the nearest 10 seconds, formatted like Python's
// `datetime.isoformat()` (e.g. "2026-06-11T23:30:10+00:00").

export interface SessionKeyPair {
  publicKeyPem: string;
  privateKey: CryptoKey;
}

const RSA_MODULUS_BITS = 2048;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function spkiToPem(spki: ArrayBuffer): string {
  const base64 = arrayBufferToBase64(spki);
  const lines = base64.match(/.{1,64}/g) ?? [];
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----\n`;
}

export async function generateSessionKeyPair(): Promise<SessionKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-PSS',
      modulusLength: RSA_MODULUS_BITS,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify'],
  );
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  return {
    publicKeyPem: spkiToPem(spki),
    privateKey: keyPair.privateKey,
  };
}

export async function signMessage(privateKey: CryptoKey, message: string): Promise<string> {
  const signature = await crypto.subtle.sign(
    { name: 'RSA-PSS', saltLength: 32 },
    privateKey,
    new TextEncoder().encode(message),
  );
  return arrayBufferToBase64(signature);
}

export function roundedUtcTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const seconds = date.getUTCSeconds() - (date.getUTCSeconds() % 10);
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(seconds)}+00:00`
  );
}

// Milliseconds until the current 10-second window ends. The client signs
// the rounded timestamp; if the request crosses the window boundary the
// server recomputes a different timestamp and rejects the signature.
export function msLeftInTimestampWindow(date: Date = new Date()): number {
  const msIntoWindow = (date.getUTCSeconds() % 10) * 1000 + date.getUTCMilliseconds();
  return 10_000 - msIntoWindow;
}

export function randomChallenge(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return arrayBufferToBase64(bytes.buffer);
}
