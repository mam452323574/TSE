import { createClient } from '@supabase/supabase-js';

// Remplacer par vos VRAIES valeurs
const SUPABASE_URL = 'VOTRE_URL_SUPABASE'; // ex: https://xxx.supabase.co
const SUPABASE_SERVICE_ROLE_KEY = 'VOTRE_CLE_SERVICE_ROLE'; // Clé secrète

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createAdminAccount() {
    const email = 'vanif13924@feriwor.com';
    const password = 'SuperAdminPassword123!';

    console.log(`Création de l'utilisateur admin : ${email}...`);

    // 1. Création dans auth.users (gère le hachage sécurisé du mot de passe)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Évite la vérification par email
    });

    if (authError) {
        console.error("Erreur création Auth :", authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user créé avec l'ID : ${userId}`);

    // 2. Création/mise à jour du profil public associé
    const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
            id: userId,
            email: email,
            username: 'SuperAdmin',
            account_tier: 'admin',      // <- LE ROLE EST ATTRIBUÉ ICI
            email_verified: true,
            has_seen_tutorial: true,
            welcome_credits: { health: 1, body: 1, nutrition: 1 }
        });

    if (profileError) {
        console.error("Erreur création profil :", profileError.message);
        return;
    }

    // 3. (Optionnel) Ajout d'une ligne dans health_scores pour éviter un bug de tableau de bord vide au 1er login
    await supabase.from('health_scores').upsert({
        user_id: userId,
        score: 100,
        calories_current: 0,
        calories_goal: 2000,
        bodyfat: 15,
        muscle: 40,
        date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id,date' });

    console.log('');
    console.log('🎉 COMPTE ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log('------------------------------------------------');
    console.log(`✉️ Email  : ${email}`);
    console.log(`🔑 Mot de passe : ${password}`);
    console.log(`👑 Rôle   : admin (20 scans/jour)`);
    console.log('------------------------------------------------');
}

createAdminAccount();
