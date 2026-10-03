// ============================================================================
//  Jurnal Pribadi — enkripsi di perangkat (client-side)
// ----------------------------------------------------------------------------
//  Jurnal TIDAK PERNAH dikirim ke server. Isinya dienkripsi dengan AES-256-GCM
//  memakai kunci yang diturunkan dari PIN anak (PBKDF2, 200.000 iterasi) lalu
//  disimpan di localStorage HP anak. Tanpa PIN, isi jurnal tidak bisa dibaca —
//  bahkan oleh developer atau orang tua yang memegang HP-nya.
// ============================================================================

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO
  mood: string | null;
  text: string;
  tags: string[];
}

interface Vault {
  v: 1;
  salt: string; // base64
  iv: string;
  data: string; // ciphertext base64 dari JSON JournalEntry[]
}

const keyName = (userId: number) => `pf_journal_v1_${userId}`;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(pin: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function readVault(userId: number): Vault | null {
  try {
    const raw = localStorage.getItem(keyName(userId));
    return raw ? (JSON.parse(raw) as Vault) : null;
  } catch {
    return null;
  }
}

export const hasVault = (userId: number) => readVault(userId) !== null;
export const cryptoSupported = () => typeof window !== "undefined" && !!window.crypto?.subtle;

export interface OpenVault {
  key: CryptoKey;
  salt: Uint8Array;
  entries: JournalEntry[];
}

async function write(userId: number, key: CryptoKey, salt: Uint8Array, entries: JournalEntry[]) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(JSON.stringify(entries)));
  const vault: Vault = { v: 1, salt: b64(salt), iv: b64(iv), data: b64(ct) };
  localStorage.setItem(keyName(userId), JSON.stringify(vault));
}

/** Membuat brankas jurnal baru dengan PIN. */
export async function createVault(userId: number, pin: string): Promise<OpenVault> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(pin, salt);
  await write(userId, key, salt, []);
  return { key, salt, entries: [] };
}

/** Membuka brankas. Melempar error bila PIN salah. */
export async function unlockVault(userId: number, pin: string): Promise<OpenVault> {
  const vault = readVault(userId);
  if (!vault) throw new Error("Brankas belum dibuat");
  const salt = unb64(vault.salt);
  const key = await deriveKey(pin, salt);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(vault.iv) }, key, unb64(vault.data));
  return { key, salt, entries: JSON.parse(new TextDecoder().decode(pt)) as JournalEntry[] };
}

export async function saveVault(userId: number, open: OpenVault, entries: JournalEntry[]) {
  await write(userId, open.key, open.salt, entries);
}

/** Menghapus seluruh jurnal (dipakai bila lupa PIN). */
export function destroyVault(userId: number) {
  localStorage.removeItem(keyName(userId));
}
