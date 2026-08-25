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

## 5. Payments — one-time server setup

The site includes a Yoco Checkout payment flow (`/pay`) backed by three PHP files in `dist/api/`. PHP needs no build step — cPanel just needs to be running **PHP 8.0 or newer** (MultiPHP Manager → select the domain → PHP 8.0+). Do this once, before the payment link is ever sent to a real customer.

### 5.1 Create `yoco-config.php` above `public_html`

This file holds real secrets and must **never** be inside `public_html` (so Apache can never serve it, `.htaccess` rules aside) and must **never** be committed to git.

1. cPanel → File Manager → navigate **up one level from `public_html`** (i.e. to your home directory, `/home/USERNAME/`).
2. Create a new file named exactly `yoco-config.php`.
3. Paste the contents of this repo's `yoco-config.example.php`, then fill in real values:
   - `yoco_secret_key` — from Yoco (Online Sales → Settings → API Keys). Use the `sk_test_...` key while testing; switch to `sk_live_...` only once you're genuinely ready to take real payments, and only ever type it directly into this file on the server.
   - `webhook_secret` — you'll get this in step 5.3, once the webhook is registered. Leave the placeholder until then.
   - `link_signing_key` — generate a real random string, e.g. run `php -r "echo bin2hex(random_bytes(32));"` in cPanel's Terminal (or any PHP shell) and paste the output. This is the shared secret `create-checkout.php` and `generate-link.php` both use to sign/verify links — it must match between them.
   - `terms_version` — matches whatever's live on `/terms` right now.
   - `log_path` — an absolute path in your home directory, e.g. `/home/USERNAME/ulendo-payments.log`. Do not put this inside `public_html`.
4. Save. File permissions `644` are fine — it's outside the web root either way.

### 5.2 Create the `.htpasswd` file for `generate-link.php`

`generate-link.php` (the internal link-generator) is protected by HTTP Basic Auth. Easiest path:

1. cPanel → **Directory Privacy** (search "Directory Privacy" in cPanel if it's not on the dashboard).
2. Navigate to `public_html/api` and enable password protection on that folder — **but note this would also gate the payment/webhook endpoints your customers and Yoco need to reach.** Don't protect the whole `api/` folder. Instead:
3. Use cPanel's **Terminal** (or any SSH access) to create the password file directly, without gating the folder:
   ```bash
   htpasswd -c /home/USERNAME/.htpasswd admin
   ```
   (`-c` creates the file; omit it if the file already exists and you're adding a second user. You'll be prompted for a password.)
4. Confirm the path in `public/.htaccess`'s `AuthUserFile` line matches exactly where you created it (`/home/USERNAME/.htpasswd`) — replace `USERNAME` with your real cPanel username, then rebuild and re-upload.
5. If Terminal access isn't available on your hosting plan, cPanel's **Directory Privacy** tool can still generate a `.htpasswd` file for you if you point it at a *dummy* subfolder you're not actually using for protection — check the file it creates and copy just the `.htpasswd` file to the home-directory path above, then remove the accidental folder protection it applied.

### 5.3 Register the Yoco webhook

1. In the Yoco dashboard: Online Sales → Settings → Webhooks → add a new webhook.
2. URL: `https://ulendotours.co.za/api/yoco-webhook.php`
3. Yoco will show you a signing secret starting with `whsec_` — copy it into `yoco-config.php`'s `webhook_secret` value (step 5.1).
4. Yoco's dashboard usually offers a "send test event" button — use it, then check that a line appended to the log file at your configured `log_path` (or check `ulendo-payments-errors.log` next to it if nothing appeared, for the rejection reason).

> **Note on webhook verification:** `api/yoco-webhook.php` implements the signature scheme exactly as documented at `developer.yoco.com/online/api-reference/webhooks/verifying-events` (Standard Webhooks / Svix convention: `webhook-id`/`webhook-timestamp`/`webhook-signature` headers, HMAC-SHA256 over `{id}.{timestamp}.{raw body}`, base64-decoded `whsec_`-prefixed secret) and the `payment.succeeded` event payload shape as documented there at time of writing. If Yoco changes either scheme, or a real test event doesn't parse the way `api/yoco-webhook.php` expects, check the current docs and adjust — this was implemented against live documentation, not guessed, but API shapes do change.

### 5.4 Test before going anywhere near a live key

With `sk_test_...` in `yoco-config.php`, nothing here moves real money. Generate a test link via `/api/generate-link.php` (log in with the Basic Auth credentials from 5.2), open it, tick the T&Cs box, and pay with one of [Yoco's documented test cards](https://developer.yoco.com) for test mode. Confirm:

- The amount shown on `/pay` matches what you generated.
- Editing `amount` in the URL bar breaks the link (signature mismatch → friendly error page).
- After paying, you land on `/pay/success`.
- A line appears in the log file at `log_path` with the booking ref, amount, and a `pay_...` Yoco payment ID.
- Clicking "Cancel" on Yoco's hosted page lands you on `/pay/cancelled`.

Only switch `yoco_secret_key` to a `sk_live_...` key once all of that checks out.

## 6. Every future change needs a fresh upload

**There is no auto-deploy here.** Pushing to GitHub does not update the live site. Any content or code change requires:

```bash
npm run build
cd dist && zip -r ../ulendo-site.zip . -x ".DS_Store" && cd ..
```

...then repeating the cPanel upload/extract steps above. If you want git-push-to-deploy later, that's a separate piece of infrastructure (a cPanel Git repo + deploy hook, or moving to a host with native CI) — not something this static export does on its own.
