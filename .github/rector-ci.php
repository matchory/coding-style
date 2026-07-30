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
 * Dry-runs the `library` preset over this package's own source.
 *
 * `laravel` is not applied here. Its rules resolve Eloquent types, so running them against a
 * repository that has `driftingly/rector-laravel` as a dev dependency but no Laravel installed fails
 * with "Class Illuminate\Database\Eloquent\Model was not found". That combination only exists in this
 * repository, which pulls the rule providers in purely to type-check the presets; a real consumer has
 * both or neither. The `laravel` preset is verified by construction instead, in `rector-build.php`.
 */
return Preset::library(RectorConfig::configure())
    ->withPaths([__DIR__ . '/../php/src']);
