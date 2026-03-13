const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qpogulljnnacrxdjbwiz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2d1bGxqbm5hY3J4ZGpid2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY3OTMsImV4cCI6MjA3NjE4Mjc5M30.19nUON5BsAerMhMDAS4LvdkB1B0dBkZ1TEvb5-3PSa0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
    const email = 'premium_friend@test.com';
    const password = 'PremiumPassword123!';

    console.log('1. Signing up user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError && !signUpError.message.includes('already registered')) {
        console.error('Sign up error:', signUpError);
        return;
    }

    console.log('2. Signing in to get token...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        console.error('Sign in error:', signInError);
        return;
    }

    const token = signInData.session.access_token;
    console.log('3. Upgrading to premium via Edge Function...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/upgrade-to-premium`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            platform: 'ios',
            productId: 'test_product',
            purchaseToken: 'test_token'
        })
    });

    const text = await response.text();
    console.log('Response:', text);
    console.log('\n--- ACCOUNT READY ---');
    console.log('Email:', email);
    console.log('Password:', password);
}

main();
