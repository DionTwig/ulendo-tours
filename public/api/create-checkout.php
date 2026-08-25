<?php
declare(strict_types=1);

require __DIR__ . '/_config.php';

header('Content-Type: application/json');

/** @return no-return */
function respond(int $status, array $body): void
{
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function log_error(string $logPath, string $message, array $context = []): void
{
    $errorLogPath = preg_replace('/\.log$/', '-errors.log', $logPath) ?? ($logPath . '-errors');
    $line = json_encode([
        'time' => date('c'),
        'message' => $message,
        'context' => $context,
    ]);
    ulendo_log_line($errorLogPath, (string) $line);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['ok' => false, 'error' => 'method_not_allowed']);
}

$config = ulendo_load_config();

if ($config['yoco_secret_key'] === '' || $config['link_signing_key'] === '') {
    log_error($config['log_path'], 'Missing yoco_secret_key or link_signing_key in config');
    respond(500, ['ok' => false, 'error' => 'server_not_configured']);
}

$raw = file_get_contents('php://input');
$input = json_decode($raw ?: '', true);
if (!is_array($input)) {
    // Fall back to form-encoded, in case the caller posted that instead of JSON.
    $input = $_POST;
}

$ref = isset($input['ref']) ? (string) $input['ref'] : '';
$amountRaw = isset($input['amount']) ? (string) $input['amount'] : '';
$desc = isset($input['desc']) ? (string) $input['desc'] : '';
$sig = isset($input['sig']) ? (string) $input['sig'] : '';
$mode = isset($input['mode']) ? (string) $input['mode'] : 'checkout';

if ($ref === '' || $amountRaw === '' || $desc === '' || $sig === '') {
    respond(400, ['ok' => false, 'error' => 'invalid_link']);
}

// Amount must be a plain non-negative integer string (cents) — no floats, no signs.
if (!preg_match('/^\d+$/', $amountRaw)) {
    respond(400, ['ok' => false, 'error' => 'invalid_link']);
}
$amount = (int) $amountRaw;

// --- The critical control: the amount (and ref/desc) must match what Ulendo actually
// signed. Without this, a customer could edit `amount` in the URL and pay less than
// the real price. The signature — not the client-supplied amount — is the source of truth.
$expectedSig = hash_hmac('sha256', "{$ref}|{$amountRaw}|{$desc}", $config['link_signing_key']);
if (!hash_equals($expectedSig, $sig)) {
    respond(400, ['ok' => false, 'error' => 'invalid_link']);
}

// Yoco's minimum charge is R2 (200 cents).
if ($amount < 200) {
    respond(400, ['ok' => false, 'error' => 'invalid_link']);
}

if ($mode === 'validate') {
    respond(200, ['ok' => true]);
}

$successUrl = 'https://ulendotours.co.za/pay/success?ref=' . rawurlencode($ref);
$cancelUrl = 'https://ulendotours.co.za/pay/cancelled?ref=' . rawurlencode($ref);

$payload = [
    'amount' => $amount,
    'currency' => 'ZAR',
    'successUrl' => $successUrl,
    'cancelUrl' => $cancelUrl,
    'metadata' => [
        'bookingRef' => $ref,
        'termsVersion' => $config['terms_version'],
        'termsAcceptedAt' => date('c'),
    ],
];

if (!function_exists('curl_init')) {
    log_error($config['log_path'], 'cURL extension not available on this server');
    respond(500, ['ok' => false, 'error' => 'payment_unavailable']);
}

$ch = curl_init('https://payments.yoco.com/api/checkouts');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer ' . $config['yoco_secret_key'],
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode($payload),
]);
$response = curl_exec($ch);
$httpStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false) {
    log_error($config['log_path'], 'Yoco request failed at transport level', ['curl_error' => $curlError]);
    respond(502, ['ok' => false, 'error' => 'payment_unavailable']);
}

$yocoBody = json_decode($response, true);

if ($httpStatus < 200 || $httpStatus >= 300 || !is_array($yocoBody) || empty($yocoBody['redirectUrl'])) {
    // Never forward Yoco's raw response to the browser — it can contain account details.
    log_error($config['log_path'], 'Yoco checkout creation failed', [
        'http_status' => $httpStatus,
        'response_body' => $response,
        'ref' => $ref,
    ]);
    respond(502, ['ok' => false, 'error' => 'payment_unavailable']);
}

respond(200, ['ok' => true, 'redirectUrl' => $yocoBody['redirectUrl']]);
