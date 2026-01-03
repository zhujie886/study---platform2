import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * 使用密码加密文本
 * @param text 要加密的文本
 * @param password 加密密码
 * @returns 加密后的文本和盐值
 */
export function encryptWithPassword(text: string, password: string): { encrypted: string; salt: string } {
  // 生成随机盐值
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  
  // 使用PBKDF2从密码派生密钥
  const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  
  // 生成随机IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // 创建加密器
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // 加密数据
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // 获取认证标签
  const authTag = cipher.getAuthTag();
  
  // 组合结果：IV + AuthTag + 加密数据
  const result = iv.toString('hex') + authTag.toString('hex') + encrypted;
  
  return { encrypted: result, salt };
}

/**
 * 使用密码解密文本
 * @param encryptedData 加密后的数据
 * @param password 解密密码
 * @param salt 盐值
 * @returns 解密后的文本
 */
export function decryptWithPassword(encryptedData: string, password: string, salt: string): string {
  try {
    // 从密码和盐值派生密钥
    const key = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    // 提取IV
    const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
    
    // 提取AuthTag
    const authTag = Buffer.from(encryptedData.slice(IV_LENGTH * 2, IV_LENGTH * 2 + TAG_LENGTH * 2), 'hex');
    
    // 提取加密数据
    const encrypted = encryptedData.slice(IV_LENGTH * 2 + TAG_LENGTH * 2);
    
    // 创建解密器
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // 解密数据
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: Invalid password or corrupted data');
  }
}

/**
 * 生成随机密钥（用于系统级加密）
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 哈希密码（用于用户认证）
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * 验证密码
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === originalHash;
}



