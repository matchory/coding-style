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

use function count;
use function fwrite;
use function printf;

use const PHP_EOL;
use const STDERR;

/**
 * Collects and prints command output.
 *
 * Separated from {@see Runner} so the checks stay assertable: a test can count failures without
 * parsing stdout.
 */
final class Reporter
{
    /** @var list<array{level: string, subject: string, detail: string}> */
    private array $findings = [];

    public function line(string $status, string $message): void
    {
        printf('%-10s %s' . PHP_EOL, $status, $message);
    }

    public function error(string $message): void
    {
        fwrite(STDERR, $message . PHP_EOL);
    }

    public function pass(string $subject, string $detail): void
    {
        $this->record('ok', $subject, $detail);
    }

    /**
     * A finding that does not fail the command unless `--strict` is set.
     *
     * Used where the correct answer depends on the repository: not every project runs Rector, and a
     * leftover local config may be deliberate.
     */
    public function warn(string $subject, string $detail): void
    {
        $this->record('warn', $subject, $detail);
    }

    public function fail(string $subject, string $detail): void
    {
        $this->record('FAIL', $subject, $detail);
    }

    /**
     * Prints the tally and returns the process exit code.
     */
    public function summarise(bool $strict): int
    {
        $failures = $this->countLevel('FAIL');
        $warnings = $this->countLevel('warn');

        printf(
            PHP_EOL . '%d ok, %d warning(s), %d failure(s)' . PHP_EOL,
            $this->countLevel('ok'),
            $warnings,
            $failures,
        );

        if ($failures > 0) {
            return 1;
        }

        if ($strict && $warnings > 0) {
            $this->error('Warnings are failures under --strict');

            return 1;
        }

        return 0;
    }

    private function record(string $level, string $subject, string $detail): void
    {
        $this->findings[] = ['level' => $level, 'subject' => $subject, 'detail' => $detail];

        printf('%-6s %-12s %s' . PHP_EOL, $level, $subject, $detail);
    }

    private function countLevel(string $level): int
    {
        return count(array_filter(
            $this->findings,
            static fn(array $finding): bool => $finding['level'] === $level,
        ));
    }
}
