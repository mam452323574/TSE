const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qpogulljnnacrxdjbwiz.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2d1bGxqbm5hY3J4ZGpid2l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MDY3OTMsImV4cCI6MjA3NjE4Mjc5M30.19nUON5BsAerMhMDAS4LvdkB1B0dBkZ1TEvb5-3PSa0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const delay = ms => new Promise(res => setTimeout(res, ms));

async function main() {
    try {
        const username = 'premium' + Math.floor(Date.now() / 1000);
        const domain = '1secmail.com';
        const email = `${username}@${domain}`;
        const password = 'PremiumPassword123!';

        console.log(`1. Signing up user: ${email}...`);
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            console.error('Sign up error:', signUpError);
            return;
        }

        const userId = signUpData.user.id;
        console.log(`User created with ID: ${userId}`);

        console.log('2. Waiting for OTP email...');
        let code = null;
        for (let i = 0; i < 20; i++) {
            await delay(3000);
            const messagesRes = await fetch(`https://www.1secmail.com/api/v1/?action=getMessages&login=${username}&domain=${domain}`);
            const messages = await messagesRes.json();

            if (messages.length > 0) {
                console.log('\nEmail received! Fetching content...');
                const msgId = messages[0].id;
                const contentRes = await fetch(`https://www.1secmail.com/api/v1/?action=readMessage&login=${username}&domain=${domain}&id=${msgId}`);
                const content = await contentRes.json();
                const match = content.htmlBody.match(/>(\d{6})</) || content.textBody.match(/(\d{6})/);
                if (match) {
                    code = match[1];
                    console.log(`Found OTP code: ${code}`);
                    break;
                } else {
                    console.log('Could not parse 6-digit code from email body:', content.textBody);
                    break;
                }
            } else {
                process.stdout.write('.');
            }
        }

        if (!code) {
            console.error('\nFailed to get OTP code');
            return;
        }

        console.log('\n3. Verifying email with OTP code...');
        const verifyRes = await fetch(`${SUPABASE_URL}/functions/v1/verify-email-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, userId, type: 'signup' })
        });

        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
            console.error('Verification failed:', verifyData);
            return;
        }
        console.log('Email verified successfully!');

        console.log('4. Signing in to get auth token...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (signInError) {
            console.error('Sign in error:', signInError);
            return;
        }

        const token = signInData.session.access_token;
        console.log('5. Upgrading to premium via Edge Function...');
        const upgradeRes = await fetch(`${SUPABASE_URL}/functions/v1/upgrade-to-premium`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ platform: 'ios', productId: 'test_product', purchaseToken: 'test_token' })
        });

        const upgradeData = await upgradeRes.json();
        if (!upgradeData.success) {
            console.error('Upgrade failed:', upgradeData);
        } else {
            console.log('Upgrade successful:', upgradeData);
        }

        console.log('\n--- ACCOUNT READY ---');
        console.log('Email:', email);
        console.log('Password:', password);
    } catch (err) {
        console.error('FATAL ERROR:', err);
    }
}

main();
