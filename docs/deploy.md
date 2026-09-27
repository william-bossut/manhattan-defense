# Deploy Manhattan Defense to Netlify

The project is already configured for Netlify:

- `netlify.toml` — build command `npm run build-nolog`, publish directory `dist`
- `package.json` — Vite + Phaser build scripts
- `.github/workflows/deploy.yml` — builds and deploys on every push to `main`

## 1. Push to GitHub

```bash
cd "/home/sstaline/Documents/vs code/manhattan-defense"

# Create the repo on GitHub first (do NOT initialize it with README/license)
# Then add it as the remote and push:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/manhattan-defense.git
git branch -M main
git push -u origin main
```

## 2. Choose a deploy method

### Option A — Netlify Git integration (easiest, recommended)

1. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**.
2. Connect your GitHub account and pick `YOUR_GITHUB_USERNAME/manhattan-defense`.
3. Build settings are read from `netlify.toml`, so they should auto-fill:
   - Build command: `npm run build-nolog`
   - Publish directory: `dist`
4. Click **Deploy**.

Netlify will now auto-deploy every time you push (or merge a PR) to `main`.

### Option B — GitHub Actions (the workflow already exists)

Use this if you prefer deploy logs inside GitHub instead of Netlify's dashboard.

1. In Netlify, go to **Site settings → General → Site details** and copy the **Site ID**.
2. Go to **User settings → Applications → Personal access tokens** and generate a token.
3. In your GitHub repo, go to **Settings → Secrets and variables → Actions** and add:
   - `NETLIFY_AUTH_TOKEN` — the token from step 2
   - `NETLIFY_SITE_ID` — the site ID from step 1

The workflow at `.github/workflows/deploy.yml` will deploy on every push to `main`.

## 3. Pull requests

Both options will build pull requests. With Option A you get Netlify deploy previews; with Option B the workflow runs a build check but only deploys from `main`.

## 4. After deploy

Your live URL will look like `https://manhattan-defense-xxx.netlify.app`. Add it to the repo's **About** section on GitHub.
