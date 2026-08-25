<?php
declare(strict_types=1);

require __DIR__ . '/_config.php';

/**
 * Verification scheme confirmed against Yoco's own docs
 * (developer.yoco.com/online/api-reference/webhooks/verifying-events) —
 * this is the "Standard Webhooks" convention (same as Svix):
 *   signed_content = "{webhook-id}.{webhook-timestamp}.{raw_body}"
 *   key            = base64_decode(secret with "whsec_" prefix stripped)
 *   signature      = base64(HMAC-SHA256(key, signed_content))
 * The webhook-signature header can carry multiple "v1,<sig>" entries
 * space-separated; any match is accepted.
 */
function verify_yoco_signature(string $secret, string $id, string $timestamp, string $rawBody, string $signatureHeader): bool
{
    if (!str_starts_with($secret, 'whsec_')) {
        return false;
    }
    $keyBytes = base64_decode(substr($secret, strlen('whsec_')), true);
    if ($keyBytes === false) {
        return false;
    }

    $signedContent = "{$id}.{$timestamp}.{$rawBody}";
    $expected = base64_encode(hash_hmac('sha256', $signedContent, $keyBytes, true));

    foreach (explode(' ', trim($signatureHeader)) as $part) {
        $pieces = explode(',', $part, 2);
        if (count($pieces) !== 2) {
            continue;
        }
        [, $candidate] = $pieces;
        if (hash_equals($expected, $candidate)) {
            return true;
        }
    }

    return false;
}

function header_value(string $name): string
{
    // Apache/PHP normally exposes custom headers as HTTP_X, but getallheaders()
    // (when available) is more reliable for hyphenated lowercase header names.
    if (function_exists('getallheaders')) {
        foreach (getallheaders() as $key => $value) {
            if (strcasecmp($key, $name) === 0) {
                return $value;
            }
        }
    }
    $serverKey = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
    return $_SERVER[$serverKey] ?? '';
}

function log_webhook_error(string $logPath, string $message, array $context = []): void
{
    $errorLogPath = preg_replace('/\.log$/', '-errors.log', $logPath) ?? ($logPath . '-errors');
    ulendo_log_line($errorLogPath, (string) json_encode([
        'time' => date('c'),
        'message' => $message,
        'context' => $context,
    ]));
}

$config = ulendo_load_config();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit;
}

$rawBody = file_get_contents('php://input') ?: '';
$webhookId = header_value('webhook-id');
$webhookTimestamp = header_value('webhook-timestamp');
$webhookSignature = header_value('webhook-signature');

if ($config['webhook_secret'] === '' || $webhookId === '' || $webhookTimestamp === '' || $webhookSignature === '') {
    log_webhook_error($config['log_path'], 'Missing webhook secret or signature headers');
    http_response_code(400);
    exit;
}

// Reject stale/replayed deliveries — 5 minute tolerance either side of now.
$now = time();
if (abs($now - (int) $webhookTimestamp) > 300) {
    log_webhook_error($config['log_path'], 'Webhook timestamp outside tolerance', ['timestamp' => $webhookTimestamp]);
    http_response_code(400);
    exit;
}

if (!verify_yoco_signature($config['webhook_secret'], $webhookId, $webhookTimestamp, $rawBody, $webhookSignature)) {
    log_webhook_error($config['log_path'], 'Webhook signature verification failed', ['webhook_id' => $webhookId]);
    http_response_code(400);
    exit;
}

$event = json_decode($rawBody, true);
if (!is_array($event)) {
    log_webhook_error($config['log_path'], 'Webhook body did not parse as JSON');
    http_response_code(400);
    exit;
}

// Always 200 quickly once the signature is valid — Yoco should not need to retry
// just because we decided an event type doesn't interest us.
if (($event['type'] ?? '') !== 'payment.succeeded') {
    http_response_code(200);
    exit;
}

$payload = is_array($event['payload'] ?? null) ? $event['payload'] : [];
$paymentId = (string) ($payload['id'] ?? '');
$amount = (int) ($payload['amount'] ?? 0);
$metadata = is_array($payload['metadata'] ?? null) ? $payload['metadata'] : [];
$bookingRef = (string) ($metadata['bookingRef'] ?? '');
$termsVersion = (string) ($metadata['termsVersion'] ?? '');

if ($paymentId === '') {
    log_webhook_error($config['log_path'], 'payment.succeeded event missing payload.id', ['event_id' => $event['id'] ?? null]);
    http_response_code(200);
    exit;
}

// Idempotency: Yoco may retry the same event, so skip if this payment ID is
// already recorded rather than logging (and potentially confirming) it twice.
if (is_file($config['log_path'])) {
    $existing = file($config['log_path'], FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($existing as $line) {
        $record = json_decode($line, true);
        if (is_array($record) && ($record['yocoPaymentId'] ?? null) === $paymentId) {
            http_response_code(200);
            exit;
        }
    }
}

ulendo_log_line($config['log_path'], (string) json_encode([
    'time' => date('c'),
    'bookingRef' => $bookingRef,
    'amount' => $amount,
    'yocoPaymentId' => $paymentId,
    'termsVersion' => $termsVersion,
]));

http_response_code(200);
