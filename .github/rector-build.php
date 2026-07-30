<?php

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

declare(strict_types=1);

use Matchory\CodingStyle\Rector\Preset;
use Rector\Config\RectorConfig;

/**
 * Builds every preset without running any rule over source.
 *
 * This is what catches a set constant renamed upstream or a rule class that moved namespace: both
 * are evaluated while the configuration is assembled. Nesting the presets also asserts that applying
 * one twice is a no-op — `withPhpSets()` throws on a second call, so a regression in that guard fails
 * here rather than in a consumer's `rector.php`.
 *
 * `withPaths()` gets an empty directory so Rector has nothing to analyse.
 */
return Preset::laravel(Preset::library(Preset::base(Preset::pest(RectorConfig::configure()))))
    ->withPaths([__DIR__ . '/empty']);
