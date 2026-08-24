# TontineGo — App mobile (Expo / React Native)

Application mobile du MVP **TontineGo** (tontines digitales pour l'Afrique de l'Ouest).
React Native + Expo SDK 57 · TypeScript strict · Expo Router · 100 % français.

## Lancement

```bash
cd mobile
npm install
npx expo start
```

Puis scanner le QR code avec **Expo Go** (Android/iOS), ou appuyer sur `a` / `i` / `w`.

## Pointer vers l'API backend

Le client API (`src/api/client.ts`) lit la variable d'environnement `EXPO_PUBLIC_API_URL`
(valeur par défaut : `http://localhost:8100/api/v1`).

- Depuis un appareil physique, `localhost` ne pointe pas vers votre machine :
  utilisez l'IP locale du serveur.

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.42:8100/api/v1 npx expo start
```

Ou créez un fichier `.env.local` à la racine de `mobile/` :

```
EXPO_PUBLIC_API_URL=http://192.168.1.42:8100/api/v1
```

> ⚠️ Les variables `EXPO_PUBLIC_*` sont inlinées au démarrage du bundler :
> redémarrez `expo start --clear` après modification.

## Compte de démonstration (backend dev)

| Champ | Valeur |
|---|---|
| Téléphone | `+2250700000001` |
| Code OTP dev | `123456` |

Flux : saisir le numéro → « Recevoir mon code » → saisir le code → « Se connecter ».
Le JWT est stocké dans le **SecureStore** du device et restauré à chaque démarrage ;
une réponse `401` déconnecte automatiquement vers `/login`.

## Écrans

| Route | Description |
|---|---|
| `/login` | Logo, téléphone (+225 prérempli), OTP en 2 étapes |
| `/(tabs)/index` | Accueil : salutation, card bleue « Caisse commune », progress bar Tour n/N, membres (badges Payé/En attente), bouton « Payer ma cotisation » |
| `/(tabs)/tontines` | Liste des tontines, création via modale (nom, montant, fréquence, nb membres), rejoindre avec un code |
| `/(tabs)/tontines/[id]` | Détail : strip calendrier des échéances, anneau de progression du pot (SVG), ordre des tours (bénéficiaire courant surligné or), historique des contributions |
| `/(tabs)/profile` | Profil, serveur API, déconnexion |

## Structure

```
app/
  _layout.tsx            # Stack racine + garde d'authentification
  login.tsx              # Auth par téléphone + OTP
  (tabs)/
    _layout.tsx          # Tab bar (Accueil / Tontines / Profil)
    index.tsx            # Accueil
    tontines.tsx         # Liste + création + rejoindre
    tontines/[id].tsx    # Détail
    profile.tsx          # Profil
src/
  api/
    client.ts            # Fetch wrapper (Bearer, 401 → login), endpoints typés
    tokenStorage.ts      # SecureStore (JWT)
  store/auth.tsx         # Contexte auth (session, restauration, signOut)
  components/            # PrimaryButton, Card, Badge, ProgressRing, MemberRow, états
  constants/theme.ts     # Design tokens (couleurs, rayons, espacements)
  types.ts               # User, Tontine, Member, Turn, Contribution…
```

## Endpoints consommés

- `POST /auth/request-otp`, `POST /auth/verify-otp`, `GET /auth/me`
- `GET /tontines`, `GET /tontines/{id}`, `POST /tontines` (création)
- `POST /tontines/join`, `POST /tontines/{id}/pay`, `GET /tontines/{id}/members`

## Qualité

```bash
npx tsc --noEmit   # vérification TypeScript strict — 0 erreur attendue
npx expo-doctor    # diagnostic projet
```

Tous les écrans gèrent les états **loading** (spinner), **erreur** (message + réessayer)
et **vide** (message + action). Aucune valeur magique en dur : tout passe par
`src/constants/theme.ts`.
