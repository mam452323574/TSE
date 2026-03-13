import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface VerificationRequest {
  email: string;
  userId: string;
  type?: 'signup' | 'login';
  locale?: string;
}

type Locale = 'fr' | 'en' | 'de' | 'it' | 'es' | 'pt';

const FALLBACK_LOCALE: Locale = 'en';

const TRANSLATIONS: Record<Locale, Record<string, string>> = {
  fr: {
    signup_subject: 'Bienvenue sur Health Scan',
    login_subject: 'Code de connexion',
    signup_title: 'Bienvenue sur Health Scan',
    login_title: 'Connexion à Health Scan',
    signup_subtitle: 'Vérifiez votre adresse email pour finaliser votre inscription.',
    login_subtitle: 'Un code de vérification a été demandé pour votre connexion.',
    expire_text: 'Expire dans 15 minutes.'
  },
  en: {
    signup_subject: 'Welcome to Health Scan',
    login_subject: 'Login Code',
    signup_title: 'Welcome to Health Scan',
    login_title: 'Login to Health Scan',
    signup_subtitle: 'Verify your email address to complete your registration.',
    login_subtitle: 'A verification code was requested for your login.',
    expire_text: 'Expires in 15 minutes.'
  },
  de: {
    signup_subject: 'Willkommen bei Health Scan',
    login_subject: 'Anmeldecode',
    signup_title: 'Willkommen bei Health Scan',
    login_title: 'Anmeldung bei Health Scan',
    signup_subtitle: 'Bestätigen Sie Ihre E-Mail-Adresse, um die Registrierung abzuschließen.',
    login_subtitle: 'Ein Bestätigungscode wurde für Ihre Anmeldung angefordert.',
    expire_text: 'Läuft in 15 Minuten ab.'
  },
  it: {
    signup_subject: 'Benvenuto in Health Scan',
    login_subject: 'Codice di accesso',
    signup_title: 'Benvenuto in Health Scan',
    login_title: 'Accedi a Health Scan',
    signup_subtitle: 'Verifica il tuo indirizzo email per completare la registrazione.',
    login_subtitle: "È stato richiesto un codice di verifica per l'accesso.",
    expire_text: 'Scade tra 15 minuti.'
  },
  es: {
    signup_subject: 'Bienvenido a Health Scan',
    login_subject: 'Código de inicio de sesión',
    signup_title: 'Bienvenido a Health Scan',
    login_title: 'Iniciar sesión en Health Scan',
    signup_subtitle: 'Verifique su dirección de correo electrónico para completar su registro.',
    login_subtitle: 'Se solicitó un código de verificación para su inicio de sesión.',
    expire_text: 'Expira en 15 minutos.'
  },
  pt: {
    signup_subject: 'Bem-vindo ao Health Scan',
    login_subject: 'Código de login',
    signup_title: 'Bem-vindo ao Health Scan',
    login_title: 'Login no Health Scan',
    signup_subtitle: 'Verifique seu endereço de e-mail para concluir o cadastro.',
    login_subtitle: 'Um código de verificação foi solicitado para seu login.',
    expire_text: 'Expira em 15 minutos.'
  }
};

function generateEmailTemplate(code: string, type: 'signup' | 'login', locale: Locale): { html: string, subject: string } {
  const t = TRANSLATIONS[locale] || TRANSLATIONS[FALLBACK_LOCALE];

  const subject = type === 'signup' ? t.signup_subject : t.login_subject;
  const title = type === 'signup' ? t.signup_title : t.login_title;
  const subtitle = type === 'signup' ? t.signup_subtitle : t.login_subtitle;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family: sans-serif; background-color: #f5f5f5; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px;">
      <h1 style="color: #1a1a1a;">${title}</h1>
      <p style="color: #666;">${subtitle}</p>
      <div style="background: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
        <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #E53935;">${code}</span>
      </div>
      <p style="font-size: 12px; color: #999;">${t.expire_text}</p>
    </div>
  </body></html>`;

  return { html, subject };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, userId, type = 'signup', locale = 'en' }: VerificationRequest = await req.json();

    // Validate and normalize locale
    const safeLocale: Locale = (
      locale && ['fr', 'en', 'de', 'it', 'es', 'pt'].includes(locale)
        ? locale
        : FALLBACK_LOCALE
    ) as Locale;

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'Email and userId required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Vérifier limite (Rate limiting)
    const { count } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 5) {
      return new Response(JSON.stringify({ error: 'Trop de tentatives. Attendez 1h.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { error: invalidateError } = await supabase.rpc('invalidate_previous_codes', { p_user_id: userId, p_type: type });
    if (invalidateError) {
      console.error('Error invalidating previous codes:', invalidateError);
    }

    // Créer nouveau code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: dbError } = await supabase
      .from('verification_codes')
      .insert({
        user_id: userId,
        email,
        code,
        type,
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) throw dbError;

    // Envoyer Email
    if (resendApiKey) {
      const { html, subject } = generateEmailTemplate(code, type, safeLocale);
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Health Scan <noreply@healthscan.cloud>',
        to: email,
        subject: subject,
        html: html,
      });
    } else {
      console.log(`[DEV] Code pour ${email}: ${code}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Envoyé' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
