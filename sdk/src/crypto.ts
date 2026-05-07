import nacl from "tweetnacl";
import * as ed2curve from "ed2curve";

export function ed25519ToCurve25519(publicKey: Uint8Array): Uint8Array {
  const curvePublic = ed2curve.convertPublicKey(publicKey);
  if (!curvePublic) {
    throw new Error("[Crypto] Failed to convert public key to Curve25519");
  }
  return curvePublic;
}

export function ed25519SecretToCurve25519(secretKey: Uint8Array): Uint8Array {
  const curveSecret = ed2curve.convertSecretKey(secretKey);
  if (!curveSecret) {
    throw new Error("[Crypto] Failed to convert secret key to Curve25519");
  }
  return curveSecret;
}

export function encrypt(
  plaintext: Uint8Array,
  senderPrivateKey: Uint8Array,
  recipientPublicKey: Uint8Array,
): Uint8Array {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const cipher = nacl.box(plaintext, nonce, recipientPublicKey, senderPrivateKey);
  const combined = new Uint8Array(nonce.length + cipher.length);
  combined.set(nonce, 0);
  combined.set(cipher, nonce.length);
  return combined;
}

export function decrypt(
  payload: Uint8Array,
  recipientPrivateKey: Uint8Array,
  senderPublicKey: Uint8Array,
): Uint8Array {
  const nonce = payload.slice(0, nacl.box.nonceLength);
  const cipher = payload.slice(nacl.box.nonceLength);
  const decrypted = nacl.box.open(cipher, nonce, senderPublicKey, recipientPrivateKey);
  if (!decrypted) {
    throw new Error("[Crypto] Failed to decrypt payload");
  }
  return decrypted;
}
