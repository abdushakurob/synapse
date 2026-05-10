export declare function ed25519ToCurve25519(publicKey: Uint8Array): Uint8Array;
export declare function ed25519SecretToCurve25519(secretKey: Uint8Array): Uint8Array;
export declare function encrypt(plaintext: Uint8Array, senderPrivateKey: Uint8Array, recipientPublicKey: Uint8Array): Uint8Array;
export declare function decrypt(payload: Uint8Array, recipientPrivateKey: Uint8Array, senderPublicKey: Uint8Array): Uint8Array;
