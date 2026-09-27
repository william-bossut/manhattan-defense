# Deploy Manhattan Defense to GitHub Pages

The project uses a GitHub Actions workflow to build and deploy to **GitHub Pages** on every push to `main`.

## Requirements

- The repo must be **public** if you're on the free GitHub plan (private GitHub Pages requires Pro/Team/Enterprise).
- You need to enable Pages in the repo settings and select **GitHub Actions** as the source.

## 1. Enable GitHub Pages

1. Go to https://github.com/william-bossut/manhattan-defense/settings/pages
2. Under **Source**, select **GitHub Actions**.
3. Save.

## 2. Make the repo public (if needed)

If you're on the free GitHub plan, make the repo public:

```bash
cd "/home/sstaline/Documents/vs code/manhattan-defense"
gh repo edit --visibility public
```

Or change it in the repo settings: **Settings → General → Danger zone → Change repository visibility**.

## 3. Trigger a deploy

Push any commit to `main`, or re-run the latest workflow:

```bash
cd "/home/sstaline/Documents/vs code/manhattan-defense"
git commit --allow-empty -m "trigger: deploy to GitHub Pages"
git push
```

## 4. Custom domain

Once the first deploy succeeds:

1. Go to https://github.com/william-bossut/manhattan-defense/settings/pages
2. Under **Custom domain**, enter your domain (e.g. `manhattan-defense.com`).
3. Follow GitHub's DNS instructions. If your domain is on Cloudflare/another DNS, add the required `A`, `AAAA`, or `CNAME` records.
4. Enable **Enforce HTTPS** once DNS propagates.

## Build settings

The workflow at `.github/workflows/deploy.yml` runs:

```bash
npm ci
npm run build-nolog
```

and uploads the `dist/` folder to GitHub Pages.

Your default URL will be:

```
https://william-bossut.github.io/manhattan-defense/
```
