# Deploying eOffice (Docker Compose)

Single-server deployment with a domain and automatic HTTPS. Three long-running services
plus a one-shot bucket initializer:

| Service | Image / build | Role | Ports |
|---|---|---|---|
| **web** | `Dockerfile.web` (Vite build → Caddy) | Serves the frontend, reverse-proxies `/api` → api, terminates TLS | 80, 443 |
| **api** | `server/Dockerfile` (Express + Prisma/SQLite) | Backend API; runs `prisma migrate deploy` on start | internal :4000 |
| **minio** *(opt-in)* | `minio/minio` (pinned) | S3 object store — only with `--profile s3` | console on `127.0.0.1:9001` |
| **createbuckets** *(opt-in)* | `minio/mc` (pinned) | Creates the `eoffice` bucket, then exits | — |

### Document storage: two modes

- **`disk` (default, recommended for a single server):** documents are stored on the `eoffice_db`
  volume at `/data/uploads`. No extra services, runs on any CPU. Start with plain `docker compose up`.
- **`s3` (opt-in):** documents go to the bundled MinIO. Set `STORAGE_DRIVER=s3` in `.env` and start
  with `docker compose --profile s3 up -d --build`.
  > ⚠️ **CPU requirement:** current MinIO images require the **x86-64-v2** instruction set. On older
  > CPUs they crash with `Fatal glibc error: CPU does not support x86-64-v2`. The compose file pins
  > MinIO to a 2023 release that runs on older CPUs; if it still crashes, your CPU is too old for
  > MinIO — use `disk` mode (documents are identical to the app, just stored on the local volume).

```
Internet ──▶ web (Caddy, 443/80, auto-TLS)
                ├── /        → static frontend (dist)
                └── /api/*   → api:4000
                                 ├── SQLite  → volume  eoffice_db  (/data/prod.db)
                                 └── docs     → minio:9000 (bucket "eoffice") → volume minio_data
```

**Data lives in named volumes** (`eoffice_db`, `minio_data`, `caddy_data`): the SQLite database,
the uploaded documents, and the TLS certificates respectively. They survive `docker compose down`
and image rebuilds — only `docker compose down -v` destroys them.

---

## 1. Prerequisites (on the server)

- Docker Engine + Compose v2 (`docker compose version`).
- Your domain's DNS **A/AAAA record already pointing at the server's public IP**.
- Ports **80 and 443 open** to the internet (Caddy needs 80 reachable for the ACME challenge).

## 2. Configure

```bash
git clone <this repo> && cd demo
cp .env.production.example .env
# then edit .env:
```

Set in `.env`:
- `SITE_ADDRESS` = your domain, e.g. `eoffice.example.com` (bare domain ⇒ auto-HTTPS).
- `CORS_ORIGIN` = `https://eoffice.example.com`.
- `JWT_SECRET` = a long random string — `openssl rand -base64 48`.
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` = strong credentials.
- `SEED_ON_START` = `true` **only** if you want the demo users (password `password123`) created on
  first boot for a throwaway pilot — set it back to `false` afterwards and change the passwords.

## 3. Launch

```bash
docker compose up -d --build
docker compose ps          # all "running" except createbuckets which is "exited (0)"
docker compose logs -f api # watch migrate deploy + startup
```

Visit `https://<your-domain>`. The first request may take a few seconds while Caddy provisions
the certificate. Log in and run the golden workflow (see `TEST_REPORT.md` for the script).

## 4. Create the first admin (real deployment, `SEED_ON_START=false`)

`/auth/register` is admin-only, so bootstrap one admin directly, then use the in-app Admin → Users
screen for everyone else:

```bash
docker compose exec api node -e "
const {PrismaClient}=require('@prisma/client');const bcrypt=require('bcryptjs');
(async()=>{const p=new PrismaClient();
await p.user.create({data:{name:'System Admin',designation:'Administrator',section:'Administration',
role:'ADMIN',email:'admin@yourorg.gov',passwordHash:await bcrypt.hash(process.env.BOOTSTRAP_PW,10),active:true}});
console.log('admin created');process.exit(0);})();" \
  -e BOOTSTRAP_PW='choose-a-strong-password'
```
(Or set `SEED_ON_START=true` for the very first `up`, log in as `admin@example.com` / `password123`,
immediately reset passwords, then set it back to `false`.)

## 5. Operations

**Update to a new version:**
```bash
git pull
docker compose up -d --build      # migrations run automatically on api start
```

**Backups.** In `disk` mode the SQLite DB **and** the documents both live on the `eoffice_db`
volume (`/data/prod.db` + `/data/uploads`), so one archive covers everything:
```bash
docker run --rm -v eoffice-demo_eoffice_db:/d -v "$PWD":/out alpine tar czf /out/eoffice_db.tgz -C /d .
```
In `s3` mode, also back up the documents from MinIO (the DB references object keys — back up together):
```bash
docker run --rm -v eoffice-demo_minio_data:/d -v "$PWD":/out alpine tar czf /out/minio_data.tgz -C /d .
```
(Volume names are prefixed with the compose project name — run `docker volume ls` to confirm; on your
server the prefix is `eoffice-demo_`.)

**MinIO admin console:** bound to `127.0.0.1:9001` only. Reach it via an SSH tunnel:
`ssh -L 9001:127.0.0.1:9001 user@server` → open `http://localhost:9001`.

**Logs / restart / stop:**
```bash
docker compose logs -f web api
docker compose restart api
docker compose down            # stop (keeps data)
docker compose down -v         # stop AND delete all data — destructive
```

---

## Notes & decisions

- **Database = SQLite on a volume.** Chosen for a low-traffic single-server deployment; zero
  migration risk (the app runs on it today). To scale out later, switch the Prisma provider to
  Postgres and add a `db` service — the storage/auth layers are unaffected.
- **Documents = local disk by default** (`STORAGE_DRIVER=disk`), on the `eoffice_db` volume. The
  `StorageProvider` interface (`server/src/services/storage.ts`) also has an `s3` driver (opt-in via
  the `s3` profile). To point at **AWS S3** instead of the bundled MinIO, set `STORAGE_DRIVER=s3`,
  `S3_ENDPOINT=` (empty), real `S3_REGION`/`S3_ACCESS_KEY`/`S3_SECRET_KEY`, `S3_FORCE_PATH_STYLE=false`,
  and don't start the `minio`/`createbuckets` services.
- **TLS via Caddy** with automatic Let's Encrypt certificates; renewals are automatic. For plain
  HTTP (behind an existing proxy / internal), set `SITE_ADDRESS=:80`.
- **Uploads never touch the web tier** — documents are streamed by the API from object storage,
  so the frontend container holds no file data.
- **HTTP body limit** is 5 MB for JSON; document uploads go through multer with a 25 MB cap.
