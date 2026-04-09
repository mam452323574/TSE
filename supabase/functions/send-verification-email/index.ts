import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@2.0.0';
import { handleCorsPreflightRequest, jsonResponse } from '../_shared/cors.ts';

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
    login_title: 'Connexion a Health Scan',
    signup_subtitle:
      'Verifiez votre adresse email pour finaliser votre inscription.',
    login_subtitle:
      'Un code de verification a ete demande pour votre connexion.',
    expire_text: 'Expire dans 15 minutes.',
  },
  en: {
    signup_subject: 'Welcome to Health Scan',
    login_subject: 'Login Code',
    signup_title: 'Welcome to Health Scan',
    login_title: 'Login to Health Scan',
    signup_subtitle:
      'Verify your email address to complete your registration.',
    login_subtitle: 'A verification code was requested for your login.',
    expire_text: 'Expires in 15 minutes.',
  },
  de: {
    signup_subject: 'Willkommen bei Health Scan',
    login_subject: 'Anmeldecode',
    signup_title: 'Willkommen bei Health Scan',
    login_title: 'Anmeldung bei Health Scan',
    signup_subtitle:
      'Bestaetigen Sie Ihre E-Mail-Adresse, um die Registrierung abzuschliessen.',
    login_subtitle:
      'Ein Bestaetigungscode wurde fuer Ihre Anmeldung angefordert.',
    expire_text: 'Laeuft in 15 Minuten ab.',
  },
  it: {
    signup_subject: 'Benvenuto in Health Scan',
    login_subject: 'Codice di accesso',
    signup_title: 'Benvenuto in Health Scan',
    login_title: 'Accedi a Health Scan',
    signup_subtitle:
      'Verifica il tuo indirizzo email per completare la registrazione.',
    login_subtitle:
      "E stato richiesto un codice di verifica per l'accesso.",
    expire_text: 'Scade tra 15 minuti.',
  },
  es: {
    signup_subject: 'Bienvenido a Health Scan',
    login_subject: 'Codigo de inicio de sesion',
    signup_title: 'Bienvenido a Health Scan',
    login_title: 'Iniciar sesion en Health Scan',
    signup_subtitle:
      'Verifique su direccion de correo electronico para completar su registro.',
    login_subtitle:
      'Se solicito un codigo de verificacion para su inicio de sesion.',
    expire_text: 'Expira en 15 minutos.',
  },
  pt: {
    signup_subject: 'Bem-vindo ao Health Scan',
    login_subject: 'Codigo de login',
    signup_title: 'Bem-vindo ao Health Scan',
    login_title: 'Login no Health Scan',
    signup_subtitle:
      'Verifique seu endereco de e-mail para concluir o cadastro.',
    login_subtitle:
      'Um codigo de verificacao foi solicitado para seu login.',
    expire_text: 'Expira em 15 minutos.',
  },
};

function generateEmailTemplate(
  code: string,
  type: 'signup' | 'login',
  locale: Locale
): { html: string; subject: string } {
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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const {
      email,
      userId,
      type = 'signup',
      locale = 'en',
    }: VerificationRequest = await req.json();

    const safeLocale: Locale = (
      locale && ['fr', 'en', 'de', 'it', 'es', 'pt'].includes(locale)
        ? locale
        : FALLBACK_LOCALE
    ) as Locale;

    if (!email || !userId) {
      return jsonResponse(
        req,
        { error: 'Email and userId required' },
        { status: 400 }
      );
    }

    const { count } = await supabase
      .from('verification_codes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('type', type)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());

    if (count && count >= 5) {
      return jsonResponse(
        req,
        { error: 'Trop de tentatives. Attendez 1h.' },
        { status: 429 }
      );
    }

    const { error: invalidateError } = await supabase.rpc(
      'invalidate_previous_codes',
      { p_user_id: userId, p_type: type }
    );
    if (invalidateError) {
      console.error('Error invalidating previous codes:', invalidateError);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const { error: dbError } = await supabase.from('verification_codes').insert({
      user_id: userId,
      email,
      code,
      type,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      throw dbError;
    }

    if (resendApiKey) {
      const { html, subject } = generateEmailTemplate(code, type, safeLocale);
      const resend = new Resend(resendApiKey);
      await resend.emails.send({
        from: 'Health Scan <noreply@healthscan.cloud>',
        to: email,
        subject,
        html,
      });
    } else {
      console.log(`[DEV] Code pour ${email}: ${code}`);
    }

    return jsonResponse(req, { success: true, message: 'Envoye' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return jsonResponse(req, { error: 'Internal Server Error' }, { status: 500 });
  }
});
