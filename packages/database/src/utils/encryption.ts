/**
 * @fileoverview Encryption utilities for sensitive data
 * @description Provides secure encryption/decryption for passwords and sensitive information
 */

import * as crypto from 'crypto';

// Use environment variable or a secure default (should be 32 bytes)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.scryptSync('default-key-change-in-production', 'salt', 32);
const IV_LENGTH = 16; // For AES, this is always 16

export const encryptionUtils = {
  /**
   * Encrypts a string using AES-256-GCM
   * @param text - The text to encrypt
   * @returns Encrypted text with IV prepended
   */
  encrypt(text: string): string {
    if (!text) return text;
    
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher('aes-256-gcm', ENCRYPTION_KEY);
    cipher.setAAD(iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + authTag + encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  },

  /**
   * Decrypts a string using AES-256-GCM
   * @param encryptedText - The encrypted text to decrypt
   * @returns Decrypted text
   */
  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher('aes-256-gcm', ENCRYPTION_KEY);
      decipher.setAAD(iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  },

  /**
   * Encrypts sensitive member program data
   * @param data - Object containing sensitive fields
   * @returns Object with encrypted sensitive fields
   */
  encryptMemberProgramData(data: {
    sitePassword?: string;
    milesPassword?: string;
  }) {
    return {
      sitePasswordEncrypted: data.sitePassword ? this.encrypt(data.sitePassword) : null,
      milesPasswordEncrypted: data.milesPassword ? this.encrypt(data.milesPassword) : null,
    };
  },

  /**
   * Decrypts sensitive member program data
   * @param data - Object containing encrypted fields
   * @returns Object with decrypted sensitive fields
   */
  decryptMemberProgramData(data: {
    sitePasswordEncrypted?: string | null;
    milesPasswordEncrypted?: string | null;
  }) {
    return {
      sitePassword: data.sitePasswordEncrypted ? this.decrypt(data.sitePasswordEncrypted) : null,
      milesPassword: data.milesPasswordEncrypted ? this.decrypt(data.milesPasswordEncrypted) : null,
    };
  },
};

/**
 * Validates that the encryption key is properly configured
 */
export function validateEncryptionSetup(): boolean {
  try {
    const testData = 'test-encryption-data';
    const encrypted = encryptionUtils.encrypt(testData);
    const decrypted = encryptionUtils.decrypt(encrypted);
    
    return decrypted === testData;
  } catch (error) {
    console.error('Encryption setup validation failed:', error);
    return false;
  }
}

/**
 * Generates a new encryption key (for initial setup)
 * @returns A new random encryption key as hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}