<?php
declare(strict_types=1);

/**
 * Loads Yoco/payment config.
 *
 * Preferred source: yoco-config.php one level above public_html on the live
 * server (never inside the web root, so Apache can never serve it directly).
 * Falls back to a project-root .env file for local development — see
 * yoco-config.example.php for the shape and DEPLOY.md for setup.
 */
function ulendo_load_config(): array
{
    $externalConfig = __DIR__ . '/../../yoco-config.php';
    if (is_file($externalConfig)) {
        $config = require $externalConfig;
        if (is_array($config)) {
            return $config;
        }
    }

    $envFile = __DIR__ . '/../../.env';
    $env = [];
    if (is_file($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }
            [$key, $value] = explode('=', $line, 2);
            $env[trim($key)] = trim($value, " \t\n\r\0\x0B\"'");
        }
    }

    return [
        'yoco_secret_key'  => $env['YOCO_SECRET_KEY'] ?? '',
        'webhook_secret'   => $env['YOCO_WEBHOOK_SECRET'] ?? '',
        'link_signing_key' => $env['LINK_SIGNING_KEY'] ?? '',
        'terms_version'    => $env['TERMS_VERSION'] ?? 'Draft 0.1',
        'log_path'         => $env['LOG_PATH'] ?? (__DIR__ . '/../../ulendo-payments.log'),
    ];
}

/** Small helper: append a line to a log file that may live above the web root. */
function ulendo_log_line(string $path, string $line): void
{
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
    @file_put_contents($path, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}
