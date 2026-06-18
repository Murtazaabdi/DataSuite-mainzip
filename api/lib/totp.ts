export function generateTOTPSecret(accountName: string) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const label = encodeURIComponent(`DS-PaaS:${accountName}`);
  const otpauthUrl = `otpauth://totp/${label}?secret=${secret}&issuer=DS-PaaS`;
  return { base32: secret, otpauthUrl, qrCodeUrl: otpauthUrl };
}

export function verifyTOTP(secret: string, code: string): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;
  for (let i = -1; i <= 1; i++) {
    const counter = Math.floor(now / timeStep) + i;
    if (generateTOTPCode(secret, counter) === code) return true;
  }
  return false;
}

function generateTOTPCode(secret: string, counter: number): string {
  const key = base32ToBytes(secret);
  const counterBytes = new Uint8Array(8);
  let temp = counter;
  for (let i = 7; i >= 0; i--) { counterBytes[i] = temp & 0xff; temp >>= 8; }
  const code = hmacSha1(key, counterBytes);
  const offset = code[code.length - 1] & 0x0f;
  const binary =
    ((code[offset] & 0x7f) << 24) |
    ((code[offset + 1] & 0xff) << 16) |
    ((code[offset + 2] & 0xff) << 8) |
    (code[offset + 3] & 0xff);
  return (binary % 1000000).toString().padStart(6, "0");
}

function base32ToBytes(base32: string): Uint8Array {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bits: number[] = [];
  for (const char of base32.toUpperCase()) {
    const val = chars.indexOf(char);
    if (val === -1) continue;
    for (let i = 4; i >= 0; i--) bits.push((val >> i) & 1);
  }
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8 && i + j < bits.length; j++) byte = (byte << 1) | bits[i + j];
    bytes.push(byte);
  }
  return new Uint8Array(bytes);
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let paddedKey: Uint8Array;
  if (key.length > blockSize) {
    paddedKey = sha1(key);
  } else {
    paddedKey = new Uint8Array(blockSize);
    paddedKey.set(key);
  }
  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }
  const inner = sha1(concat(iKeyPad, message));
  return sha1(concat(oKeyPad, inner));
}

function sha1(data: Uint8Array): Uint8Array {
  let h0 = 0x67452301, h1 = 0xefcdab89, h2 = 0x98badcfe, h3 = 0x10325476, h4 = 0xc3d2e1f0;
  const origLen = data.length;
  const paddedLen = Math.ceil((origLen + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(data);
  padded[origLen] = 0x80;
  const view = new DataView(padded.buffer);
  view.setBigUint64(paddedLen - 8, BigInt(origLen * 8), false);
  let [a, b, c, d, e] = [h0, h1, h2, h3, h4];
  for (let i = 0; i < paddedLen; i += 64) {
    const w = new Uint32Array(80);
    for (let j = 0; j < 16; j++) w[j] = view.getUint32(i + j * 4, false);
    for (let j = 16; j < 80; j++) w[j] = rot(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
    let [tA, tB, tC, tD, tE] = [a, b, c, d, e];
    for (let j = 0; j < 80; j++) {
      let f: number, k: number;
      if (j < 20)      { f = (tB & tC) | (~tB & tD); k = 0x5a827999; }
      else if (j < 40) { f = tB ^ tC ^ tD;            k = 0x6ed9eba1; }
      else if (j < 60) { f = (tB & tC) | (tB & tD) | (tC & tD); k = 0x8f1bbcdc; }
      else             { f = tB ^ tC ^ tD;            k = 0xca62c1d6; }
      const tmp = (rot(tA, 5) + f + tE + k + w[j]) >>> 0;
      [tE, tD, tC, tB, tA] = [tD, tC, rot(tB, 30), tA, tmp];
    }
    a = (a + tA) >>> 0; b = (b + tB) >>> 0; c = (c + tC) >>> 0;
    d = (d + tD) >>> 0; e = (e + tE) >>> 0;
  }
  const result = new Uint8Array(20);
  const rv = new DataView(result.buffer);
  rv.setUint32(0, a, false); rv.setUint32(4, b, false);
  rv.setUint32(8, c, false); rv.setUint32(12, d, false); rv.setUint32(16, e, false);
  return result;
}

function rot(value: number, bits: number): number {
  return ((value << bits) | (value >>> (32 - bits))) >>> 0;
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const r = new Uint8Array(a.length + b.length);
  r.set(a); r.set(b, a.length);
  return r;
}
