import React, { useContext, useRef, useState, useEffect } from 'react';
import { AuthContext } from '../App';
import { DataService } from '../services/dataService';
import { Camera, LogOut, Award, Users, Save, Trash2, Plus } from 'lucide-react';
import { Profile, Recruit } from '../types';
import AuthDebugPanel from '../components/AuthDebugPanel';
import DataSyncPanel from '../components/DataSyncPanel';

const ProfilePage: React.FC = () => {
  const { user, logout } = useContext(AuthContext);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  
  // Local state for editing
  const [profileData, setProfileData] = useState<Partial<Profile>>({});
  const [newRecruitName, setNewRecruitName] = useState('');
  const [recruits, setRecruits] = useState<Recruit[]>([]);

  useEffect(() => {
    if (user) {
        setProfileData({
            full_name: user.full_name,
            team_name: user.team_name,
            sponsor: user.sponsor,
            email: user.email,
            avatar_url: user.avatar_url,
            // ... other fields
        });
        setRecruits(user.recruits || []);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      setUploading(true);
      try {
          const url = await DataService.updateProfileAvatar(e.target.files[0]);
          setProfileData(prev => ({ ...prev, avatar_url: url }));
      } catch (err) {
          alert("Erreur upload");
      } finally {
          setUploading(false);
      }
  };

  const handleSaveProfile = async () => {
      try {
          await DataService.updateProfile({
              ...profileData,
              recruits: recruits
          });
          alert("Profil sauvegardé !");
      } catch (e) {
          alert("Erreur sauvegarde");
      }
  };

  const handleAddRecruit = () => {
      if (newRecruitName.trim()) {
          const newRecruit: Recruit = {
              id: `rec_${Date.now()}`,
              name: newRecruitName,
              join_date: new Date().toISOString().split('T')[0]
          };
          setRecruits([...recruits, newRecruit]);
          setNewRecruitName('');
      }
  };

  const handleRemoveRecruit = (id: string) => {
      setRecruits(recruits.filter(r => r.id !== id));
  };

  return (
    <div className="p-4 pt-8 pb-20">
      <h2 className="text-2xl font-serif font-bold text-slate-900 mb-6">Mon Espace</h2>

      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-6">
          
          {/* Avatar Section */}
          <div className="flex items-start gap-6 mb-8">
              <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-50 shadow-md bg-slate-200">
                      <img src={profileData.avatar_url || 'https://via.placeholder.com/150'} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-white border border-slate-200 text-slate-600 p-2 rounded-full shadow-sm hover:text-rose-600 transition"
                  >
                      <Camera size={16} />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              </div>
              
              <div className="flex-1 space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase">Nom Complet</label>
                         <input 
                            value={profileData.full_name || ''}
                            onChange={e => setProfileData({...profileData, full_name: e.target.value})}
                            className="w-full font-bold text-slate-800 border-b border-slate-200 bg-white focus:border-rose-500 outline-none py-1"
                         />
                     </div>
                     <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase">Titre / Métier</label>
                         <input 
                            defaultValue="Conseiller Parfum"
                            className="w-full border-b border-slate-200 bg-white outline-none py-1 text-slate-600"
                         />
                     </div>
                 </div>
                 <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase">Email</label>
                     <input 
                        value={profileData.email || ''}
                        readOnly
                        className="w-full text-slate-500 border-b border-slate-100 py-1 bg-white"
                     />
                 </div>
              </div>
          </div>

          {/* Team Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nom d'Équipe</label>
                  <input 
                      value={profileData.team_name || ''}
                      onChange={e => setProfileData({...profileData, team_name: e.target.value})}
                      placeholder="Ma Super Équipe"
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
              </div>
              <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Marraine / Parrain</label>
                  <input 
                      value={profileData.sponsor || ''}
                      onChange={e => setProfileData({...profileData, sponsor: e.target.value})}
                      placeholder="Nom du sponsor"
                      className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-slate-800"
                  />
              </div>
          </div>
          
          <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Fuseau Horaire</label>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                  Europe/Paris
              </div>
          </div>

          <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSaveProfile}
                className="bg-rose-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-rose-200 hover:bg-rose-700 transition"
              >
                  <Save size={18} />
                  Sauvegarder mon profil
              </button>
          </div>
      </div>

      {/* Recruits Section */}
      <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-lg">Mes Filleules</h3>
              <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">{recruits.length}</span>
          </div>

          <div className="flex gap-2 mb-4">
              <input 
                  value={newRecruitName}
                  onChange={e => setNewRecruitName(e.target.value)}
                  placeholder="Nom de la nouvelle recrue"
                  className="flex-1 p-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500 text-sm text-slate-800"
              />
              <button 
                onClick={handleAddRecruit}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-700"
              >
                  Ajouter
              </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-100">
              <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                      <tr>
                          <th className="p-3">Nom</th>
                          <th className="p-3">Date d'arrivée</th>
                          <th className="p-3 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {recruits.length === 0 ? (
                          <tr>
                              <td colSpan={3} className="p-4 text-center text-slate-400 italic">Aucune filleule pour le moment.</td>
                          </tr>
                      ) : (
                          recruits.map(recruit => (
                              <tr key={recruit.id} className="hover:bg-slate-50 transition">
                                  <td className="p-3 font-medium text-slate-800">{recruit.name}</td>
                                  <td className="p-3 text-slate-500">{recruit.join_date}</td>
                                  <td className="p-3 text-right">
                                      <button 
                                        onClick={() => handleRemoveRecruit(recruit.id)}
                                        className="text-slate-300 hover:text-red-500 transition"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))
                      )}
                  </tbody>
              </table>
          </div>
      </div>
      
      {/* Coach Box (Optional Integration) */}
      <div className="bg-gradient-to-br from-rose-600 to-rose-500 rounded-xl p-6 text-white shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                  <Award size={24} />
              </div>
              <div>
                  <h3 className="font-bold text-lg">Coach IA Actif</h3>
                  <p className="text-white/80 text-sm">Votre assistant est prêt à vous aider.</p>
              </div>
          </div>
          <button className="w-full bg-white text-rose-600 font-bold py-2 rounded-lg hover:bg-rose-50 transition">
              Demander un conseil
          </button>
      </div>

      {/* Auth Debug Panel */}
      <div className="mb-6">
        <AuthDebugPanel />
      </div>

      {/* Data Sync Validation Panel */}
      <div className="mb-6">
        <DataSyncPanel />
      </div>

      <button
        onClick={logout}
        className="w-full bg-red-50 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition"
      >
          <LogOut size={18} />
          Se déconnecter
      </button>
    </div>
  );
};

export default ProfilePage;