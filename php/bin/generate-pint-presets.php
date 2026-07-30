#!/usr/bin/env php
<?php

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

declare(strict_types=1);

/**
 * Derives every secondary Pint preset from `pint/base.json`.
 *
 * Pint has no configuration inheritance: `--config` selects exactly one file and nothing is merged
 * into it. Secondary presets are therefore complete, standalone files, and are generated from the
 * base rather than hand-maintained so the rules have a single source of truth.
 *
 * Run `php php/bin/generate-pint-presets.php`; pass `--check` to verify the committed output is up
 * to date without writing (used by CI).
 */
$pintDirectory = dirname(__DIR__) . '/pint';
$check = in_array('--check', $argv, true);

/**
 * Rules dropped by the `relaxed` preset.
 *
 * These rewrite or reorder docblocks. They produce by far the largest diff when a repository first
 * adopts the shared style, and that diff is what stalls adoption. `relaxed` exists so a repository
 * can take the formatting rules immediately and graduate to `base` later; it is not a permanent
 * home.
 */
const RELAXED_OMITS_RULES = [
    'no_superfluous_phpdoc_tags',
    'phpdoc_align',
    'phpdoc_no_alias_tag',
    'phpdoc_no_empty_return',
    'phpdoc_no_useless_inheritdoc',
    'phpdoc_order',
    'phpdoc_order_by_value',
    'phpdoc_scalar',
    'phpdoc_separation',
    'phpdoc_single_line_var_spacing',
    'phpdoc_to_comment',
    'phpdoc_trim',
    'phpdoc_trim_consecutive_blank_line_separation',
    'phpdoc_types_order',
];

$base = json_decode(
    json: (string) file_get_contents($pintDirectory . '/base.json'),
    associative: true,
    flags: JSON_THROW_ON_ERROR,
);

$relaxed = $base;
$relaxed['rules'] = array_diff_key($base['rules'], array_flip(RELAXED_OMITS_RULES));

$presets = ['relaxed' => $relaxed];
$failures = [];

foreach ($presets as $name => $preset) {
    $path = $pintDirectory . '/' . $name . '.json';
    $encoded = json_encode(
        value: $preset,
        flags: JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
              | JSON_THROW_ON_ERROR,
    );

    // json_encode() hardcodes four-space indentation; JSON in this organisation is two-space.
    $rendered = preg_replace_callback(
        pattern: '/^(?: {4})+/m',
        callback: static fn(array $matches): string => str_repeat(
            ' ',
            intdiv(strlen($matches[0]), 2),
        ),
        subject: $encoded,
    ) . "\n";

    if ($check) {
        $current = is_file($path) ? (string) file_get_contents($path) : '';

        if ($current !== $rendered) {
            $failures[] = $name;
        }

        continue;
    }

    file_put_contents($path, $rendered);
    echo "wrote pint/{$name}.json\n";
}

if ($failures !== []) {
    fwrite(STDERR, sprintf(
        "Stale Pint presets: %s\nRun `php php/bin/generate-pint-presets.php`\n",
        implode(', ', $failures),
    ));

    exit(1);
}

if ($check) {
    echo "Pint presets are up to date\n";
}
