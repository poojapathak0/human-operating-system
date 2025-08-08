# Clear — A Human Operating System (MVP)

Reconnect with what matters. A minimalist, privacy-first PWA for emotional clarity. Offline-first, no ads, no tracking.

## Features
- Daily Clarity Check-In (mood + note)
- Life Reflection Timeline
- Decision Compass (values + options)
- Inner Vault (encrypted journaling)
- Local-first IndexedDB storage with session encryption
- PWA offline support

## Tech
- React + Vite + TypeScript
- Zustand (state), Dexie (IndexedDB)
- i18next (i18n)
- VitePWA (offline)
- Vitest + RTL (tests)

## Run locally
1. Install dependencies
   ```powershell
   npm install
   ```
2. Start dev server
   ```powershell
   npm run dev
   ```
3. Build & preview
   ```powershell
   npm run build; npm run preview
   ```

## Privacy & Security
- Data stays in your browser (IndexedDB). No network sync.
- Encrypted export/import helpers provided; session key only (MVP).
- Add a passphrase flow for persistent encryption in next iterations.

## Next steps
- Add passphrase-based key derivation (PBKDF2/Argon2)
- Optional on-device AI insights (local LLM or WebAssembly models)
- E2E encrypted backup/sync
- Voice input and accessibility improvements
- More languages and RTL support
