/**
 * Module CORS partagé pour les fonctions Edge Supabase
 * 
 * Configuration via variable d'environnement ALLOWED_ORIGINS
 * Exemple: "https://votre-domaine.com,http://localhost:8081,http://localhost:19006"
 */

// Récupérer les origines autorisées depuis la variable d'environnement
const allowedOriginsEnv = Deno.env.get('ALLOWED_ORIGINS') || '';
const allowedOrigins = allowedOriginsEnv
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

/**
 * Vérifie si une origine est autorisée
 */
function isOriginAllowed(origin: string): boolean {
  // Si aucune origine configurée, refuser par défaut (sécurité)
  if (allowedOrigins.length === 0) {
    console.warn('[CORS] Aucune origine configurée dans ALLOWED_ORIGINS. Refus par défaut.');
    return false;
  }

  // Autoriser si '*' est dans la liste (mode développement uniquement)
  if (allowedOrigins.includes('*')) {
    return true;
  }

  // Vérifier si l'origine exacte est dans la liste
  return allowedOrigins.includes(origin);
}

/**
 * Génère les headers CORS en fonction de l'origine de la requête
 * 
 * @param req - La requête HTTP entrante
 * @returns Les headers CORS appropriés
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  
  // Si pas d'origine (requêtes mobiles natives, server-to-server), autoriser
  // Les apps mobiles natives n'envoient pas d'en-tête Origin
  if (!origin) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    };
  }

  const isAllowed = isOriginAllowed(origin);

  if (!isAllowed) {
    console.warn(`[CORS] Origine non autorisée: ${origin}`);
  }

  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Crée une réponse pour les requêtes OPTIONS (preflight)
 * 
 * @param req - La requête HTTP entrante
 * @returns Une réponse HTTP pour le preflight CORS
 */
export function handleCorsPreflightRequest(req: Request): Response {
  return new Response(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}

/**
 * Vérifie si la requête est autorisée selon les règles CORS
 * Retourne une réponse d'erreur si l'origine n'est pas autorisée
 * 
 * @param req - La requête HTTP entrante
 * @returns null si autorisé, ou une Response d'erreur sinon
 */
export function validateCorsOrigin(req: Request): Response | null {
  const origin = req.headers.get('Origin');
  
  // Pas d'origine = requête mobile native ou server-to-server, autoriser
  if (!origin) {
    return null;
  }

  if (!isOriginAllowed(origin)) {
    return new Response(
      JSON.stringify({ error: 'Origin not allowed' }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}
