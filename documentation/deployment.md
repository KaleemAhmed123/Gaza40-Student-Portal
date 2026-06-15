# Deployment Notes

This backend can be deployed for demo/staging on Render with MongoDB Atlas.

## Recommended Demo Stack

- API hosting: Render Web Service.
- Database: MongoDB Atlas.
- Email: Resend.
- Keep-alive: UptimeRobot hitting `/health`.

## Node Version

The project pins Node through `package.json`:

```json
"engines": {
  "node": "22.x"
}
```

This avoids Render selecting a newer default Node version unexpectedly.

## Render Settings

Build command:

```bash
corepack pnpm install --frozen-lockfile && corepack pnpm prisma:generate && corepack pnpm build
```

Start command:

```bash
corepack pnpm start
```

Do not use `corepack enable` on Render. It can fail on a read-only filesystem.

## Environment Variables

Required:

```env
NODE_ENV=production
DATABASE_URL=
JWT_ACCESS_SECRET=
CORS_ORIGIN=
FRONTEND_URL=
TRUST_PROXY=true
COOKIE_SECURE=true
```

Production code also forces `trust proxy` and secure `SameSite=None` auth cookies when `NODE_ENV=production`, but these environment values should still be set explicitly on Render.

Optional:

```env
RESEND_API_KEY=
EMAIL_FROM=
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=300
AUTH_RATE_LIMIT_MAX=20
UPLOAD_RATE_LIMIT_MAX=60
```

## Database Steps

Push the Prisma MongoDB schema before or during deployment:

```powershell
corepack pnpm prisma:push
corepack pnpm prisma:seed
corepack pnpm prisma:seed:admin
corepack pnpm prisma:seed:regional-admin
```

Prisma Migrate does not support MongoDB, so do not use `prisma migrate deploy` for this app after the MongoDB migration.

## Render Free Tier Keep-Alive

Use UptimeRobot:

- Type: HTTP(s)
- URL: `https://YOUR_RENDER_APP.onrender.com/health`
- Interval: 10 minutes

Use `/health`, not `/health/db`, for keep-alive.

Optional separate DB monitor:

- URL: `https://YOUR_RENDER_APP.onrender.com/health/db`
- Interval: 60 minutes

## Important Limitations

- Render free services can sleep without keep-alive traffic.
- Local upload storage is not durable on hosted platforms.
- Resend test sender has recipient restrictions.
- Production email requires verified domain.
- Secrets pasted into chat or logs must be rotated.
