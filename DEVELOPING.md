# Developing & preview deployments

## URLs

| Environment | URL | Git source |
|---|---|---|
| **Production** | https://bnarcum.github.io/cisco-portfolio-navigator/ | `main` on `origin` |
| **Preview** | https://bnarcum.github.io/cisco-portfolio-navigator-preview/ | `dev` pushed to `preview` remote |

Production also appears on the [Cisco internal tools hub](https://wwwin-github.cisco.com/pages/bnarcum/cisco-tools/). Only merge to `main` when you intend to update that live site.

## Remotes

```text
origin   → github.com/bnarcum/cisco-portfolio-navigator.git      (production)
preview  → github.com/bnarcum/cisco-portfolio-navigator-preview.git (sandbox)
```

## Daily workflow

```bash
git checkout dev

# edit cisco-portfolio-navigator.html, assets, JSON, etc.

git add -A && git commit -m "Describe your enhancement"
git push preview dev:main    # publishes to the preview URL (~1 min)
git push origin dev          # optional backup of dev branch on GitHub
```

Share the preview URL with colleagues while you iterate. The orange banner at the top marks it as non-production.

## Promote to production

When preview looks good:

```bash
git checkout main
git merge dev
git push origin main         # updates production GitHub Pages
```

Keep experimenting on `dev` — production stays untouched until you merge and push `main`.

## Local testing

No build step required:

```bash
python3 -m http.server 8765
# open http://localhost:8765/cisco-portfolio-navigator.html
```

Playwright tests (optional):

```bash
npm test
```
