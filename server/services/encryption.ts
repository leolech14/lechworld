import sodium from 'libsodium-wrappers';

const keyEnv = process.env.ENCRYPTION_KEY;
if (!keyEnv) {
  throw new Error('ENCRYPTION_KEY environment variable is required');
}
// Expect key to be base64 encoded
const key = Buffer.from(keyEnv, 'base64');

export async function encrypt(plain: string): Promise<{ciphertext: string; nonce: string}> {
  await sodium.ready;
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const cipher = sodium.crypto_secretbox_easy(plain, nonce, key);
  return {
    ciphertext: Buffer.from(cipher).toString('base64'),
    nonce: Buffer.from(nonce).toString('base64')
  };
}

export async function decrypt(ciphertext: string, nonce: string): Promise<string> {
  await sodium.ready;
  const cipher = Buffer.from(ciphertext, 'base64');
  const n = Buffer.from(nonce, 'base64');
  const message = sodium.crypto_secretbox_open_easy(cipher, n, key);
  return Buffer.from(message).toString();
}
