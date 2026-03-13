import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

export const i18n = new I18n(
    {
        "fr": {
            "common": {
                "back": "Retour",
                "retry": "Réessayer",
                "error": "Erreur",
                "ok": "OK",
                "cancel": "Annuler",
                "password": "Mot de passe",
                "loading": "Chargement...",
                "success": "Succès",
                "unknown_user": "Utilisateur",
                "account_free": "Compte Gratuit",
                "account_premium": "Compte Premium",
                "home_back": "Retour à l'accueil",
                "save": "Sauvegarder",
                "later": "Plus tard",
                "skip": "Passer",
                "finish": "Terminer",
                "available": "Disponible",
                "in": "dans",
                "time": {
                    "d": "j",
                    "h": "h",
                    "min": "min",
                    "s": "s"
                },
                "day": "jour",
                "days": "jours",
                "years_short": "ans",
                "hour": "heure",
                "hours": "heures",
                "minute": "minute",
                "minutes": "minutes",
                "time_ago": {
                    "just_now": "À l'instant",
                    "minutes_ago": "Il y a {{count}} min",
                    "hours_ago": "Il y a {{count}}h",
                    "yesterday": "Hier",
                    "days_ago": "Il y a {{count}} jours"
                },
                "yesterday": "Hier",
                "days_ago": "Il y a {{count}} jours"
            },
            "tabs": {
                "home": "Accueil",
                "analytics": "Analyses",
                "scanner": "Scanner"
            },
            "home": {
                "items_available": "Scans disponibles",
                "items_advised": "Compléments Conseillés",
                "global_score": "Score Global",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Limite atteinte",
                "available": "disponible"
            },
            "scan_preview": {
                "title": "Choisir l'analyse",
                "type_label": "Type de scan",
                "confirm_button": "Confirmer et Sauvegarder",
                "confirm_loading": "Enregistrement...",
                "loading_text": "Votre scan arrive bientôt, cela peut prendre quelques secondes...",
                "error_title_type": "Type incorrect",
                "error_title_analysis": "Analyse impossible",
                "error_title_network": "Erreur réseau",
                "error_msg_default": "Oups, l'image n'a pas pu être analysée.",
                "error_msg_network": "Impossible de contacter le serveur d'analyse.",
                "error_validation": "Paramètres invalides.",
                "error_session": "Session expirée."
            },
            "scan_result": {
                "title": "Résultats",
                "no_data": "Aucune analyse disponible",
                "analysis_face": "Analyse Visage",
                "analysis_body": "Analyse Corps",
                "analysis_nutrition": "Analyse Nutrition",
                "ai_complete": "Analyse IA terminée",
                "details_title": "Détails de l'analyse",
                "score_face": "Score Santé/Esthétique",
                "score_body": "Score Forme",
                "score_nutrition": "Score Santé Assiette",
                "perceived_age": "Âge perçu",
                "face_shape": "Forme visage",
                "symmetry": "Symétrie",
                "fatigue": "Niveau de fatigue",
                "hydration": "Hydratation",
                "photogenic": "Score photogénie",
                "skin_quality": "Qualité de peau",
                "glow": "Éclat (Glow)",
                "collagen": "Collagène (est.)",
                "body_type": "Type corporel",
                "muscle_mass": "Masse musculaire",
                "waist": "Tour de taille (est.)",
                "strength": "Score Force",
                "bmi": "IMC (est.)",
                "metabolic_age": "Âge métabolique",
                "body_fat": "Graisse corporelle (est.)",
                "posture": "Posture",
                "body_symmetry": "Symétrie",
                "calories": "Calories (kcal)",
                "verdict": "Verdict",
                "satiety": "Indice Satiété",
                "ingredients": "Qualité Ingrédients",
                "glycemic": "Indice Glycémique",
                "vitamins": "Vitamines principales",
                "macros_title": "Macros (est. grammes)",
                "proteins": "Protéines",
                "carbs": "Glucides",
                "fats": "Lipides"
            },
            "notification_settings": {
                "title": "Préférences Notifications",
                "types": "Types de Notifications",
                "types_desc": "Choisissez les notifications que vous souhaitez recevoir",
                "reminders": "Rappels",
                "reminders_desc": "Rappels de scans et de suivi quotidien",
                "achievements": "Succès",
                "achievements_desc": "Notifications de jalons et accomplissements",
                "new_content": "Nouveau Contenu",
                "new_content_desc": "Nouvelles recettes, exercices et fonctionnalités",
                "info": "💡 Les notifications vous aident à rester motivé et à suivre vos progrès. Vous pouvez les désactiver à tout moment.",
                "save": "Sauvegarder les préférences",
                "saved_title": "Paramètres sauvegardés",
                "saved_message": "Vos préférences de notification ont été mises à jour avec succès.",
                "error_save": "Impossible de sauvegarder vos paramètres."
            },
            "privacy": {
                "title": "Politique de Confidentialité",
                "last_updated": "Dernière mise à jour : 9 février 2026",
                "intro_title": "1. Introduction",
                "intro_content": "Bienvenue sur Health Scan. Nous nous engageons à protéger votre vie privée et vos données personnelles. Cette politique explique comment nous collectons, utilisons et protégeons vos informations conformément au Règlement Général sur la Protection des Données (RGPD) et aux lois applicables.",
                "data_title": "2. Données Collectées",
                "data_content": "Nous collectons les catégories de données suivantes :",
                "data_account": "Informations de compte : email, nom d'utilisateur, photo de profil",
                "data_scans": "Données de scans : images analysées par notre IA (visage, corps, repas), résultats d'analyses et scores de santé",
                "data_device": "Informations techniques : identifiant d'appareil pour la sécurité de connexion",
                "data_usage": "Données d'utilisation : historique des scans, préférences, statistiques d'utilisation",
                "camera_title": "3. Utilisation de la Caméra",
                "camera_content": "Health Scan utilise la caméra de votre appareil exclusivement pour capturer des images à analyser (visage, corps, alimentation). Les photos sont traitées par notre intelligence artificielle pour générer des analyses de santé. Les images sont transmises de manière sécurisée via HTTPS et ne sont jamais partagées avec des tiers. Vous pouvez supprimer vos données à tout moment.",
                "usage_title": "4. Utilisation des Données",
                "usage_content": "Vos données sont utilisées pour :",
                "usage_analysis": "Fournir des analyses de santé personnalisées via notre IA",
                "usage_improve": "Améliorer nos algorithmes et la qualité de nos services",
                "usage_personalize": "Personnaliser votre expérience et vos recommandations",
                "storage_title": "5. Stockage et Sécurité",
                "storage_content": "Vos données sont stockées de manière sécurisée sur Supabase, une plateforme cloud conforme aux standards de sécurité les plus élevés. Toutes les communications sont chiffrées via TLS/SSL. Vos mots de passe sont hashés avec des algorithmes cryptographiques robustes. Nous appliquons des politiques de sécurité (RLS) au niveau de la base de données pour garantir que seul vous pouvez accéder à vos données.",
                "sharing_title": "6. Partage des Données",
                "sharing_content": "Nous ne vendons jamais vos données personnelles. Vos données ne sont partagées qu'avec les prestataires techniques essentiels au fonctionnement du service (hébergement, envoi d'emails) et uniquement dans la mesure nécessaire. En cas d'obligation légale, nous pouvons être amenés à communiquer certaines informations aux autorités compétentes.",
                "rights_title": "7. Vos Droits",
                "rights_content": "Conformément au RGPD, vous disposez des droits suivants :",
                "rights_access": "Droit d'accès : consulter toutes vos données personnelles",
                "rights_delete": "Droit à l'effacement : supprimer votre compte et toutes vos données",
                "rights_export": "Droit à la portabilité : exporter vos données dans un format standard",
                "rights_withdraw": "Droit de retrait : retirer votre consentement à tout moment",
                "children_title": "8. Protection des Mineurs",
                "children_content": "Health Scan n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données concernant des mineurs. Si vous êtes parent et pensez que votre enfant nous a fourni des informations, contactez-nous pour les supprimer.",
                "updates_title": "9. Modifications",
                "updates_content": "Nous pouvons mettre à jour cette politique de confidentialité. En cas de modifications importantes, nous vous en informerons via l'application ou par email. La date de dernière mise à jour est indiquée en haut de cette page.",
                "contact_title": "10. Contact",
                "contact_content": "Pour toute question concernant vos données ou cette politique, contactez-nous :"
            },
            "components": {
                "avatar": {
                    "error_title": "Erreur",
                    "error_download": "Impossible de télécharger la photo",
                    "error_size": "Image trop volumineuse. Maximum 5MB.",
                    "perm_title": "Permission requise",
                    "perm_gallery": "Veuillez autoriser l'accès à la galerie photo",
                    "perm_camera": "Veuillez autoriser l'accès à la caméra",
                    "options_title": "Photo de profil",
                    "options_msg": "Choisissez une option",
                    "take_photo": "Prendre une photo",
                    "choose_gallery": "Choisir de la galerie",
                    "hint": "Appuyez pour modifier"
                },
                "urgency": {
                    "title": "Attention",
                    "message": "L'IA a détecté des indicateurs visuels nécessitant votre attention.\n\nCeci n'est pas un diagnostic médical.",
                    "dismiss": "J'ai compris"
                },
                "table": {
                    "header_feature": "Fonctionnalité",
                    "header_free": "Gratuit",
                    "header_premium": "Premium"
                },
                "feature_list": {
                    "free": "Gratuit",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Analyse complète corps & visage",
                    "subtitle_used": "Revenez demain pour un nouveau scan",
                    "subtitle_available": "Analyse IA approfondie disponible",
                    "status_locked": "Débloquez avec Premium",
                    "status_used": "Reset à minuit",
                    "status_available": "Prêt à scanner"
                },
                "feature_gate": {
                    "title": "Fonctionnalité Premium",
                    "upgrade_btn": "Passer Premium"
                },
                "error_boundary": {
                    "title": "Oups !",
                    "retry": "Réessayer",
                    "logout": "Se déconnecter"
                },
                "condition_card": {
                    "probability": "Probabilité",
                    "explanation": "Explication",
                    "tip": "Conseil pratique",
                    "unlock": "Débloquer"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                }
            },
            "scan_types": {
                "body": "Corps",
                "health": "Visage",
                "nutrition": "Nutrition",
                "super": "Super Scan"
            },
            "scan_limits": {
                "week_1": "1 scan par semaine",
                "month_1": "1 scan par mois",
                "days_3_1": "1 scan tous les 3 jours",
                "premium_only": "Premium uniquement",
                "day_3": "3 scans par jour",
                "day_1": "1 scan par jour",
                "msg_weekly_reached": "Limite hebdomadaire atteinte",
                "msg_monthly_reached": "Limite mensuelle atteinte",
                "msg_days_3_reached": "Limite atteinte (tous les 3 jours)",
                "msg_premium_only": "Réservé aux membres Premium",
                "msg_daily_reached_3": "Limite quotidienne atteinte (3 scans)",
                "msg_daily_reached_1": "Limite quotidienne atteinte (1 scan)"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Ovale",
                    "Round": "Rond",
                    "Square": "Carré",
                    "Heart": "Cœur",
                    "Diamond": "Diamant",
                    "Long": "Allongé",
                    "Triangle": "Triangle",
                    "Rectangular": "Rectangulaire"
                },
                "body_type": {
                    "Ectomorph": "Ectomorphe",
                    "Mesomorph": "Mésomorphe",
                    "Endomorph": "Endomorphe",
                    "Hourglass": "Sablier",
                    "Pear": "Poire",
                    "Apple": "Pomme",
                    "Rectangle": "Rectangle",
                    "Inverted Triangle": "Triangle Inversé"
                },
                "muscle_mass": {
                    "Low": "Faible",
                    "Moderate": "Modérée",
                    "Average": "Moyenne",
                    "High": "Élevée",
                    "Very High": "Très Élevée",
                    "Athlete": "Athlétique"
                },
                "glycemic_index": {
                    "Low": "Faible",
                    "Moderate": "Modéré",
                    "High": "Élevé"
                },
                "ingredient_quality": {
                    "Excellent": "Excellente",
                    "Good": "Bonne",
                    "Average": "Moyenne",
                    "Poor": "Mauvaise",
                    "Bad": "Médiocre"
                },
                "severity": {
                    "low": "Faible",
                    "moderate": "Modéré",
                    "high": "Élevé"
                }
            },
            "condition_card": {
                "explanation": "Explication",
                "advice": "Conseil pratique",
                "probability": "probabilité",
                "unlock": "Débloquer"
            },
            "notifications": {
                "title": "Notifications",
                "empty_title": "Aucune notification",
                "empty_unread": "Vous avez tout lu ! Continuez votre suivi santé.",
                "empty_all": "Vous n'avez pas encore de notifications.",
                "loading": "Chargement des notifications...",
                "filter_all": "Toutes",
                "filter_unread": "Non lues",
                "filter_read": "Lues",
                "scan_health_title": "Scan Santé Disponible",
                "scan_health_body": "Votre scan santé hebdomadaire est maintenant disponible. Prenez soin de vous !",
                "scan_body_title": "Scan Corps Disponible",
                "scan_body_body": "Votre scan corps mensuel est maintenant disponible. Suivez votre progression !",
                "scan_nutrition_title": "Scan Nutrition Disponible",
                "scan_nutrition_body": "Votre scan nutrition est maintenant disponible. Analysez vos repas !",
                "scan_super_title": "Super Scan Disponible",
                "scan_super_body": "Votre Super Scan quotidien est maintenant disponible. Obtenez une analyse complète !",
                "achievements": {
                    "title": "Succès Débloqué !",
                    "one_week": "1 semaine avec nous !",
                    "one_month": "1 mois de suivi !",
                    "three_months": "3 mois de persévérance !",
                    "six_months": "6 mois de progrès !",
                    "one_year": "1 an de santé !"
                },
                "daily_reminders": {
                    "1": {
                        "title": "Rappel Quotidien",
                        "body": "N'oubliez pas votre suivi santé du jour !"
                    },
                    "2": {
                        "title": "C'est l'heure !",
                        "body": "Prenez un moment pour scanner vos repas."
                    },
                    "3": {
                        "title": "Objectif Santé",
                        "body": "Restez sur la bonne voie avec un scan rapide."
                    },
                    "4": {
                        "title": "Suivi Santé",
                        "body": "Avez-vous complété vos objectifs aujourd'hui ?"
                    },
                    "5": {
                        "title": "Routine Santé",
                        "body": "La régularité est la clé du succès !"
                    },
                    "6": {
                        "title": "Health Scan",
                        "body": "Votre coach santé vous attend."
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "Super Scan Prêt",
                        "body": "Votre analyse complète est disponible."
                    },
                    "2": {
                        "title": "Nouveau Jour",
                        "body": "Découvrez votre forme du jour avec le Super Scan."
                    },
                    "3": {
                        "title": " Analyse Approfondie",
                        "body": "Le Super Scan est prêt à être utilisé !"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "Continuez comme ça !",
                        "body": "Chaque petit pas compte pour votre santé."
                    },
                    "2": {
                        "title": "Bravo !",
                        "body": "Votre assiduité porte ses fruits."
                    },
                    "3": {
                        "title": "Restez Motivé",
                        "body": "Vous faites du super boulot, ne lâchez rien !"
                    },
                    "4": {
                        "title": "Santé & Bien-être",
                        "body": "Prendre soin de soi est le meilleur investissement."
                    },
                    "5": {
                        "title": "Inspiration",
                        "body": "Votre futur vous vous remerciera."
                    },
                    "6": {
                        "title": "Mouvement",
                        "body": "Un corps sain dans un esprit sain."
                    }
                }
            },
            "not_found": {
                "text": "Cette page n'existe pas.",
                "link": "Retour à l'accueil"
            },
            "settings": {
                "title": "Paramètres",
                "section_subscription": "Abonnement",
                "upgrade_premium": "Passer Premium",
                "section_preferences": "Préférences",
                "language": "Langue",
                "notifications": "Notifications",
                "new_notifications": "nouvelles",
                "notifications_preferences": "Préférences de notification",
                "section_app": "Application",
                "privacy_policy": "Politique de confidentialité",
                "danger_zone_title": "Zone de Danger",
                "danger_zone_desc": "Une fois votre compte supprimé, il sera impossible de revenir en arrière. Soyez certain de votre choix.",
                "sign_out_button": "Se déconnecter",
                "sign_out_loading": "Déconnexion...",
                "footer_version": "Health Scan v1.0.0",
                "select_language_title": "Choisir la langue",
                "cancel": "Annuler",
                "ok": "OK",
                "sign_out_confirm_title": "Déconnexion",
                "sign_out_confirm_msg": "Êtes-vous sûr de vouloir vous déconnecter ?",
                "sign_out_error_title": "Erreur",
                "sign_out_error_msg": "Erreur lors de la déconnexion",
                "danger_zone": "Zone de danger"
            },
            "api_errors": {
                "network": "Erreur réseau. Vérifiez votre connexion.",
                "unauthorized": "Session expirée. Veuillez vous reconnecter.",
                "server": "Erreur serveur. Veuillez réessayer plus tard.",
                "scan_limit": "Limite de scan atteinte.",
                "payment_failed": "Echec du paiement."
            },
            "navigation": {
                "session_expired_title": "Session Expirée",
                "session_expired_msg": "Votre session a expiré. Veuillez vous reconnecter.",
                "loop_error_title": "Erreur de Navigation",
                "loop_error_msg": "Une boucle de redirection a été détectée. Veuillez vous déconnecter et réessayer.",
                "logout_btn": "Se Déconnecter"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Connectez-vous à votre compte",
                "email_placeholder": "Votre email",
                "password_placeholder": "Votre mot de passe",
                "password_confirm": "Confirmer le mot de passe",
                "login_btn": "Se Connecter",
                "no_account": "Pas de compte ?",
                "signup_link": "S'inscrire",
                "signup_title": "Créer un compte",
                "signup_subtitle": "Rejoignez-nous pour suivre votre santé",
                "password_min_placeholder": "Mot de passe (min. 6 caractères)",
                "password_confirm_placeholder": "Confirmez le mot de passe",
                "verification_note": "Nous vous enverrons un code de vérification.",
                "signup_btn": "S'inscrire",
                "has_account": "Déjà un compte ?",
                "login_link": "Se Connecter",
                "error_email_required": "L'email est requis",
                "error_password_required": "Le mot de passe est requis",
                "error_passwords_match": "Les mots de passe ne correspondent pas",
                "error_password_length": "Le mot de passe doit faire au moins 6 caractères",
                "error_login_generic": "Échec de la connexion",
                "error_ip_limit_reached": "Limite de création de compte atteinte sur ce réseau. Veuillez réessayer plus tard.",
                "error_signup_generic": "Échec de l'inscription",
                "error_account_creation": "Erreur lors de la création du compte",
                "error_username_taken": "Ce nom d'utilisateur est déjà pris. Veuillez en choisir un autre.",
                "error_session_invalid": "Session invalide",
                "error_email_verification_required": "Veuillez vérifier votre email avant de continuer.",
                "error_disposable_email": "Les adresses email temporaires ne sont pas autorisées",
                "error_verification_send": "Échec de l'envoi du code de vérification",
                "error_verification_code": "Code incorrect",
                "error_auth_cancelled": "Authentification annulée",
                "verify_btn": "Vérifier",
                "verifying": "Vérification...",
                "verification_sent_title": "Email vérifié !",
                "verification_sent_subtitle_signup": "Finalisation de la création de votre compte...",
                "verification_sent_subtitle_login": "Connexion en cours...",
                "verify_title": "Vérifiez votre email",
                "verify_subtitle": "Nous avons envoyé un code à 6 chiffres à",
                "code_expired": "Code expire dans",
                "resend_code": "Renvoyer le code",
                "resend_in": "Renvoyer dans {{seconds}}s",
                "code_incomplete": "Veuillez entrer le code complet",
                "code_invalid": "Code incorrect ou expiré",
                "code_incorrect": "Code incorrect",
                "code_not_found": "Aucun code de vérification trouvé. Veuillez en demander un nouveau.",
                "code_expired_error": "Ce code a expiré. Veuillez en demander un nouveau.",
                "too_many_attempts": "Trop de tentatives incorrectes. Veuillez demander un nouveau code.",
                "attempts_remaining": "{{count}} essai(s) restant(s)",
                "remember_device": "Se souvenir de cet appareil",
                "email_label": "Email",
                "errors": {
                    "fill_all": "Veuillez remplir tous les champs",
                    "invalid_email": "Email invalide",
                    "password_mismatch": "Les mots de passe ne correspondent pas",
                    "password_short": "Le mot de passe doit faire au moins 6 caractères",
                    "disposable_email": "Les emails temporaires ne sont pas acceptés",
                    "email_in_use": "Cet email est déjà utilisé",
                    "general_error": "Une erreur est survenue",
                    "invalid_credentials": "Identifiants invalides",
                    "oauth_login": "Erreur lors de la connexion avec {{provider}}"
                },
                "general_error": "Une erreur est survenue"
            },
            "scanner": {
                "authorize_camera": "Autoriser la caméra",
                "camera_permission_msg": "Nous avons besoin d'accéder à votre caméra pour scanner.",
                "error_taking_photo": "Impossible de prendre la photo",
                "error_loading_image": "Impossible de charger l'image",
                "type_required_title": "Type de scan requis",
                "type_required_msg": "Veuillez sélectionner un type de scan.",
                "super_unavailable_title": "Super Scan non disponible",
                "super_unavailable_msg": "Veuillez sélectionner un autre type de scan."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Débloquez tout le potentiel de votre santé",
                "already_premium_title": "Vous êtes Premium !",
                "already_premium_desc": "Vous avez accès à toutes les fonctionnalités premium",
                "price_per_month": "/mois",
                "cancel_anytime": "Annulez à tout moment",
                "features_title": "Fonctionnalités Premium",
                "subscribe_btn": "S'abonner maintenant",
                "processing": "Traitement en cours...",
                "restore_btn": "Restaurer mes achats",
                "restoring": "Restauration...",
                "store_disclaimer": "Via l'App Store / Google Play",
                "web_disclaimer": "Les achats in-app ne sont disponibles que sur l'application mobile.",
                "purchase_success_title": "Bienvenue dans Premium!",
                "purchase_success_msg": "Votre abonnement a été activé.",
                "restore_success_title": "Achats restaurés",
                "restore_success_msg": "Abonnement restauré avec succès.",
                "restore_empty": "Aucun achat trouvé.",
                "benefits": {
                    "instant": "Accès instantané",
                    "tracking": "Suivi avancé",
                    "support": "Support prioritaire"
                },
                "upgrade_title": "Passer Premium",
                "upgrade_premium": "Passer Premium",
                "subtitle_premium": "Votre abonnement est actif.",
                "subtitle_upgrade": "Débloquez tout le potentiel de votre santé",
                "compare_plans": "Comparer les plans",
                "button_upgrade": "S'abonner",
                "button_later": "Plus tard",
                "price": "9,99 €",
                "period": "/mois",
                "web_unavailable_title": "Non disponible sur le Web",
                "validation_title": "Validation en cours",
                "purchase_error_default": "Une erreur est survenue lors de l'achat. Veuillez réessayer.",
                "purchase_error_generic": "Votre achat n'a pas pu être traité. Veuillez vérifier votre connexion et réessayer.",
                "restore_empty_title": "Info",
                "restore_error_default": "Vos achats n'ont pas pu être restaurés. Veuillez réessayer.",
                "restore_error_generic": "Une erreur est survenue lors de la restauration. Veuillez réessayer.",
                "web_note": "Note : Les achats in-app ne sont disponibles que dans les applications mobiles natives. Utilisez l'application Android ou iOS pour souscrire un abonnement.",
                "store_note": "L'abonnement sera facturé via votre compte {{store}}. Gérez votre abonnement dans les paramètres de votre compte {{store}}.",
                "already_premium_intro": "Vous êtes membre Premium.",
                "already_premium_active": "Vous avez un abonnement actif.",
                "renewal_date": "Renouvellement le : %{date}",
                "manage_subscription": "Gérer mon abonnement",
                "subscription_page": {
                    "hero_title": "Débloquez tout votre potentiel santé",
                    "hero_subtitle": "Choisissez la formule qui vous correspond",
                    "free_title": "Gratuit",
                    "free_price": "0 €",
                    "monthly_title": "Premium",
                    "monthly_price": "9,99 €/mois",
                    "annual_title": "Premium Annuel",
                    "annual_price": "79,99 €/an",
                    "annual_monthly": "soit 6,67 €/mois",
                    "annual_crossed": "119,88 €",
                    "annual_badge": "Meilleure offre",
                    "annual_coming_soon": "L'abonnement annuel sera bientôt disponible.",
                    "cta_monthly": "S'abonner — 9,99 €/mois",
                    "cta_annual": "S'abonner — 79,99 €/an",
                    "legal": "Abonnement renouvelé automatiquement. Annulable à tout moment.",
                    "terms_link": "Conditions d'utilisation",
                    "privacy_link": "Politique de confidentialité",
                    "free_feat_face": "Scan visage : 1 gratuit / 7 jours",
                    "free_feat_body": "Scan corps : 1 gratuit / 30 jours",
                    "free_feat_nutrition": "Scan nutrition : 1 gratuit / 3 jours",
                    "free_feat_partial": "Résultats partiels (métriques verrouillées)",
                    "free_feat_no_super": "Pas d'accès au Super Scan",
                    "free_feat_no_history": "Pas d'historique ni graphiques",
                    "prem_feat_face": "3 scans visage par jour",
                    "prem_feat_body": "3 scans corps par jour",
                    "prem_feat_nutrition": "3 scans nutrition par jour",
                    "prem_feat_super": "1 Super Scan par jour",
                    "prem_feat_unlocked": "Tous les résultats déverrouillés",
                    "prem_feat_history": "Historique complet + graphiques",
                    "prem_feat_ai": "Conseils IA personnalisés"
                }
            },
            "exercises": {
                "title": "Nos Exercices",
                "search_placeholder": "Rechercher un exercice...",
                "no_results": "Aucun exercice trouvé",
                "duration": "min",
                "difficulty": {
                    "easy": "Facile",
                    "medium": "Moyen",
                    "hard": "Difficile"
                }
            },
            "recipes": {
                "title": "Nos Recettes",
                "search_placeholder": "Rechercher une recette...",
                "no_results": "Aucune recette trouvée",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Facile",
                    "medium": "Moyen",
                    "hard": "Difficile"
                }
            },
            "onboarding": {
                "welcome_title": "Bienvenue !",
                "setup_profile": "Configurez votre profil",
                "choose_style": "Choisissez votre style",
                "username_label": "Nom d'utilisateur *",
                "username_placeholder": "pseudo123",
                "username_status": {
                    "checking": "Vérification...",
                    "available": "Disponible",
                    "taken": "Déjà pris",
                    "invalid": "3-20 caractères, lettres, chiffres, _ ou -"
                },
                "theme": {
                    "dark": "Sombre",
                    "dark_desc": "Par défaut",
                    "light": "Clair",
                    "light_desc": "Secondaire"
                },
                "next_btn": "Suivant",
                "start_btn": "Commencer l'aventure",
                "error_session": "Session invalide. Veuillez vous reconnecter.",
                "error_email": "Veuillez vérifier votre email avant de continuer.",
                "error_username_empty": "Veuillez choisir un nom d'utilisateur",
                "error_username_taken": "Veuillez choisir un nom d'utilisateur disponible"
            },
            "languages": {
                "fr": "Français",
                "en": "Anglais",
                "de": "Allemand",
                "it": "Italien",
                "es": "Espagnol",
                "pt": "Portugais"
            },
            "analytics": {
                "title": "Analyses",
                "subtitle": "Suivez votre progression",
                "periods": {
                    "days_7": "7j",
                    "days_30": "30j",
                    "months_3": "3 Mois",
                    "year_1": "1 An"
                },
                "premium_feature": "Fonctionnalité Premium",
                "premium_feature_msg": "Les analyses sur 3 mois et 1 an sont réservées aux membres Premium.\n\nDébloquez l'accès complet à votre historique santé !",
                "empty_state": "Commencez à scanner pour voir vos progrès ici !",
                "health_score": "Score Santé",
                "health_score_subtitle": "Évolution de votre score global",
                "physical_evolution": "Évolution Physique",
                "physical_evolution_subtitle": "Score Corporel",
                "face_score": "Score Visage",
                "face_score_subtitle": "Évolution de votre score visage",
                "nutrition_score": "Score Nutrition",
                "nutrition_score_subtitle": "Score moyen des repas",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Score de Risque Global",
                "legend_score": "Score (0-100)",
                "legend_body_fat": "Graisse Corporelle %"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "Le Super Scan est une fonctionnalité exclusive réservée aux membres Premium.\n\nObtenez une analyse complète et détaillée en passant à Premium !",
                "used_alert_title": "Super Scan utilisé",
                "used_alert_msg": "Vous avez déjà utilisé votre Super Scan aujourd'hui.\n\nRevenez demain pour un nouveau Super Scan !",
                "global_risk_score": "Score de Risque Global",
                "analysis_summary": "Résumé de l'analyse",
                "conditions_detected": "Conditions détectées",
                "ras_title": "RAS",
                "ras_subtitle": "Aucun signe détecté",
                "ras_description": "L'analyse n'a détecté aucune condition particulière. Continuez à prendre soin de vous !",
                "premium_badge": "Premium",
                "used_today": "Utilisé",
                "limit_daily": "1/jour",
                "connection_reconnecting": "Reconnexion en cours...",
                "connection_unstable": "Connexion instable. Appuyez pour réessayer."
            },
            "premium_features": {
                "categories": {
                    "scans": "Scans",
                    "analytics": "Analyses",
                    "content": "Contenu",
                    "features": "Fonctionnalités",
                    "support": "Support"
                },
                "list": {
                    "health_scans": {
                        "title": "Scans Santé",
                        "description": "Analysez votre santé faciale pour détecter les signes de fatigue et de stress",
                        "free": "1 scan santé par semaine",
                        "premium": "3 scans santé par jour"
                    },
                    "body_scans": {
                        "title": "Scans Corps",
                        "description": "Suivez l'évolution de votre composition corporelle",
                        "free": "1 scan corps par mois",
                        "premium": "3 scans corps par jour"
                    },
                    "nutrition_scans": {
                        "title": "Scans Nutrition",
                        "description": "Analysez vos repas pour un suivi nutritionnel précis",
                        "free": "1 scan nutrition tous les 3 jours",
                        "premium": "3 scans nutrition par jour"
                    },
                    "detailed_analytics": {
                        "title": "Analyses Détaillées",
                        "description": "Graphiques avancés, historique complet et prédictions de santé",
                        "free": "Graphiques basiques sur 7 jours",
                        "premium": "Analyses détaillées illimitées avec historique complet et prédictions"
                    },
                    "unlimited_scans": {
                        "title": "Scans Illimités",
                        "description": "Nombre illimité de scans corporels, santé et nutrition par jour",
                        "free": "Limité selon le type de scan",
                        "premium": "3 scans de chaque type par jour"
                    },
                    "advanced_recipes": {
                        "title": "Recettes Avancées",
                        "description": "Accès aux recettes premium avec plans nutritionnels détaillés et vidéos",
                        "free": "Accès aux recettes de base",
                        "premium": "Accès complet aux recettes premium avec plans nutritionnels et vidéos"
                    },
                    "premium_exercises": {
                        "title": "Exercices Premium",
                        "description": "Programmes d'exercices personnalisés et vidéos HD",
                        "free": "Exercices de base",
                        "premium": "Programmes personnalisés avec vidéos HD et coaching"
                    },
                    "export_data": {
                        "title": "Export de Données",
                        "description": "Export de vos données de santé en PDF ou CSV",
                        "free": "Non disponible",
                        "premium": "Export illimité en PDF ou CSV"
                    },
                    "priority_support": {
                        "title": "Support Prioritaire",
                        "description": "Réponses rapides de notre équipe support",
                        "free": "Support standard (48-72h)",
                        "premium": "Réponses prioritaires sous 24h"
                    },
                    "custom_goals": {
                        "title": "Objectifs Personnalisés",
                        "description": "Définissez des objectifs de santé sur mesure avec suivi avancé",
                        "free": "Objectifs prédéfinis",
                        "premium": "Objectifs personnalisés avec suivi avancé"
                    },
                    "meal_planner": {
                        "title": "Planificateur de Repas",
                        "description": "Planification automatique des repas selon vos objectifs",
                        "free": "Non disponible",
                        "premium": "Planification automatique selon vos objectifs"
                    }
                }
            },
            "months_short": {
                "0": "Jan",
                "1": "Fév",
                "2": "Mar",
                "3": "Avr",
                "4": "Mai",
                "5": "Juin",
                "6": "Juil",
                "7": "Août",
                "8": "Sep",
                "9": "Oct",
                "10": "Nov",
                "11": "Déc"
            },
            "copilot": {
                "analytics_step": "Consultez vos statistiques et suivez vos progrès dans le temps.",
                "scanner_step": "Scannez vos aliments et photos pour analyser votre santé !",
                "settings_step": "Accédez aux paramètres de votre compte et de l'application.",
                "notifications_step": "Retrouvez ici vos notifications et succès débloqués !"
            }
        },
        "en": {
            "common": {
                "back": "Back",
                "retry": "Retry",
                "error": "Error",
                "ok": "OK",
                "cancel": "Cancel",
                "password": "Password",
                "loading": "Loading...",
                "success": "Success",
                "unknown_user": "User",
                "account_free": "Free Account",
                "account_premium": "Premium Account",
                "home_back": "Back to Home",
                "save": "Save",
                "later": "Later",
                "skip": "Skip",
                "finish": "Finish",
                "available": "Available",
                "in": "in",
                "time": {
                    "d": "d",
                    "h": "h",
                    "min": "min",
                    "s": "s"
                },
                "day": "day",
                "days": "days",
                "years_short": "yrs",
                "hour": "hour",
                "hours": "hours",
                "minute": "minute",
                "minutes": "minutes",
                "time_ago": {
                    "just_now": "Just now",
                    "minutes_ago": "{{count}} min ago",
                    "hours_ago": "{{count}}h ago",
                    "yesterday": "Yesterday",
                    "days_ago": "{{count}} days ago"
                },
                "yesterday": "Yesterday",
                "days_ago": "{{count}} days ago"
            },
            "tabs": {
                "home": "Home",
                "analytics": "Analytics",
                "scanner": "Scan"
            },
            "home": {
                "items_available": "Available Scans",
                "items_advised": "Recommended Supplements",
                "global_score": "Global Score",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Limit reached",
                "available": "available"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Oval",
                    "Round": "Round",
                    "Square": "Square",
                    "Heart": "Heart",
                    "Diamond": "Diamond",
                    "Long": "Long",
                    "Triangle": "Triangle",
                    "Rectangular": "Rectangular"
                },
                "body_type": {
                    "Ectomorph": "Ectomorph",
                    "Mesomorph": "Mesomorph",
                    "Endomorph": "Endomorph",
                    "Hourglass": "Hourglass",
                    "Pear": "Pear",
                    "Apple": "Apple",
                    "Rectangle": "Rectangle",
                    "Inverted Triangle": "Inverted Triangle"
                },
                "muscle_mass": {
                    "Low": "Low",
                    "Moderate": "Moderate",
                    "Average": "Average",
                    "High": "High",
                    "Very High": "Very High",
                    "Athlete": "Athlete"
                },
                "glycemic_index": {
                    "Low": "Low",
                    "Moderate": "Moderate",
                    "High": "High"
                },
                "ingredient_quality": {
                    "Excellent": "Excellent",
                    "Good": "Good",
                    "Average": "Average",
                    "Poor": "Poor",
                    "Bad": "Bad"
                },
                "severity": {
                    "low": "Low",
                    "moderate": "Moderate",
                    "high": "High"
                }
            },
            "condition_card": {
                "explanation": "Explanation",
                "advice": "Actionable Advice",
                "probability": "probability",
                "unlock": "Unlock"
            },
            "scan_preview": {
                "title": "Choose Analysis",
                "type_label": "Scan Type",
                "confirm_button": "Confirm and Save",
                "confirm_loading": "Saving...",
                "loading_text": "Your scan is coming soon, this may take a few seconds...",
                "error_title_type": "Incorrect Type",
                "error_title_analysis": "Analysis Impossible",
                "error_title_network": "Network Error",
                "error_msg_default": "Oops, the image could not be analyzed.",
                "error_msg_network": "Unable to contact analysis server.",
                "error_validation": "Invalid parameters.",
                "error_session": "Session expired."
            },
            "scan_result": {
                "title": "Results",
                "no_data": "No analysis available",
                "analysis_face": "Face Analysis",
                "analysis_body": "Body Analysis",
                "analysis_nutrition": "Nutrition Analysis",
                "ai_complete": "AI Analysis Complete",
                "details_title": "Analysis Details",
                "score_face": "Health/Aesthetics Score",
                "score_body": "Fitness Score",
                "score_nutrition": "Plate Health Score",
                "perceived_age": "Perceived Age",
                "face_shape": "Face Shape",
                "symmetry": "Symmetry",
                "fatigue": "Fatigue Level",
                "hydration": "Hydration",
                "photogenic": "Photogenic Score",
                "skin_quality": "Skin Quality",
                "glow": "Glow",
                "collagen": "Collagene (est.)",
                "body_type": "Body Type",
                "muscle_mass": "Muscle Mass",
                "waist": "Waist (est.)",
                "strength": "Strength Score",
                "bmi": "BMI (est.)",
                "metabolic_age": "Metabolic Age",
                "body_fat": "Body Fat (est.)",
                "posture": "Posture",
                "body_symmetry": "Symmetry",
                "calories": "Calories (kcal)",
                "verdict": "Verdict",
                "satiety": "Satiety Index",
                "ingredients": "Ingredients Quality",
                "glycemic": "Glycemic Index",
                "vitamins": "Main Vitamins",
                "macros_title": "Macros (est. grams)",
                "proteins": "Proteins",
                "carbs": "Carbs",
                "fats": "Fats"
            },
            "notification_settings": {
                "title": "Notification Preferences",
                "types": "Notification Types",
                "types_desc": "Choose which notifications you want to receive",
                "reminders": "Reminders",
                "reminders_desc": "Scan reminders and daily tracking",
                "achievements": "Achievements",
                "achievements_desc": "Milestones and accomplishments notifications",
                "new_content": "New Content",
                "new_content_desc": "New recipes, exercises, and features",
                "info": "💡 Notifications help you stay motivated and track your progress. You can disable them at any time.",
                "save": "Save Preferences",
                "saved_title": "Settings Saved",
                "saved_message": "Your notification preferences have been updated successfully.",
                "error_save": "Unable to save your settings."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Unlock your full health potential",
                "already_premium_title": "You are Premium!",
                "already_premium_intro": "Vous êtes membre Premium.",
                "already_premium_active": "You have an active subscription.",
                "renewal_date": "Renews on: %{date}",
                "manage_subscription": "Manage subscription",
                "already_premium_desc": "Vous avez accès à toutes les fonctionnalités premium.",
                "price_per_month": "/mois",
                "cancel_anytime": "Annulez à tout moment",
                "features_title": "Premium Features",
                "subscribe_btn": "S'abonner Maintenant",
                "processing": "Traitement...",
                "restore_btn": "Restaurer les achats",
                "restoring": "Restauration...",
                "store_disclaimer": "Via App Store / Google Play",
                "web_disclaimer": "Les achats in-app sont uniquement disponibles sur mobiles.",
                "purchase_success_title": "Bienvenue Premium !",
                "purchase_success_msg": "Votre abonnement a été activé.",
                "restore_success_title": "Achats Restaurés",
                "restore_success_msg": "Abonnement restauré avec succès.",
                "restore_empty": "Aucun achat trouvé.",
                "benefits": {
                    "instant": "Accès Immédiat",
                    "tracking": "Suivi Avancé",
                    "support": "Support Prioritaire"
                },
                "upgrade_title": "Passer Premium",
                "upgrade_premium": "Upgrade to Premium",
                "subtitle_premium": "Votre abonnement est actif.",
                "subtitle_upgrade": "Libérez tout votre potentiel santé",
                "compare_plans": "Comparer les plans",
                "button_upgrade": "S'abonner",
                "button_later": "Peut-être plus tard",
                "price": "9,99 €",
                "period": "/mois",
                "web_unavailable_title": "Non disponible sur Web",
                "validation_title": "Validation en cours",
                "purchase_error_default": "Une erreur est survenue lors de l'achat. Veuillez réessayer.",
                "purchase_error_generic": "Impossible de traiter votre achat. Veuillez vérifier votre connexion et réessayer.",
                "restore_empty_title": "Info",
                "restore_error_default": "Impossible de restaurer vos achats. Veuillez réessayer.",
                "restore_error_generic": "Une erreur est survenue lors de la restauration. Veuillez réessayer.",
                "web_note": "Note: Les achats in-app ne sont disponibles que sur les applications mobiles natives. Utilisez l'application Android ou iOS pour vous abonner.",
                "store_note": "L'abonnement sera facturé via votre compte {{store}}. Gérez votre abonnement dans les paramètres de votre compte {{store}}.",
                "subscription_page": {
                    "hero_title": "Unlock your full health potential",
                    "hero_subtitle": "Choose the plan that fits you",
                    "free_title": "Free",
                    "free_price": "€0",
                    "monthly_title": "Premium",
                    "monthly_price": "€9.99/month",
                    "annual_title": "Annual Premium",
                    "annual_price": "€79.99/year",
                    "annual_monthly": "i.e. €6.67/month",
                    "annual_crossed": "€119.88",
                    "annual_badge": "Best value",
                    "annual_coming_soon": "The annual subscription will be available soon.",
                    "cta_monthly": "Subscribe — €9.99/mo",
                    "cta_annual": "Subscribe — €79.99/yr",
                    "legal": "Subscription auto-renews. Cancel anytime.",
                    "terms_link": "Terms of Use",
                    "privacy_link": "Privacy Policy",
                    "free_feat_face": "Face scan: 1 free every 7 days",
                    "free_feat_body": "Body scan: 1 free every 30 days",
                    "free_feat_nutrition": "Nutrition scan: 1 free every 3 days",
                    "free_feat_partial": "Partial results (some metrics locked)",
                    "free_feat_no_super": "No Super Scan access",
                    "free_feat_no_history": "No history or charts",
                    "prem_feat_face": "3 face scans per day",
                    "prem_feat_body": "3 body scans per day",
                    "prem_feat_nutrition": "3 nutrition scans per day",
                    "prem_feat_super": "1 Super Scan per day",
                    "prem_feat_unlocked": "All results unlocked",
                    "prem_feat_history": "Full history + charts",
                    "prem_feat_ai": "Personalized AI tips"
                }
            },
            "privacy": {
                "title": "Privacy Policy",
                "last_updated": "Last updated: February 9, 2026",
                "intro_title": "1. Introduction",
                "intro_content": "Welcome to Health Scan. We are committed to protecting your privacy and personal data. This policy explains how we collect, use, and protect your information in accordance with the General Data Protection Regulation (GDPR) and applicable laws.",
                "data_title": "2. Collected Data",
                "data_content": "We collect the following categories of data:",
                "data_account": "Account information: email, username, profile photo",
                "data_scans": "Scan data: images analyzed by our AI (face, body, meals), analysis results and health scores",
                "data_device": "Technical information: device identifier for login security",
                "data_usage": "Usage data: scan history, preferences, usage statistics",
                "camera_title": "3. Camera Usage",
                "camera_content": "Health Scan uses your device camera exclusively to capture images for analysis (face, body, food). Photos are processed by our artificial intelligence to generate health analyses. Images are transmitted securely via HTTPS and are never shared with third parties. You can delete your data at any time.",
                "usage_title": "4. Data Usage",
                "usage_content": "Your data is used to:",
                "usage_analysis": "Provide personalized health analyses via our AI",
                "usage_improve": "Improve our algorithms and service quality",
                "usage_personalize": "Personalize your experience and recommendations",
                "storage_title": "5. Storage and Security",
                "storage_content": "Your data is securely stored on Supabase, a cloud platform compliant with the highest security standards. All communications are encrypted via TLS/SSL. Your passwords are hashed with robust cryptographic algorithms. We apply row-level security (RLS) policies at the database level to ensure only you can access your data.",
                "sharing_title": "6. Data Sharing",
                "sharing_content": "We never sell your personal data. Your data is only shared with technical providers essential to service operation (hosting, email delivery) and only to the extent necessary. In case of legal obligation, we may communicate certain information to competent authorities.",
                "rights_title": "7. Your Rights",
                "rights_content": "Under GDPR, you have the following rights:",
                "rights_access": "Right of access: view all your personal data",
                "rights_delete": "Right to erasure: delete your account and all your data",
                "rights_export": "Right to data portability: export your data in a standard format",
                "rights_withdraw": "Right to withdraw: withdraw your consent at any time",
                "children_title": "8. Children Protection",
                "children_content": "Health Scan is not intended for persons under 16 years of age. We do not knowingly collect data concerning minors. If you are a parent and believe your child has provided us with information, contact us to delete it.",
                "updates_title": "9. Updates",
                "updates_content": "We may update this privacy policy. In case of significant changes, we will notify you via the application or email. The last update date is indicated at the top of this page.",
                "contact_title": "10. Contact",
                "contact_content": "For any questions about your data or this policy, contact us:"
            },
            "components": {
                "feature_gate": {
                    "title": "Premium Feature",
                    "upgrade_btn": "Upgrade to Premium"
                },
                "table": {
                    "header_feature": "Feature",
                    "header_free": "Free",
                    "header_premium": "Premium"
                },
                "error_boundary": {
                    "title": "Oops!",
                    "retry": "Retry",
                    "logout": "Sign Out"
                },
                "condition_card": {
                    "probability": "probability",
                    "explanation": "Explanation",
                    "tip": "Practical tip",
                    "unlock": "Unlock"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                },
                "avatar": {
                    "error_title": "Error",
                    "error_download": "Unable to download photo",
                    "error_size": "Image too large. Maximum 5MB.",
                    "perm_title": "Permission required",
                    "perm_gallery": "Please allow access to photo gallery",
                    "perm_camera": "Please allow access to camera",
                    "options_title": "Profile Photo",
                    "options_msg": "Choose an option",
                    "take_photo": "Take a photo",
                    "choose_gallery": "Choose from gallery",
                    "hint": "Tap to edit"
                },
                "urgency": {
                    "title": "Attention",
                    "message": "AI has detected visual indicators requiring your attention.\n\nThis is not a medical diagnosis.",
                    "dismiss": "I understand"
                },
                "feature_list": {
                    "free": "Free",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Full Body & Face Analysis",
                    "subtitle_used": "Come back tomorrow for a new scan",
                    "subtitle_available": "Deep AI Analysis Available",
                    "status_locked": "Unlock with Premium",
                    "status_used": "Resets at midnight",
                    "status_available": "Ready to scan"
                }
            },
            "scan_types": {
                "body": "Body",
                "health": "Face",
                "nutrition": "Nutrition",
                "super": "Super Scan"
            },
            "scan_limits": {
                "week_1": "1 scan per week",
                "month_1": "1 scan per month",
                "days_3_1": "1 scan every 3 days",
                "premium_only": "Premium only",
                "day_3": "3 scans per day",
                "day_1": "1 scan per day",
                "msg_weekly_reached": "Weekly limit reached",
                "msg_monthly_reached": "Monthly limit reached",
                "msg_days_3_reached": "Limit reached (every 3 days)",
                "msg_premium_only": "Premium members only",
                "msg_daily_reached_3": "Daily limit reached (3 scans)",
                "msg_daily_reached_1": "Daily limit reached (1 scan)"
            },
            "notifications": {
                "title": "Notifications",
                "empty_title": "No notifications",
                "empty_unread": "All caught up! Keep tracking your health.",
                "empty_all": "You don't have any notifications yet.",
                "loading": "Loading notifications...",
                "filter_all": "All",
                "filter_unread": "Unread",
                "filter_read": "Read",
                "scan_health_title": "Health Scan Available",
                "scan_health_body": "Your weekly health scan is now available. Take care!",
                "scan_body_title": "Body Scan Available",
                "scan_body_body": "Your monthly body scan is now available. Track your progress!",
                "scan_nutrition_title": "Nutrition Scan Available",
                "scan_nutrition_body": "Your nutrition scan is available.",
                "scan_super_title": "Super Scan Available",
                "scan_super_body": "Your daily Super Scan is available.",
                "achievements": {
                    "title": "New Milestone!",
                    "one_week": "Congratulations! One week of health tracking!",
                    "one_month": "Congratulations! 🎉 You have been taking care of yourself with Health Scan for a month.",
                    "three_months": "Well done! 3 months of health tracking!",
                    "six_months": "Amazing! 6 months of tracking your health. Keep it up!",
                    "one_year": "Extraordinary! One year with Health Scan! 🏆"
                },
                "daily_reminders": {
                    "1": {
                        "title": "Hey, it's time!",
                        "body": "A quick scan today? Your health will thank you!"
                    },
                    "2": {
                        "title": "We miss you!",
                        "body": "Take 30 seconds to check your form today."
                    },
                    "3": {
                        "title": "Ready for your check-up?",
                        "body": "Run a quick scan and stay on top!"
                    },
                    "4": {
                        "title": "Hey you!",
                        "body": "Don't forget your daily scan, it takes 2 minutes."
                    },
                    "5": {
                        "title": "We're waiting for you!",
                        "body": "Your body may have things to tell you today."
                    },
                    "6": {
                        "title": "Health reminder",
                        "body": "A photo, an analysis, and you know where you stand!"
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "Super Scan recharged!",
                        "body": "Your daily Super Scan is ready. Enjoy it!"
                    },
                    "2": {
                        "title": "Here we go again!",
                        "body": "New day, new Super Scan at your disposal!"
                    },
                    "3": {
                        "title": "Your Super Scan awaits",
                        "body": "Full analysis is available again!"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "Keep it up!",
                        "body": "Every scan brings you closer to your goals."
                    },
                    "2": {
                        "title": "You rock!",
                        "body": "Your consistency pays off, results will follow."
                    },
                    "3": {
                        "title": "Quick reminder",
                        "body": "Taking care of yourself is also listening to your body."
                    },
                    "4": {
                        "title": "Great progress!",
                        "body": "You're doing great work, keep this momentum."
                    },
                    "5": {
                        "title": "You're on the right track",
                        "body": "Consistency is key to success. Bravo!"
                    },
                    "6": {
                        "title": "Proud of yourself?",
                        "body": "You should be! Tracking your health is already a big step."
                    }
                }
            },
            "not_found": {
                "text": "This page doesn't exist.",
                "link": "Go to home screen"
            },
            "settings": {
                "title": "Settings",
                "section_subscription": "Subscription",
                "upgrade_premium": "Upgrade Premium",
                "section_preferences": "Preferences",
                "language": "Language",
                "notifications": "Notifications",
                "new_notifications": "new",
                "notifications_preferences": "Notification Preferences",
                "section_app": "Application",
                "privacy_policy": "Privacy Policy",
                "danger_zone_title": "Danger Zone",
                "danger_zone_desc": "Once your account is deleted, there is no going back. Please be certain.",
                "sign_out_button": "Sign Out",
                "sign_out_loading": "Signing out...",
                "footer_version": "Health Scan v1.0.0",
                "select_language_title": "Select Language",
                "cancel": "Cancel",
                "ok": "OK",
                "sign_out_confirm_title": "Sign Out",
                "sign_out_confirm_msg": "Are you sure you want to sign out?",
                "sign_out_error_title": "Error",
                "sign_out_error_msg": "Error signing out",
                "danger_zone": "Danger zone"
            },
            "api_errors": {
                "network": "Network error. Check your connection.",
                "unauthorized": "Session expired. Please log in again.",
                "server": "Server error. Please try again later.",
                "scan_limit": "Scan limit reached.",
                "payment_failed": "Payment failed."
            },
            "navigation": {
                "session_expired_title": "Session Expired",
                "session_expired_msg": "Your session has expired. Please log in again.",
                "loop_error_title": "Navigation Error",
                "loop_error_msg": "A redirection loop was detected. Please sign out and try again.",
                "logout_btn": "Sign Out"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Sign in to your account",
                "email_placeholder": "Email",
                "password_placeholder": "Password",
                "password_confirm": "Confirm Password",
                "login_btn": "Sign In",
                "no_account": "Don't have an account?",
                "signup_link": "Sign Up",
                "signup_title": "Create Account",
                "signup_subtitle": "Join to scan and improve health",
                "password_min_placeholder": "Password (min. 6 chars)",
                "password_confirm_placeholder": "Confirm password",
                "verification_note": "We'll send you a verification code.",
                "signup_btn": "Sign Up",
                "has_account": "Already have an account?",
                "login_link": "Sign In",
                "error_email_required": "Email is required",
                "error_password_required": "Password is required",
                "error_passwords_match": "Passwords do not match",
                "error_password_length": "Password must be at least 6 characters",
                "error_login_generic": "Login failed",
                "error_ip_limit_reached": "Account creation limit reached for this network. Please try again later.",
                "error_signup_generic": "Sign up failed",
                "error_account_creation": "Error creating account",
                "error_username_taken": "This username is already taken. Please choose another one.",
                "error_session_invalid": "Invalid session",
                "error_email_verification_required": "Please verify your email before continuing.",
                "error_disposable_email": "Disposable email addresses are not allowed",
                "error_verification_send": "Failed to send verification code",
                "error_verification_code": "Incorrect code",
                "error_auth_cancelled": "Authentication cancelled",
                "verify_btn": "Verify",
                "verifying": "Verifying...",
                "verification_sent_title": "Email verified!",
                "verification_sent_subtitle_signup": "Finalizing your account creation...",
                "verification_sent_subtitle_login": "Logging in...",
                "verify_title": "Verify your email",
                "verify_subtitle": "We sent a 6-digit code to",
                "code_expired": "Code expired in",
                "resend_code": "Resend code",
                "resend_in": "Resend in {{seconds}}s",
                "code_incomplete": "Please enter the full code",
                "code_invalid": "Incorrect or expired code",
                "code_incorrect": "Incorrect code",
                "code_not_found": "No verification code found. Please request a new one.",
                "code_expired_error": "This code has expired. Please request a new one.",
                "too_many_attempts": "Too many incorrect attempts. Please request a new code.",
                "attempts_remaining": "{{count}} attempt(s) remaining",
                "remember_device": "Remember this device",
                "email_label": "Email",
                "errors": {
                    "fill_all": "Please fill all fields",
                    "invalid_email": "Invalid email",
                    "password_mismatch": "Passwords do not match",
                    "password_short": "Password must be at least 6 characters",
                    "disposable_email": "Disposable emails are not allowed",
                    "email_in_use": "This email is already in use",
                    "general_error": "An error occurred",
                    "invalid_credentials": "Invalid credentials",
                    "oauth_login": "Error logging in with {{provider}}"
                },
                "general_error": "An error has occurred"
            },
            "scanner": {
                "authorize_camera": "Authorize Camera",
                "camera_permission_msg": "We need access to your camera to scan.",
                "error_taking_photo": "Unable to take photo",
                "error_loading_image": "Unable to load image",
                "type_required_title": "Scan type required",
                "type_required_msg": "Please select a scan type.",
                "super_unavailable_title": "Super Scan unavailable",
                "super_unavailable_msg": "Please select another scan type."
            },
            "exercises": {
                "title": "Our Exercises",
                "search_placeholder": "Search for an exercise...",
                "no_results": "No exercises found",
                "duration": "min",
                "difficulty": {
                    "easy": "Easy",
                    "medium": "Medium",
                    "hard": "Hard"
                }
            },
            "recipes": {
                "title": "Our Recipes",
                "search_placeholder": "Search for a recipe...",
                "no_results": "No recipes found",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Easy",
                    "medium": "Medium",
                    "hard": "Hard"
                }
            },
            "onboarding": {
                "welcome_title": "Welcome!",
                "setup_profile": "Set up your profile",
                "choose_style": "Choose your style",
                "username_label": "Username *",
                "username_placeholder": "username123",
                "username_status": {
                    "checking": "Checking...",
                    "available": "Available",
                    "taken": "Already taken",
                    "invalid": "3-20 chars, letters, numbers, _ or -"
                },
                "theme": {
                    "dark": "Dark",
                    "dark_desc": "Default",
                    "light": "Light",
                    "light_desc": "Secondary"
                },
                "next_btn": "Next",
                "start_btn": "Start Adventure",
                "error_session": "Invalid session. Please log in again.",
                "error_email": "Please verify your email before continuing.",
                "error_username_empty": "Please choose a username",
                "error_username_taken": "Please choose an available username"
            },
            "languages": {
                "fr": "French",
                "en": "English",
                "de": "German",
                "it": "Italian",
                "es": "Spanish",
                "pt": "Portuguese"
            },
            "analytics": {
                "title": "Analytics",
                "subtitle": "Track your progress",
                "periods": {
                    "days_7": "7d",
                    "days_30": "30d",
                    "months_3": "3 Months",
                    "year_1": "1 Year"
                },
                "premium_feature": "Premium Feature",
                "premium_feature_msg": "3-month and 1-year analytics are reserved for Premium members.\n\nUnlock full access to your health history!",
                "empty_state": "Start scanning to see your progress here!",
                "health_score": "Health Score",
                "health_score_subtitle": "Evolution of your global score",
                "physical_evolution": "Physical Evolution",
                "physical_evolution_subtitle": "Body Score",
                "face_score": "Face Score",
                "face_score_subtitle": "Your face score evolution",
                "nutrition_score": "Nutrition Score",
                "nutrition_score_subtitle": "Average meal score",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Global Risk Score",
                "legend_score": "Score (0-100)",
                "legend_body_fat": "Body Fat %"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "Super Scan is an exclusive feature for Premium members.\n\nGet a complete and detailed analysis by upgrading to Premium!",
                "used_alert_title": "Super Scan Used",
                "used_alert_msg": "You have already used your Super Scan today.\n\nCome back tomorrow for a new Super Scan!",
                "global_risk_score": "Global Risk Score",
                "analysis_summary": "Analysis Summary",
                "conditions_detected": "Detected Conditions",
                "ras_title": "All Clear",
                "ras_subtitle": "No signs detected",
                "ras_description": "The analysis did not detect any particular condition. Keep taking care of yourself!",
                "premium_badge": "Premium",
                "used_today": "Used",
                "limit_daily": "1/day",
                "connection_reconnecting": "Reconnecting...",
                "connection_unstable": "Unstable connection. Tap to retry."
            },
            "premium_features": {
                "categories": {
                    "scans": "Scans",
                    "analytics": "Analytics",
                    "content": "Content",
                    "features": "Features",
                    "support": "Support"
                },
                "list": {
                    "health_scans": {
                        "title": "Health Scans",
                        "description": "Analyze your facial health to detect signs of fatigue and stress",
                        "free": "1 health scan per week",
                        "premium": "3 health scans per day"
                    },
                    "body_scans": {
                        "title": "Body Scans",
                        "description": "Track your body composition evolution",
                        "free": "1 body scan per month",
                        "premium": "3 body scans per day"
                    },
                    "nutrition_scans": {
                        "title": "Nutrition Scans",
                        "description": "Analyze your meals for precise nutritional tracking",
                        "free": "1 nutrition scan every 3 days",
                        "premium": "3 nutrition scans per day"
                    },
                    "detailed_analytics": {
                        "title": "Detailed Analytics",
                        "description": "Advanced charts, full history and health predictions",
                        "free": "Basic charts (7 days)",
                        "premium": "Unlimited detailed analytics with full history and predictions"
                    },
                    "unlimited_scans": {
                        "title": "Unlimited Scans",
                        "description": "Unlimited body, health, and nutrition scans per day",
                        "free": "Limited by scan type",
                        "premium": "3 scans of each type per day"
                    },
                    "advanced_recipes": {
                        "title": "Advanced Recipes",
                        "description": "Access to premium recipes with detailed nutritional plans and videos",
                        "free": "Access to basic recipes",
                        "premium": "Full access to premium recipes with nutritional plans and videos"
                    },
                    "premium_exercises": {
                        "title": "Premium Exercises",
                        "description": "Personalized workout programs and HD videos",
                        "free": "Basic exercises",
                        "premium": "Personalized programs with HD videos and coaching"
                    },
                    "export_data": {
                        "title": "Data Export",
                        "description": "Export your health data to PDF or CSV",
                        "free": "Not available",
                        "premium": "Unlimited PDF or CSV export"
                    },
                    "priority_support": {
                        "title": "Priority Support",
                        "description": "Fast responses from our support team",
                        "free": "Standard support (48-72h)",
                        "premium": "Priority responses within 24h"
                    },
                    "custom_goals": {
                        "title": "Custom Goals",
                        "description": "Define custom health goals with advanced tracking",
                        "free": "Predefined goals",
                        "premium": "Custom goals with advanced tracking"
                    },
                    "meal_planner": {
                        "title": "Meal Planner",
                        "description": "Automatic meal planning based on your goals",
                        "free": "Not available",
                        "premium": "Automatic planning based on your goals"
                    }
                }
            },
            "months_short": {
                "0": "Jan",
                "1": "Feb",
                "2": "Mar",
                "3": "Apr",
                "4": "May",
                "5": "Jun",
                "6": "Jul",
                "7": "Aug",
                "8": "Sep",
                "9": "Oct",
                "10": "Nov",
                "11": "Dec"
            },
            "copilot": {
                "analytics_step": "View your stats and track your progress over time.",
                "scanner_step": "Scan your food and photos to analyze your health!",
                "settings_step": "Go to your account and app settings.",
                "notifications_step": "Find your unlocked notifications and achievements here!"
            }
        },
        "de": {
            "tabs": {
                "home": "Startseite",
                "analytics": "Analysen",
                "scanner": "Scannen"
            },
            "common": {
                "back": "Zurück",
                "retry": "Wiederholen",
                "error": "Fehler",
                "ok": "OK",
                "cancel": "Abbrechen",
                "password": "Passwort",
                "loading": "Laden...",
                "success": "Erfolg",
                "unknown_user": "Benutzer",
                "account_free": "Kostenloses Konto",
                "account_premium": "Premium-Konto",
                "home_back": "Zurück zum Start",
                "save": "Speichern",
                "later": "Später",
                "skip": "Überspringen",
                "finish": "Fertig",
                "available": "Verfügbar",
                "in": "in",
                "time": {
                    "d": "t",
                    "h": "std",
                    "min": "min",
                    "s": "s"
                },
                "day": "Tag",
                "days": "Tage",
                "years_short": "J.",
                "hour": "Stunde",
                "hours": "Stunden",
                "minute": "Minute",
                "minutes": "Minuten",
                "time_ago": {
                    "just_now": "Gerade eben",
                    "minutes_ago": "vor {{count}} Min",
                    "hours_ago": "vor {{count}} Std",
                    "yesterday": "Gestern",
                    "days_ago": "vor {{count}} Tagen"
                },
                "yesterday": "Gestern",
                "days_ago": "Vor {{count}} Tagen"
            },
            "scan_limits": {
                "week_1": "1 Scan pro Woche",
                "month_1": "1 Scan pro Monat",
                "days_3_1": "1 Scan alle 3 Tage",
                "premium_only": "Nur Premium",
                "day_3": "3 Scans pro Tag",
                "day_1": "1 Scan pro Tag",
                "msg_weekly_reached": "Wöchentliches Limit erreicht",
                "msg_monthly_reached": "Monatslimit erreicht",
                "msg_days_3_reached": "Limit erreicht (alle 3 Tage)",
                "msg_premium_only": "Reserviert für Premium-Mitglieder",
                "msg_daily_reached_3": "Tageslimit erreicht (3 Scans)",
                "msg_daily_reached_1": "Tageslimit erreicht (1 Scan)"
            },
            "home": {
                "items_available": "Verfügbare Scans",
                "items_advised": "Empfohlene Ergänzungsmittel",
                "global_score": "Gesamtpunktzahl",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Limit erreicht",
                "available": "verfügbar"
            },
            "scan_preview": {
                "title": "Analyse wählen",
                "type_label": "Scan-Typ",
                "confirm_button": "Bestätigen und Speichern",
                "confirm_loading": "Speichern...",
                "loading_text": "Ihr Scan kommt bald, dies kann einige Sekunden dauern...",
                "error_title_type": "Falscher Typ",
                "error_title_analysis": "Analyse unmöglich",
                "error_title_network": "Netzwerkfehler",
                "error_msg_default": "Hoppla, das Bild konnte nicht analysiert werden.",
                "error_msg_network": "Analyseserver nicht erreichbar.",
                "error_validation": "Ungültige Parameter.",
                "error_session": "Sitzung abgelaufen."
            },
            "copilot": {
                "analytics_step": "Überprüfen Sie Ihre Statistiken und verfolgen Sie Ihren Fortschritt.",
                "scanner_step": "Scannen Sie Ihr Essen und Fotos, um Ihre Gesundheit zu analysieren!",
                "settings_step": "Greifen Sie auf Ihre Konto- und App-Einstellungen zu.",
                "notifications_step": "Hier finden Sie Ihre Benachrichtigungen und freigeschalteten Erfolge!"
            },
            "scan_result": {
                "title": "Ergebnisse",
                "no_data": "Keine Analyse verfügbar",
                "analysis_face": "Gesichtsanalyse",
                "analysis_body": "Körperanalyse",
                "analysis_nutrition": "Ernährungsanalyse",
                "ai_complete": "KI-Analyse abgeschlossen",
                "details_title": "Analysedetails",
                "score_face": "Gesundheits-/Ästhetik-Score",
                "score_body": "Fitness-Score",
                "score_nutrition": "Tellergesundheits-Score",
                "perceived_age": "Geschätztes Alter",
                "face_shape": "Gesichtsform",
                "symmetry": "Symmetrie",
                "fatigue": "Müdigkeitslevel",
                "hydration": "Hydratation",
                "photogenic": "Fotogen-Score",
                "skin_quality": "Hautqualität",
                "glow": "Ausstrahlung (Glow)",
                "collagen": "Kollagen (gesch.)",
                "body_type": "Körpertyp",
                "muscle_mass": "Muskelmasse",
                "waist": "Taille (gesch.)",
                "strength": "Kraft-Score",
                "bmi": "BMI (gesch.)",
                "metabolic_age": "Stoffwechselalter",
                "body_fat": "Körperfett (gesch.)",
                "posture": "Haltung",
                "body_symmetry": "Symmetrie",
                "calories": "Kalorien (kcal)",
                "verdict": "Urteil",
                "satiety": "Sättigungsindex",
                "ingredients": "Zutatenqualität",
                "glycemic": "Glykämischer Index",
                "vitamins": "Hauptvitamine",
                "macros_title": "Makros (gesch. Gramm)",
                "proteins": "Proteine",
                "carbs": "Kohlenhydrate",
                "fats": "Fette"
            },
            "notification_settings": {
                "title": "Benachrichtigungseinstellungen",
                "types": "Benachrichtigungstypen",
                "types_desc": "Wählen Sie, welche Benachrichtigungen Sie erhalten möchten",
                "reminders": "Erinnerungen",
                "reminders_desc": "Scan-Erinnerungen und tägliches Tracking",
                "achievements": "Erfolge",
                "achievements_desc": "Meilensteine und Errungenschaften",
                "new_content": "Neuer Inhalt",
                "new_content_desc": "Neue Rezepte, Übungen und Funktionen",
                "info": "💡 Benachrichtigungen helfen Ihnen, motiviert zu bleiben. Sie können sie jederzeit deaktivieren.",
                "save": "Einstellungen speichern",
                "saved_title": "Gespeichert",
                "saved_message": "Ihre Einstellungen wurden aktualisiert.",
                "error_save": "Speichern fehlgeschlagen."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Entfalten Sie Ihr volles Potenzial",
                "already_premium_title": "Du bist Premium!",
                "already_premium_desc": "Du hast Zugriff auf alle Premium-Funktionen.",
                "price_per_month": "/Monat",
                "cancel_anytime": "Jederzeit kündbar",
                "features_title": "Premium-Funktionen",
                "subscribe_btn": "Jetzt abonnieren",
                "processing": "Verarbeitung...",
                "restore_btn": "Käufe wiederherstellen",
                "restoring": "Wiederherstellung...",
                "store_disclaimer": "Via App Store / Google Play",
                "web_disclaimer": "In-App-Käufe nur auf dem Handy verfügbar.",
                "purchase_success_title": "Willkommen bei Premium!",
                "purchase_success_msg": "Abonnement aktiviert.",
                "restore_success_title": "Wiederhergestellt",
                "restore_success_msg": "Abonnement erfolgreich wiederhergestellt.",
                "restore_empty": "Keine Käufe gefunden.",
                "benefits": {
                    "instant": "Sofortiger Zugriff",
                    "tracking": "Erweitertes Tracking",
                    "support": "Priorisierter Support"
                },
                "upgrade_title": "Premium upgraden",
                "upgrade_premium": "Auf Premium upgraden",
                "subtitle_premium": "Ihr Abonnement ist aktiv.",
                "subtitle_upgrade": "Entfalten Sie Ihr volles Gesundheitspotenzial",
                "compare_plans": "Pläne vergleichen",
                "button_upgrade": "Abonnieren",
                "button_later": "Vielleicht später",
                "price": "9,99 €",
                "period": "/Monat",
                "web_unavailable_title": "Nicht im Web verfügbar",
                "validation_title": "Überprüfung läuft",
                "purchase_error_default": "Ein Fehler ist beim Kauf aufgetreten. Bitte versuchen Sie es erneut.",
                "purchase_error_generic": "Kauf konnte nicht verarbeitet werden. Bitte überprüfen Sie Ihre Verbindung.",
                "restore_empty_title": "Info",
                "restore_error_default": "Käufe konnten nicht wiederhergestellt werden.",
                "restore_error_generic": "Fehler bei der Wiederherstellung.",
                "web_note": "Hinweis: In-App-Käufe sind nur in den nativen mobilen Apps verfügbar. Nutzen Sie die Android- oder iOS-App zum Abonnieren.",
                "store_note": "Das Abonnement wird über Ihr {{store}}-Konto abgerechnet. Verwalten Sie es in den Einstellungen Ihres {{store}}-Kontos.",
                "already_premium_intro": "Sie sind Premium-Mitglied."
            },
            "privacy": {
                "title": "Datenschutzerklärung",
                "last_updated": "Zuletzte Aktualisierung: 15. Oktober 2025",
                "intro_title": "1. Einleitung",
                "intro_content": "Willkommen bei Health Scan. Wir schützen Ihre Privatsphäre.",
                "data_title": "2. Gesammelte Daten",
                "usage_title": "3. Datennutzung",
                "storage_title": "4. Speicherung & Sicherheit",
                "sharing_title": "5. Datenweitergabe",
                "rights_title": "6. Ihre Rechte",
                "contact_title": "10. Kontakt",
                "data_content": "Wir erheben die folgenden Kategorien von Daten:",
                "data_account": "Kontoinformationen: E-Mail, Benutzername, Profilfoto",
                "data_scans": "Scandaten: Von unserer KI analysierte Bilder (Gesicht, Körper, Mahlzeiten), Analyseergebnisse und Gesundheitswerte",
                "data_device": "Technische Informationen: Gerätekennung zur Anmeldesicherheit",
                "data_usage": "Nutzungsdaten: Scanverlauf, Präferenzen, Nutzungsstatistiken",
                "camera_title": "3. Verwendung der Kamera",
                "camera_content": "Health Scan verwendet die Kamera Ihres Geräts ausschließlich zur Aufnahme von Bildern zur Analyse (Gesicht, Körper, Ernährung). Die Fotos werden von unserer künstlichen Intelligenz verarbeitet, um Gesundheitsanalysen zu erstellen. Bilder werden sicher über HTTPS übertragen und niemals an Dritte weitergegeben. Sie können Ihre Daten jederzeit löschen.",
                "usage_content": "Ihre Daten werden verwendet, um:",
                "usage_analysis": "Stellen Sie mithilfe unserer KI personalisierte Gesundheitsanalysen bereit",
                "usage_improve": "Verbessern Sie unsere Algorithmen und die Qualität unserer Dienstleistungen",
                "usage_personalize": "Personalisieren Sie Ihre Erfahrungen und Empfehlungen",
                "storage_content": "Ihre Daten werden sicher auf Supabase gespeichert, einer Cloud-Plattform, die höchste Sicherheitsstandards erfüllt. Die gesamte Kommunikation wird über TLS/SSL verschlüsselt. Ihre Passwörter werden mit robusten kryptografischen Algorithmen gehasht. Wir setzen Sicherheitsrichtlinien (RLS) auf Datenbankebene durch, um sicherzustellen, dass nur Sie auf Ihre Daten zugreifen können.",
                "sharing_content": "Wir verkaufen Ihre persönlichen Daten niemals. Eine Weitergabe Ihrer Daten erfolgt ausschließlich an technische Dienstleister, die für den Betrieb des Dienstes unbedingt erforderlich sind (Hosting, E-Mail-Versand) und nur im dafür erforderlichen Umfang. Im Falle einer gesetzlichen Verpflichtung können wir verpflichtet sein, bestimmte Informationen an die zuständigen Behörden weiterzugeben.",
                "rights_content": "Gemäß der DSGVO haben Sie folgende Rechte:",
                "rights_access": "Zugriffsrecht: Alle Ihre persönlichen Daten einsehen",
                "rights_delete": "Recht auf Löschung: Löschen Sie Ihr Konto und alle Ihre Daten",
                "rights_export": "Recht auf Portabilität: Exportieren Sie Ihre Daten in ein Standardformat",
                "rights_withdraw": "Widerrufsrecht: Widerrufen Sie Ihre Einwilligung jederzeit",
                "children_title": "8. Jugendschutz",
                "children_content": "Health Scan ist nicht für Personen unter 16 Jahren bestimmt. Wir erfassen wissentlich keine Daten von Minderjährigen. Wenn Sie ein Elternteil sind und glauben, dass Ihr Kind uns Informationen zur Verfügung gestellt hat, kontaktieren Sie uns, um diese zu löschen.",
                "updates_title": "9. Änderungen",
                "updates_content": "Wir können diese Datenschutzrichtlinie aktualisieren. Bei wesentlichen Änderungen benachrichtigen wir Sie über den Antrag oder per E-Mail. Das Datum der letzten Aktualisierung wird oben auf dieser Seite angezeigt.",
                "contact_content": "Wenn Sie Fragen zu Ihren Daten oder dieser Richtlinie haben, kontaktieren Sie uns:"
            },
            "components": {
                "feature_gate": {
                    "title": "Premium-Funktion",
                    "upgrade_btn": "Upgrade auf Premium"
                },
                "table": {
                    "header_feature": "Funktion",
                    "header_free": "Kostenlos",
                    "header_premium": "Premium"
                },
                "error_boundary": {
                    "title": "Hoppla!",
                    "retry": "Wiederholen",
                    "logout": "Abmelden"
                },
                "condition_card": {
                    "probability": "Wahrscheinlichkeit",
                    "explanation": "Erklärung",
                    "tip": "Tipp",
                    "unlock": "Freischalten"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                },
                "avatar": {
                    "error_title": "Fehler",
                    "error_download": "Foto konnte nicht heruntergeladen werden",
                    "error_size": "Bild zu groß. Maximal 5MB.",
                    "perm_title": "Erlaubnis erforderlich",
                    "perm_gallery": "Bitte Zugriff auf Fotogalerie erlauben",
                    "perm_camera": "Bitte Zugriff auf Kamera erlauben",
                    "options_title": "Profilbild",
                    "options_msg": "Option wählen",
                    "take_photo": "Foto aufnehmen",
                    "choose_gallery": "Aus Galerie wählen",
                    "hint": "Zum Bearbeiten tippen"
                },
                "urgency": {
                    "title": "Achtung",
                    "message": "KI hat visuelle Indikatoren erkannt, die Ihre Aufmerksamkeit erfordern.\n\nDies ist keine medizinische Diagnose.",
                    "dismiss": "Verstanden"
                },
                "feature_list": {
                    "free": "Kostenlos",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Komplette Körper- & Gesichtsanalyse",
                    "subtitle_used": "Kommen Sie morgen für einen neuen Scan wieder",
                    "subtitle_available": "Tiefe KI-Analyse verfügbar",
                    "status_locked": "Mit Premium freischalten",
                    "status_used": "Reset um Mitternacht",
                    "status_available": "Bereit zum Scannen"
                }
            },
            "scan_types": {
                "body": "Körper",
                "health": "Gesicht",
                "nutrition": "Ernährung",
                "super": "Super Scan"
            },
            "notifications": {
                "title": "Benachrichtigungen",
                "empty_title": "Keine Benachrichtigungen",
                "empty_unread": "Alles gelesen! Verfolgen Sie Ihre Gesundheit weiter.",
                "empty_all": "Sie haben noch keine Benachrichtigungen.",
                "loading": "Lade Benachrichtigungen...",
                "filter_all": "Alle",
                "filter_unread": "Ungelesen",
                "filter_read": "Gelesen",
                "scan_health_title": "Gesundheitsscan verfügbar",
                "scan_health_body": "Ihr wöchentlicher Gesundheitsscan ist verfügbar. Bleiben Sie gesund!",
                "scan_body_title": "Körperscan verfügbar",
                "scan_body_body": "Ihr monatlicher Körperscan ist verfügbar. Verfolgen Sie Ihren Fortschritt!",
                "scan_nutrition_title": "Ernährungs-Scan verfügbar",
                "scan_nutrition_body": "Ihr Ernährungs-Scan ist verfügbar.",
                "scan_super_title": "Super Scan verfügbar",
                "scan_super_body": "Ihr täglicher Super Scan ist verfügbar.",
                "achievements": {
                    "title": "Neuer Meilenstein!",
                    "one_week": "Herzlichen Glückwunsch! Eine Woche Gesundheits-Tracking!",
                    "one_month": "Herzlichen Glückwunsch! 🎉 Sie kümmern sich seit einem Monat mit Health Scan um Ihre Gesundheit.",
                    "three_months": "Gut gemacht! 3 Monate Gesundheits-Tracking!",
                    "six_months": "Unglaublich! 6 Monate Gesundheits-überwachung. Weiter so!",
                    "one_year": "Außergewöhnlich! Ein Jahr mit Health Scan! 🏆"
                },
                "daily_reminders": {
                    "1": {
                        "title": "Hey, es ist Zeit!",
                        "body": "Ein kleiner Scan heute? Ihre Gesundheit wird es Ihnen danken!"
                    },
                    "2": {
                        "title": "Wir vermissen dich!",
                        "body": "Nehmen Sie sich 30 Sekunden Zeit, um Ihre Tagesform zu überprüfen."
                    },
                    "3": {
                        "title": "Bereit für den Check-up?",
                        "body": "Starten Sie einen schnellen Scan und bleiben Sie fit!"
                    },
                    "4": {
                        "title": "Hallo du!",
                        "body": "Vergiss deinen täglichen Scan nicht, es dauert 2 Minuten."
                    },
                    "5": {
                        "title": "Wir warten auf dich!",
                        "body": "Dein Körper hat dir heute vielleicht etwas zu sagen."
                    },
                    "6": {
                        "title": "Gesundheits-Erinnerung",
                        "body": "Ein Foto, eine Analyse, und du weißt, wo du stehst!"
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "Super Scan aufgeladen!",
                        "body": "Ihr täglicher Super Scan ist bereit. Genießen Sie es!"
                    },
                    "2": {
                        "title": "Es geht wieder los!",
                        "body": "Neuer Tag, neuer Super Scan zu Ihrer Verfügung!"
                    },
                    "3": {
                        "title": "Ihr Super Scan wartet",
                        "body": "Die vollständige Analyse ist wieder verfügbar!"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "Weiter so!",
                        "body": "Jeder Scan bringt Sie Ihren Zielen näher."
                    },
                    "2": {
                        "title": "Du rockst das!",
                        "body": "Deine Regelmäßigkeit zahlt sich aus, die Ergebnisse folgen."
                    },
                    "3": {
                        "title": "Kleine Erinnerung",
                        "body": "Sich um sich selbst zu kümmern, bedeutet auch, auf seinen Körper zu hören."
                    },
                    "4": {
                        "title": "Toller Fortschritt!",
                        "body": "Du leistest gute Arbeit, behalte diesen Schwung bei."
                    },
                    "5": {
                        "title": "Du bist auf dem richtigen Weg",
                        "body": "Konsistenz ist der Schlüssel zum Erfolg. Bravo!"
                    },
                    "6": {
                        "title": "Stolz auf dich?",
                        "body": "Das solltest du sein! Seine Gesundheit zu verfolgen ist bereits ein großer Schritt."
                    }
                }
            },
            "not_found": {
                "text": "Diese Seite existiert nicht.",
                "link": "Zur Startseite"
            },
            "api_errors": {
                "network": "Netzwerkfehler. Überprüfen Sie Ihre Verbindung.",
                "unauthorized": "Sitzung abgelaufen. Bitte erneut anmelden.",
                "server": "Serverfehler. Bitte versuchen Sie es später erneut.",
                "scan_limit": "Scan-Limit erreicht.",
                "payment_failed": "Zahlung fehlgeschlagen."
            },
            "navigation": {
                "session_expired_title": "Sitzung abgelaufen",
                "session_expired_msg": "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.",
                "loop_error_title": "Navigationsfehler",
                "loop_error_msg": "Eine Umleitungsschleife wurde erkannt. Bitte melden Sie sich ab und versuchen Sie es erneut.",
                "logout_btn": "Abmelden"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Melden Sie sich an",
                "email_placeholder": "E-Mail",
                "password_placeholder": "Passwort",
                "password_confirm": "Passwort bestätigen",
                "login_btn": "Anmelden",
                "no_account": "Kein Konto?",
                "signup_link": "Registrieren",
                "signup_title": "Konto erstellen",
                "signup_subtitle": "Werden Sie Teil von Health Scan",
                "password_min_placeholder": "Passwort (min. 6 Zeichen)",
                "password_confirm_placeholder": "Passwort bestätigen",
                "verification_note": "Wir senden Ihnen einen Bestätigungscode.",
                "signup_btn": "Registrieren",
                "has_account": "Bereits ein Konto?",
                "login_link": "Anmelden",
                "error_email_required": "E-Mail ist erforderlich",
                "error_password_required": "Passwort ist erforderlich",
                "error_passwords_match": "Passwörter stimmen nicht überein",
                "error_password_length": "Passwort muss mindestens 6 Zeichen lang sein",
                "error_login_generic": "Anmeldung fehlgeschlagen",
                "error_ip_limit_reached": "Kontoerstellungslimit für dieses Netzwerk erreicht. Bitte versuchen Sie es später erneut.",
                "error_signup_generic": "Registrierung fehlgeschlagen",
                "error_account_creation": "Fehler beim Erstellen des Kontos",
                "error_username_taken": "Dieser Benutzername ist bereits vergeben. Bitte wählen Sie einen anderen.",
                "error_session_invalid": "Ungültige Sitzung",
                "error_email_verification_required": "Bitte verifizieren Sie Ihre E-Mail bevor Sie fortfahren.",
                "error_disposable_email": "Wegwerf-E-Mail-Adressen sind nicht erlaubt",
                "error_verification_send": "Fehler beim Senden des Bestätigungscodes",
                "error_verification_code": "Falscher Code",
                "error_auth_cancelled": "Authentifizierung abgebrochen",
                "verify_btn": "Überprüfen",
                "verifying": "Überprüfung...",
                "verification_sent_title": "E-Mail verifiziert!",
                "verification_sent_subtitle_signup": "Kontoerstellung wird abgeschlossen...",
                "verification_sent_subtitle_login": "Anmeldung läuft...",
                "verify_title": "Überprüfen Sie Ihre E-Mail",
                "verify_subtitle": "Wir haben einen 6-stelligen Code gesendet an",
                "code_expired": "Code läuft ab in",
                "resend_code": "Code erneut senden",
                "resend_in": "Erneut senden in {{seconds}}s",
                "code_incomplete": "Bitte geben Sie den vollständigen Code ein",
                "code_invalid": "Falscher oder abgelaufener Code",
                "remember_device": "Dieses Gerät merken",
                "email_label": "E-Mail",
                "errors": {
                    "fill_all": "Bitte alle Felder ausfüllen",
                    "invalid_email": "Ungültige E-Mail",
                    "password_mismatch": "Passwörter stimmen nicht überein",
                    "password_short": "Passwort muss mind. 6 Zeichen lang sein",
                    "disposable_email": "Wegwerf-E-Mails sind nicht erlaubt",
                    "email_in_use": "Diese E-Mail wird bereits verwendet",
                    "general_error": "Ein Fehler ist aufgetreten",
                    "invalid_credentials": "Ungültige Anmeldedaten",
                    "oauth_login": "Fehler bei der Anmeldung mit {{provider}}"
                },
                "code_incorrect": "Falscher Code",
                "code_not_found": "Kein Bestätigungscode gefunden. Bitte fordern Sie ein neues an.",
                "code_expired_error": "Dieser Code ist abgelaufen. Bitte fordern Sie ein neues an.",
                "too_many_attempts": "Zu viele Fehlversuche. Bitte fordern Sie einen neuen Code an.",
                "attempts_remaining": "{{count}}-Testversion(en) verbleibend",
                "general_error": "Es ist ein Fehler aufgetreten"
            },
            "scanner": {
                "authorize_camera": "Kamera zulassen",
                "camera_permission_msg": "Wir benötigen Zugriff auf Ihre Kamera, um zu scannen.",
                "error_taking_photo": "Foto konnte nicht aufgenommen werden",
                "error_loading_image": "Bild konnte nicht geladen werden",
                "type_required_title": "Erforderlicher Scantyp",
                "type_required_msg": "Bitte wählen Sie einen Scantyp aus.",
                "super_unavailable_title": "Super Scan nicht verfügbar",
                "super_unavailable_msg": "Bitte wählen Sie einen anderen Scantyp."
            },
            "exercises": {
                "title": "Unsere Übungen",
                "search_placeholder": "Übung suchen...",
                "no_results": "Keine Übungen gefunden",
                "duration": "min",
                "difficulty": {
                    "easy": "Leicht",
                    "medium": "Mittel",
                    "hard": "Schwer"
                }
            },
            "recipes": {
                "title": "Unsere Rezepte",
                "search_placeholder": "Rezept suchen...",
                "no_results": "Keine Rezepte gefunden",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Leicht",
                    "medium": "Mittel",
                    "hard": "Schwer"
                }
            },
            "onboarding": {
                "welcome_title": "Willkommen!",
                "setup_profile": "Profil einrichten",
                "choose_style": "Stil wählen",
                "username_label": "Benutzername *",
                "username_placeholder": "user123",
                "username_status": {
                    "checking": "Prüfen...",
                    "available": "Verfügbar",
                    "taken": "Bereits vergeben",
                    "invalid": "3-20 Zeichen, Buchstaben, Zahlen"
                },
                "theme": {
                    "dark": "Dunkel",
                    "dark_desc": "Standard",
                    "light": "Hell",
                    "light_desc": "Sekundär"
                },
                "next_btn": "Weiter",
                "start_btn": "Abenteuer starten",
                "error_session": "Ungültige Sitzung. Bitte neu einloggen.",
                "error_email": "Bitte E-Mail vor dem Fortfahren bestätigen.",
                "error_username_empty": "Bitte Benutzernamen wählen",
                "error_username_taken": "Bitte freien Benutzernamen wählen"
            },
            "languages": {
                "fr": "Französisch",
                "en": "Englisch",
                "de": "Deutsch",
                "it": "Italienisch",
                "es": "Spanisch",
                "pt": "Portugiesisch"
            },
            "analytics": {
                "title": "Analysen",
                "subtitle": "Verfolgen Sie Ihren Fortschritt",
                "periods": {
                    "days_7": "7T",
                    "days_30": "30T",
                    "months_3": "3 Mon",
                    "year_1": "1 Jahr"
                },
                "premium_feature": "Premium-Funktion",
                "premium_feature_msg": "Analysen über 3 Monate und 1 Jahr sind Premium-Mitgliedern vorbehalten.\n\nSchalten Sie den vollen Zugriff auf Ihre Gesundheitshistorie frei!",
                "empty_state": "Scannen Sie, um hier Ihren Fortschritt zu sehen!",
                "health_score": "Gesundheits-Score",
                "health_score_subtitle": "Entwicklung Ihres Gesamtscores",
                "physical_evolution": "Körperliche Entwicklung",
                "physical_evolution_subtitle": "Körperscore & Körperfett %",
                "face_score": "Gesichtswertung",
                "face_score_subtitle": "Entwicklung Ihrer Gesichtswertung",
                "nutrition_score": "Ernährungs-Score",
                "nutrition_score_subtitle": "Durchschnittlicher Mahlzeitenscore",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Globales Risiko-Score",
                "legend_score": "Score (0-100)",
                "legend_body_fat": "Körperfett %"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "Super Scan ist eine exklusive Funktion für Premium-Mitglieder.\n\nErhalten Sie eine vollständige und detaillierte Analyse, indem Sie auf Premium upgraden!",
                "used_alert_title": "Super Scan verwendet",
                "used_alert_msg": "Sie haben Ihren Super Scan heute bereits verwendet.\n\nKommen Sie morgen für einen neuen Super Scan zurück!",
                "global_risk_score": "Globales Risiko-Score",
                "analysis_summary": "Analyse-Zusammenfassung",
                "conditions_detected": "Erkannte Bedingungen",
                "ras_title": "Alles in Ordnung",
                "ras_subtitle": "Keine Anzeichen erkannt",
                "ras_description": "Die Analyse hat keine besonderen Bedingungen erkannt. Passen Sie weiterhin gut auf sich auf!",
                "premium_badge": "Premium",
                "used_today": "Verwendet",
                "limit_daily": "1/Tag",
                "connection_reconnecting": "Verbindung wird wiederhergestellt...",
                "connection_unstable": "Instabile Verbindung. Zum Wiederholen tippen."
            },
            "premium_features": {
                "categories": {
                    "scans": "Scans",
                    "analytics": "Analysen",
                    "content": "Inhalt",
                    "features": "Funktionen",
                    "support": "Support"
                },
                "list": {
                    "health_scans": {
                        "title": "Gesundheitsscans",
                        "description": "Analysieren Sie Ihre Gesichtsgesundheit auf Anzeichen von Müdigkeit und Stress",
                        "free": "1 Gesundheitsscan pro Woche",
                        "premium": "3 Gesundheitsscans pro Tag"
                    },
                    "body_scans": {
                        "title": "Körperscans",
                        "description": "Verfolgen Sie die Entwicklung Ihrer Körperzusammensetzung",
                        "free": "1 Körperscan pro Monat",
                        "premium": "3 Körperscans pro Tag"
                    },
                    "nutrition_scans": {
                        "title": "Ernährungsscans",
                        "description": "Analysieren Sie Ihre Mahlzeiten für präzises Ernährungstracking",
                        "free": "1 Ernährungsscan alle 3 Tage",
                        "premium": "3 Ernährungsscans pro Tag"
                    },
                    "detailed_analytics": {
                        "title": "Detaillierte Analysen",
                        "description": "Erweiterte Diagramme, vollständiger Verlauf und Gesundheitsvorhersagen",
                        "free": "Basis-Diagramme (7 Tage)",
                        "premium": "Unbegrenzte detaillierte Analysen mit Verlauf und Vorhersagen"
                    },
                    "unlimited_scans": {
                        "title": "Unbegrenzte Scans",
                        "description": "Unbegrenzte Körper-, Gesundheits- und Ernährungsscans pro Tag",
                        "free": "Begrenzt nach Scan-Typ",
                        "premium": "3 Scans jedes Typs pro Tag"
                    },
                    "advanced_recipes": {
                        "title": "Fortgeschrittene Rezepte",
                        "description": "Zugang zu Premium-Rezepten mit detaillierten Ernährungsplänen und Videos",
                        "free": "Zugang zu Basis-Rezepten",
                        "premium": "Voller Zugang zu Premium-Rezepten mit Plänen und Videos"
                    },
                    "premium_exercises": {
                        "title": "Premium-Übungen",
                        "description": "Personalisierte Trainingsprogramme und HD-Videos",
                        "free": "Basis-Übungen",
                        "premium": "Personalisierte Programme mit HD-Videos und Coaching"
                    },
                    "export_data": {
                        "title": "Datenexport",
                        "description": "Exportieren Sie Ihre Gesundheitsdaten als PDF oder CSV",
                        "free": "Nicht verfügbar",
                        "premium": "Unbegrenzter Export als PDF oder CSV"
                    },
                    "priority_support": {
                        "title": "Priorisierter Support",
                        "description": "Schnelle Antworten von unserem Support-Team",
                        "free": "Standard-Support (48-72h)",
                        "premium": "Priorisierte Antworten innerhalb von 24h"
                    },
                    "custom_goals": {
                        "title": "Benutzerdefinierte Ziele",
                        "description": "Definieren Sie maßgeschneiderte Gesundheitsziele mit erweitertem Tracking",
                        "free": "Vordefinierte Ziele",
                        "premium": "Benutzerdefinierte Ziele mit erweitertem Tracking"
                    },
                    "meal_planner": {
                        "title": "Mahlzeitenplaner",
                        "description": "Automatische Mahlzeitenplanung basierend auf Ihren Zielen",
                        "free": "Nicht verfügbar",
                        "premium": "Automatische Planung basierend auf Ihren Zielen"
                    }
                }
            },
            "months_short": {
                "0": "Jan",
                "1": "Feb",
                "2": "Mär",
                "3": "Apr",
                "4": "Mai",
                "5": "Jun",
                "6": "Jul",
                "7": "Aug",
                "8": "Sep",
                "9": "Okt",
                "10": "Nov",
                "11": "Dez"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Oval",
                    "Round": "Runden",
                    "Square": "Quadrat",
                    "Heart": "Herz",
                    "Diamond": "Diamant",
                    "Long": "Verlängern",
                    "Triangle": "Dreieck",
                    "Rectangular": "Rechteckig"
                },
                "body_type": {
                    "Ectomorph": "Ektomorph",
                    "Mesomorph": "Mesomorph",
                    "Endomorph": "Endomorph",
                    "Hourglass": "Sanduhr",
                    "Pear": "Birne",
                    "Apple": "Apfel",
                    "Rectangle": "Rechteck",
                    "Inverted Triangle": "Umgekehrtes Dreieck"
                },
                "muscle_mass": {
                    "Low": "Schwach",
                    "Moderate": "Mäßig",
                    "Average": "Durchschnitt",
                    "High": "Hoch",
                    "Very High": "Sehr hoch",
                    "Athlete": "Sportlich"
                },
                "glycemic_index": {
                    "Low": "Schwach",
                    "Moderate": "Mäßig",
                    "High": "Schüler"
                },
                "ingredient_quality": {
                    "Excellent": "Exzellent",
                    "Good": "Gut",
                    "Average": "Durchschnitt",
                    "Poor": "Schlecht",
                    "Bad": "Arm"
                },
                "severity": {
                    "low": "Schwach",
                    "moderate": "Mäßig",
                    "high": "Schüler"
                }
            },
            "condition_card": {
                "explanation": "Erläuterung",
                "advice": "Praktische Ratschläge",
                "probability": "Wahrscheinlichkeit",
                "unlock": "Entsperren"
            },
            "settings": {
                "title": "Einstellungen",
                "section_subscription": "Abonnement",
                "upgrade_premium": "Upgrade auf Premium",
                "section_preferences": "Präferenzen",
                "language": "Sprache",
                "notifications": "Benachrichtigungen",
                "new_notifications": "Nachricht",
                "notifications_preferences": "Benachrichtigungseinstellungen",
                "section_app": "Anwendung",
                "privacy_policy": "Datenschutzrichtlinie",
                "danger_zone_title": "Gefahrenzone",
                "danger_zone_desc": "Sobald Ihr Konto gelöscht wurde, gibt es kein Zurück mehr. Seien Sie sich Ihrer Wahl sicher.",
                "sign_out_button": "Abmelden",
                "sign_out_loading": "Trennen...",
                "footer_version": "Gesundheitsscan v1.0.0",
                "select_language_title": "Sprache wählen",
                "cancel": "Stornieren",
                "ok": "Okay",
                "sign_out_confirm_title": "Trennen",
                "sign_out_confirm_msg": "Möchten Sie sich wirklich abmelden?",
                "sign_out_error_title": "Fehler",
                "sign_out_error_msg": "Fehler beim Trennen der Verbindung",
                "danger_zone": "Gefahrenzone"
            }
        },
        "it": {
            "common": {
                "back": "Indietro",
                "retry": "Riprova",
                "error": "Errore",
                "ok": "OK",
                "cancel": "Annulla",
                "password": "Password",
                "loading": "Caricamento...",
                "success": "Successo",
                "unknown_user": "Utente",
                "account_free": "Account Gratuito",
                "account_premium": "Account Premium",
                "home_back": "Torna alla Home",
                "save": "Salva",
                "later": "Più tardi",
                "skip": "Salta",
                "finish": "Finito",
                "available": "Disponibile",
                "in": "in",
                "time": {
                    "d": "g",
                    "h": "o",
                    "min": "min",
                    "s": "s"
                },
                "day": "giorno",
                "days": "giorni",
                "years_short": "anni",
                "hour": "ora",
                "hours": "ore",
                "minute": "minuto",
                "minutes": "minuti",
                "yesterday": "Ieri",
                "days_ago": "{{count}} giorni fa",
                "time_ago": {
                    "just_now": "Proprio adesso",
                    "minutes_ago": "Ci sono {{count}} min",
                    "hours_ago": "Ci sono {{count}}h",
                    "yesterday": "Ieri",
                    "days_ago": "{{count}} giorni fa"
                }
            },
            "tabs": {
                "home": "Home",
                "analytics": "Analisi",
                "scanner": "Scansiona"
            },
            "copilot": {
                "analytics_step": "Controlla le tue statistiche e segui i tuoi progressi nel tempo.",
                "scanner_step": "Scansiona il tuo cibo e le foto per analizzare la tua salute!",
                "settings_step": "Accedi alle impostazioni del tuo account e dell'app.",
                "notifications_step": "Trova qui le tue notifiche e i traguardi sbloccati!"
            },
            "scan_limits": {
                "week_1": "1 scan a settimana",
                "month_1": "1 scan al mese",
                "days_3_1": "1 scan ogni 3 giorni",
                "premium_only": "Solo Premium",
                "day_3": "3 scan al giorno",
                "day_1": "1 scan al giorno",
                "msg_weekly_reached": "Limite settimanale raggiunto",
                "msg_monthly_reached": "Limite mensile raggiunto",
                "msg_days_3_reached": "Limite raggiunto (ogni 3 giorni)",
                "msg_premium_only": "Solo per membri Premium",
                "msg_daily_reached_3": "Limite giornaliero raggiunto (3 scan)",
                "msg_daily_reached_1": "Limite giornaliero raggiunto (1 scan)"
            },
            "home": {
                "items_available": "Scansioni disponibili",
                "items_advised": "Integratori Consigliati",
                "global_score": "Punteggio Globale",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Limite raggiunto",
                "available": "disponibile"
            },
            "scan_preview": {
                "title": "Scegli Analisi",
                "type_label": "Tipo di scansione",
                "confirm_button": "Conferma e Salva",
                "confirm_loading": "Salvataggio...",
                "loading_text": "La tua scansione arriverà presto, potrebbe richiedere alcuni secondi...",
                "error_title_type": "Tipo errato",
                "error_title_analysis": "Analisi impossibile",
                "error_title_network": "Errore di rete",
                "error_msg_default": "Ops, l'immagine non ha potuto essere analizzata.",
                "error_msg_network": "Impossibile contattare il server di analisi.",
                "error_validation": "Parametri non validi.",
                "error_session": "Sessione scaduta."
            },
            "scan_result": {
                "title": "Risultati",
                "no_data": "Nessuna analisi disponibile",
                "analysis_face": "Analisi Viso",
                "analysis_body": "Analisi Corpo",
                "analysis_nutrition": "Analisi Nutrizione",
                "ai_complete": "Analisi IA completata",
                "details_title": "Dettagli Analisi",
                "score_face": "Punteggio Salute/Estetica",
                "score_body": "Punteggio Forma",
                "score_nutrition": "Punteggio Salute Piatto",
                "perceived_age": "Età percepita",
                "face_shape": "Forma viso",
                "symmetry": "Simmetria",
                "fatigue": "Livello stanchezza",
                "hydration": "Idratazione",
                "photogenic": "Punteggio fotogenia",
                "skin_quality": "Qualità pelle",
                "glow": "Luminosità (Glow)",
                "collagen": "Collagene (stima)",
                "body_type": "Tipo corporeo",
                "muscle_mass": "Massa muscolare",
                "waist": "Girovita (stima)",
                "strength": "Punteggio Forza",
                "bmi": "BMI (stima)",
                "metabolic_age": "Età metabolica",
                "body_fat": "Grasso corporeo (stima)",
                "posture": "Postura",
                "body_symmetry": "Simmetria",
                "calories": "Calorie (kcal)",
                "verdict": "Verdetto",
                "satiety": "Indice Sazietà",
                "ingredients": "Qualità Ingredienti",
                "glycemic": "Indice Glicemico",
                "vitamins": "Vitamine principali",
                "macros_title": "Macro (stima grammi)",
                "proteins": "Proteine",
                "carbs": "Carboidrati",
                "fats": "Grassi"
            },
            "notification_settings": {
                "title": "Preferenze Notifiche",
                "types": "Tipi di Notifica",
                "types_desc": "Scegli quali notifiche ricevere",
                "reminders": "Promemoria",
                "reminders_desc": "Promemoria scansioni e monitoraggio",
                "achievements": "Traguardi",
                "achievements_desc": "Notifiche obiettivi e successi",
                "new_content": "Nuovi Contenuti",
                "new_content_desc": "Nuove ricette, esercizi e funzioni",
                "info": "💡 Le notifiche ti aiutano a restare motivato. Puoi disattivarle in qualsiasi momento.",
                "save": "Salva Preferenze",
                "saved_title": "Impostazioni Salvate",
                "saved_message": "Preferenze aggiornate con successo.",
                "error_save": "Impossibile salvare le impostazioni."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Sblocca tutto il tuo potenziale",
                "already_premium_title": "Sei Premium!",
                "already_premium_desc": "Hai accesso a tutte le funzionalità premium.",
                "price_per_month": "/mese",
                "cancel_anytime": "Annulla in qualsiasi momento",
                "features_title": "Funzionalità Premium",
                "subscribe_btn": "Abbonati Ora",
                "processing": "Elaborazione...",
                "restore_btn": "Ripristina Acquisti",
                "restoring": "Ripristino...",
                "store_disclaimer": "Via App Store / Google Play",
                "web_disclaimer": "Acquisti in-app disponibili solo su mobile.",
                "purchase_success_title": "Benvenuto in Premium!",
                "purchase_success_msg": "Abbonamento attivato.",
                "restore_success_title": "Ripristinato",
                "restore_success_msg": "Abbonamento ripristinato con successo.",
                "restore_empty": "Nessun acquisto trovato.",
                "benefits": {
                    "instant": "Accesso Immediato",
                    "tracking": "Monitoraggio Avanzato",
                    "support": "Supporto Prioritario"
                },
                "upgrade_title": "Passa a Premium",
                "upgrade_premium": "Passa a Premium",
                "subtitle_premium": "Il tuo abbonamento è attivo.",
                "subtitle_upgrade": "Sblocca il tuo pieno potenziale di salute",
                "compare_plans": "Confronta i piani",
                "button_upgrade": "Abbonati",
                "button_later": "Forse più tardi",
                "price": "9,99 €",
                "period": "/mese",
                "web_unavailable_title": "Non disponibile sul Web",
                "validation_title": "Convalida in corso",
                "purchase_error_default": "Si è verificato un errore durante l'acquisto. Riprova.",
                "purchase_error_generic": "Impossibile elaborare l'acquisto. Controlla la tua connessione.",
                "restore_empty_title": "Info",
                "restore_error_default": "Impossibile ripristinare gli acquisti.",
                "restore_error_generic": "Errore durante il ripristino.",
                "web_note": "Nota: Gli acquisti in-app sono disponibili solo sulle app mobili native. Usa l'app Android o iOS per abbonarti.",
                "store_note": "L'abbonamento verrà addebitato sul tuo account {{store}}. Gestisci l'abbonamento nelle impostazioni del tuo account {{store}}.",
                "already_premium_intro": "Sei un membro Premium."
            },
            "privacy": {
                "title": "Politica Privacy",
                "last_updated": "Ultimo aggiornamento: 15 Ottobre 2025",
                "intro_title": "1. Introduzione",
                "intro_content": "Benvenuto su Health Scan. Proteggiamo la tua privacy.",
                "data_title": "2. Dati Raccolti",
                "usage_title": "3. Uso dei Dati",
                "storage_title": "4. Archiviazione & Sicurezza",
                "sharing_title": "5. Condivisione Dati",
                "rights_title": "6. I Tuoi Diritti",
                "contact_title": "10. Contatti",
                "data_content": "Raccogliamo le seguenti categorie di dati:",
                "data_account": "Informazioni sull'account: email, nome utente, foto del profilo",
                "data_scans": "Dati di scansione: immagini analizzate dalla nostra intelligenza artificiale (viso, corpo, pasti), risultati di analisi e punteggi di salute",
                "data_device": "Informazioni tecniche: identificatore del dispositivo per la sicurezza dell'accesso",
                "data_usage": "Dati di utilizzo: cronologia delle scansioni, preferenze, statistiche di utilizzo",
                "camera_title": "3. Utilizzo della fotocamera",
                "camera_content": "Health Scan utilizza la fotocamera del tuo dispositivo esclusivamente per acquisire immagini da analizzare (viso, corpo, dieta). Le foto vengono elaborate dalla nostra intelligenza artificiale per generare analisi sanitarie. Le immagini vengono trasmesse in modo sicuro tramite HTTPS e non vengono mai condivise con terze parti. Puoi cancellare i tuoi dati in qualsiasi momento.",
                "usage_content": "I tuoi dati vengono utilizzati per:",
                "usage_analysis": "Fornisci analisi sanitarie personalizzate tramite la nostra intelligenza artificiale",
                "usage_improve": "Migliorare i nostri algoritmi e la qualità dei nostri servizi",
                "usage_personalize": "Personalizza la tua esperienza e i tuoi consigli",
                "storage_content": "I tuoi dati sono archiviati in modo sicuro su Supabase, una piattaforma cloud che soddisfa i più elevati standard di sicurezza. Tutte le comunicazioni sono crittografate tramite TLS/SSL. Le tue password vengono sottoposte ad hashing con robusti algoritmi crittografici. Applichiamo politiche di sicurezza (RLS) a livello di database per garantire che solo tu possa accedere ai tuoi dati.",
                "sharing_content": "Non vendiamo mai i tuoi dati personali. I tuoi dati vengono condivisi solo con fornitori di servizi tecnici essenziali per il funzionamento del servizio (hosting, invio di e-mail) e solo nella misura necessaria. In caso di obbligo legale, potremmo essere tenuti a comunicare alcune informazioni alle autorità competenti.",
                "rights_content": "Ai sensi del GDPR, hai i seguenti diritti:",
                "rights_access": "Diritto di accesso: consultare tutti i tuoi dati personali",
                "rights_delete": "Diritto alla cancellazione: cancella il tuo account e tutti i tuoi dati",
                "rights_export": "Diritto alla portabilità: esporta i tuoi dati in un formato standard",
                "rights_withdraw": "Diritto di recesso: revocare il consenso in qualsiasi momento",
                "children_title": "8. Tutela dei minori",
                "children_content": "Health Scan non è destinato a persone di età inferiore a 16 anni. Non raccogliamo consapevolmente dati di minori. Se sei un genitore e ritieni che tuo figlio ci abbia fornito informazioni, contattaci per eliminarle.",
                "updates_title": "9. Modifiche",
                "updates_content": "Potremmo aggiornare questa politica sulla privacy. In caso di modifiche significative, ti avviseremo tramite l'applicazione o tramite email. La data dell'ultimo aggiornamento è indicata nella parte superiore di questa pagina.",
                "contact_content": "Se hai domande riguardanti i tuoi dati o questa politica, contattaci:"
            },
            "components": {
                "feature_gate": {
                    "title": "Funzionalità Premium",
                    "upgrade_btn": "Passa a Premium"
                },
                "table": {
                    "header_feature": "Funzionalità",
                    "header_free": "Gratuito",
                    "header_premium": "Premium"
                },
                "error_boundary": {
                    "title": "Ops!",
                    "retry": "Riprova",
                    "logout": "Disconnetti"
                },
                "condition_card": {
                    "probability": "probabilità",
                    "explanation": "Spiegazione",
                    "tip": "Consiglio",
                    "unlock": "Sblocca"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                },
                "avatar": {
                    "error_title": "Errore",
                    "error_download": "Impossibile scaricare foto",
                    "error_size": "Immagine troppo grande. Massimo 5MB.",
                    "perm_title": "Permesso richiesto",
                    "perm_gallery": "Consenti accesso alla galleria",
                    "perm_camera": "Consenti accesso alla fotocamera",
                    "options_title": "Foto Profilo",
                    "options_msg": "Scegli un'opzione",
                    "take_photo": "Scatta foto",
                    "choose_gallery": "Scegli dalla galleria",
                    "hint": "Tocca per modificare"
                },
                "urgency": {
                    "title": "Attenzione",
                    "message": "L'IA ha rilevato indicatori visivi che richiedono attenzione.\n\nQuesta non è una diagnosi medica.",
                    "dismiss": "Ho capito"
                },
                "feature_list": {
                    "free": "Gratuito",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Analisi completa Corpo & Viso",
                    "subtitle_used": "Torna domani per un nuovo scan",
                    "subtitle_available": "Analisi IA approfondita disponibile",
                    "status_locked": "Sblocca con Premium",
                    "status_used": "Reset a mezzanotte",
                    "status_available": "Pronto per la scansione"
                }
            },
            "scan_types": {
                "body": "Corpo",
                "health": "Viso",
                "nutrition": "Nutrizione",
                "super": "Super Scan"
            },
            "notifications": {
                "title": "Notifiche",
                "empty_title": "Nessuna notifica",
                "empty_unread": "Tutto letto! Continua a monitorare la tua salute.",
                "empty_all": "Non hai ancora notifiche.",
                "loading": "Caricamento notifiche...",
                "filter_all": "Tutte",
                "filter_unread": "Non lette",
                "filter_read": "Lette",
                "scan_health_title": "Scan Salute Disponibile",
                "scan_health_body": "Il tuo scan salute settimanale è disponibile.",
                "scan_body_title": "Scan Corpo Disponibile",
                "scan_body_body": "Il tuo scan corpo mensile è disponibile.",
                "scan_nutrition_title": "Scan Nutrizione Disponibile",
                "scan_nutrition_body": "Il tuo scan nutrizione è disponibile.",
                "scan_super_title": "Super Scan Disponibile",
                "scan_super_body": "Il tuo Super Scan quotidiano è disponibile.",
                "achievements": {
                    "title": "Nuovo Traguardo!",
                    "one_week": "Congratulazioni! Una settimana di monitoraggio della salute!",
                    "one_month": "Congratulazioni! 🎉 È un mese che ti prendi cura di te con Health Scan.",
                    "three_months": "Ben fatto! 3 mesi di monitoraggio della salute!",
                    "six_months": "Incredibile! 6 mesi di monitoraggio della tua salute. Continua così!",
                    "one_year": "Extraordinaire ! Un an avec Health Scan ! 🏆"
                },
                "daily_reminders": {
                    "1": {
                        "title": "Ehi, è ora!",
                        "body": "Una piccola scansione oggi? La tua salute ti ringrazierà!"
                    },
                    "2": {
                        "title": "Ci manchi!",
                        "body": "Prenditi 30 secondi per controllare la tua forma oggi."
                    },
                    "3": {
                        "title": "Pronto per il check-up?",
                        "body": "Lancia una scansione rapida e rimani al top!"
                    },
                    "4": {
                        "title": "Ehi tu!",
                        "body": "Non dimenticare la tua scansione quotidiana, ci vogliono 2 minuti."
                    },
                    "5": {
                        "title": "Ti aspettiamo!",
                        "body": "Il tuo corpo potrebbe avere cose da dirti oggi."
                    },
                    "6": {
                        "title": "Promemoria salute",
                        "body": "Una foto, un'analisi e sai dove sei!"
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "Super Scan ricaricato!",
                        "body": "Il tuo Super Scan quotidiano è pronto. Approfittane!"
                    },
                    "2": {
                        "title": "Si riparte!",
                        "body": "Nuovo giorno, nuovo Super Scan a tua disposizione!"
                    },
                    "3": {
                        "title": "Il tuo Super Scan ti aspetta",
                        "body": "L'analisi completa è nuovamente disponibile!"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "Continua così!",
                        "body": "Ogni scansione ti avvicina ai tuoi obiettivi."
                    },
                    "2": {
                        "title": "Sei forte!",
                        "body": "La tua costanza ripaga, i risultati seguiranno."
                    },
                    "3": {
                        "title": "Piccolo promemoria",
                        "body": "Prendersi cura di sé è anche ascoltare il proprio corpo."
                    },
                    "4": {
                        "title": "Grandi progressi!",
                        "body": "Stai facendo un ottimo lavoro, continua con questo slancio."
                    },
                    "5": {
                        "title": "Sei sulla strada giusta",
                        "body": "La costanza è la chiave del successo. Bravo!"
                    },
                    "6": {
                        "title": "Orgoglioso di te?",
                        "body": "Dovresti esserlo! Monitorare la tua salute è già un grande passo."
                    }
                }
            },
            "not_found": {
                "text": "Questa pagina non esiste.",
                "link": "Torna alla home"
            },
            "api_errors": {
                "network": "Errore di rete. Controlla la connessione.",
                "unauthorized": "Sessione scaduta. Accedi di nuovo.",
                "server": "Errore server. Riprova più tardi.",
                "scan_limit": "Limite scan raggiunto.",
                "payment_failed": "Pagamento fallito."
            },
            "navigation": {
                "session_expired_title": "Sessione Scaduta",
                "session_expired_msg": "La tua sessione è scaduta. Per favori accedi di nuovo.",
                "loop_error_title": "Errore di Navigazione",
                "loop_error_msg": "Rilevato loop di reindirizzamento. Disconnettiti e riprova.",
                "logout_btn": "Disconnetti"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Accedi al tuo account",
                "email_placeholder": "Email",
                "password_placeholder": "Password",
                "password_confirm": "Conferma Password",
                "login_btn": "Accedi",
                "no_account": "Non hai un account?",
                "signup_link": "Registrati",
                "signup_title": "Crea Account",
                "signup_subtitle": "Unisciti per scansionare la tua salute",
                "password_min_placeholder": "Password (min. 6 car.)",
                "password_confirm_placeholder": "Conferma password",
                "verification_note": "Ti invieremo un codice di verifica.",
                "signup_btn": "Registrati",
                "has_account": "Hai già un account?",
                "login_link": "Accedi",
                "error_email_required": "Email richiesta",
                "error_password_required": "Password richiesta",
                "error_passwords_match": "Le password non corrispondono",
                "error_password_length": "La password deve avere almeno 6 caratteri",
                "error_login_generic": "Errore durante l'accesso",
                "error_ip_limit_reached": "Limite di creazione account raggiunto per questa rete. Riprova più tardi.",
                "error_signup_generic": "Errore durante la registrazione",
                "verify_btn": "Verifica",
                "verifying": "Verifica in corso...",
                "verification_sent_title": "Email verificata!",
                "verification_sent_subtitle_signup": "Finalizzando la creazione del tuo account...",
                "verification_sent_subtitle_login": "Accesso in corso...",
                "verify_title": "Verifica la tua email",
                "verify_subtitle": "Abbiamo inviato un codice a 6 cifre a",
                "code_expired": "Codice scade in",
                "resend_code": "Invia nuovamente codice",
                "resend_in": "Invia nuovamente in {{seconds}}s",
                "code_incomplete": "Inserisci il codice completo",
                "code_invalid": "Codice errato o scaduto",
                "remember_device": "Ricorda questo dispositivo",
                "email_label": "Email",
                "errors": {
                    "fill_all": "Compila tutti i campi",
                    "invalid_email": "Email non valida",
                    "password_mismatch": "Le password non corrispondono",
                    "password_short": "La password deve avere almeno 6 caratteri",
                    "disposable_email": "Email temporanee non consentite",
                    "email_in_use": "Questa email è già in uso",
                    "general_error": "Si è verificato un errore",
                    "invalid_credentials": "Credenziali non valide",
                    "oauth_login": "Errore accesso con {{provider}}"
                },
                "error_account_creation": "Errore durante la creazione dell'account",
                "error_username_taken": "Questo nome utente è già utilizzato. Per favore scegline un altro.",
                "error_session_invalid": "Sessione non valida",
                "error_email_verification_required": "Controlla la tua email prima di continuare.",
                "error_disposable_email": "Non sono ammessi indirizzi email temporanei",
                "error_verification_send": "Impossibile inviare il codice di verifica",
                "error_verification_code": "Codice errato",
                "error_auth_cancelled": "Autenticazione annullata",
                "code_incorrect": "Codice errato",
                "code_not_found": "Nessun codice di verifica trovato. Si prega di richiederne uno nuovo.",
                "code_expired_error": "Questo codice è scaduto. Si prega di richiederne uno nuovo.",
                "too_many_attempts": "Troppi tentativi sbagliati. Si prega di richiedere un nuovo codice.",
                "attempts_remaining": "{{count}} prove rimanenti",
                "general_error": "Si è verificato un errore"
            },
            "scanner": {
                "authorize_camera": "Autorizza fotocamera",
                "camera_permission_msg": "Abbiamo bisogno di accedere alla tua fotocamera per scansionare.",
                "error_taking_photo": "Impossibile scattare la foto",
                "error_loading_image": "Impossibile caricare l'immagine",
                "type_required_title": "Tipo di scansione richiesto",
                "type_required_msg": "Seleziona un tipo di scansione.",
                "super_unavailable_title": "Super Scan non disponibile",
                "super_unavailable_msg": "Seleziona un altro tipo di scansione."
            },
            "exercises": {
                "title": "I Nostri Esercizi",
                "search_placeholder": "Cerca esercizio...",
                "no_results": "Nessun esercizio trovato",
                "duration": "min",
                "difficulty": {
                    "easy": "Facile",
                    "medium": "Medio",
                    "hard": "Difficile"
                }
            },
            "recipes": {
                "title": "Le Nostre Ricette",
                "search_placeholder": "Cerca ricetta...",
                "no_results": "Nessuna ricetta trovata",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Facile",
                    "medium": "Medio",
                    "hard": "Difficile"
                }
            },
            "onboarding": {
                "welcome_title": "Benvenuto!",
                "setup_profile": "Configura profilo",
                "choose_style": "Scegli stile",
                "username_label": "Nome utente *",
                "username_placeholder": "utente123",
                "username_status": {
                    "checking": "Verifica...",
                    "available": "Disponibile",
                    "taken": "Già preso",
                    "invalid": "3-20 car., lettere, numeri"
                },
                "theme": {
                    "dark": "Scuro",
                    "dark_desc": "Predefinito",
                    "light": "Chiaro",
                    "light_desc": "Secondario"
                },
                "next_btn": "Avanti",
                "start_btn": "Inizia Avventura",
                "error_session": "Sessione non valida. Riaccedi.",
                "error_email": "Verifica email prima di continuare.",
                "error_username_empty": "Scegli un nome utente",
                "error_username_taken": "Scegli un nome utente disponibile"
            },
            "languages": {
                "fr": "Francese",
                "en": "Inglese",
                "de": "Tedesco",
                "it": "Italiano",
                "es": "Spagnolo",
                "pt": "Portoghese"
            },
            "analytics": {
                "title": "Analisi",
                "subtitle": "Monitora i tuoi progressi",
                "periods": {
                    "days_7": "7g",
                    "days_30": "30g",
                    "months_3": "3 Mesi",
                    "year_1": "1 Anno"
                },
                "premium_feature": "Funzionalità Premium",
                "premium_feature_msg": "Le analisi su 3 mesi e 1 anno sono riservate ai membri Premium.\n\nSblocca l'accesso completo alla tua cronologia salute!",
                "empty_state": "Inizia a scansionare per vedere i tuoi progressi qui!",
                "health_score": "Punteggio Salute",
                "health_score_subtitle": "Evoluzione del tuo punteggio globale",
                "physical_evolution": "Evoluzione Fisica",
                "physical_evolution_subtitle": "Punteggio Corporeo & Grasso Corporeo %",
                "face_score": "Punteggio Viso",
                "face_score_subtitle": "Evoluzione del punteggio viso",
                "nutrition_score": "Punteggio Nutrizione",
                "nutrition_score_subtitle": "Punteggio medio dei pasti",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Punteggio di Rischio Globale",
                "legend_score": "Punteggio (0-100)",
                "legend_body_fat": "Grasso Corporeo %"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "Il Super Scan è una funzionalità esclusiva per i membri Premium.\n\nOttieni un'analisi completa e dettagliata passando a Premium!",
                "used_alert_title": "Super Scan Utilizzato",
                "used_alert_msg": "Hai già utilizzato il tuo Super Scan oggi.\n\nTorna domani per un nuovo Super Scan!",
                "global_risk_score": "Punteggio Rischio Globale",
                "analysis_summary": "Riepilogo Analisi",
                "conditions_detected": "Condizioni Rilevate",
                "ras_title": "Tutto ok",
                "ras_subtitle": "Nessun segno rilevato",
                "ras_description": "L'analisi non ha rilevato nessuna condizione particolare. Continua a prenderti cura di te!",
                "premium_badge": "Premium",
                "used_today": "Usato",
                "limit_daily": "1/giorno",
                "connection_reconnecting": "Riconnessione...",
                "connection_unstable": "Connessione instabile. Tocca per riprovare."
            },
            "premium_features": {
                "categories": {
                    "scans": "Scansioni",
                    "analytics": "Analisi",
                    "content": "Contenuti",
                    "features": "Funzionalità",
                    "support": "Supporto"
                },
                "list": {
                    "health_scans": {
                        "title": "Scansioni Salute",
                        "description": "Analizza la salute del viso per rilevare segni di stanchezza e stress",
                        "free": "1 scansione salute a settimana",
                        "premium": "3 scansioni salute al giorno"
                    },
                    "body_scans": {
                        "title": "Scansioni Corpo",
                        "description": "Monitora l'evoluzione della composizione corporea",
                        "free": "1 scansione corpo al mese",
                        "premium": "3 scansioni corpo al giorno"
                    },
                    "nutrition_scans": {
                        "title": "Scansioni Nutrizione",
                        "description": "Analizza i tuoi pasti per un monitoraggio nutrizionale preciso",
                        "free": "1 scansione nutrizione ogni 3 giorni",
                        "premium": "3 scansioni nutrizione al giorno"
                    },
                    "detailed_analytics": {
                        "title": "Analisi Dettagliate",
                        "description": "Grafici avanzati, cronologia completa e previsioni sulla salute",
                        "free": "Grafici di base (7 giorni)",
                        "premium": "Analisi dettagliate illimitate con cronologia e previsioni"
                    },
                    "unlimited_scans": {
                        "title": "Scansioni Illimitate",
                        "description": "Scansioni corpo, salute e nutrizione illimitate al giorno",
                        "free": "Limitato per tipo di scansione",
                        "premium": "3 scansioni di ogni tipo al giorno"
                    },
                    "advanced_recipes": {
                        "title": "Ricette Avanzate",
                        "description": "Accesso a ricette premium con piani nutrizionali dettagliati e video",
                        "free": "Accesso a ricette di base",
                        "premium": "Accesso completo a ricette premium con piani e video"
                    },
                    "premium_exercises": {
                        "title": "Esercizi Premium",
                        "description": "Programmi di allenamento personalizzati e video HD",
                        "free": "Esercizi di base",
                        "premium": "Programmi personalizzati con video HD e coaching"
                    },
                    "export_data": {
                        "title": "Esportazione Dati",
                        "description": "Esporta i tuoi dati sanitari in PDF o CSV",
                        "free": "Non disponibile",
                        "premium": "Esportazione illimitata in PDF o CSV"
                    },
                    "priority_support": {
                        "title": "Supporto Prioritario",
                        "description": "Risposte rapide dal nostro team di supporto",
                        "free": "Supporto standard (48-72h)",
                        "premium": "Risposte prioritarie entro 24 ore"
                    },
                    "custom_goals": {
                        "title": "Obiettivi Personalizzati",
                        "description": "Definisci obiettivi di salute su misura con monitoraggio avanzato",
                        "free": "Obiettivi predefiniti",
                        "premium": "Obiettivi personalizzati con monitoraggio avanzato"
                    },
                    "meal_planner": {
                        "title": "Pianificatore Pasti",
                        "description": "Pianificazione automatica dei pasti in base ai tuoi obiettivi",
                        "free": "Non disponibile",
                        "premium": "Pianificazione automatica in base ai tuoi obiettivi"
                    }
                }
            },
            "months_short": {
                "0": "Gen",
                "1": "Feb",
                "2": "Mar",
                "3": "Apr",
                "4": "Mag",
                "5": "Giu",
                "6": "Lug",
                "7": "Ago",
                "8": "Set",
                "9": "Ott",
                "10": "Nov",
                "11": "Dic"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Ovale",
                    "Round": "Girare",
                    "Square": "Piazza",
                    "Heart": "Cuore",
                    "Diamond": "Diamante",
                    "Long": "Allungare",
                    "Triangle": "Triangolo",
                    "Rectangular": "Rettangolare"
                },
                "body_type": {
                    "Ectomorph": "Ectomorfo",
                    "Mesomorph": "Mesomorfo",
                    "Endomorph": "Endomorfo",
                    "Hourglass": "Clessidra",
                    "Pear": "Pera",
                    "Apple": "Mela",
                    "Rectangle": "Rettangolo",
                    "Inverted Triangle": "Triangolo invertito"
                },
                "muscle_mass": {
                    "Low": "Debole",
                    "Moderate": "Moderare",
                    "Average": "Media",
                    "High": "Alto",
                    "Very High": "Molto alto",
                    "Athlete": "Atletico"
                },
                "glycemic_index": {
                    "Low": "Debole",
                    "Moderate": "Moderare",
                    "High": "Pupilla"
                },
                "ingredient_quality": {
                    "Excellent": "Eccellente",
                    "Good": "Bene",
                    "Average": "Media",
                    "Poor": "Cattivo",
                    "Bad": "Povero"
                },
                "severity": {
                    "low": "Debole",
                    "moderate": "Moderare",
                    "high": "Pupilla"
                }
            },
            "condition_card": {
                "explanation": "Spiegazione",
                "advice": "Consigli pratici",
                "probability": "probabilità",
                "unlock": "Sbloccare"
            },
            "settings": {
                "title": "Impostazioni",
                "section_subscription": "Sottoscrizione",
                "upgrade_premium": "Passa a Premium",
                "section_preferences": "Preferenze",
                "language": "Lingua",
                "notifications": "Notifiche",
                "new_notifications": "notizia",
                "notifications_preferences": "Preferenze di notifica",
                "section_app": "Applicazione",
                "privacy_policy": "politica sulla riservatezza",
                "danger_zone_title": "Zona pericolosa",
                "danger_zone_desc": "Una volta eliminato il tuo account, non sarà possibile tornare indietro. Sii sicuro della tua scelta.",
                "sign_out_button": "Esci",
                "sign_out_loading": "Disconnetti...",
                "footer_version": "Scansione salute v1.0.0",
                "select_language_title": "Scegli la lingua",
                "cancel": "Cancellare",
                "ok": "Va bene",
                "sign_out_confirm_title": "Disconnetti",
                "sign_out_confirm_msg": "Sei sicuro di voler uscire?",
                "sign_out_error_title": "Errore",
                "sign_out_error_msg": "Errore durante la disconnessione",
                "danger_zone": "Zona pericolosa"
            }
        },
        "es": {
            "tabs": {
                "home": "Inicio",
                "analytics": "Análisis",
                "scanner": "Escáner"
            },
            "common": {
                "back": "Atrás",
                "retry": "Reintentar",
                "error": "Error",
                "ok": "OK",
                "cancel": "Cancelar",
                "password": "Contraseña",
                "loading": "Cargando...",
                "success": "Éxito",
                "unknown_user": "Usuario",
                "account_free": "Cuenta Gratuita",
                "account_premium": "Cuenta Premium",
                "home_back": "Volver al Inicio",
                "save": "Guardar",
                "later": "Más tarde",
                "time": {
                    "d": "d",
                    "h": "h",
                    "min": "min",
                    "s": "s"
                },
                "day": "día",
                "days": "días",
                "years_short": "años",
                "hour": "hora",
                "hours": "horas",
                "minute": "minuto",
                "minutes": "minutos",
                "yesterday": "Ayer",
                "days_ago": "hace {{count}} días",
                "skip": "Aprobar",
                "finish": "para terminar",
                "available": "Disponible",
                "in": "En",
                "time_ago": {
                    "just_now": "Ahora mismo",
                    "minutes_ago": "Hay {{count}} min.",
                    "hours_ago": "Hay {{count}}h",
                    "yesterday": "Ayer",
                    "days_ago": "Hace {{count}} días"
                }
            },
            "settings": {
                "title": "Ajustes",
                "section_subscription": "Mi Suscripción",
                "section_preferences": "Preferencias",
                "section_app": "Aplicación",
                "notifications": "Notificaciones",
                "notifications_preferences": "Preferencias de notificaciones",
                "privacy_policy": "Política de Privacidad",
                "danger_zone": "Zona Peligrosa",
                "danger_zone_title": "Zona Peligrosa",
                "danger_zone_desc": "Esta acción cerrará la sesión de su cuenta. Sus datos se conservarán.",
                "sign_out_button": "Cerrar Sesión",
                "sign_out_loading": "Cerrando sesión...",
                "sign_out_confirm_title": "Cerrar Sesión",
                "sign_out_confirm_msg": "¿Estás seguro de que quieres cerrar sesión?\n\nSus datos se guardarán y podrá volver a iniciar sesión en cualquier momento.",
                "sign_out_error_title": "Error",
                "sign_out_error_msg": "Ocurrió un error al cerrar sesión. Por favor, inténtelo de nuevo.",
                "upgrade_premium": "Ver beneficios Premium",
                "new_notifications": "nuevo",
                "footer_version": "Health Scan v1.0.0",
                "language": "Idioma",
                "select_language_title": "Seleccionar idioma",
                "cancel": "Cancelar",
                "ok": "OK"
            },
            "home": {
                "items_available": "Escaneos disponibles",
                "items_advised": "Suplementos Recomendados",
                "global_score": "Puntuación Global",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Límite alcanzado",
                "available": "disponible"
            },
            "scan_preview": {
                "title": "Elegir Análisis",
                "type_label": "Tipo de escaneo",
                "confirm_button": "Confirmar y Guardar",
                "confirm_loading": "Guardando...",
                "loading_text": "Tu escaneo llegará pronto, esto puede tomar unos segundos...",
                "error_title_type": "Tipo incorrecto",
                "error_title_analysis": "Análisis imposible",
                "error_title_network": "Error de red",
                "error_msg_default": "Vaya, la imagen no pudo ser analizada.",
                "error_msg_network": "Imposible contactar con el servidor de análisis.",
                "error_validation": "Parámetros inválidos.",
                "error_session": "Sesión expirada."
            },
            "scan_result": {
                "title": "Resultados",
                "no_data": "Ningún análisis disponible",
                "analysis_face": "Análisis Facial",
                "analysis_body": "Análisis Corporal",
                "analysis_nutrition": "Análisis Nutrición",
                "ai_complete": "Análisis IA completado",
                "details_title": "Detalles del Análisis",
                "score_face": "Puntuación Salud/Estética",
                "score_body": "Puntuación Forma",
                "score_nutrition": "Puntuación Salud Plato",
                "perceived_age": "Edad percibida",
                "face_shape": "Forma rostro",
                "symmetry": "Simetría",
                "fatigue": "Nivel de fatiga",
                "hydration": "Hidratación",
                "photogenic": "Puntuación fotogénica",
                "skin_quality": "Calidad piel",
                "glow": "Resplandor (Glow)",
                "collagen": "Colágeno (est.)",
                "body_type": "Tipo corporal",
                "muscle_mass": "Masa muscular",
                "waist": "Cintura (est.)",
                "strength": "Puntuación Fuerza",
                "bmi": "IMC (est.)",
                "metabolic_age": "Edad metabólica",
                "body_fat": "Grasa corporal (est.)",
                "posture": "Postura",
                "body_symmetry": "Simetría",
                "calories": "Calorías (kcal)",
                "verdict": "Veredicto",
                "satiety": "Índice Saciedad",
                "ingredients": "Calidad Ingredientes",
                "glycemic": "Índice Glucémico",
                "vitamins": "Vitaminas principales",
                "macros_title": "Macros (est. gramos)",
                "proteins": "Proteínas",
                "carbs": "Carbohidratos",
                "fats": "Grasas"
            },
            "notification_settings": {
                "title": "Ajustes Notificaciones",
                "types": "Tipos de Notificación",
                "types_desc": "Elija qué notificaciones recibir",
                "reminders": "Recordatorios",
                "reminders_desc": "Recordatorios de análisis y seguimiento",
                "achievements": "Logros",
                "achievements_desc": "Hitos y éxitos",
                "new_content": "Nuevo Contenido",
                "new_content_desc": "Nuevas recetas, ejercicios y funciones",
                "info": "💡 Las notificaciones te ayudan a mantenerte motivado. Puedes desactivarlas cuando quieras.",
                "save": "Guardar Ajustes",
                "saved_title": "Ajustes Guardados",
                "saved_message": "Preferencias actualizadas con éxito.",
                "error_save": "Error al guardar."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Desbloquea todo tu potencial",
                "already_premium_title": "¡Eres Premium!",
                "already_premium_desc": "Tienes acceso a todas las funciones.",
                "price_per_month": "/mes",
                "cancel_anytime": "Cancela cuando quieras",
                "features_title": "Funciones Premium",
                "subscribe_btn": "Suscribirse Ahora",
                "processing": "Procesando...",
                "restore_btn": "Restaurar Compras",
                "restoring": "Restaurando...",
                "store_disclaimer": "Vía App Store / Google Play",
                "web_disclaimer": "Compras in-app solo en móvil.",
                "purchase_success_title": "¡Bienvenido a Premium!",
                "purchase_success_msg": "Suscripción activada.",
                "restore_success_title": "Restaurado",
                "restore_success_msg": "Suscripción restaurada con éxito.",
                "restore_empty": "No se encontraron compras.",
                "benefits": {
                    "instant": "Acceso inmediato",
                    "tracking": "Seguimiento avanzado",
                    "support": "Soporte prioritario"
                },
                "upgrade_title": "Actualizar Premium",
                "upgrade_premium": "Mejorar a Premium",
                "subtitle_premium": "Tu suscripción está activa.",
                "subtitle_upgrade": "Desbloquea todo tu potencial de salud",
                "compare_plans": "Comparar planes",
                "button_upgrade": "Suscribirse",
                "button_later": "Quizás más tarde",
                "price": "9,99 €",
                "period": "/mes",
                "web_unavailable_title": "No disponible en la web",
                "validation_title": "Validación en curso",
                "purchase_error_default": "Se produjo un error durante la compra. Por favor inténtalo de nuevo.",
                "purchase_error_generic": "Su compra no pudo ser procesada. Por favor verifique su conexión e inténtelo nuevamente.",
                "restore_empty_title": "Información",
                "restore_error_default": "Tus compras no se pudieron restaurar. Por favor inténtalo de nuevo.",
                "restore_error_generic": "Se produjo un error durante la restauración. Por favor inténtalo de nuevo.",
                "web_note": "Nota: Las compras dentro de la aplicación solo están disponibles en aplicaciones móviles nativas. Utilice la aplicación de Android o iOS para comprar una suscripción.",
                "store_note": "La suscripción se facturará a través de su cuenta {{store}}. Administre su suscripción en la configuración de su cuenta {{store}}.",
                "already_premium_intro": "Eres miembro Premium."
            },
            "privacy": {
                "title": "Política Privacidad",
                "last_updated": "Última actualización: 15 Octubre 2025",
                "intro_title": "1. Introducción",
                "intro_content": "Bienvenido a Health Scan. Protegemos tu privacidad.",
                "data_title": "2. Datos Recopilados",
                "usage_title": "3. Uso de Datos",
                "storage_title": "4. Almacenamiento & Seguridad",
                "sharing_title": "5. Compartir Datos",
                "rights_title": "6. Sus Derechos",
                "contact_title": "10. Contacto",
                "data_content": "Recopilamos las siguientes categorías de datos:",
                "data_account": "Información de la cuenta: correo electrónico, nombre de usuario, foto de perfil",
                "data_scans": "Datos de escaneo: imágenes analizadas por nuestra IA (rostro, cuerpo, comidas), resultados de análisis y puntuaciones de salud.",
                "data_device": "Información técnica: identificador de dispositivo para seguridad de inicio de sesión",
                "data_usage": "Datos de uso: historial de escaneo, preferencias, estadísticas de uso",
                "camera_title": "3. Usando la cámara",
                "camera_content": "Health Scan utiliza la cámara de su dispositivo exclusivamente para capturar imágenes para su análisis (rostro, cuerpo, dieta). Las fotos son procesadas por nuestra inteligencia artificial para generar análisis de salud. Las imágenes se transmiten de forma segura a través de HTTPS y nunca se comparten con terceros. Puedes eliminar tus datos en cualquier momento.",
                "usage_content": "Tus datos se utilizan para:",
                "usage_analysis": "Ofrezca análisis de salud personalizados a través de nuestra IA",
                "usage_improve": "Mejorar nuestros algoritmos y la calidad de nuestros servicios.",
                "usage_personalize": "Personaliza tu experiencia y recomendaciones",
                "storage_content": "Tus datos se almacenan de forma segura en Supabase, una plataforma en la nube que cumple con los más altos estándares de seguridad. Todas las comunicaciones están cifradas mediante TLS/SSL. Sus contraseñas están codificadas con algoritmos criptográficos robustos. Aplicamos políticas de seguridad (RLS) a nivel de base de datos para garantizar que solo usted pueda acceder a sus datos.",
                "sharing_content": "Nunca vendemos sus datos personales. Sus datos solo se comparten con proveedores de servicios técnicos esenciales para el funcionamiento del servicio (alojamiento, envío de correos electrónicos) y solo en la medida necesaria. En caso de obligación legal, es posible que debamos comunicar cierta información a las autoridades competentes.",
                "rights_content": "De acuerdo con el RGPD, tienes los siguientes derechos:",
                "rights_access": "Derecho de acceso: consultar todos sus datos personales",
                "rights_delete": "Derecho de supresión: eliminar tu cuenta y todos tus datos",
                "rights_export": "Derecho a la portabilidad: exporta tus datos en un formato estándar",
                "rights_withdraw": "Derecho de desistimiento: retira tu consentimiento en cualquier momento",
                "children_title": "8. Protección de menores",
                "children_content": "Health Scan no está destinado a personas menores de 16 años. No recopilamos conscientemente datos de menores. Si es padre y cree que su hijo nos ha proporcionado información, contáctenos para eliminarla.",
                "updates_title": "9. Cambios",
                "updates_content": "Es posible que actualicemos esta política de privacidad. En caso de cambios significativos, se lo notificaremos a través de la aplicación o por correo electrónico. La fecha de la última actualización se indica en la parte superior de esta página.",
                "contact_content": "Si tiene alguna pregunta sobre sus datos o esta política, contáctenos:"
            },
            "components": {
                "feature_gate": {
                    "title": "Función Premium",
                    "upgrade_btn": "Mejorar a Premium"
                },
                "table": {
                    "header_feature": "Función",
                    "header_free": "Gratis",
                    "header_premium": "Premium"
                },
                "error_boundary": {
                    "title": "¡Ups!",
                    "retry": "Reintentar",
                    "logout": "Cerrar Sesión"
                },
                "condition_card": {
                    "probability": "probabilidad",
                    "explanation": "Explicación",
                    "tip": "Consejo",
                    "unlock": "Desbloquear"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                },
                "avatar": {
                    "error_title": "Error",
                    "error_download": "No se pudo descargar la foto",
                    "perm_title": "Permiso requerido",
                    "perm_gallery": "Permitir acceso a la galería",
                    "perm_camera": "Permitir acceso a la cámara",
                    "options_title": "Foto de Perfil",
                    "options_msg": "Elige una opción",
                    "take_photo": "Tomar foto",
                    "choose_gallery": "Elegir de galería",
                    "hint": "Toca para editar",
                    "error_size": "Imagen demasiado grande. Máximo 5 MB."
                },
                "urgency": {
                    "title": "Atención",
                    "message": "La IA ha detectado indicadores visuales que requieren atención.\n\nEsto no es un diagnóstico médico.",
                    "dismiss": "Entendido"
                },
                "feature_list": {
                    "free": "Gratis",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Análisis completo cuerpo y rostro",
                    "subtitle_used": "Vuelve mañana para un nuevo escaneo",
                    "subtitle_available": "Análisis IA profundo disponible",
                    "status_locked": "Desbloquear con Premium",
                    "status_used": "Reinicio a medianoche",
                    "status_available": "Listo para escanear"
                }
            },
            "copilot": {
                "analytics_step": "Revisa tus estadísticas y sigue tu progreso a lo largo del tiempo.",
                "scanner_step": "¡Escanea tu comida y fotos para analizar tu salud!",
                "settings_step": "Accede a la configuración de tu cuenta y de la aplicación.",
                "notifications_step": "¡Encuentra aquí tus notificaciones y logros desbloqueados!"
            },
            "scan_types": {
                "body": "Cuerpo",
                "health": "Rostro",
                "nutrition": "Nutrición",
                "super": "Super Scan"
            },
            "scan_limits": {
                "week_1": "1 escaneo por semana",
                "month_1": "1 escaneo al mes",
                "days_3_1": "1 escaneo cada 3 días",
                "premium_only": "Solo Premium",
                "day_3": "3 escaneos al día",
                "day_1": "1 escaneo al día",
                "msg_weekly_reached": "Límite semanal alcanzado",
                "msg_monthly_reached": "Límite mensual alcanzado",
                "msg_days_3_reached": "Límite alcanzado",
                "msg_premium_only": "Solo miembros Premium",
                "msg_daily_reached_3": "Límite diario alcanzado (3 escaneos)",
                "msg_daily_reached_1": "Límite diario alcanzado (1 escaneo)"
            },
            "notifications": {
                "title": "Notificaciones",
                "empty_title": "Sin notificaciones",
                "empty_unread": "¡Todo leído! Sigue monitoreando tu salud.",
                "empty_all": "Aún no tienes notificaciones.",
                "loading": "Cargando notificaciones...",
                "filter_all": "Todas",
                "filter_unread": "No leídas",
                "filter_read": "Leídas",
                "scan_health_title": "Escaneo Salud Disponible",
                "scan_health_body": "Tu escaneo de salud semanal está disponible.",
                "scan_body_title": "Escaneo Cuerpo Disponible",
                "scan_body_body": "Tu escaneo corporal mensual está disponible.",
                "scan_nutrition_title": "Escaneo Nutrición Disponible",
                "scan_nutrition_body": "Tu escaneo de nutrición está disponible.",
                "scan_super_title": "Super Scan Disponible",
                "scan_super_body": "Tu Super Scan diario está disponible.",
                "achievements": {
                    "title": "¡Nuevo Hito!",
                    "one_week": "¡Felicidades! ¡Una semana de seguimiento de salud!",
                    "one_month": "¡Felicidades! 🎉 Llevas un mes cuidándote con Health Scan.",
                    "three_months": "¡Bien hecho! ¡3 meses de seguimiento de salud!",
                    "six_months": "¡Increíble! 6 meses de seguimiento de tu salud. ¡Sigue así!",
                    "one_year": "¡Extraordinario! ¡Un año con Health Scan! 🏆"
                },
                "daily_reminders": {
                    "1": {
                        "title": "¡Hola, es la hora!",
                        "body": "¿Un pequeño escaneo hoy? ¡Tu salud te lo agradecerá!"
                    },
                    "2": {
                        "title": "¡Te extrañamos!",
                        "body": "Toma 30 segundos para revisar tu estado hoy."
                    },
                    "3": {
                        "title": "¿Listo para tu chequeo?",
                        "body": "¡Lanza un escaneo rápido y mantente en la cima!"
                    },
                    "4": {
                        "title": "¡Hola tú!",
                        "body": "No olvides tu escaneo diario, toma 2 minutos."
                    },
                    "5": {
                        "title": "¡Te esperamos!",
                        "body": "Tu cuerpo puede tener cosas que decirte hoy."
                    },
                    "6": {
                        "title": "Recordatorio de salud",
                        "body": "¡Una foto, un análisis y sabes dónde estás!"
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "¡Super Scan recargado!",
                        "body": "Tu Super Scan diario está listo. ¡Disfrútalo!"
                    },
                    "2": {
                        "title": "¡Aquí vamos de nuevo!",
                        "body": "¡Nuevo día, nuevo Super Scan a tu disposición!"
                    },
                    "3": {
                        "title": "Tu Super Scan te espera",
                        "body": "¡El análisis completo está disponible de nuevo!"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "¡Sigue así!",
                        "body": "Cada escaneo te acerca a tus objetivos."
                    },
                    "2": {
                        "title": "¡Lo estás haciendo genial!",
                        "body": "Tu constancia paga, los resultados seguirán."
                    },
                    "3": {
                        "title": "Pequeño recordatorio",
                        "body": "Cuidarse también es escuchar a su cuerpo."
                    },
                    "4": {
                        "title": "¡Buena progresión!",
                        "body": "Haces un buen trabajo, sigue así."
                    },
                    "5": {
                        "title": "Vas por buen camino",
                        "body": "La constancia es la clave del éxito. ¡Bravo!"
                    },
                    "6": {
                        "title": "¿Orgulloso de ti?",
                        "body": "¡Deberías! Seguir tu salud ya es un gran paso."
                    }
                }
            },
            "not_found": {
                "text": "Esta página no existe.",
                "link": "Ir al inicio"
            },
            "api_errors": {
                "network": "Error de red. Verifica tu conexión.",
                "unauthorized": "Sesión expirada. Inicia sesión de nuevo.",
                "server": "Error del servidor. Intenta más tarde.",
                "scan_limit": "Límite de escaneo alcanzado.",
                "payment_failed": "Pago fallido."
            },
            "navigation": {
                "session_expired_title": "Sesión Expirada",
                "session_expired_msg": "Tu sesión ha expirado. Por favor inicia sesión de nuevo.",
                "loop_error_title": "Error de Navegación",
                "loop_error_msg": "Se detectó un bucle de redirección. Cierra sesión e intenta de nuevo.",
                "logout_btn": "Cerrar Sesión"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Inicie sesión en su cuenta",
                "email_placeholder": "Correo electrónico",
                "password_placeholder": "Contraseña",
                "password_confirm": "Confirmar Contraseña",
                "login_btn": "Iniciar Sesión",
                "no_account": "¿No tienes una cuenta?",
                "signup_link": "Regístrate",
                "signup_title": "Crear Cuenta",
                "signup_subtitle": "Únete para escanear y mejorar tu salud",
                "password_min_placeholder": "Contraseña (min. 6 caracteres)",
                "password_confirm_placeholder": "Confirmar contraseña",
                "verification_note": "Te enviaremos un código de verificación.",
                "signup_btn": "Registrarse",
                "has_account": "¿Ya tienes una cuenta?",
                "login_link": "Iniciar Sesión",
                "error_ip_limit_reached": "Límite de creación de cuenta alcanzado para esta red. Por favor, inténtelo de nuevo más tarde.",
                "general_error": "Ocurrió un error",
                "email_label": "Correo electrónico",
                "errors": {
                    "fill_all": "Por favor, complete todos los campos",
                    "invalid_email": "Correo electrónico no válido",
                    "password_mismatch": "Las contraseñas no coinciden",
                    "password_short": "La contraseña debe tener al menos 6 caracteres",
                    "disposable_email": "No se permiten correos electrónicos temporales",
                    "email_in_use": "Este correo electrónico ya está en uso",
                    "general_error": "Ocurrió un error",
                    "invalid_credentials": "Credenciales no válidas",
                    "oauth_login": "Error al iniciar sesión con {{provider}}"
                },
                "error_email_required": "Se requiere correo electrónico",
                "error_password_required": "Se requiere contraseña",
                "error_passwords_match": "Las contraseñas no coinciden",
                "error_password_length": "La contraseña debe tener al menos 6 caracteres.",
                "error_login_generic": "error de inicio de sesion",
                "error_signup_generic": "Registro fallido",
                "error_account_creation": "Error al crear cuenta",
                "error_username_taken": "Este nombre de usuario ya está en uso. Por favor elige otro.",
                "error_session_invalid": "Sesión no válida",
                "error_email_verification_required": "Por favor revisa tu correo electrónico antes de continuar.",
                "error_disposable_email": "No se permiten direcciones de correo electrónico temporales",
                "error_verification_send": "No se pudo enviar el código de verificación",
                "error_verification_code": "código incorrecto",
                "error_auth_cancelled": "Autenticación cancelada",
                "verify_btn": "Controlar",
                "verifying": "Verificación...",
                "verification_sent_title": "Correo electrónico verificado!",
                "verification_sent_subtitle_signup": "Finalizando la creación de su cuenta...",
                "verification_sent_subtitle_login": "Conexión en progreso...",
                "verify_title": "Revisa tu correo electrónico",
                "verify_subtitle": "Hemos enviado un código de 6 dígitos a",
                "code_expired": "El código caduca en",
                "resend_code": "Reenviar código",
                "resend_in": "Reenviar en {{segundos}}s",
                "code_incomplete": "Veuillez entrer le code complet",
                "code_invalid": "Código incorrecto o caducado",
                "code_incorrect": "código incorrecto",
                "code_not_found": "No se encontró ningún código de verificación. Por favor solicite uno nuevo.",
                "code_expired_error": "Este código ha caducado. Por favor solicite uno nuevo.",
                "too_many_attempts": "Demasiados intentos incorrectos. Solicite un nuevo código.",
                "attempts_remaining": "Quedan {{count}} pruebas",
                "remember_device": "Recuerda este dispositivo"
            },
            "exercises": {
                "title": "Nuestros Ejercicios",
                "search_placeholder": "Buscar ejercicio...",
                "no_results": "No se encontraron ejercicios",
                "duration": "min",
                "difficulty": {
                    "easy": "Fácil",
                    "medium": "Medio",
                    "hard": "Difícil"
                }
            },
            "recipes": {
                "title": "Nuestras Recetas",
                "search_placeholder": "Buscar receta...",
                "no_results": "No se encontraron recetas",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Fácil",
                    "medium": "Medio",
                    "hard": "Difícil"
                }
            },
            "onboarding": {
                "welcome_title": "¡Bienvenido!",
                "setup_profile": "Configura tu perfil",
                "choose_style": "Elige tu estilo",
                "username_label": "Nombre de usuario *",
                "username_placeholder": "usuario123",
                "username_status": {
                    "checking": "Verificando...",
                    "available": "Disponible",
                    "taken": "Ya en uso",
                    "invalid": "3-20 car., letras, números"
                },
                "theme": {
                    "dark": "Oscuro",
                    "dark_desc": "Por defecto",
                    "light": "Claro",
                    "light_desc": "Secundario"
                },
                "next_btn": "Siguiente",
                "start_btn": "Empezar Aventura",
                "error_session": "Sesión inválida. Inicia sesión de nuevo.",
                "error_email": "Verifica tu email antes de continuar.",
                "error_username_empty": "Elige un nombre de usuario",
                "error_username_taken": "Elige un nombre de usuario disponible"
            },
            "languages": {
                "fr": "Francés",
                "en": "Inglés",
                "de": "Alemán",
                "it": "Italiano",
                "es": "Español",
                "pt": "Portugués"
            },
            "analytics": {
                "title": "Análisis",
                "subtitle": "Sigue tu progreso",
                "periods": {
                    "days_7": "7d",
                    "days_30": "30d",
                    "months_3": "3 Meses",
                    "year_1": "1 Año"
                },
                "premium_feature": "Función Premium",
                "premium_feature_msg": "Los análisis de 3 meses y 1 año están reservados para miembros Premium.\n\n¡Desbloquea el acceso completo a tu historial de salud!",
                "empty_state": "¡Empieza a escanear para ver tu progreso aquí!",
                "health_score": "Puntuación de Salud",
                "health_score_subtitle": "Evolución de tu puntuación global",
                "physical_evolution": "Evolución Física",
                "physical_evolution_subtitle": "Puntuación Corporal & Grasa Corporal %",
                "face_score": "Puntuación Facial",
                "face_score_subtitle": "Evolución de tu puntuación facial",
                "nutrition_score": "Puntuación Nutrición",
                "nutrition_score_subtitle": "Puntuación media de comidas",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Puntuación de Riesgo Global",
                "legend_score": "Puntuación (0-100)",
                "legend_body_fat": "Grasa Corporal %"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "Super Scan es una función exclusiva para miembros Premium.\n\n¡Obtén un análisis completo y detallado actualizando a Premium!",
                "used_alert_title": "Super Scan Utilizado",
                "used_alert_msg": "Ya has utilizado tu Super Scan hoy.\n\n¡Vuelve mañana para un nuevo Super Scan!",
                "global_risk_score": "Puntuación Riesgo Global",
                "analysis_summary": "Resumen del Análisis",
                "conditions_detected": "Condiciones Detectadas",
                "ras_title": "Todo bien",
                "ras_subtitle": "Sin signos detectados",
                "ras_description": "El análisis no detectó ninguna condición particular. ¡Sigue cuidándote!",
                "premium_badge": "Premium",
                "used_today": "Usado",
                "limit_daily": "1/día",
                "connection_reconnecting": "Reconectando...",
                "connection_unstable": "Conexión inestable. Toca para reintentar."
            },
            "premium_features": {
                "categories": {
                    "scans": "Escaneos",
                    "analytics": "Análisis",
                    "content": "Contenido",
                    "features": "Funciones",
                    "support": "Soporte"
                },
                "list": {
                    "health_scans": {
                        "title": "Escaneos de Salud",
                        "description": "Analice su salud facial para detectar signos de fatiga y estrés",
                        "free": "1 escaneo de salud por semana",
                        "premium": "3 escaneos de salud al día"
                    },
                    "body_scans": {
                        "title": "Escaneos Corporales",
                        "description": "Siga la evolución de su composición corporal",
                        "free": "1 escaneo corporal al mes",
                        "premium": "3 escaneos corporales al día"
                    },
                    "nutrition_scans": {
                        "title": "Escaneos de Nutrición",
                        "description": "Analice sus comidas para un seguimiento nutricional preciso",
                        "free": "1 escaneo de nutrición cada 3 días",
                        "premium": "3 escaneos de nutrición al día"
                    },
                    "detailed_analytics": {
                        "title": "Análisis Detallados",
                        "description": "Gráficos avanzados, historial completo y predicciones de salud",
                        "free": "Gráficos básicos (7 días)",
                        "premium": "Análisis detallados ilimitados con historial completo y predicciones"
                    },
                    "unlimited_scans": {
                        "title": "Escaneos Ilimitados",
                        "description": "Escaneos corporales, de salud y nutrición ilimitados por día",
                        "free": "Limitado según tipo de escaneo",
                        "premium": "3 escaneos de cada tipo al día"
                    },
                    "advanced_recipes": {
                        "title": "Recetas Avanzadas",
                        "description": "Acceso a recetas premium con planes nutricionales detallados y videos",
                        "free": "Acceso a recetas básicas",
                        "premium": "Acceso completo a recetas premium con planes y videos"
                    },
                    "premium_exercises": {
                        "title": "Ejercicios Premium",
                        "description": "Programas de ejercicios personalizados y videos HD",
                        "free": "Ejercicios básicos",
                        "premium": "Programas personalizados con videos HD y coaching"
                    },
                    "export_data": {
                        "title": "Exportar Datos",
                        "description": "Exportar sus datos de salud a PDF o CSV",
                        "free": "No disponible",
                        "premium": "Exportación ilimitada a PDF o CSV"
                    },
                    "priority_support": {
                        "title": "Soporte Prioritario",
                        "description": "Respuestas rápidas de nuestro equipo de soporte",
                        "free": "Soporte estándar (48-72h)",
                        "premium": "Respuestas prioritarias en 24h"
                    },
                    "custom_goals": {
                        "title": "Objetivos Personalizados",
                        "description": "Defina objetivos de salud a medida con seguimiento avanzado",
                        "free": "Objetivos predefinidos",
                        "premium": "Objetivos personalizados con seguimiento avanzado"
                    },
                    "meal_planner": {
                        "title": "Planificador de Comidas",
                        "description": "Planificación automática de comidas según sus objetivos",
                        "free": "No disponible",
                        "premium": "Planificación automática según sus objetivos"
                    }
                }
            },
            "months_short": {
                "0": "Ene",
                "1": "Feb",
                "2": "Mar",
                "3": "Abr",
                "4": "May",
                "5": "Jun",
                "6": "Jul",
                "7": "Ago",
                "8": "Sep",
                "9": "Oct",
                "10": "Nov",
                "11": "Dic"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Oval",
                    "Round": "Redondo",
                    "Square": "Cuadrado",
                    "Heart": "Corazón",
                    "Diamond": "Diamante",
                    "Long": "Alargado",
                    "Triangle": "Triángulo",
                    "Rectangular": "Rectangular"
                },
                "body_type": {
                    "Ectomorph": "ectomorfo",
                    "Mesomorph": "Mesomorfo",
                    "Endomorph": "endomorfo",
                    "Hourglass": "Reloj de arena",
                    "Pear": "Pera",
                    "Apple": "Manzana",
                    "Rectangle": "Rectángulo",
                    "Inverted Triangle": "Triángulo invertido"
                },
                "muscle_mass": {
                    "Low": "Débil",
                    "Moderate": "Moderado",
                    "Average": "Promedio",
                    "High": "Alto",
                    "Very High": "muy alto",
                    "Athlete": "Atlético"
                },
                "glycemic_index": {
                    "Low": "Débil",
                    "Moderate": "Moderado",
                    "High": "Alumno"
                },
                "ingredient_quality": {
                    "Excellent": "Excelente",
                    "Good": "Bien",
                    "Average": "Promedio",
                    "Poor": "Malo",
                    "Bad": "Pobre"
                },
                "severity": {
                    "low": "Débil",
                    "moderate": "Moderado",
                    "high": "Alumno"
                }
            },
            "condition_card": {
                "explanation": "Explicación",
                "advice": "Consejos prácticos",
                "probability": "probabilidad",
                "unlock": "Desatascar"
            },
            "scanner": {
                "authorize_camera": "Permitir cámara",
                "camera_permission_msg": "Necesitamos acceso a su cámara para escanear.",
                "error_taking_photo": "No se puede tomar la foto",
                "error_loading_image": "No se puede cargar la imagen",
                "type_required_title": "Tipo de escaneo requerido",
                "type_required_msg": "Seleccione un tipo de escaneo.",
                "super_unavailable_title": "Súper escaneo no disponible",
                "super_unavailable_msg": "Seleccione otro tipo de escaneo."
            }
        },
        "pt": {
            "common": {
                "back": "Voltar",
                "retry": "Tentar novamente",
                "error": "Erro",
                "ok": "OK",
                "cancel": "Cancelar",
                "password": "Senha",
                "loading": "Carregando...",
                "success": "Sucesso",
                "unknown_user": "Usuário",
                "account_free": "Conta Gratuita",
                "account_premium": "Conta Premium",
                "home_back": "Voltar ao Início",
                "save": "Salvar",
                "later": "Mais tarde",
                "skip": "Pular",
                "finish": "Finalizar",
                "available": "Disponível",
                "in": "em",
                "time": {
                    "d": "d",
                    "h": "h",
                    "min": "min",
                    "s": "s"
                },
                "day": "dia",
                "days": "dias",
                "years_short": "anos",
                "hour": "hora",
                "hours": "horas",
                "minute": "minuto",
                "minutes": "minutos",
                "yesterday": "Ontem",
                "days_ago": "há {{count}} dias",
                "time_ago": {
                    "just_now": "Agora mesmo",
                    "minutes_ago": "Há {{count}} minutos",
                    "hours_ago": "Há {{count}}h",
                    "yesterday": "Ontem",
                    "days_ago": "{{count}} há dias"
                }
            },
            "tabs": {
                "home": "Início",
                "analytics": "Análises",
                "scanner": "Escanear"
            },
            "copilot": {
                "analytics_step": "Verifique suas estatísticas e acompanhe seu progresso ao longo do tempo.",
                "scanner_step": "Escaneie seus alimentos e fotos para analisar sua saúde!",
                "settings_step": "Acesse as configurações da sua conta e do aplicativo.",
                "notifications_step": "Encontre aqui suas notificações e conquistas desbloqueadas!"
            },
            "home": {
                "items_available": "Scans disponíveis",
                "items_advised": "Suplementos Recomendados",
                "global_score": "Pontuação Global",
                "hero_title": "Global Score"
            },
            "scan_limit": {
                "limit_reached": "Limite atingido",
                "available": "disponível"
            },
            "scan_preview": {
                "title": "Escolher Análise",
                "type_label": "Tipo de scan",
                "confirm_button": "Confirmar e Salvar",
                "confirm_loading": "Salvando...",
                "loading_text": "Sua análise chegará em breve, isso pode levar alguns segundos...",
                "error_title_type": "Tipo incorreto",
                "error_title_analysis": "Análise impossível",
                "error_title_network": "Erro de rede",
                "error_msg_default": "Ops, a imagem não pôde ser analisada.",
                "error_msg_network": "Impossível contatar o servidor de análise.",
                "error_validation": "Parâmetros inválidos.",
                "error_session": "Sessão expirada."
            },
            "scan_result": {
                "title": "Resultados",
                "no_data": "Nenhuma análise disponível",
                "analysis_face": "Análise Facial",
                "analysis_body": "Análise Corporal",
                "analysis_nutrition": "Análise Nutricional",
                "ai_complete": "Análise IA concluída",
                "details_title": "Detalhes da análise",
                "score_face": "Pontuação Saúde/Estética",
                "score_body": "Pontuação Forma",
                "score_nutrition": "Pontuação Saúde Prato",
                "perceived_age": "Idade percebida",
                "face_shape": "Formato do rosto",
                "symmetry": "Simetria",
                "fatigue": "Nível de fadiga",
                "hydration": "Hidratação",
                "photogenic": "Pontuação fotogênica",
                "skin_quality": "Qualidade da pele",
                "glow": "Brilho (Glow)",
                "collagen": "Colágeno (est.)",
                "body_type": "Tipo corporal",
                "muscle_mass": "Massa muscular",
                "waist": "Cintura (est.)",
                "strength": "Pontuação Força",
                "bmi": "IMC (est.)",
                "metabolic_age": "Idade metabólica",
                "body_fat": "Gordura corporal (est.)",
                "posture": "Postura",
                "body_symmetry": "Simetria",
                "calories": "Calorias (kcal)",
                "verdict": "Veredito",
                "satiety": "Índice Saciedade",
                "ingredients": "Qualidade Ingredientes",
                "glycemic": "Índice Glicêmico",
                "vitamins": "Vitaminas principais",
                "macros_title": "Macros (est. gramas)",
                "proteins": "Proteínas",
                "carbs": "Carboidratos",
                "fats": "Gorduras"
            },
            "notification_settings": {
                "title": "Config. Notificações",
                "types": "Tipos de Notificação",
                "types_desc": "Escolha quais notificações receber",
                "reminders": "Lembretes",
                "reminders_desc": "Lembretes de scans e acompanhamento",
                "achievements": "Conquistas",
                "achievements_desc": "Notificações de marcos e sucessos",
                "new_content": "Novo Conteúdo",
                "new_content_desc": "Novas receitas, exercícios e recursos",
                "info": "💡 As notificações ajudam você a se manter motivado. Você pode desativá-las a qualquer momento.",
                "save": "Salvar Preferências",
                "saved_title": "Configurações Salvas",
                "saved_message": "Preferências atualizadas com sucesso.",
                "error_save": "Erro ao salvar ajustes."
            },
            "privacy": {
                "title": "Política de Privacidade",
                "last_updated": "Última atualização: 15 Outubro 2025",
                "intro_title": "1. Introdução",
                "intro_content": "Bem-vindo ao Health Scan. Protegemos sua privacidade.",
                "data_title": "2. Dados Coletados",
                "usage_title": "3. Uso de Dados",
                "storage_title": "4. Armazenamento & Segurança",
                "sharing_title": "5. Compartilhamento",
                "rights_title": "6. Seus Direitos",
                "contact_title": "10. Contato",
                "data_content": "Recolhemos as seguintes categorias de dados:",
                "data_account": "Informação da conta: e-mail, nome de utilizador, fotografia de perfil",
                "data_scans": "Dados de digitalização: imagens analisadas pela nossa IA (rosto, corpo, refeições), resultados de análises e pontuações de saúde",
                "data_device": "Informações técnicas: identificador do dispositivo para segurança de início de sessão",
                "data_usage": "Dados de utilização: histórico de verificação, preferências, estatísticas de utilização",
                "camera_title": "3. Usando a câmara",
                "camera_content": "O Health Scan utiliza a câmara do seu dispositivo exclusivamente para captar imagens para análise (rosto, corpo, dieta). As fotos são processadas pela nossa inteligência artificial para gerar análises de saúde. As imagens são transmitidas de forma segura por HTTPS e nunca são partilhadas com terceiros. Pode eliminar os seus dados a qualquer momento.",
                "usage_content": "Os seus dados são utilizados para:",
                "usage_analysis": "Forneça análises de saúde personalizadas através da nossa IA",
                "usage_improve": "Melhorar os nossos algoritmos e a qualidade dos nossos serviços",
                "usage_personalize": "Personalize a sua experiência e recomendações",
                "storage_content": "Os seus dados são armazenados de forma segura no Supabase, uma plataforma na nuvem que cumpre os mais elevados padrões de segurança. Todas as comunicações são encriptadas via TLS/SSL. As suas palavras-passe são encriptadas com algoritmos criptográficos robustos. Aplicamos políticas de segurança (RLS) ao nível da base de dados para garantir que apenas você pode aceder aos seus dados.",
                "sharing_content": "Nunca vendemos os seus dados pessoais. Os seus dados apenas são partilhados com prestadores de serviços técnicos essenciais ao funcionamento do serviço (hospedagem, envio de emails) e apenas na medida do necessário. No caso de uma obrigação legal, poderemos ser obrigados a comunicar determinadas informações às autoridades competentes.",
                "rights_content": "De acordo com o RGPD, tem os seguintes direitos:",
                "rights_access": "Direito de acesso: consultar todos os seus dados pessoais",
                "rights_delete": "Direito ao apagamento: apague a sua conta e todos os seus dados",
                "rights_export": "Direito à portabilidade: exporte os seus dados em formato standard",
                "rights_withdraw": "Direito de desistência: retire o seu consentimento a qualquer momento",
                "children_title": "8. Proteção de Menores",
                "children_content": "O Health Scan não se destina a menores de 16 anos de idade. Não recolhemos intencionalmente dados de menores. Se é pai e acredita que o seu filho nos forneceu informações, por favor contacte-nos para as eliminar.",
                "updates_title": "9. Mudanças",
                "updates_content": "Poderemos atualizar esta política de privacidade. Em caso de alterações significativas, iremos notificá-lo através da aplicação ou por e-mail. A data da última atualização está indicada no topo desta página.",
                "contact_content": "Se tiver alguma dúvida sobre os seus dados ou sobre esta política, por favor contacte-nos:"
            },
            "components": {
                "avatar": {
                    "error_title": "Erro",
                    "error_download": "Não foi possível baixar a foto",
                    "error_size": "Imagem muito grande. Máximo 5MB.",
                    "perm_title": "Permissão necessária",
                    "perm_gallery": "Permitir acesso à galeria",
                    "perm_camera": "Permitir acesso à câmera",
                    "options_title": "Foto de Perfil",
                    "options_msg": "Escolha uma opção",
                    "take_photo": "Tirar foto",
                    "choose_gallery": "Escolher da galeria",
                    "hint": "Toque para editar"
                },
                "urgency": {
                    "title": "Atenção",
                    "message": "A IA detectou indicadores visuais que requerem atenção.\n\nIsto não é um diagnóstico médico.",
                    "dismiss": "Entendi"
                },
                "table": {
                    "header_feature": "Recurso",
                    "header_free": "Grátis",
                    "header_premium": "Premium"
                },
                "feature_list": {
                    "free": "Grátis",
                    "premium": "Premium"
                },
                "super_scan": {
                    "title": "Super Scan",
                    "subtitle_locked": "Análise completa Corpo & Rosto",
                    "subtitle_used": "Volte amanhã para um novo scan",
                    "subtitle_available": "Análise IA profunda disponível",
                    "status_locked": "Desbloquear com Premium",
                    "status_used": "Reset à meia-noite",
                    "status_available": "Pronto para escanear"
                },
                "feature_gate": {
                    "title": "Recurso Premium",
                    "upgrade_btn": "Mudar para Premium"
                },
                "error_boundary": {
                    "title": "Ops!",
                    "retry": "Tentar novamente",
                    "logout": "Sair"
                },
                "condition_card": {
                    "probability": "probabilidade",
                    "explanation": "Explicação",
                    "tip": "Dica",
                    "unlock": "Desbloquear"
                },
                "metric_card": {
                    "premium_label": "PREMIUM",
                    "blurred_text": "••••••"
                }
            },
            "scan_types": {
                "body": "Corpo",
                "health": "Rosto",
                "nutrition": "Nutrição",
                "super": "Super Scan"
            },
            "scan_limits": {
                "week_1": "1 scan por semana",
                "month_1": "1 scan por mês",
                "days_3_1": "1 scan a cada 3 dias",
                "premium_only": "Apenas Premium",
                "day_3": "3 scans por dia",
                "day_1": "1 scan por dia",
                "msg_weekly_reached": "Limite semanal atingido",
                "msg_monthly_reached": "Limite mensal atingido",
                "msg_days_3_reached": "Limite atingido (a cada 3 dias)",
                "msg_premium_only": "Apenas membros Premium",
                "msg_daily_reached_3": "Limite diário atingido (3 scans)",
                "msg_daily_reached_1": "Limite diário atingido (1 scan)"
            },
            "notifications": {
                "title": "Notificações",
                "empty_title": "Sem notificações",
                "empty_unread": "Tudo lido! Continue acompanhando.",
                "empty_all": "Você ainda não tem notificações.",
                "loading": "Carregando notificações...",
                "filter_all": "Todas",
                "filter_unread": "Não lidas",
                "filter_read": "Lidas",
                "scan_health_title": "Scan Saúde Disponível",
                "scan_health_body": "Seu scan de saúde semanal está disponível. Cuide-se!",
                "scan_body_title": "Scan Corpo Disponível",
                "scan_body_body": "Seu scan corporal mensal está disponível. Acompanhe seu progresso!",
                "scan_nutrition_title": "Scan Nutrição Disponível",
                "scan_nutrition_body": "Seu scan de nutrição está disponível. Analise suas refeições!",
                "scan_super_title": "Super Scan Disponível",
                "scan_super_body": "Seu Super Scan diário está disponível. Obtenha uma análise completa!",
                "achievements": {
                    "title": "Nova Conquista!",
                    "one_week": "Parabéns! Uma semana de acompanhamento da saúde!",
                    "one_month": "Parabéns! 🎉 Você está cuidando de si mesmo com o Health Scan há um mês.",
                    "three_months": "Muito bem! 3 meses de acompanhamento da saúde!",
                    "six_months": "Incrível! 6 meses acompanhando sua saúde. Continue assim!",
                    "one_year": "Extraordinário! Um ano com o Health Scan! 🏆"
                },
                "daily_reminders": {
                    "1": {
                        "title": "Ei, está na hora!",
                        "body": "Um pequeno scan hoje? Sua saúde agradece!"
                    },
                    "2": {
                        "title": "Sentimos sua falta!",
                        "body": "Tire 30 segundos para verificar sua forma hoje."
                    },
                    "3": {
                        "title": "Pronto para o check-up?",
                        "body": "Faça um scan rápido e fique no topo!"
                    },
                    "4": {
                        "title": "Ei você!",
                        "body": "Não esqueça seu scan diário, leva 2 minutos."
                    },
                    "5": {
                        "title": "Estamos te esperando!",
                        "body": "Seu corpo pode ter coisas a dizer hoje."
                    },
                    "6": {
                        "title": "Lembrete de saúde",
                        "body": "Uma foto, uma análise e você sabe onde está!"
                    }
                },
                "super_scan_ready": {
                    "1": {
                        "title": "Super Scan recarregado!",
                        "body": "Seu Super Scan diário está pronto. Aproveite!"
                    },
                    "2": {
                        "title": "Aqui vamos nós de novo!",
                        "body": "Novo dia, novo Super Scan à sua disposição!"
                    },
                    "3": {
                        "title": "Seu Super Scan aguarda",
                        "body": "A análise completa está disponível novamente!"
                    }
                },
                "motivational": {
                    "1": {
                        "title": "Continue assim!",
                        "body": "Cada scan te aproxima dos seus objetivos."
                    },
                    "2": {
                        "title": "Você é demais!",
                        "body": "Sua consistência compensa, os resultados virão."
                    },
                    "3": {
                        "title": "Pequeno lembrete",
                        "body": "Cuidar de si mesmo é também ouvir o seu corpo."
                    },
                    "4": {
                        "title": "Ótimo progresso!",
                        "body": "Você está fazendo um ótimo trabalho, mantenha esse ritmo."
                    },
                    "5": {
                        "title": "Você está no caminho certo",
                        "body": "A consistência é a chave para o sucesso. Bravo!"
                    },
                    "6": {
                        "title": "Orgulhoso de si mesmo?",
                        "body": "Deveria estar! Acompanhar sua saúde já é um grande passo."
                    }
                }
            },
            "not_found": {
                "text": "Esta página não existe.",
                "link": "Voltar para o início"
            },
            "settings": {
                "title": "Configurações",
                "section_subscription": "Assinatura",
                "upgrade_premium": "Mudar para Premium",
                "section_preferences": "Preferências",
                "language": "Idioma",
                "notifications": "Notificações",
                "new_notifications": "novas",
                "notifications_preferences": "Preferências de notificação",
                "section_app": "Aplicativo",
                "privacy_policy": "Política de privacidade",
                "danger_zone_title": "Zona de Perigo",
                "danger_zone_desc": "Uma vez que sua conta for excluída, não haverá volta. Tenha certeza.",
                "sign_out_button": "Sair",
                "sign_out_loading": "Saindo...",
                "footer_version": "Health Scan v1.0.0",
                "select_language_title": "Escolher idioma",
                "cancel": "Cancelar",
                "ok": "OK",
                "sign_out_confirm_title": "Sair",
                "sign_out_confirm_msg": "Tem certeza que deseja sair?",
                "sign_out_error_title": "Erro",
                "sign_out_error_msg": "Erro ao sair",
                "danger_zone": "Zona de perigo"
            },
            "api_errors": {
                "network": "Erro de rede. Verifique sua conexão.",
                "unauthorized": "Sessão expirada. Faça login novamente.",
                "server": "Erro no servidor. Tente novamente mais tarde.",
                "scan_limit": "Limite de scan atingido.",
                "payment_failed": "Falha no pagamento."
            },
            "navigation": {
                "session_expired_title": "Sessão Expirada",
                "session_expired_msg": "Sua sessão expirou. Por favor faça login novamente.",
                "loop_error_title": "Erro de Navegação",
                "loop_error_msg": "Loop de redirecionamento detectado. Saia e tente novamente.",
                "logout_btn": "Sair"
            },
            "auth": {
                "login_title": "Health Scan",
                "login_subtitle": "Entre na sua conta",
                "email_placeholder": "Seu email",
                "password_placeholder": "Sua senha",
                "password_confirm": "Confirmar Senha",
                "login_btn": "Entrar",
                "no_account": "Não tem conta?",
                "signup_link": "Cadastrar",
                "signup_title": "Criar conta",
                "signup_subtitle": "Junte-se a nós para acompanhar sua saúde",
                "password_min_placeholder": "Senha (min. 6 caracteres)",
                "password_confirm_placeholder": "Confirme a senha",
                "verification_note": "Enviaremos um código de verificação.",
                "signup_btn": "Cadastrar",
                "has_account": "Já tem conta?",
                "login_link": "Entrar",
                "error_email_required": "O email é obrigatório",
                "error_password_required": "A senha é obrigatória",
                "error_passwords_match": "As senhas não coincidem",
                "error_password_length": "A senha deve ter pelo menos 6 caracteres",
                "error_login_generic": "Falha no login",
                "error_ip_limit_reached": "Limite de criação de conta atingido para esta rede. Tente novamente mais tarde.",
                "error_signup_generic": "Falha no cadastro",
                "error_account_creation": "Erro ao criar conta",
                "error_username_taken": "Este nome de usuário já está em uso. Escolha outro.",
                "error_session_invalid": "Sessão inválida",
                "error_email_verification_required": "Por favor, verifique seu email antes de continuar.",
                "error_disposable_email": "Emails temporários não são permitidos",
                "error_verification_send": "Falha ao enviar código de verificação",
                "error_verification_code": "Código incorreto",
                "error_auth_cancelled": "Autenticação cancelada",
                "verify_btn": "Verificar",
                "verifying": "Verificando...",
                "verification_sent_title": "Email verificado!",
                "verification_sent_subtitle_signup": "Finalizando a criação da sua conta...",
                "verification_sent_subtitle_login": "Entrando...",
                "verify_title": "Verifique seu email",
                "verify_subtitle": "Enviamos um código de 6 dígitos para",
                "code_expired": "Código expira em",
                "resend_code": "Reenviar código",
                "resend_in": "Reenviar em {{seconds}}s",
                "code_incomplete": "Por favor, digite o código completo",
                "code_invalid": "Código incorreto ou expirado",
                "remember_device": "Lembrar deste dispositivo",
                "email_label": "Email",
                "errors": {
                    "fill_all": "Por favor, preencha todos os campos",
                    "invalid_email": "Email inválido",
                    "password_mismatch": "As senhas não coincidem",
                    "password_short": "A senha deve ter pelo menos 6 caracteres",
                    "disposable_email": "Emails temporários não são permitidos",
                    "email_in_use": "Este email já está em uso",
                    "general_error": "Ocorreu um erro",
                    "invalid_credentials": "Credenciais inválidas",
                    "oauth_login": "Erro ao entrar com {{provider}}"
                },
                "code_incorrect": "Código incorreto",
                "code_not_found": "Nenhum código de verificação encontrado. Solicite um novo.",
                "code_expired_error": "Este código expirou. Solicite um novo.",
                "too_many_attempts": "Muitas tentativas incorretas. Solicite um novo código.",
                "attempts_remaining": "{{count}} restantes testes",
                "general_error": "Ocorreu um erro"
            },
            "scanner": {
                "authorize_camera": "Autorizar câmera",
                "camera_permission_msg": "Precisamos de acesso à sua câmera para escanear.",
                "error_taking_photo": "Não foi possível tirar a foto",
                "error_loading_image": "Não foi possível carregar a imagem",
                "type_required_title": "Tipo de scan necessário",
                "type_required_msg": "Por favor selecione um tipo de scan.",
                "super_unavailable_title": "Super Scan indisponível",
                "super_unavailable_msg": "Por favor selecione outro tipo de scan."
            },
            "premium": {
                "title": "Health Scan Premium",
                "subtitle": "Desbloqueie todo o seu potencial de saúde",
                "already_premium_title": "Você é Premium!",
                "already_premium_desc": "Você tem acesso a todos os recursos premium",
                "price_per_month": "/mês",
                "cancel_anytime": "Cancele a qualquer momento",
                "features_title": "Recursos Premium",
                "subscribe_btn": "Assinar agora",
                "processing": "Processando...",
                "restore_btn": "Restaurar compras",
                "restoring": "Restaurando...",
                "store_disclaimer": "Via App Store / Google Play",
                "web_disclaimer": "Compras no aplicativo estão disponíveis apenas no app móvel.",
                "purchase_success_title": "Bem-vindo ao Premium!",
                "purchase_success_msg": "Sua assinatura foi ativada.",
                "restore_success_title": "Compras restauradas",
                "restore_success_msg": "Assinatura restaurada com sucesso.",
                "restore_empty": "Nenhuma compra encontrada.",
                "benefits": {
                    "instant": "Acesso instantâneo",
                    "tracking": "Acompanhamento avançado",
                    "support": "Suporte prioritário"
                },
                "upgrade_title": "Mudar para Premium",
                "upgrade_premium": "Mudar para Premium",
                "subtitle_premium": "Sua assinatura está ativa.",
                "subtitle_upgrade": "Desbloqueie todo o seu potencial de saúde",
                "compare_plans": "Comparar planos",
                "button_upgrade": "Assinar",
                "button_later": "Mais tarde",
                "price": "9,99 €",
                "period": "/mês",
                "web_unavailable_title": "Indisponível na Web",
                "validation_title": "Validação em andamento",
                "purchase_error_default": "Ocorreu um erro durante a compra. Tente novamente.",
                "purchase_error_generic": "Sua compra não pôde ser processada. Verifique sua conexão e tente novamente.",
                "restore_empty_title": "Info",
                "restore_error_default": "Não foi possível restaurar suas compras. Tente novamente.",
                "restore_error_generic": "Ocorreu um erro durante a restauração. Tente novamente.",
                "web_note": "Nota: As compras no aplicativo estão disponíveis apenas em aplicativos móveis nativos. Use o aplicativo Android ou iOS para assinar.",
                "store_note": "A assinatura será cobrada através da sua conta {{store}}. Gerencie sua assinatura nas configurações da sua conta {{store}}.",
                "already_premium_intro": "É um membro Premium."
            },
            "exercises": {
                "title": "Nossos Exercícios",
                "search_placeholder": "Buscar exercício...",
                "no_results": "Nenhum exercício encontrado",
                "duration": "min",
                "difficulty": {
                    "easy": "Fácil",
                    "medium": "Médio",
                    "hard": "Difícil"
                }
            },
            "recipes": {
                "title": "Nossas Receitas",
                "search_placeholder": "Buscar receita...",
                "no_results": "Nenhuma receita encontrada",
                "prep_time": "min",
                "difficulty": {
                    "easy": "Fácil",
                    "medium": "Médio",
                    "hard": "Difícil"
                }
            },
            "onboarding": {
                "welcome_title": "Bem-vindo!",
                "setup_profile": "Configure seu perfil",
                "choose_style": "Escolha seu estilo",
                "username_label": "Nome de usuário *",
                "username_placeholder": "usuario123",
                "username_status": {
                    "checking": "Verificando...",
                    "available": "Disponível",
                    "taken": "Já em uso",
                    "invalid": "3-20 caracteres, letras, números, _ ou -"
                },
                "theme": {
                    "dark": "Escuro",
                    "dark_desc": "Padrão",
                    "light": "Claro",
                    "light_desc": "Secundário"
                },
                "next_btn": "Próximo",
                "start_btn": "Começar a aventura",
                "error_session": "Sessão inválida. Por favor, faça login novamente.",
                "error_email": "Por favor, verifique seu email antes de continuar.",
                "error_username_empty": "Por favor, escolha um nome de usuário",
                "error_username_taken": "Por favor, escolha um nome de usuário disponível"
            },
            "languages": {
                "fr": "Francês",
                "en": "Inglês",
                "de": "Alemão",
                "it": "Italiano",
                "es": "Espanhol",
                "pt": "Português"
            },
            "analytics": {
                "title": "Análises",
                "subtitle": "Acompanhe seu progresso",
                "periods": {
                    "days_7": "7d",
                    "days_30": "30d",
                    "months_3": "3 Meses",
                    "year_1": "1 Ano"
                },
                "premium_feature": "Recurso Premium",
                "premium_feature_msg": "As análises de 3 meses e 1 ano são reservadas para membros Premium.\n\nDesbloqueie o acesso total ao seu histórico de saúde!",
                "empty_state": "Comece a escanear para ver seu progresso aqui!",
                "health_score": "Pontuação de Saúde",
                "health_score_subtitle": "Evolução da sua pontuação global",
                "physical_evolution": "Evolução Física",
                "physical_evolution_subtitle": "Pontuação Corporal & % Gordura Corporal",
                "face_score": "Pontuação Facial",
                "face_score_subtitle": "Evolução da sua pontuação facial",
                "nutrition_score": "Pontuação de Nutrição",
                "nutrition_score_subtitle": "Pontuação média das refeições",
                "super_scan_score": "Super Scan",
                "super_scan_score_subtitle": "Pontuação de Risco Global",
                "legend_score": "Pontuação (0-100)",
                "legend_body_fat": "% Gordura Corporal"
            },
            "super_scan_features": {
                "premium_alert_title": "Super Scan Premium",
                "premium_alert_msg": "O Super Scan é um recurso exclusivo para membros Premium.\n\nObtenha uma análise completa e detalhada tornando-se Premium!",
                "used_alert_title": "Super Scan utilizado",
                "used_alert_msg": "Você já utilizou seu Super Scan hoje.\n\nVolte amanhã para um novo Super Scan!",
                "global_risk_score": "Pontuação de Risco Global",
                "analysis_summary": "Resumo da análise",
                "conditions_detected": "Condições detectadas",
                "ras_title": "Nada a assinalar",
                "ras_subtitle": "Nenhum sinal detectado",
                "ras_description": "A análise não detectou nenhuma condição particular. Continue a cuidar de si mesmo!",
                "premium_badge": "Premium",
                "used_today": "Utilizado",
                "limit_daily": "1/dia",
                "connection_reconnecting": "Reconectando...",
                "connection_unstable": "Conexão instável. Toque para tentar novamente."
            },
            "premium_features": {
                "categories": {
                    "scans": "Scans",
                    "analytics": "Análises",
                    "content": "Conteúdo",
                    "features": "Funcionalidades",
                    "support": "Suporte"
                },
                "list": {
                    "health_scans": {
                        "title": "Scans de Saúde",
                        "description": "Analise sua saúde facial para detectar sinais de fadiga e estresse",
                        "free": "1 scan de saúde por semana",
                        "premium": "3 scans de saúde por dia"
                    },
                    "body_scans": {
                        "title": "Scans Corporais",
                        "description": "Acompanhe a evolução da sua composição corporal",
                        "free": "1 scan corporal por mês",
                        "premium": "3 scans corporais por dia"
                    },
                    "nutrition_scans": {
                        "title": "Scans de Nutrição",
                        "description": "Analise suas refeições para um acompanhamento nutricional preciso",
                        "free": "1 scan de nutrição a cada 3 dias",
                        "premium": "3 scans de nutrição por dia"
                    },
                    "detailed_analytics": {
                        "title": "Análises Detalhadas",
                        "description": "Gráficos avançados, histórico completo e previsões de saúde",
                        "free": "Gráficos básicos (7 dias)",
                        "premium": "Análises detalhadas ilimitadas com histórico completo e previsões"
                    },
                    "unlimited_scans": {
                        "title": "Scans Ilimitados",
                        "description": "Scans corporais, de saúde e nutrição ilimitados por dia",
                        "free": "Limitado por tipo de scan",
                        "premium": "3 scans de cada tipo por dia"
                    },
                    "advanced_recipes": {
                        "title": "Receitas Avançadas",
                        "description": "Acesso a receitas premium com planos nutricionais detalhados e vídeos",
                        "free": "Acesso a receitas básicas",
                        "premium": "Acesso completo a receitas premium com planos e vídeos"
                    },
                    "premium_exercises": {
                        "title": "Exercícios Premium",
                        "description": "Programas de exercícios personalizados e vídeos em HD",
                        "free": "Exercícios básicos",
                        "premium": "Programas personalizados com vídeos HD e coaching"
                    },
                    "export_data": {
                        "title": "Exportação de Dados",
                        "description": "Exporte seus dados de saúde em PDF ou CSV",
                        "free": "Não disponível",
                        "premium": "Exportação ilimitada em PDF ou CSV"
                    },
                    "priority_support": {
                        "title": "Suporte Prioritário",
                        "description": "Respostas rápidas da nossa equipe de suporte",
                        "free": "Suporte padrão (48-72h)",
                        "premium": "Respostas prioritárias em 24h"
                    },
                    "custom_goals": {
                        "title": "Objetivos Personalizados",
                        "description": "Defina objetivos de saúde sob medida com acompanhamento avançado",
                        "free": "Objetivos predefinidos",
                        "premium": "Objetivos personalizados com acompanhamento avançado"
                    },
                    "meal_planner": {
                        "title": "Planejador de Refeições",
                        "description": "Planejamento automático de refeições com base em seus objetivos",
                        "free": "Não disponível",
                        "premium": "Planejamento automático com base em seus objetivos"
                    }
                }
            },
            "months_short": {
                "0": "Jan",
                "1": "Fev",
                "2": "Mar",
                "3": "Abr",
                "4": "Mai",
                "5": "Jun",
                "6": "Jul",
                "7": "Ago",
                "8": "Set",
                "9": "Out",
                "10": "Nov",
                "11": "Dez"
            },
            "scan_values": {
                "face_shape": {
                    "Oval": "Oval",
                    "Round": "Redondo",
                    "Square": "Quadrado",
                    "Heart": "Coração",
                    "Diamond": "Diamante",
                    "Long": "Alongado",
                    "Triangle": "Triângulo",
                    "Rectangular": "Retangular"
                },
                "body_type": {
                    "Ectomorph": "Ectomorfo",
                    "Mesomorph": "Mesomorfo",
                    "Endomorph": "Endomorfo",
                    "Hourglass": "Ampulheta",
                    "Pear": "Pera",
                    "Apple": "Maçã",
                    "Rectangle": "Retângulo",
                    "Inverted Triangle": "Triângulo Invertido"
                },
                "muscle_mass": {
                    "Low": "Fraco",
                    "Moderate": "Moderado",
                    "Average": "Média",
                    "High": "Alto",
                    "Very High": "Muito alto",
                    "Athlete": "Atlético"
                },
                "glycemic_index": {
                    "Low": "Fraco",
                    "Moderate": "Moderado",
                    "High": "Aluno"
                },
                "ingredient_quality": {
                    "Excellent": "Excelente",
                    "Good": "Bom",
                    "Average": "Média",
                    "Poor": "Ruim",
                    "Bad": "Pobre"
                },
                "severity": {
                    "low": "Fraco",
                    "moderate": "Moderado",
                    "high": "Aluno"
                }
            },
            "condition_card": {
                "explanation": "Explicação",
                "advice": "Conselhos práticos",
                "probability": "probabilidade",
                "unlock": "Desbloquear"
            }
        }
    }
);

// Set fallback to French
i18n.defaultLocale = 'fr';
i18n.enableFallback = true;
