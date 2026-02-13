/**
 * Service de logging pour le flow d'authentification
 * Système on/off pour tracer tous les événements de connexion/déconnexion
 */

export type LogLevel = 'INFO' | 'DEBUG' | 'ERROR' | 'WARN' | 'AUTH_EVENT';

export interface AuthLogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  details?: any;
  source: string;
  userId?: string;
  sessionId?: string;
}

class AuthLogger {
  private static instance: AuthLogger;
  private logs: AuthLogEntry[] = [];
  private maxLogs = 500; // Limite pour éviter les fuites mémoire
  private sessionId: string;

  private constructor() {
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.log('INFO', 'AuthLogger initialized', { sessionId: this.sessionId }, 'AuthLogger');
  }

  static getInstance(): AuthLogger {
    if (!AuthLogger.instance) {
      AuthLogger.instance = new AuthLogger();
    }
    return AuthLogger.instance;
  }

  /**
   * Vérifie si le debugging est activé
   */
  isEnabled(): boolean {
    try {
      const enabled = localStorage.getItem('auth_debug_enabled');
      return enabled === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Active ou désactive le debugging
   */
  setEnabled(enabled: boolean): void {
    try {
      localStorage.setItem('auth_debug_enabled', enabled.toString());
      this.log('INFO', `Auth debugging ${enabled ? 'ENABLED' : 'DISABLED'}`, {}, 'AuthLogger');
    } catch (e) {
      console.warn('Cannot set auth_debug_enabled in localStorage', e);
    }
  }

  /**
   * Log un événement d'authentification
   */
  log(level: LogLevel, event: string, details?: any, source: string = 'Unknown', userId?: string): void {
    const entry: AuthLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      details: this.sanitizeDetails(details),
      source,
      userId,
      sessionId: this.sessionId
    };

    // Ajouter au stockage interne
    this.logs.push(entry);

    // Limiter la taille du tableau
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log dans la console si activé
    if (this.isEnabled()) {
      const prefix = `[AUTH ${level}] [${source}]`;
      const message = `${prefix} ${event}`;

      switch (level) {
        case 'ERROR':
          console.error(message, details || '');
          break;
        case 'WARN':
          console.warn(message, details || '');
          break;
        case 'AUTH_EVENT':
          console.log(`%c${message}`, 'color: #10b981; font-weight: bold', details || '');
          break;
        case 'DEBUG':
          console.debug(message, details || '');
          break;
        default:
          console.log(message, details || '');
      }
    }

    // Sauvegarder dans localStorage pour persistance (optionnel)
    this.persistLogs();
  }

  /**
   * Sanitize les détails pour éviter de logger des données sensibles
   */
  private sanitizeDetails(details: any): any {
    if (!details) return details;

    const sanitized = { ...details };

    // Liste des clés à masquer
    const sensitiveKeys = [
      'password',
      'token',
      'access_token',
      'refresh_token',
      'apikey',
      'api_key',
      'secret',
      'auth_token',
      'bearer'
    ];

    const sanitizeObject = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      const result = Array.isArray(obj) ? [] : {};

      for (const key in obj) {
        if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
          result[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          result[key] = sanitizeObject(obj[key]);
        } else {
          result[key] = obj[key];
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Persiste les logs dans localStorage (derniers 100)
   */
  private persistLogs(): void {
    if (!this.isEnabled()) return;

    try {
      const recentLogs = this.logs.slice(-100);
      localStorage.setItem('auth_debug_logs', JSON.stringify(recentLogs));
    } catch (e) {
      // Ignore si quota dépassé
    }
  }

  /**
   * Récupère tous les logs
   */
  getLogs(): AuthLogEntry[] {
    return [...this.logs];
  }

  /**
   * Récupère les logs depuis localStorage
   */
  getPersistedLogs(): AuthLogEntry[] {
    try {
      const stored = localStorage.getItem('auth_debug_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Efface tous les logs
   */
  clear(): void {
    this.logs = [];
    try {
      localStorage.removeItem('auth_debug_logs');
    } catch {}
    this.log('INFO', 'Logs cleared', {}, 'AuthLogger');
  }

  /**
   * Exporte les logs en JSON
   */
  exportLogs(): string {
    const exportData = {
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Exporte les logs en format texte lisible
   */
  exportLogsAsText(): string {
    let text = `=== AUTH DEBUG LOGS ===\n`;
    text += `Session ID: ${this.sessionId}\n`;
    text += `Exported at: ${new Date().toISOString()}\n`;
    text += `Total logs: ${this.logs.length}\n`;
    text += `\n${'='.repeat(80)}\n\n`;

    this.logs.forEach((log, index) => {
      text += `[${index + 1}] ${log.timestamp} | ${log.level} | ${log.source}\n`;
      text += `Event: ${log.event}\n`;
      if (log.userId) text += `User ID: ${log.userId}\n`;
      if (log.details) {
        text += `Details: ${JSON.stringify(log.details, null, 2)}\n`;
      }
      text += `${'-'.repeat(80)}\n`;
    });

    return text;
  }

  /**
   * Log spécifique pour les événements Supabase Auth
   */
  logAuthStateChange(event: string, session: any): void {
    this.log(
      'AUTH_EVENT',
      `Supabase Auth State Change: ${event}`,
      {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider,
        expiresAt: session?.expires_at
      },
      'Supabase.onAuthStateChange',
      session?.user?.id
    );
  }

  /**
   * Log spécifique pour les appels API d'authentification
   */
  logAuthApiCall(method: string, endpoint: string, params?: any, response?: any, error?: any): void {
    const level: LogLevel = error ? 'ERROR' : 'DEBUG';

    this.log(
      level,
      `Auth API Call: ${method}`,
      {
        endpoint,
        params,
        success: !error,
        response: error ? undefined : response,
        error: error ? { message: error.message, code: error.code } : undefined
      },
      'AuthAPI'
    );
  }

  /**
   * Log spécifique pour le flow de connexion
   */
  logLoginFlow(step: string, details?: any): void {
    this.log('INFO', `Login Flow: ${step}`, details, 'LoginFlow');
  }

  /**
   * Log spécifique pour le flow de déconnexion
   */
  logLogoutFlow(step: string, details?: any): void {
    this.log('INFO', `Logout Flow: ${step}`, details, 'LogoutFlow');
  }
}

// Export de l'instance singleton
export const authLogger = AuthLogger.getInstance();

// Helpers pour faciliter l'utilisation
export const logAuthEvent = (event: string, details?: any, source?: string) => {
  authLogger.log('AUTH_EVENT', event, details, source);
};

export const logAuthError = (event: string, error: any, source?: string) => {
  authLogger.log('ERROR', event, error, source);
};

export const logAuthDebug = (event: string, details?: any, source?: string) => {
  authLogger.log('DEBUG', event, details, source);
};
