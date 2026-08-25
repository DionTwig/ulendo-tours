<?php
// EXAMPLE ONLY — placeholder values, safe to commit.
//
// The real file is named `yoco-config.php` and lives ONE LEVEL ABOVE public_html
// on the live server (e.g. /home/USERNAME/yoco-config.php), so it sits outside
// the web root and Apache can never serve it directly, regardless of .htaccess
// rules. It is uploaded manually and is NEVER committed to this repo.
//
// See DEPLOY.md for exactly how/where to create it.
return [
    // From Yoco: Online Sales → Settings → API Keys. Test keys start with sk_test_,
    // live keys with sk_live_. Never put a sk_live_ key in this repo, in chat, or
    // in any file the browser can reach.
    'yoco_secret_key'  => 'sk_test_7c71bb653mqyv1m4f024e99b3f64',

    // From Yoco once the webhook endpoint below is registered (Online Sales →
    // Settings → Webhooks). Starts with whsec_.
    'webhook_secret'   => 'whsec_xxxxx',

    // A long random string used to sign/verify payment links. Generate your own —
    // e.g. `php -r "echo bin2hex(random_bytes(32));"` — do not reuse this example.
    'link_signing_key' => 'a-long-random-string',

    // Bumped whenever terms.astro's content changes materially. Recorded against
    // every payment's metadata so we always know which version a customer accepted.
    'terms_version'    => 'Draft 0.1',

    // Above the web root — never inside public_html. Yoco payment confirmations
    // are appended here by api/yoco-webhook.php.
    'log_path'         => '/home/USERNAME/ulendo-payments.log',
];
