import React, { useState, useEffect } from 'react';
import { authLogger, AuthLogEntry } from '../services/authLogger';
import { Bug, Download, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';

const AuthDebugPanel: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [logs, setLogs] = useState<AuthLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Charger l'état initial
  useEffect(() => {
    setIsEnabled(authLogger.isEnabled());
    setLogs(authLogger.getLogs());
  }, []);

  // Auto-refresh des logs toutes les 2 secondes si activé
  useEffect(() => {
    if (autoRefresh && showLogs) {
      const interval = setInterval(() => {
        setLogs(authLogger.getLogs());
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, showLogs]);

  const handleToggleDebug = () => {
    const newState = !isEnabled;
    authLogger.setEnabled(newState);
    setIsEnabled(newState);
  };

  const handleRefreshLogs = () => {
    setLogs(authLogger.getLogs());
  };

  const handleClearLogs = () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      authLogger.clear();
      setLogs([]);
    }
  };

  const handleExportJSON = () => {
    const data = authLogger.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportText = () => {
    const data = authLogger.exportLogsAsText();
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-logs-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-amber-600 bg-amber-50';
      case 'AUTH_EVENT': return 'text-green-600 bg-green-50';
      case 'DEBUG': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Bug className="text-purple-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Système de Debugging Auth</h3>
              <p className="text-xs text-slate-500">
                {isEnabled ? '✅ Activé - Tous les événements sont tracés' : '⚪ Désactivé'}
              </p>
            </div>
          </div>

          {/* Toggle principal */}
          <button
            onClick={handleToggleDebug}
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-sm ${
              isEnabled
                ? 'bg-green-500 text-white hover:bg-green-600'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {isEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Ce système trace :</strong> Connexion, déconnexion, événements Supabase Auth, appels API,
          création de profil, erreurs d'authentification et tout le flow de connexion.
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors font-medium"
          >
            {showLogs ? <EyeOff size={16} /> : <Eye size={16} />}
            {showLogs ? 'Masquer' : 'Voir'} les logs ({logs.length})
          </button>

          <button
            onClick={handleRefreshLogs}
            className="flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors font-medium"
          >
            <RefreshCw size={16} />
            Rafraîchir
          </button>

          <button
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <Trash2 size={16} />
            Effacer
          </button>

          <button
            onClick={handleExportJSON}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <Download size={16} />
            Export JSON
          </button>

          <button
            onClick={handleExportText}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            <Download size={16} />
            Export TXT
          </button>
        </div>

        {/* Auto-refresh toggle */}
        {showLogs && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-slate-600">Rafraîchir automatiquement (toutes les 2s)</span>
          </label>
        )}
      </div>

      {/* Logs Display */}
      {showLogs && (
        <div className="border-t border-slate-200">
          <div className="bg-slate-900 text-slate-100 p-3 font-mono text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">LOGS DE DÉBOGAGE ({logs.length})</span>
              <span className="text-slate-400">Session: {authLogger['sessionId']?.slice(0, 12)}...</span>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto bg-slate-50">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bug size={48} className="mx-auto mb-3 opacity-30" />
                <p>Aucun log pour le moment</p>
                <p className="text-xs mt-1">
                  {isEnabled ? 'Les événements apparaîtront ici' : 'Activez le debugging pour voir les logs'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {[...logs].reverse().map((log, index) => (
                  <div key={index} className="p-3 hover:bg-white transition-colors">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900 text-sm">{log.event}</span>
                          <span className="text-xs text-slate-400">• {log.source}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                          {log.userId && <span className="ml-2">• User: {log.userId.slice(0, 8)}...</span>}
                        </div>
                        {log.details && (
                          <pre className="mt-2 p-2 bg-slate-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span>
            {logs.filter(l => l.level === 'ERROR').length} erreurs •{' '}
            {logs.filter(l => l.level === 'AUTH_EVENT').length} événements auth •{' '}
            {logs.filter(l => l.level === 'DEBUG').length} debug
          </span>
          <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPanel;
