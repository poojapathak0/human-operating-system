# Clear (Human Operating System) — Architecture Overview

This document explains the modular structure for the privacy-first, offline-first PWA and how new features integrate.

## Modules

- Frontend (React + Router)
  - Routes in `src/routes/*`
  - Shared UI and utilities in `src/components`, `src/utils`, and `src/styles.css`
- State Store (Zustand)
  - `src/store/appStore.ts` keeps app state; uses Dexie for persistence
- Local Database (IndexedDB via Dexie)
  - `src/db/db.ts` defines tables and versioned migrations
- Encryption Layer
  - `src/utils/cryptoKey.ts` provides key derivation (PBKDF2) and AES-GCM helpers
- Feature Services (modular)
  - Check-In: `src/modules/checkin/` encapsulates persistence and queries
  - Vault (Journal): `src/modules/vault/` wraps encrypted CRUD for journal entries
  - (Future) Habits/Cycles/AI live under `src/modules/<feature>` each with clear contracts
- P2P Sync
  - WebRTC + QR under `src/utils/p2p.ts` and UI in `src/routes/Sync.tsx`
- Reminders & Notifications
  - `src/utils/reminders.ts` schedules in-app reminders; `.ics` export for OS alerts

## Why this shape

- Clear boundaries: routes/UI only call service/store functions; services talk to `db` and encryption utils
- Easier testing: services are pure, stored under `src/modules/*`
- Migration-friendly: Dexie versioned schema lives in one file
- Privacy by design: encryption happens at the edges (Vault service), keys in-memory only

## Contracts (examples)

- Check-In service
  - addCheckIn({ mood, notes?, createdAt? }) => CheckIn
  - listCheckIns(limit?) => CheckIn[] (latest first)
  - getMoodStats(days) => Record<Mood, number>
- Vault service
  - addJournalEntry(plain, createdAt?) => JournalEntry (encrypted at rest)
  - readJournalEntry(entry) => string (requires unlocked key)
  - listJournalEntries(limit?) => JournalEntry[]

## Future integration points

- Cycle/Symptom Tracking
  - Module: `src/modules/cycles/`
  - Tables: `cycles`, `symptoms`, with daily entries
  - Insights: local analytics over time windows (no cloud)
  - UI: route `routes/Cycles.tsx` with calendar + tags
- Habit Nudges
  - Module: `src/modules/habits/`
  - Tables: `habits`, `habit_logs`
  - Reminders: schedule nudges via reminders service; `.ics` for out-of-app reliability
  - UI: integrate with Planner (show Today’s habits)
- On-device Chatbot (local models)
  - Module: `src/modules/assistant/`
  - Approach: WebLLM/WebGPU or TinyML (e.g., ONNX Runtime Web)
  - Privacy: models stored locally; no network calls by default
  - UX: opt-in download, show storage and battery impact

## Premium HOS extensions

- Local ML & Behavioral Patterns
  - `modules/ml/*` provides features, models, and explainability
  - Risks/insights are predictions only; user-controlled via Settings
- Cognitive Nudges
  - `modules/nudges/service.ts` generates small, value-aligned actions
- Reflective Prompts
  - `modules/prompts/service.ts` surfaces journaling cues from context
- Mind Maps (planned)
  - `modules/mindmap/*` to render correlations between habits, emotions, and outcomes (local computation)
- Assistant (planned)
  - `modules/assistant/*` offline chatbot using local models; privacy toggle and bandwidth guards

## Accessibility & Minimalism

- Large text, high contrast, reduce motion flags stored in `localStorage`
- Calm palette in `styles.css`; avoid heavy animations; ensure 4.5:1 contrast
- Keyboard navigation and aria labels throughout components

## Data flow

UI -> Services/Store -> Dexie (IndexedDB)
         |            -> Crypto (Vault only)
         -> Reminders (optional)

## Sync

- P2P shares encrypted export only (no server)
- QR encodes offers/answers for WebRTC DataChannels
- Vault data stays encrypted end-to-end
