# Rapport de Mise en Place : Expiration des Abonnements Premium

J'ai implémenté une solution robuste pour gérer l'expiration des abonnements sans nécessiter de licence développeur ni de webhooks pour le moment.

## Ce qui a été fait

### 1. Base de Données
J'ai créé une nouvelle migration (`20260209180000_add_subscription_expiration.sql`) qui ajoute les champs suivants à la table `user_profiles` :
- `subscription_status` : pour suivre l'état (active, expired, etc.).
- `subscription_expiry_date` : la date de fin de l'abonnement.
- `subscription_platform` : la plateforme d'origine (ios, android, etc.).

### 2. Edge Function `upgrade-to-premium`
J'ai mis à jour cette fonction pour :
- Calculer une date d'expiration lors de l'achat (par défaut +1 mois pour les tests, ou la date réelle si fournie par le store).
- Enregistrer cette date dans le profil utilisateur lors de la validation de l'achat.

### 3. Edge Function `sync-subscription-status` (Nouvelle)
J'ai créé cette fonction pour gérer la synchronisation serveur :
- Elle vérifie si l'abonnement est expiré par rapport à la date actuelle.
- Si expiré, elle met à jour le statut en base de données (`account_tier` -> `free`, `subscription_status` -> `expired`).

### 4. Vérification Client (`AuthContext.tsx`)
J'ai modifié le contexte d'authentification pour :
- Vérifier la date d'expiration à chaque chargement du profil utilisateur.
- Si la date est passée, l'application repasse **immédiatement** l'utilisateur en mode "Gratuit" localement (mise à jour optimiste).
- Elle appelle ensuite discrètement `sync-subscription-status` pour mettre à jour la base de données.

## Comment Tester

1.  **Appliquer la migration** : Exécutez la nouvelle migration sur votre base Supabase.
2.  **Déployer les fonctions** : Déployez `upgrade-to-premium` et `sync-subscription-status`.
3.  **Achat Test** : Faites un achat dans l'app. Vous devriez passer Premium.
4.  **Test d'Expiration** :
    - Allez dans votre base de données Supabase -> Table `user_profiles`.
    - Trouvez votre utilisateur et changez `subscription_expiry_date` à une date passée (e.g. hier).
    - Rechargez l'application (ou relancez-la).
    - Vous devrez constater que vous êtes repassé en mode "Gratuit" automatiquement.

Cette solution est autonome et fonctionne parfaitement pour le développement et la production initiale sans infrastructure complexe.
