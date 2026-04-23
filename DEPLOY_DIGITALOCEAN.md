# Deploy To DigitalOcean

## Recommended

Use **DigitalOcean App Platform** with this repository and Dockerfile.

App Platform supports Dockerfile-based deployments from a Git repository:
- [Create apps](https://docs.digitalocean.com/products/app-platform/how-to/create-apps/)
- [Dockerfile build reference](https://docs.digitalocean.com/products/app-platform/reference/dockerfile/)

## Option 1: App Platform

1. Push this project to GitHub.
2. In DigitalOcean, choose **Create -> App Platform**.
3. Select your GitHub repo.
4. App Platform should detect the `Dockerfile`.
5. Set these environment variables in App Platform:
   - `SUPABASE_URL`
   - `SUPABASE_REST_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PRODUCTS_TABLE`
   - `SUPABASE_BUCKET`
   - `SUPABASE_S3_ENDPOINT`
   - `SUPABASE_PUBLIC_BASE_URL`
   - `SUPABASE_ACCESS_KEY_ID`
   - `SUPABASE_SECRET_ACCESS_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHANNEL_ID`
   - `TELEGRAM_WEBHOOK_URL`
6. Deploy.

Notes:
- Do not upload `.env` to git.
- App Platform injects env vars at runtime.
- The container listens on port `8080`.

## Option 2: Docker On A Droplet

Build locally:

```bash
docker build -t rog-store .
docker run --env-file .env -p 8080:8080 rog-store
```

Then push the image to a registry and run it on a DigitalOcean Droplet.

## If You Want A Registry-Based Deploy

DigitalOcean App Platform can also deploy from container images:
- [Deploy from container images](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-container-images/)

## Suggested Choice

For this project, **App Platform + Dockerfile** is the easiest path.
