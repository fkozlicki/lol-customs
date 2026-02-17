# Niunio

Desktop app that collects custom game match data from the League of Legends client and syncs it to your Supabase backend. Built for **non-technical users**: they install, open the app, and click Sync—no config files or setup.

---

## For your colleagues (end users)

1. **Get the installer** from you (e.g. `Niunio Setup x.x.x.exe` on Windows).
2. **Install** the app (double‑click the installer and follow the steps).
3. **Install League of Legends** if it’s not already on the PC, and log in at least once.
4. **Open Niunio**, then:
   - If it says “League client not running”, start **League of Legends** and log in.
   - Click **Select League folder** (or **Change folder** if needed).
   - Click **Sync now** to upload their custom games.

No configuration, no .env files, no terminal—just install and use.

---

## For you (developer / distributor)

### Build the installer (one-time per release)

1. Clone the repo and install dependencies:
   ```bash
   git clone <your-repo> && cd custom-ladder
   bun install
   ```
2. In **`apps/lcu`**, create a `.env` file (copy from `.env.example`) and set **your** Supabase URL and service key. This is only for the build; colleagues never see or edit this.
3. Build the **Windows** installer (works from macOS, Linux, or Windows):
   ```bash
   cd apps/lcu && bun run release:win
   ```
   The `.exe` will be in **`apps/lcu/release/`**: `Niunio Setup x.x.x.exe`.

   (Use `bun run release` to build for your current OS only, e.g. Mac → `.app`/`.dmg`.)

Your `.env` is **embedded into the build** (in a config file inside the app). Colleagues get an app that already points at your Supabase project—they don’t configure anything.

### Host on GitHub Releases and add download to the web app

1. Create a new release on GitHub (e.g. tag `v0.1.0`), upload **`Niunio Setup x.x.x.exe`** from `apps/lcu/release/` as a release asset.
2. Copy the asset URL (e.g. `https://github.com/owner/repo/releases/download/v0.1.0/Rift-Rank-LCU-Setup-0.1.0.exe`).
3. In **`apps/app`**, set in your env (e.g. `.env` or Vercel):  
   `NEXT_PUBLIC_LCU_DOWNLOAD_URL=<that URL>`
4. Redeploy the web app. The dashboard sidebar will show **Download desktop app**; colleagues click it to get the Windows installer.

### Security note

The Supabase **service role key** is inside the packaged app so it works without user setup. That’s acceptable for an internal tool for people you trust. Prefer:

- A dedicated Supabase project (or key) for this app, and
- RLS / policies so the key can only do what the sync needs (e.g. insert into `matches`, `players`, etc.).

Don’t use this build for a public or untrusted audience without a proper backend proxy.

---

## Directory structure (same pattern as `apps/app`)

- **`src/app/`** – Next.js UI (layout, page, globals.css).
- **`src/electron/`** – Electron main process and preload.
- **`src/`** – LCU client, sync, config, Supabase, transform (backend logic).

## Dev (you only)

- **Setup**: In `apps/lcu`, copy `.env.example` to `.env` and set Supabase URL and service key.
- **Run**: From repo root `bun run dev:lcu`, or from `apps/lcu`: `bun run dev`.
- **Scripts**: `bun run build` = Next build + embed config + electron-builder. Output in `release/`.

Only **custom games** with 10 players and duration ≥ 5 minutes are synced.
