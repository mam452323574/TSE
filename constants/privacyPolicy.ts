export interface PrivacyPolicySection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface PrivacyPolicyLocaleContent {
  locale: 'fr' | 'en';
  label: string;
  title: string;
  lastUpdated: string;
  intro: string;
  sections: PrivacyPolicySection[];
}

export const PUBLIC_PRIVACY_POLICY_URL = 'https://healthscan.cloud/privacy-policy';

export const PRIVACY_POLICY_CONTENT: PrivacyPolicyLocaleContent[] = [
  {
    locale: 'fr',
    label: 'FR',
    title: 'Politique de confidentialite',
    lastUpdated: 'Derniere mise a jour : 18 mars 2026',
    intro:
      "Cette page explique comment Health Scan collecte, utilise et protege les donnees necessaires a l'analyse des scans sante et au fonctionnement du service.",
    sections: [
      {
        title: '1. Responsable et portee',
        paragraphs: [
          'Health Scan fournit des fonctionnalites de scan photo et de suivi sante. Cette politique couvre l application mobile, la page publique de politique de confidentialite et les services techniques relies a votre compte.',
          'Si vous utilisez Health Scan, vous acceptez que nous traitions les donnees decrites ci-dessous pour fournir les scans, l historique, la facturation et la securite du compte.',
        ],
      },
      {
        title: '2. Donnees collectees',
        paragraphs: ['Nous collectons uniquement les categories de donnees necessaires au service.'],
        bullets: [
          'Informations de compte : adresse email, nom utilisateur et photo de profil si vous en ajoutez une.',
          'Donnees de scan : photos de visage, corps ou repas, resultats d analyse, scores et historique de scans.',
          'Donnees techniques : identifiant d appareil, informations de session et journaux necessaires a la securite et a l authentification.',
          'Donnees d usage : preferences de langue, etat d abonnement et interactions utiles au fonctionnement du produit.',
        ],
      },
      {
        title: '3. Utilisation de la camera et des photos',
        paragraphs: [
          'La camera est utilisee pour capturer des photos que vous choisissez de soumettre a un scan. Ces photos peuvent aussi etre choisies depuis la galerie lorsque vous utilisez le selecteur de photos.',
          "Les images sont televersees de maniere securisee vers notre backend, stockees dans l infrastructure Supabase utilisee par Health Scan, puis transmises a notre infrastructure d analyse pour produire les resultats affiches dans l application.",
        ],
      },
      {
        title: '4. Finalites du traitement',
        paragraphs: ['Nous utilisons vos donnees pour :'],
        bullets: [
          'executer les scans et generer des resultats d analyse sante par IA ;',
          'afficher votre historique et vos scores dans l application ;',
          'gerer l authentification, la securite du compte et les abonnements ;',
          'ameliorer la fiabilite du service et resoudre les incidents techniques.',
        ],
      },
      {
        title: '5. Prestataires et partage des donnees',
        paragraphs: [
          'Nous ne vendons pas vos donnees personnelles.',
          'Nous partageons les donnees uniquement avec des prestataires techniques necessaires a la fourniture du service, notamment Supabase pour l authentification, la base de donnees et le stockage, ainsi que notre infrastructure d analyse accessible via n8n.basedjew.com pour traiter les scans que vous envoyez.',
          'Nous pouvons aussi divulguer certaines donnees si la loi l exige ou pour proteger nos droits et la securite du service.',
        ],
      },
      {
        title: '6. Conservation et securite',
        paragraphs: [
          'Les donnees de compte et l historique de scans sont conserves tant que votre compte reste actif ou jusqu a reception d une demande de suppression valide.',
          'Les communications entre l application et nos services utilisent HTTPS. L acces aux donnees est restreint aux besoins du service et des operations de support.',
        ],
      },
      {
        title: '7. Vos droits',
        paragraphs: ['Selon la legislation applicable, vous pouvez demander :'],
        bullets: [
          'l acces a vos donnees ;',
          'la rectification de donnees inexactes ;',
          'la suppression de votre compte et des donnees associees ;',
          'l export de certaines donnees lorsque cela est techniquement possible ;',
          'le retrait de votre consentement lorsque ce traitement repose sur votre consentement.',
        ],
      },
      {
        title: '8. Suppression des donnees',
        paragraphs: [
          'Health Scan ne propose pas actuellement de suppression complete self-service dans l application.',
          'Pour demander la suppression de votre compte ou de vos donnees, ecrivez a privacy@healthscan.cloud depuis l adresse associee a votre compte.',
        ],
      },
      {
        title: '9. Mineurs et mises a jour',
        paragraphs: [
          'Health Scan n est pas destine aux personnes de moins de 16 ans.',
          'Nous pouvons mettre a jour cette politique pour refleter des evolutions legales, techniques ou produit. La date de mise a jour la plus recente est indiquee en haut de cette page.',
        ],
      },
      {
        title: '10. Contact',
        paragraphs: [
          'Pour toute question relative a la vie privee, a la suppression de donnees ou a cette politique, contactez privacy@healthscan.cloud.',
          'Pour le support produit general, contactez support@healthscan.cloud.',
        ],
      },
    ],
  },
  {
    locale: 'en',
    label: 'EN',
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: March 18, 2026',
    intro:
      'This page explains how Health Scan collects, uses, and protects the data required to run health scans and the service itself.',
    sections: [
      {
        title: '1. Controller and scope',
        paragraphs: [
          'Health Scan provides photo scan and health tracking features. This policy applies to the mobile app, the public privacy policy page, and the technical services connected to your account.',
          'If you use Health Scan, you agree that we process the data described below to provide scans, history, billing, and account security.',
        ],
      },
      {
        title: '2. Data we collect',
        paragraphs: ['We only collect categories of data that are necessary to operate the service.'],
        bullets: [
          'Account information: email address, username, and profile photo if you add one.',
          'Scan data: face, body, or food photos, analysis results, scores, and scan history.',
          'Technical data: device identifier, session information, and logs required for security and authentication.',
          'Usage data: language preference, subscription state, and interactions required for product operation.',
        ],
      },
      {
        title: '3. Camera and photo use',
        paragraphs: [
          'The camera is used to capture photos that you choose to submit for a scan. Photos may also be selected from the gallery when you use the system photo picker.',
          'Images are uploaded securely to our backend, stored in the Supabase infrastructure used by Health Scan, and then sent to our analysis infrastructure to produce the results shown in the app.',
        ],
      },
      {
        title: '4. Why we process data',
        paragraphs: ['We use your data to:'],
        bullets: [
          'run scans and generate AI health analysis results;',
          'show your history and scores inside the app;',
          'manage authentication, account security, and subscriptions;',
          'improve service reliability and resolve technical incidents.',
        ],
      },
      {
        title: '5. Service providers and data sharing',
        paragraphs: [
          'We do not sell your personal data.',
          'We only share data with technical providers needed to operate the service, including Supabase for authentication, database, and storage, and our scan analysis infrastructure reachable via n8n.basedjew.com to process the scans you submit.',
          'We may also disclose certain data if required by law or to protect our rights and service security.',
        ],
      },
      {
        title: '6. Retention and security',
        paragraphs: [
          'Account data and scan history are retained while your account remains active or until we receive a valid deletion request.',
          'Communications between the app and our services use HTTPS. Access to data is limited to what is required to operate and support the service.',
        ],
      },
      {
        title: '7. Your rights',
        paragraphs: ['Depending on applicable law, you may request:'],
        bullets: [
          'access to your data;',
          'correction of inaccurate data;',
          'deletion of your account and associated data;',
          'export of certain data where technically feasible;',
          'withdrawal of consent where processing depends on consent.',
        ],
      },
      {
        title: '8. Data deletion',
        paragraphs: [
          'Health Scan does not currently provide a full self-service account deletion flow inside the app.',
          'To request deletion of your account or data, email privacy@healthscan.cloud from the address linked to your account.',
        ],
      },
      {
        title: '9. Children and updates',
        paragraphs: [
          'Health Scan is not intended for people under 16 years old.',
          'We may update this policy to reflect legal, technical, or product changes. The latest revision date appears at the top of this page.',
        ],
      },
      {
        title: '10. Contact',
        paragraphs: [
          'For privacy, deletion, or policy questions, contact privacy@healthscan.cloud.',
          'For general product support, contact support@healthscan.cloud.',
        ],
      },
    ],
  },
];
