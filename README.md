# Tribeo – Frontend (React + Vite)
![build](https://img.shields.io/badge/build-passing-brightgreen)
![tests](https://img.shields.io/badge/tests-vitest-blue)
![node](https://img.shields.io/badge/node-18%2B-339933)
![react](https://img.shields.io/badge/react-18-61DAFB)
![vite](https://img.shields.io/badge/vite-5-646CFF)
![license](https://img.shields.io/badge/license-MIT-lightgrey)

Frontend web de **Tribeo**, interface pour la gestion des **groupes**, **sessions sportives**, **présences**, **quotas** et **abonnements**.  
Stack : **React 18**, **Vite**, **React Router**, **i18n**, **Stripe** (checkout), **CSS** (vanilla). *(Tailwind prêt si besoin.)*

---

## Sommaire
- [Fonctionnalités](#fonctionnalités)
- [Aperçu technique](#aperçu-technique)
- [Installation rapide](#installation-rapide)
- [Configuration (.env)](#configuration-env)
- [Scripts NPM](#scripts-npm)
- [Structure du projet](#structure-du-projet)
- [Intégration API & Auth](#intégration-api--auth)
- [Stripe (abonnements)](#stripe-abonnements)
- [i18n (traductions)](#i18n-traductions)
- [Qualité & Tests](#qualité--tests)
- [Déploiement](#déploiement)
- [Dépannage](#dépannage)
- [Licence](#licence)

---

## Fonctionnalités
- 🔐 **Auth JWT** : login/register, refresh auto, routes protégées.
- 👤 **Profil utilisateur** : consultation/édition, désactivation via backend.
- 👥 **Groupes** : création, adhésion, invitations, liste et détails.
- 🏋️ **Sessions sportives** : création, participation, **présence**.
- 📊 **Quotas & rôles** : affichage des limites selon `member/premium/coach/admin`.
- 💳 **Stripe** : démarrage du checkout (premium/coach) depuis l’UI.
- 🌍 **i18n** (react-i18next) : FR/EN prêts à l’emploi.
- ⚠️ **Gestion d’erreurs** UI (toasts/messages), loaders/spinners.
- 🔗 **Config par env** : API base URL, clé Stripe, URLs de redirection.

---

## Aperçu technique
- **React 18**, **Vite**
- **React Router** (routes publiques/privées)
- **Contexte** : `AuthContext`, `QuotasContext`
- **i18n** : `react-i18next`
- **HTTP** : `fetch`/`axios` (selon projet) avec intercepteur JWT
- **Styles** : CSS (fichiers `.css`), Tailwind optionnel
- **Stripe** : redirection Checkout via URL fournie par le backend

---

## Installation rapide

> Prérequis : **Node 18+** (ou 20+), **npm** ou **pnpm**.

```bash
# 1) Cloner et entrer
git clone https://github.com/username/tribeo-frontend.git
cd tribeo-frontend

# 2) Dépendances
npm install
# ou
# pnpm install

# 3) Variables d'environnement
cp .env.sample .env
# → Renseigner les variables (voir section suivante)

# 4) Lancer en dev
npm run dev
# http://127.0.0.1:5173
