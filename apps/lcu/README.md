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
   cd apps/lcu && bun run release
   ```
   The **`.exe`** and **`latest.yml`** (for auto-updates) will be in **`apps/lcu/release/`**, e.g. `Niunio Setup 0.2.0.exe` and `latest.yml`.

   (Use `bun run build` to build for your current OS only, e.g. Mac → `.app`/`.dmg`.)

Your `.env` is **embedded into the build** (in a config file inside the app). Colleagues get an app that already points at your Supabase project—they don’t configure anything.

### GitHub Releases: download link + auto-updates (no folder)

GitHub Releases don’t let you upload a folder, only individual files. You can still use them for both the download link and auto-updates by using **one release with a fixed tag** and uploading two files per version.

**One-time setup**

1. On GitHub, create a release with a **fixed tag** you’ll reuse (e.g. `lcu` or `desktop`). You can create it without any assets; you’ll add files in the next step.
2. In **`apps/lcu`** `.env`, set:
   - `APP_BASE_URL` = your web app URL (e.g. `https://yourapp.com`)
   - `UPDATE_FEED_URL` = the **download base URL** of that release, **no trailing slash**, e.g.  
     `https://github.com/owner/repo/releases/download/lcu`  
     (Replace `owner/repo` and `lcu` with your repo and tag.)

**For each new version (e.g. 0.2.0)**

1. In `apps/lcu`, run **`bun run release`**. You get **`release/Niunio Setup 0.2.0.exe`** and **`release/latest.yml`**.
2. Open the **same** release on GitHub (tag `lcu`).
3. Upload **both files** as release assets:
   - `Niunio Setup 0.2.0.exe`
   - `latest.yml`  
   (You can delete the previous version’s exe from the release to avoid clutter; keep one exe + one `latest.yml` so the feed always points at the current build.)
4. In **`apps/app`**, set **`NEXT_PUBLIC_LCU_DOWNLOAD_URL`** to the **direct asset URL** of the installer, e.g.  
   `https://github.com/owner/repo/releases/download/lcu/Niunio%20Setup%200.2.0.exe`  
   (Optional: set **`LCU_MINIMUM_VERSION=0.2.0`** and redeploy so old clients are prompted to update.)

The desktop app will request **`UPDATE_FEED_URL/latest.yml`** (e.g. `.../releases/download/lcu/latest.yml`). GitHub serves each asset by filename, so as long as `latest.yml` and the exe are on that release, auto-updates work. No folder needed—just two files per release on the same fixed-tag release.

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
