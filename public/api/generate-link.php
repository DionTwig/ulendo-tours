<?php
declare(strict_types=1);

// Access to this file is controlled by HTTP Basic Auth in .htaccess — see DEPLOY.md.
require __DIR__ . '/_config.php';

$config = ulendo_load_config();

$result = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ref = trim((string) ($_POST['ref'] ?? ''));
    $randInput = trim((string) ($_POST['amount_rand'] ?? ''));
    $desc = trim((string) ($_POST['desc'] ?? ''));

    $randNormalised = str_replace([' ', ','], '', $randInput);

    if ($ref === '' || $desc === '' || $randNormalised === '' || !is_numeric($randNormalised)) {
        $error = 'Fill in a reference, a positive amount in Rand, and a description.';
    } else {
        $amountCents = (int) round(((float) $randNormalised) * 100);
        if ($amountCents < 200) {
            $error = 'Amount must be at least R2.00 (Yoco\'s minimum charge).';
        } elseif ($config['link_signing_key'] === '') {
            $error = 'link_signing_key is not configured on this server — see DEPLOY.md.';
        } else {
            $sig = hash_hmac('sha256', "{$ref}|{$amountCents}|{$desc}", $config['link_signing_key']);
            $query = http_build_query([
                'ref' => $ref,
                'amount' => $amountCents,
                'desc' => $desc,
                'sig' => $sig,
            ]);
            $url = 'https://ulendotours.co.za/pay?' . $query;
            $randFormatted = number_format($amountCents / 100, 2);

            $waMessage = "Hi! Here's your secure payment link for {$ref}:\n{$url}\n\n"
                . "Amount due: R{$randFormatted}\n\n"
                . "This covers: {$desc}\n\n"
                . "Any questions, just reply here.";

            $result = [
                'url' => $url,
                'waMessage' => $waMessage,
                'amountFormatted' => $randFormatted,
            ];
        }
    }
}
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Generate payment link | Ulendo Tours</title>
  <style>
    :root {
      --green-900: #0A3A31;
      --green-700: #0E574A;
      --orange-500: #F15C22;
      --orange-600: #D14A16;
      --cream-100: #EFF5CF;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--green-900);
      color: var(--cream-100);
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 48px 20px;
    }
    .card {
      background: #fff;
      color: var(--green-900);
      max-width: 560px;
      width: 100%;
      border-radius: 20px;
      padding: 32px;
    }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .sub { color: rgba(10,58,49,0.6); font-size: 14px; margin: 0 0 24px; }
    label { display: block; font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
    input, textarea {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(10,58,49,0.2);
      font-size: 15px;
      font-family: inherit;
    }
    button {
      margin-top: 20px;
      background: var(--orange-500);
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
    }
    button:hover { background: var(--orange-600); }
    .copy-btn {
      margin-top: 8px;
      background: transparent;
      color: var(--green-700);
      border: 1px solid rgba(10,58,49,0.25);
      padding: 8px 16px;
      font-size: 13px;
    }
    .copy-btn:hover { background: rgba(10,58,49,0.05); }
    .result { margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(10,58,49,0.12); }
    .result h2 { font-size: 15px; margin: 0 0 8px; }
    .error {
      background: #FDEDEA;
      color: #B3261E;
      border-radius: 10px;
      padding: 12px 16px;
      font-size: 14px;
      margin-bottom: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Generate a signed payment link</h1>
    <p class="sub">Internal tool — links are signed, tampered amounts are rejected server-side.</p>

    <?php if ($error !== null): ?>
      <div class="error"><?= htmlspecialchars($error, ENT_QUOTES) ?></div>
    <?php endif; ?>

    <form method="post">
      <label for="ref">Booking reference</label>
      <input type="text" id="ref" name="ref" value="<?= htmlspecialchars((string) ($_POST['ref'] ?? ''), ENT_QUOTES) ?>" placeholder="e.g. CPT-2026-014" required>

      <label for="amount_rand">Amount (Rand)</label>
      <input type="text" id="amount_rand" name="amount_rand" value="<?= htmlspecialchars((string) ($_POST['amount_rand'] ?? ''), ENT_QUOTES) ?>" placeholder="e.g. 5000" required>

      <label for="desc">Description</label>
      <input type="text" id="desc" name="desc" value="<?= htmlspecialchars((string) ($_POST['desc'] ?? ''), ENT_QUOTES) ?>" placeholder="e.g. Cape Town Long Weekend deposit" required>

      <button type="submit">Generate link</button>
    </form>

    <?php if ($result !== null): ?>
      <div class="result">
        <h2>Payment link (R<?= htmlspecialchars($result['amountFormatted'], ENT_QUOTES) ?>)</h2>
        <textarea id="urlField" rows="3" readonly><?= htmlspecialchars($result['url'], ENT_QUOTES) ?></textarea>
        <button type="button" class="copy-btn" onclick="copyField('urlField', this)">Copy link</button>

        <h2 style="margin-top:24px;">WhatsApp message</h2>
        <textarea id="waField" rows="6" readonly><?= htmlspecialchars($result['waMessage'], ENT_QUOTES) ?></textarea>
        <button type="button" class="copy-btn" onclick="copyField('waField', this)">Copy message</button>
      </div>
    <?php endif; ?>
  </div>

  <script>
    function copyField(id, btn) {
      const field = document.getElementById(id);
      field.select();
      navigator.clipboard.writeText(field.value).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(() => { btn.textContent = original; }, 1500);
      });
    }
  </script>
</body>
</html>
