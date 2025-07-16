// Simple client-side encryption utilities
// In production, use more robust encryption libraries

export class SimpleEncryption {
  private static key = "lech-world-secret-key-2024";

  static encrypt(text: string): string {
    try {
      // Simple XOR encryption for demo purposes
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return btoa(result);
    } catch (error) {
      console.error("Encryption error:", error);
      return text;
    }
  }

  static decrypt(encryptedText: string): string {
    try {
      const text = atob(encryptedText);
      let result = "";
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(
          text.charCodeAt(i) ^ this.key.charCodeAt(i % this.key.length)
        );
      }
      return result;
    } catch (error) {
      console.error("Decryption error:", error);
      return encryptedText;
    }
  }

  static encryptCredentials(username: string, password: string): string {
    const credentials = { username, password };
    return this.encrypt(JSON.stringify(credentials));
  }

  static decryptCredentials(encryptedCredentials: string): { username: string; password: string } {
    try {
      const decrypted = this.decrypt(encryptedCredentials);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Credential decryption error:", error);
      return { username: "", password: "" };
    }
  }
}

export default SimpleEncryption;
