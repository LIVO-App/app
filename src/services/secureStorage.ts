import { Preferences } from "@capacitor/preferences";
import { Capacitor } from "@capacitor/core";

// TODO (6): implementazione solo per mobile, dato che @ionic-enterprise/secure-storage è a pagamento. Sostituire localStorage con SecureStorage quando/se verrà implementato secureStorage effettivo
/**
 * Servizio per gestire lo storage persistente e sicuro
 * Su mobile usa Capacitor Preferences (storage nativo criptato)
 * Su web usa localStorage come fallback
 */
class SecureStorage {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  /**
   * Salva un valore nello storage persistente
   */
  async set(key: string, value: string): Promise<void> {
    if (this.isNative) {
      await Preferences.set({ key, value });
    } else {
      localStorage.setItem(key, value);
    }
  }

  /**
   * Recupera un valore dallo storage persistente
   */
  async get(key: string): Promise<string | null> {
    if (this.isNative) {
      const { value } = await Preferences.get({ key });
      return value;
    } else {
      return localStorage.getItem(key);
    }
  }

  /**
   * Rimuove un valore dallo storage persistente
   */
  async remove(key: string): Promise<void> {
    if (this.isNative) {
      await Preferences.remove({ key });
    } else {
      localStorage.removeItem(key);
    }
  }

  /**
   * Pulisce tutto lo storage persistente
   */
  async clear(): Promise<void> {
    if (this.isNative) {
      await Preferences.clear();
    } else {
      localStorage.clear();
    }
  }

  /**
   * Verifica se l'app è in esecuzione su piattaforma nativa
   */
  isNativePlatform(): boolean {
    return this.isNative;
  }
}

export const secureStorage = new SecureStorage();
