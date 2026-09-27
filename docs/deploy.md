# Deploy Manhattan Defense to Cloudflare Pages

The project now uses **GitHub Actions** to build and deploy to **Cloudflare Pages** on every push to `main`.

## What you need

Three GitHub secrets:

| Secret | What it is | Where to get it |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | API token with Cloudflare Pages edit permission | https://dash.cloudflare.com/profile/api-tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | https://dash.cloudflare.com → right sidebar of any domain, or Pages overview URL |
| `CLOUDFLARE_PROJECT_NAME` | The Cloudflare Pages project name | You choose it when creating the project (e.g. `manhattan-defense`) |

## 1. Create the Cloudflare Pages project

### Option A — Dashboard (easiest)
1. Go to https://dash.cloudflare.com → **Pages** → **Create a project**.
2. Choose **Connect to Git** → select `william-bossut/manhattan-defense`.
3. In build settings, use:
   - Build command: `npm run build-nolog`
   - Build output directory: `dist`
4. Save. Cloudflare creates the project and gives it a name.

### Option B — API
If you give the agent your `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, they can create it via the Cloudflare API:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/pages/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"manhattan-defense","production_branch":"main"}'
```

## 2. Add GitHub secrets

In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.

Add all three secrets from step 1.

## 3. Trigger a deploy

Push any commit to `main`, or re-run the latest workflow:
```bash
cd "/home/sstaline/Documents/vs code/manhattan-defense"
git commit --allow-empty -m "trigger: deploy to Cloudflare Pages"
git push
```

## 4. Custom domain

Once the first deploy succeeds:
1. In Cloudflare Pages → your project → **Custom domains**.
2. Click **Set up a custom domain** and enter your domain.
3. Follow Cloudflare's DNS instructions. Because your domain is already on Cloudflare, this is usually one click.

## Build settings

Build settings are controlled by `.github/workflows/deploy.yml`, not by Cloudflare's dashboard. The workflow runs:
```bash
npm ci
npm run build-nolog
```
and uploads the `dist/` folder.
