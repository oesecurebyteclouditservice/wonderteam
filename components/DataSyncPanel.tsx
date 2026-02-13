import React, { useState } from 'react';
import { dataSyncValidator, SyncValidationResult } from '../services/dataSyncValidator';
import { DataService } from '../services/dataService';
import { RefreshCw, Download, CheckCircle, XCircle, AlertTriangle, Database } from 'lucide-react';

const DataSyncPanel: React.FC = () => {
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<SyncValidationResult | null>(null);

  const handleValidate = async () => {
    setValidating(true);
    try {
      // Récupérer les données du Frontend
      const [products, clients, orders, profile] = await Promise.all([
        DataService.getProducts(),
        DataService.getClients(),
        DataService.getOrders(),
        DataService.getProfile()
      ]);

      // Lancer la validation
      const validationResult = await dataSyncValidator.validate({
        products,
        clients,
        orders,
        profile
      });

      setResult(validationResult);
    } catch (error: any) {
      console.error('Validation error:', error);
      alert(`Erreur lors de la validation: ${error.message}`);
    } finally {
      setValidating(false);
    }
  };

  const handleExport = (format: 'json' | 'text') => {
    if (result) {
      dataSyncValidator.exportReport(result, format);
    }
  };

  const getStatusIcon = (synced: boolean) => {
    return synced ? (
      <CheckCircle className="text-green-500" size={20} />
    ) : (
      <XCircle className="text-red-500" size={20} />
    );
  };

  const getStatusBadge = (synced: boolean) => {
    return synced ? (
      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-bold text-xs">✅ SYNCHRONISÉ</span>
    ) : (
      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-bold text-xs">❌ DÉSYNCHRONISÉ</span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Database className="text-blue-600" size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Validation de Synchronisation</h3>
              <p className="text-xs text-slate-500">
                Vérifiez l'alignement des données Frontend ↔ Backend
              </p>
            </div>
          </div>

          <button
            onClick={handleValidate}
            disabled={validating}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={validating ? 'animate-spin' : ''} size={16} />
            {validating ? 'Validation...' : 'Valider'}
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <p className="text-sm text-slate-600">
          <strong>Cette validation compare :</strong> Les données actuellement en mémoire (Frontend)
          avec les données stockées dans Supabase (Backend). Détecte les incohérences, les données
          manquantes et les erreurs de synchronisation.
        </p>
      </div>

      {/* Results */}
      {result && (
        <div className="p-4 space-y-4">
          {/* Global Status */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-sm text-slate-500 mb-1">Statut Global</p>
              <div className="flex items-center gap-2">
                {getStatusBadge(result.isValid)}
                <span className="text-xs text-slate-400">
                  {new Date(result.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="flex items-center gap-2 px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={14} />
                JSON
              </button>
              <button
                onClick={() => handleExport('text')}
                className="flex items-center gap-2 px-3 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Download size={14} />
                TXT
              </button>
            </div>
          </div>

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="text-red-500 mt-0.5" size={18} />
                <p className="font-bold text-red-700">Erreurs détectées</p>
              </div>
              <ul className="text-sm text-red-600 space-y-1 ml-6 list-disc">
                {result.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Products */}
            <SyncCard
              title="Produits"
              status={result.summary.products}
              details={result.details.products}
            />

            {/* Clients */}
            <SyncCard
              title="Clients"
              status={result.summary.clients}
              details={result.details.clients}
            />

            {/* Orders */}
            <SyncCard
              title="Commandes"
              status={result.summary.orders}
              details={result.details.orders}
            />

            {/* Profile */}
            <SyncCard
              title="Profil"
              status={result.summary.profile}
              details={result.details.profile}
            />
          </div>
        </div>
      )}

      {/* Empty State */}
      {!result && !validating && (
        <div className="p-8 text-center text-slate-400">
          <Database size={48} className="mx-auto mb-3 opacity-30" />
          <p>Aucune validation effectuée</p>
          <p className="text-xs mt-1">
            Cliquez sur "Valider" pour lancer une vérification de synchronisation
          </p>
        </div>
      )}
    </div>
  );
};

// Composant pour afficher une carte de synchronisation
const SyncCard: React.FC<{
  title: string;
  status: any;
  details: any[];
}> = ({ title, status, details }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        className={`p-3 cursor-pointer transition-colors ${
          status.synced ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800">{title}</h4>
          {status.synced ? (
            <CheckCircle className="text-green-600" size={18} />
          ) : (
            <XCircle className="text-red-600" size={18} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Frontend</p>
            <p className="font-bold text-slate-800">{status.frontendCount}</p>
          </div>
          <div>
            <p className="text-slate-500">Backend</p>
            <p className="font-bold text-slate-800">{status.backendCount}</p>
          </div>
        </div>

        {!status.synced && (
          <div className="mt-2 pt-2 border-t border-slate-200 space-y-1 text-xs">
            {status.mismatches > 0 && (
              <p className="text-amber-600">⚠️ {status.mismatches} incohérence(s)</p>
            )}
            {status.missingInBackend > 0 && (
              <p className="text-red-600">❌ {status.missingInBackend} manquant(s) en Backend</p>
            )}
            {status.missingInFrontend > 0 && (
              <p className="text-blue-600">📥 {status.missingInFrontend} manquant(s) en Frontend</p>
            )}
          </div>
        )}
      </div>

      {showDetails && details.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-200 max-h-48 overflow-y-auto">
          <p className="text-xs font-bold text-slate-600 mb-2">Détails ({details.length})</p>
          <div className="space-y-2">
            {details.map((detail, index) => (
              <div key={index} className="text-xs p-2 bg-white rounded border border-slate-200">
                <p className="font-mono text-slate-800">{detail.message}</p>
                {detail.field && (
                  <div className="mt-1 space-y-0.5 text-slate-600">
                    <p>Frontend: {JSON.stringify(detail.frontendValue)}</p>
                    <p>Backend: {JSON.stringify(detail.backendValue)}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataSyncPanel;
