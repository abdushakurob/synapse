"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ed25519ToCurve25519 = ed25519ToCurve25519;
exports.ed25519SecretToCurve25519 = ed25519SecretToCurve25519;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const ed2curve = __importStar(require("ed2curve"));
function ed25519ToCurve25519(publicKey) {
    const curvePublic = ed2curve.convertPublicKey(publicKey);
    if (!curvePublic) {
        throw new Error("[Crypto] Failed to convert public key to Curve25519");
    }
    return curvePublic;
}
function ed25519SecretToCurve25519(secretKey) {
    const curveSecret = ed2curve.convertSecretKey(secretKey);
    if (!curveSecret) {
        throw new Error("[Crypto] Failed to convert secret key to Curve25519");
    }
    return curveSecret;
}
function encrypt(plaintext, senderPrivateKey, recipientPublicKey) {
    const nonce = tweetnacl_1.default.randomBytes(tweetnacl_1.default.box.nonceLength);
    const cipher = tweetnacl_1.default.box(plaintext, nonce, recipientPublicKey, senderPrivateKey);
    const combined = new Uint8Array(nonce.length + cipher.length);
    combined.set(nonce, 0);
    combined.set(cipher, nonce.length);
    return combined;
}
function decrypt(payload, recipientPrivateKey, senderPublicKey) {
    const nonce = payload.slice(0, tweetnacl_1.default.box.nonceLength);
    const cipher = payload.slice(tweetnacl_1.default.box.nonceLength);
    const decrypted = tweetnacl_1.default.box.open(cipher, nonce, senderPublicKey, recipientPrivateKey);
    if (!decrypted) {
        throw new Error("[Crypto] Failed to decrypt payload");
    }
    return decrypted;
}
