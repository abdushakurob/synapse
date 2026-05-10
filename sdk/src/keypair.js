"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKeypair = generateKeypair;
exports.saveKeypair = saveKeypair;
exports.loadKeypair = loadKeypair;
const web3_js_1 = require("@solana/web3.js");
const fs_1 = require("fs");
function generateKeypair() {
    return web3_js_1.Keypair.generate();
}
function saveKeypair(path, keypair) {
    (0, fs_1.writeFileSync)(path, JSON.stringify(Array.from(keypair.secretKey)));
}
function loadKeypair(path) {
    const raw = (0, fs_1.readFileSync)(path, "utf8");
    const secret = JSON.parse(raw);
    return web3_js_1.Keypair.fromSecretKey(Uint8Array.from(secret));
}
