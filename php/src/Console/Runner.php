<?php

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * Its contents are strictly confidential and proprietary.
 *
 * @copyright © 2026 Matchory GmbH · All rights reserved
 */

declare(strict_types=1);

namespace Matchory\CodingStyle\Console;

use JsonException;
use Matchory\CodingStyle\Rector\Preset;

use function array_key_exists;
use function file_get_contents;
use function file_put_contents;
use function is_array;
use function is_file;
use function is_string;
use function json_decode;
use function preg_match;
use function sprintf;
use function str_contains;

use const JSON_THROW_ON_ERROR;

/**
 * The `matchory-coding-style` command for PHP consumers.
 *
 * Lives in `src/` rather than inside the executable so that PHPStan analyses it. The binary is a
 * thin dispatcher.
 */
final readonly class Runner
{
    /**
     * Files copied verbatim into the project root, as target path => path inside this package.
     *
     * Only `.editorconfig` needs this. Pint reads its config from `vendor/` via `--config`, PHPStan
     * through `includes:`, and Rector through a PHP call, so none of them need anything copied.
     * EditorConfig resolves `root = false` by walking up the directory tree and cannot reference a
     * file inside a package.
     */
    private const array MANAGED_FILES = [
        '.editorconfig' => '/.editorconfig',
    ];

    public function __construct(
        private string $packageRoot,
        private string $projectRoot,
        private Reporter $reporter,
    ) {}

    /**
     * Writes the managed files into the project, or reports that they have drifted.
     */
    public function sync(bool $check): int
    {
        $stale = [];

        foreach (self::MANAGED_FILES as $target => $source) {
            $expected = file_get_contents($this->packageRoot . $source);

            if ($expected === false) {
                $this->reporter->error(sprintf("Cannot read '%s' from the package", $target));

                return 1;
            }

            $path = $this->projectRoot . '/' . $target;
            $current = is_file($path) ? file_get_contents($path) : null;

            if ($current === $expected) {
                $this->reporter->line('unchanged', $target);

                continue;
            }

            if ($check) {
                $stale[] = $target;

                continue;
            }

            if (file_put_contents($path, $expected) === false) {
                $this->reporter->error(sprintf("Cannot write '%s'", $target));

                return 1;
            }

            $this->reporter->line($current === null ? 'created' : 'updated', $target);
        }

        if ($stale !== []) {
            $this->reporter->error(sprintf(
                "Out of date: %s\nRun `vendor/bin/matchory-coding-style sync`",
                implode(', ', $stale),
            ));

            return 1;
        }

        return 0;
    }

    /**
     * Checks that this project is actually wired to the shared configuration.
     *
     * Installing the package is not the same as using it. A repository can carry it in
     * `composer.json` while its `fmt` script still points at a local `pint.json`, or while the one
     * PHPStan parameter that cannot be shipped from a package is missing. Those are exactly the
     * failures that reintroduce drift, and none of them break a build on their own.
     *
     * Findings are advisory unless `$strict` is set, because not every repository wants every tool.
     */
    public function verify(bool $strict): int
    {
        $this->verifyEditorConfig();
        $this->verifyPint();
        $this->verifyPhpStan();
        $this->verifyRector();

        return $this->reporter->summarise($strict);
    }

    private function verifyEditorConfig(): void
    {
        $expected = file_get_contents($this->packageRoot . '/.editorconfig');
        $path = $this->projectRoot . '/.editorconfig';

        if (! is_file($path)) {
            $this->reporter->fail(
                '.editorconfig',
                'missing; run `vendor/bin/matchory-coding-style sync`',
            );

            return;
        }

        if (file_get_contents($path) !== $expected) {
            $this->reporter->fail(
                '.editorconfig',
                'has drifted from the canonical copy; run `vendor/bin/matchory-coding-style sync`',
            );

            return;
        }

        $this->reporter->pass('.editorconfig', 'matches the canonical copy');
    }

    /**
     * Pint cannot merge configuration, so the only way to use a shared preset is `--config`.
     *
     * A leftover local `pint.json` is the tell that a repository is still on its own rules.
     */
    private function verifyPint(): void
    {
        if (! $this->composerScriptsMention('php/pint/')) {
            $this->reporter->fail(
                'pint',
                'no composer script passes --config vendor/matchory/coding-style/php/pint/<preset>.json',
            );

            return;
        }

        $this->reporter->pass('pint', 'a composer script uses a shared preset');

        if (is_file($this->projectRoot . '/pint.json')) {
            $this->reporter->warn(
                'pint',
                'a local pint.json is present; --config ignores it, so it is either dead or you are '
                . 'merging it deliberately',
            );
        }
    }

    /**
     * PHPStan needs two things checked, for opposite reasons.
     *
     * `base.neon` arrives on its own through extension-installer, so its absence means the plugin is
     * disabled rather than that the consumer forgot something. The complexity thresholds are the
     * mirror image: they CANNOT be shipped, because PHPStan merges extension configs after every
     * `includes:` and `tomasvotruba/cognitive-complexity` sorts last. They have to be declared
     * locally or they silently stay at the far stricter package defaults.
     */
    private function verifyPhpStan(): void
    {
        $generated = $this->projectRoot
            . '/vendor/phpstan/extension-installer/src/GeneratedConfig.php';

        if (! is_file($generated)) {
            $this->reporter->warn(
                'phpstan',
                'phpstan/extension-installer is not installed, so base.neon is never applied',
            );
        } else {
            $contents = (string) file_get_contents($generated);

            if (str_contains($contents, 'matchory/coding-style')) {
                $this->reporter->pass('phpstan', 'base.neon is auto-applied via extension-installer');
            } else {
                $this->reporter->fail(
                    'phpstan',
                    'extension-installer has not picked up this package; check that '
                    . 'allow-plugins.phpstan/extension-installer is true and re-run composer install',
                );
            }
        }

        $config = $this->firstExistingFile(['phpstan.neon', 'phpstan.neon.dist', 'phpstan.dist.neon']);

        if ($config === null) {
            $this->reporter->warn('phpstan', 'no phpstan.neon found');

            return;
        }

        $contents = (string) file_get_contents($config);

        if (preg_match('/^\s*cognitive_complexity\s*:/m', $contents) === 1) {
            $this->reporter->pass('phpstan', 'complexity thresholds are declared locally');
        } else {
            $this->reporter->fail(
                'phpstan',
                'cognitive_complexity is not declared in your own config, so it silently stays at the '
                . 'package defaults (class: 40, function: 9). This parameter cannot be shipped from a '
                . 'package; see php/phpstan/complexity.neon for the values to copy',
            );
        }
    }

    private function verifyRector(): void
    {
        $config = $this->firstExistingFile(['rector.php']);

        if ($config === null) {
            $this->reporter->warn('rector', 'no rector.php found');

            return;
        }

        $contents = (string) file_get_contents($config);

        if (str_contains($contents, Preset::class)) {
            $this->reporter->pass('rector', 'uses a shared preset');

            return;
        }

        $this->reporter->fail(
            'rector',
            'rector.php does not call Matchory\\CodingStyle\\Rector\\Preset',
        );
    }

    /**
     * @param list<string> $candidates
     */
    private function firstExistingFile(array $candidates): ?string
    {
        foreach ($candidates as $candidate) {
            $path = $this->projectRoot . '/' . $candidate;

            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Whether any composer script contains the given fragment.
     *
     * Script values are either a string or a list of strings, and a project may nest references via
     * `@other-script`, so this only sees literal steps. Good enough: the point is to catch a project
     * whose formatter never mentions the shared preset at all.
     */
    private function composerScriptsMention(string $fragment): bool
    {
        foreach ($this->composerScripts() as $script) {
            foreach ((array) $script as $step) {
                if (is_string($step) && str_contains($step, $fragment)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @return array<string, mixed>
     */
    private function composerScripts(): array
    {
        $path = $this->projectRoot . '/composer.json';

        if (! is_file($path)) {
            return [];
        }

        try {
            $manifest = json_decode(
                (string) file_get_contents($path),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
        } catch (JsonException) {
            return [];
        }

        if (! is_array($manifest) || ! array_key_exists('scripts', $manifest)) {
            return [];
        }

        return is_array($manifest['scripts']) ? $manifest['scripts'] : [];
    }
}
