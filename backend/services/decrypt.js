const crypto = require('crypto');

/**
 * Descriptografa payload do ClickBank
 * Algoritmo: SHA1(secretKey) → hex → 32 chars → AES-256-CBC
 * @param {string} notification - base64 do payload criptografado
 * @param {string} iv - base64 do IV
 * @param {string} secretKey - Secret Key configurada no ClickBank
 * @returns {object} payload descriptografado
 */
function decryptClickBank(notification, iv, secretKey) {
  const sha1hex = crypto.createHash('sha1').update(secretKey).digest('hex');
  const key = Buffer.from(sha1hex.slice(0, 32), 'utf8');
  const ivBuf = Buffer.from(iv, 'base64');
  const data = Buffer.from(notification, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-cbc', key, ivBuf);
  let decrypted = decipher.update(data, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted.trim());
}

/**
 * Criptografa Secret Key para armazenamento seguro no banco
 */
function encryptSecretKey(secretKey) {
  const encKey = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encKey, iv);
  let encrypted = cipher.update(secretKey, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return `${iv.toString('base64')}:${encrypted}`;
}

/**
 * Descriptografa Secret Key do banco
 */
function decryptSecretKey(stored) {
  const [ivB64, encrypted] = stored.split(':');
  const encKey = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').slice(0, 32);
  const iv = Buffer.from(ivB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encKey, iv);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { decryptClickBank, encryptSecretKey, decryptSecretKey };
