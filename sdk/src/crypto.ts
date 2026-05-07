import nacl from "tweetnacl";

export function ed25519ToCurve25519(publicKey: Uint8Array): Uint8Array {
  if (publicKey.length !== nacl.box.publicKeyLength) {
    throw new Error("[Crypto] Invalid public key length");
  }
  return publicKey;
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
