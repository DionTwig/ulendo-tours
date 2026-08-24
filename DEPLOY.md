# Deploying Ulendo Tours to cPanel

This is a static site (Astro, `output: "static"`). There is no Node runtime, database, or build step on the server — you're uploading plain HTML/CSS/JS/images that Apache serves directly.

## 1. Build and zip

From the project root:

```bash
npm run build
```

This outputs to `dist/`. Then zip the **contents** of `dist/`, not the `dist/` folder itself:

```bash
cd dist && zip -r ../ulendo-site.zip . -x ".DS_Store" && cd ..
```

Zipping `dist` itself (rather than `cd`-ing into it first) produces an archive that extracts to `public_html/dist/index.html` instead of `public_html/index.html` — the site will 404 on every page. This is the single most common way this goes wrong.

**Verify `.htaccess` made it into the archive before uploading** — zip tools (and some GUI "Compress" actions) silently skip dotfiles depending on configuration:

```bash
unzip -l ulendo-site.zip | grep htaccess
```

If nothing prints, `.htaccess` didn't make it in and the site will have no HTTPS redirect, no custom 404, and no caching headers. Re-zip with a tool/flag that includes dotfiles.

> **Note for Windows without a `zip`/`unzip` CLI:** PowerShell's `Compress-Archive` (and the `System.IO.Compression.FileSystem` assembly under Windows PowerShell 5.1) is known to write **backslash-separated** paths inside the archive instead of the forward-slash paths the ZIP format requires — e.g. `_astro\file.css` instead of `_astro/file.css`. Extracted on a Linux server, this can produce literal filenames containing a backslash instead of real subfolders, breaking every asset reference. If you build the zip on Windows, verify entry names use `/` before uploading (list the archive's contents and check), or build it inside WSL/Git Bash with real `zip` instead.

## 2. cPanel upload

1. Log into cPanel → **File Manager** → navigate to `public_html`.
2. **Delete** any default `index.html`, `default.php`, or placeholder page cPanel put there — an existing `index.html` will take priority over nothing, but a stray `default.php` can still be served for some request paths and confuse things.
3. **Upload** `ulendo-site.zip` into `public_html`.
4. Select it → **Extract**. Extract into `public_html` (not a subfolder).
5. **Delete `ulendo-site.zip`** after extracting — no reason to leave it publicly reachable.

### See the dotfiles

By default, cPanel's File Manager hides files starting with `.`, so `.htaccess` will look like it's missing even when it extracted correctly. Enable **Settings → Show Hidden Files (dotfiles)** in the top-right of File Manager to confirm it's actually there.

### Permissions

cPanel usually sets these correctly on upload/extract, but if anything looks wrong (500 errors, `.htaccess` not applying):

- Files: `644`
- Folders: `755`

## 3. Before testing: SSL

The `.htaccess` in this repo force-redirects every request to `https://`. **Confirm AutoSSL / Let's Encrypt is active and issued for `ulendotours.co.za`** (cPanel → SSL/TLS Status) before you load the site. If HTTPS isn't actually available yet, the `RewriteCond %{HTTPS} !=on` rule will redirect to an `https://` URL that doesn't work, and depending on how the browser/CDN caches that, it can look like a redirect loop. Get the certificate live first, then test.

## 4. Post-upload checks

1. Load `https://ulendotours.co.za` — confirm it renders (images, fonts, animations, the padlock).
2. **Hard-refresh** (Ctrl/Cmd+Shift+R) to rule out a stale cached copy of anything from before deployment.
3. Visit a route that doesn't exist, e.g. `https://ulendotours.co.za/this-does-not-exist` — confirm the custom 404 page renders (not Apache's default error page, not a blank page).
4. Confirm the browser shows a valid padlock/certificate for the domain.
5. Open `https://ulendotours.co.za/sitemap-index.xml` directly — confirm it loads and lists `sitemap-0.xml`.

## 5. Every future change needs a fresh upload

**There is no auto-deploy here.** Pushing to GitHub does not update the live site. Any content or code change requires:

```bash
npm run build
cd dist && zip -r ../ulendo-site.zip . -x ".DS_Store" && cd ..
```

...then repeating the cPanel upload/extract steps above. If you want git-push-to-deploy later, that's a separate piece of infrastructure (a cPanel Git repo + deploy hook, or moving to a host with native CI) — not something this static export does on its own.
