/**
 * Script de test de configuration d'authentification Supabase
 * Vérifie si la confirmation d'email est activée/désactivée
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes');
  console.error('Vérifiez que VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthConfig() {
  console.log('🔍 Test de Configuration d\'Authentification Supabase\n');
  console.log('URL:', SUPABASE_URL);
  console.log('');

  // Générer un email de test unique
  const testEmail = `test-${Date.now()}@wonderteam-test.com`;
  const testPassword = 'Test123456!';
  const testName = 'Test User';

  console.log('📝 Tentative d\'inscription avec:');
  console.log(`   Email: ${testEmail}`);
  console.log('   Password: ********');
  console.log('');

  try {
    // Tenter une inscription
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          full_name: testName
        }
      }
    });

    if (error) {
      console.error('❌ Erreur lors de l\'inscription:', error.message);
      return;
    }

    console.log('✅ Inscription réussie !');
    console.log('');

    // Analyser la réponse
    console.log('📊 Analyse de la Configuration:\n');

    if (data.session) {
      console.log('✅ SESSION CRÉÉE IMMÉDIATEMENT');
      console.log('   → La confirmation d\'email est DÉSACTIVÉE');
      console.log('   → Les utilisateurs peuvent se connecter immédiatement');
      console.log('   → Comportement: Connexion automatique après inscription');
      console.log('');
      console.log('🎯 Recommandation:');
      console.log('   Cette configuration est adaptée pour le développement/test.');
      console.log('   En production, considérez activer la confirmation d\'email.');
    } else if (data.user && !data.session) {
      console.log('⚠️  AUCUNE SESSION CRÉÉE');
      console.log('   → La confirmation d\'email est ACTIVÉE');
      console.log('   → Les utilisateurs doivent vérifier leur email avant de se connecter');
      console.log('   → Comportement: Email de confirmation envoyé');
      console.log('');
      console.log('📧 Email de Confirmation:');
      console.log(`   Un email a été envoyé à: ${testEmail}`);
      console.log('   (Note: Il s\'agit d\'un email de test qui ne sera pas reçu)');
      console.log('');
      console.log('🎯 Recommandation:');
      console.log('   Pour permettre la connexion immédiate, désactivez la confirmation d\'email:');
      console.log('   → Dashboard Supabase → Authentication → Settings');
      console.log('   → Décocher "Enable email confirmations"');
      console.log('');
      console.log('   Consultez SUPABASE-EMAIL-CONFIG.md pour plus de détails.');
    } else {
      console.log('❓ RÉPONSE INATTENDUE');
      console.log('   → Vérifiez la configuration Supabase');
    }

    console.log('');
    console.log('📋 Détails Techniques:');
    console.log('   User ID:', data.user?.id || 'N/A');
    console.log('   Email:', data.user?.email || 'N/A');
    console.log('   Email Confirmed:', data.user?.email_confirmed_at ? '✅ Oui' : '❌ Non');
    console.log('   Has Session:', data.session ? '✅ Oui' : '❌ Non');
    console.log('   Session Expires:', data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A');

    // Nettoyer - Supprimer le compte de test si possible
    if (data.session) {
      console.log('');
      console.log('🧹 Nettoyage du compte de test...');
      const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user!.id);
      if (!deleteError) {
        console.log('✅ Compte de test supprimé');
      }
    }

  } catch (err: any) {
    console.error('❌ Erreur inattendue:', err.message);
  }

  console.log('');
  console.log('═'.repeat(60));
  console.log('Test terminé');
}

// Exécuter le test
testAuthConfig().catch(console.error);
