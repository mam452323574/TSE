const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qpogulljnnacrxdjbwiz.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2d1bGxqbm5hY3J4ZGpid2l6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDYwNjc5MywiZXhwIjoyMDc2MTgyNzkzfQ.Q_W35tXUAWCIw7Ie-2QNLS9NCoYZAs2I72gU4q3kvEM';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createSchoolAccount() {
    const email = 'school@tse.app';
    const password = 'school123';

    console.log(`Création du compte school : ${email}...`);

    // Supprimer l'ancien s'il existe (pour pouvoir relancer le script)
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = usersData?.users?.find(u => u.email === email);
    if (existingUser) {
        await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
        console.log('Ancien compte supprimé.');
    }

    // 1. Création dans auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
    });

    if (authError) {
        console.error("Erreur création Auth :", authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`✅ Auth user créé avec l'ID : ${userId}`);

    // 2. Profil admin (premium permanent, skip RevenueCat)
    await supabaseAdmin.from('user_profiles').upsert({
        id: userId,
        email: email,
        username: 'TSE',
        account_tier: 'admin',
        email_verified: true,
        has_seen_tutorial: true,
        subscription_status: 'active',
        subscription_expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        welcome_credits: { health: 1, body: 1, nutrition: 1 }
    });

    // 3. Health scores de démo
    await supabaseAdmin.from('health_scores').upsert({
        user_id: userId,
        score: 85,
        calories_current: 0,
        calories_goal: 2200,
        bodyfat: 18,
        muscle: 35,
        date: new Date().toISOString().split('T')[0],
    }, { onConflict: 'user_id,date' });

    // 4. OAuth connection
    await supabaseAdmin.from('oauth_connections').upsert({
        user_id: userId,
        provider: 'email',
        provider_user_id: userId,
        provider_email: email,
    });

    console.log('');
    console.log('🎉 COMPTE SCHOOL ADMIN CRÉÉ AVEC SUCCÈS !');
    console.log(`📧 Email    : ${email}`);
    console.log(`🔑 Password : ${password}`);
    console.log(`👤 Username : TSE`);
    console.log(`⭐ Tier     : admin (premium permanent)`);
}

createSchoolAccount();
