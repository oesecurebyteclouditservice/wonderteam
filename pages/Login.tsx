import React, { useContext, useState } from 'react';
import { AuthContext } from '../App';
import { Sparkles, Eye, EyeOff, KeyRound } from 'lucide-react';
import { DataService } from '../services/dataService';

const Login: React.FC = () => {
  const { login } = useContext(AuthContext);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleGoogleLogin = async () => {
      try {
          await DataService.signInWithGoogle();
          if (!(import.meta as any).env.VITE_SUPABASE_URL) {
              login(); 
          }
      } catch (error) {
          console.error(error);
          alert("Erreur de connexion Google");
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      try {
          if (isRegistering) {
              if (password !== confirmPassword) {
                  alert("Les mots de passe ne correspondent pas.");
                  setLoading(false);
                  return;
              }
              const { error } = await DataService.signUpWithEmail(email, password, fullName);
              if (error) throw error;
              alert("Compte créé avec succès !");
              // Auto-login or ask to login
              login();
          } else {
              const { error } = await DataService.signInWithEmail(email, password);
              if (error) throw error;
              login();
          }
      } catch (error: any) {
          console.error(error);
          alert(error.message || "Une erreur est survenue.");
      } finally {
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
        <p className="text-slate-500 mb-8 font-light">Votre assistant de vente luxe</p>

        {/* Google Button */}
        <button 
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-rose-200 text-slate-700 font-medium py-3 rounded-2xl hover:bg-rose-50 transition-all flex items-center justify-center gap-3 mb-6 relative group"
        >
            <div className="absolute inset-0 rounded-2xl border-2 border-rose-100 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuer avec Google
        </button>

        {/* Divider */}
        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rose-100"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-400 font-medium">ou</span>
            </div>
        </div>

        {/* Form */}
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
                    {isRegistering ? 'Créer mon compte' : 'Se connecter'}
                    {!isRegistering && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
                </>
            )}
          </button>
        </form>

        <div className="mt-8">
            <p className="text-sm text-slate-500">
                {isRegistering ? "Déjà inscrit ?" : "Pas encore de compte ?"}
                <button 
                    onClick={() => { setIsRegistering(!isRegistering); setConfirmPassword(''); }}
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