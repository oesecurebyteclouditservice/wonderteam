import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { Sparkles, Eye, EyeOff, KeyRound, AlertTriangle, Info, Mail } from 'lucide-react';
import { DataService, checkMockMode } from '../services/dataService';

function getAuthErrorMessage(params: URLSearchParams): string | null {
  const error = params.get('error');
  if (!error) return null;

  const errorDescription = params.get('error_description')?.replace(/\+/g, ' ') || '';

  if (error === 'server_error') {
    return "Erreur du serveur d'authentification. Veuillez reessayer plus tard.";
  }
  return `Erreur de connexion : ${errorDescription || error}`;
}

const Login: React.FC = () => {
  const { login } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMock, setIsMock] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Check for OAuth error params in URL
    const params = new URLSearchParams(window.location.search);
    const errorMsg = getAuthErrorMessage(params);
    if (errorMsg) {
      setAuthError(errorMsg);
      // Clean URL without reloading
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Check mock mode
    checkMockMode().then(setIsMock);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setAuthError(null);

      try {
          if (isRegistering) {
              if (password !== confirmPassword) {
                  setAuthError("Les mots de passe ne correspondent pas.");
                  setLoading(false);
                  return;
              }
              if (password.length < 6) {
                  setAuthError("Le mot de passe doit contenir au moins 6 caracteres.");
                  setLoading(false);
                  return;
              }
              const { data, error } = await DataService.signUpWithEmail(email, password, fullName);
              if (error) throw error;

              // Vérifier si l'utilisateur a une session (email confirmé automatiquement)
              if (data?.session) {
                  // Email confirmé automatiquement, connexion directe
                  login();
              } else if (data?.user && !data?.session) {
                  // Email nécessite confirmation
                  setAuthError("✅ Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte, puis reconnectez-vous.");
                  setIsRegistering(false); // Basculer vers le mode connexion
              }
          } else {
              const { error } = await DataService.signInWithEmail(email, password);
              if (error) throw error;
              login();
          }
      } catch (error: any) {
          console.error(error);
          if (error.message?.includes('Invalid login credentials')) {
            setAuthError("Email ou mot de passe incorrect. Si vous venez de vous inscrire, vérifiez votre email de confirmation.");
          } else if (error.message?.includes('Email not confirmed')) {
            setAuthError("📧 Votre email n'est pas encore confirmé. Veuillez vérifier votre boîte mail (et les spams) et cliquer sur le lien de confirmation.");
          } else if (error.message?.includes('compte existe déjà')) {
            setAuthError(error.message);
            setIsRegistering(false); // Basculer vers le mode connexion
          } else if (error.message?.includes('User already registered')) {
            setAuthError("Un compte existe déjà avec cet email. Veuillez vous connecter.");
            setIsRegistering(false);
          } else {
            setAuthError(error.message || "Une erreur est survenue.");
          }
      } finally {
          setLoading(false);
      }
  };

  const handleGoogleSignIn = async () => {
      setLoading(true);
      setAuthError(null);
      try {
          const { error } = await DataService.signInWithGoogle();
          if (error) throw error;
          // OAuth redirect will happen automatically, no need to call login() here
      } catch (error: any) {
          console.error(error);
          setAuthError(error.message || "Erreur lors de la connexion avec Google.");
          setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-white px-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center">

        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white mb-6 shadow-lg shadow-rose-200 transform rotate-3">
          <Sparkles size={32} />
        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 mb-2">Wonder Team</h1>
        <p className="text-slate-500 mb-6 font-light">Votre assistant de vente luxe</p>

        {/* Mock Mode Banner */}
        {isMock && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <div className="flex items-start gap-2">
              <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-amber-800">Mode Demonstration</p>
                <p className="text-xs text-amber-700 mt-1">
                  La base de donnees est temporairement indisponible. Les donnees affichees sont simulees. Vous pouvez vous connecter avec n'importe quel email.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-red-200 text-left">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{authError}</p>
            </div>
          </div>
        )}

        {/* Email/Password Form (Primary) */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">

          {isRegistering && (
             <div>
                <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Nom complet</label>
                <input
                  type="text"
                  placeholder="Julie Vendeur"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-300"
                />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Email</label>
            <input
              type="email"
              placeholder="vous@exemple.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative">
            <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Mot de passe</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all placeholder:text-slate-300"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {isRegistering && (
             <div className="relative">
                <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Confirmer mot de passe</label>
                <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-900 focus:outline-none focus:ring-2 transition-all placeholder:text-slate-300 ${
                          confirmPassword && password !== confirmPassword
                          ? 'border-red-300 focus:ring-red-500'
                          : 'border-slate-200 focus:ring-rose-500'
                      }`}
                    />
                    {confirmPassword && password !== confirmPassword && (
                        <div className="absolute right-3 top-3 text-red-500">
                             <KeyRound size={18} className="text-red-400" />
                        </div>
                    )}
                </div>
                {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] text-red-500 mt-1 ml-1">Les mots de passe ne correspondent pas</p>
                )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
                <>
                    {isRegistering ? 'Creer mon compte' : 'Se connecter'}
                    {!isRegistering && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="mt-6 mb-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="text-xs text-slate-400 font-medium">OU</span>
            <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* Google Sign-In Button */}
        <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white text-slate-700 border-2 border-slate-200 font-semibold py-3.5 rounded-xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            ) : (
                <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continuer avec Google
                </>
            )}
        </button>

        <div className="mt-6">
            <p className="text-sm text-slate-500">
                {isRegistering ? "Deja inscrit ?" : "Pas encore de compte ?"}
                <button
                    onClick={() => { setIsRegistering(!isRegistering); setConfirmPassword(''); setAuthError(null); }}
                    className="ml-1 text-rose-600 font-bold hover:underline focus:outline-none"
                >
                    {isRegistering ? "Se connecter" : "S'inscrire"}
                </button>
            </p>
        </div>

        {!isRegistering && (
             <div className="mt-6 text-xs text-slate-300">
               En continuant, vous acceptez nos <a href="#" className="underline">conditions d'utilisation</a>
             </div>
        )}
      </div>
    </div>
  );
};

export default Login;
