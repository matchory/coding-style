<?php

/**
 * This file is part of matchory/coding-style, a Matchory project.
 *
 * @copyright © 2026 Matchory GmbH
 * @license MIT
 */

declare(strict_types=1);

namespace Matchory\CodingStyle\Rector;

use Pest\Rector\Rules\SimplifyToBeTruthyFalsyRector;
use Pest\Rector\Rules\SimplifyToLiteralBooleanRector;
use Pest\Rector\Rules\UseEachModifierRector;
use Pest\Rector\Rules\UseToBeFileRector;
use Pest\Rector\Rules\UseToBeInRector;
use Pest\Rector\Rules\UseToBeListRector;
use Pest\Rector\Rules\UseToContainOnlyInstancesOfRector;
use Pest\Rector\Rules\UseToHaveKeysRector;
use Rector\CodeQuality\Rector\Identical\FlipTypeControlToUseExclusiveTypeRector;
use Rector\CodeQuality\Rector\Isset_\IssetOnPropertyObjectToPropertyExistsRector;
use Rector\CodingStyle\Rector\Catch_\CatchExceptionNameMatchingTypeRector;
use Rector\CodingStyle\Rector\Encapsed\EncapsedStringsToSprintfRector;
use Rector\Configuration\RectorConfigBuilder;
use Rector\Php73\Rector\FuncCall\JsonThrowOnErrorRector;
use Rector\Php81\Rector\Array_\ArrayToFirstClassCallableRector;
use Rector\Php82\Rector\Param\AddSensitiveParameterAttributeRector;
use Rector\Php84\Rector\Class_\PropertyHookRector;
use Rector\PHPUnit\CodeQuality\Rector\Class_\PreferTestsWithCamelCaseRector;
use Rector\PHPUnit\PHPUnit100\Rector\Class_\RemoveNamedArgsInDataProviderRector;
use Rector\PHPUnit\PHPUnit120\Rector\MethodCall\ExplicitMockExpectsCallRector;
use RectorLaravel\Rector\Class_\AddHasFactoryToModelsRector;
use RectorLaravel\Rector\ClassMethod\MakeModelAttributesAndScopesProtectedRector;
use RectorLaravel\Rector\FuncCall\ConfigToTypedConfigMethodCallRector;
use RectorLaravel\Rector\FuncCall\DispatchNonShouldQueueToDispatchSyncRector;
use RectorLaravel\Rector\MethodCall\ReplaceServiceContainerCallArgRector;
use RectorLaravel\Rector\MethodCall\UseComponentPropertyWithinCommandsRector;
use RectorLaravel\Rector\MethodCall\WhereToWhereLikeRector;
use RectorLaravel\Rector\PropertyFetch\ReplaceFakerInstanceWithHelperRector;
use RectorLaravel\Set\LaravelSetList;

/**
 * Composable Rector presets.
 *
 * Rector configuration is PHP, so unlike Pint it needs no copying and no discovery mechanism: a
 * consumer's `rector.php` calls one of these and then adds its own paths and skips.
 *
 * ```php
 * use Matchory\CodingStyle\Rector\Preset;
 * use Rector\Config\RectorConfig;
 *
 * return Preset::laravel(RectorConfig::configure())
 *     ->withPaths([__DIR__ . '/app', __DIR__ . '/tests'])
 *     ->withSkip([SomeRector::class => [__DIR__ . '/app/Legacy']]);
 * ```
 *
 * `withPaths()`, `withSkip()`, `withRules()` and `withSets()` all merge rather than replace, so
 * calls made after a preset add to it instead of overwriting it.
 *
 * Framework rule sets are applied only when the package that provides them is installed, so the
 * same preset works in a repository that has `driftingly/rector-laravel` and one that does not.
 * Nothing here declares paths: those are the one part of a Rector config that is irreducibly local.
 */
final class Preset
{
    /**
     * Presets already applied to a given builder, keyed by object id.
     *
     * `RectorConfigBuilder::withPhpSets()` throws when called twice, so applying a preset twice to
     * the same builder is fatal. That is easy to do by accident, because the presets build on one
     * another: `Preset::laravel(Preset::base($config))` reaches `base()` twice. Tracking what has
     * been applied makes the second call a no-op instead of an error.
     *
     * The builder methods all return `$this`, so the object identity is stable across a chain.
     *
     * @var array<int, list<string>>
     */
    private static array $applied = [];

    /**
     * Language-level rules that apply to any PHP codebase.
     *
     * PHP version sets are resolved from the consuming project's own `composer.json` constraint, so
     * this preset does not pin a target version.
     */
    public static function base(RectorConfigBuilder $config): RectorConfigBuilder
    {
        if (self::isApplied($config, __FUNCTION__)) {
            return $config;
        }

        $config = $config
            ->withParallel()
            ->withPhpSets()
            ->withImportNames(
                importNames: true,
                importDocBlockNames: true,
                importShortClasses: true,
                removeUnusedImports: true,
            )
            ->withPreparedSets(
                deadCode: true,
                codeQuality: true,
                codingStyle: true,
                typeDeclarations: true,
                privatization: true,
                naming: false,
                namedArgs: false,
                instanceOf: false,
                earlyReturn: true,
            )
            ->withRules([
                JsonThrowOnErrorRector::class,
                AddSensitiveParameterAttributeRector::class,
                PropertyHookRector::class,
            ]);

        // ExplicitBoolCompareRector and ObjectExplicitBoolCompareRector need no entry here: both ship
        // only in the strict-booleans set, which is not enabled above (and is deprecated upstream), so
        // skipping them is dead configuration that Rector warns about.
        return $config->withSkip([
            // Rewrites isset($model->foo) to property_exists($model, 'foo') && …, which is wrong for
            // every object with magic properties. Eloquent attributes live in $attributes, not as
            // declared properties: isset() routes through __isset() and is true, while
            // property_exists() is false.
            IssetOnPropertyObjectToPropertyExistsRector::class,

            EncapsedStringsToSprintfRector::class,
            CatchExceptionNameMatchingTypeRector::class,
            FlipTypeControlToUseExclusiveTypeRector::class,
        ]);
    }

    /**
     * {@see self::base()} plus PHPUnit and, when installed, Pest.
     *
     * Use for composer packages and any non-Laravel PHP project.
     */
    public static function library(RectorConfigBuilder $config): RectorConfigBuilder
    {
        $config = self::base($config);

        if (self::isApplied($config, __FUNCTION__)) {
            return $config;
        }

        $config = $config
            ->withAttributesSets(phpunit: true)
            ->withComposerBased(phpunit: true)
            ->withPreparedSets(phpunitCodeQuality: true)
            ->withRules([
                ExplicitMockExpectsCallRector::class,
                RemoveNamedArgsInDataProviderRector::class,
                PreferTestsWithCamelCaseRector::class,
            ]);

        return self::pest($config);
    }

    /**
     * {@see self::library()} plus Laravel rule sets, when `driftingly/rector-laravel` is installed.
     */
    public static function laravel(RectorConfigBuilder $config): RectorConfigBuilder
    {
        $config = self::library($config);

        if (self::isApplied($config, __FUNCTION__) || ! self::has(LaravelSetList::class)) {
            return $config;
        }

        // `pestphp/pest-plugin-rector` has no Laravel-flavoured set, unlike the abandoned
        // `mrpunyapal/rector-pest` it replaced. Nothing to add here beyond what pest() already did.
        return $config
            ->withComposerBased(laravel: true)
            ->withSets([
                LaravelSetList::LARAVEL_CODE_QUALITY,
                LaravelSetList::LARAVEL_COLLECTION,
                LaravelSetList::LARAVEL_TYPE_DECLARATIONS,
                LaravelSetList::LARAVEL_TESTING,
                LaravelSetList::LARAVEL_ELOQUENT_MAGIC_METHOD_TO_QUERY_BUILDER,
                LaravelSetList::LARAVEL_FACTORIES,
                LaravelSetList::LARAVEL_LEGACY_FACTORIES_TO_CLASSES,
                LaravelSetList::LARAVEL_ARRAYACCESS_TO_METHOD_CALL,
                LaravelSetList::LARAVEL_CONTAINER_STRING_TO_FULLY_QUALIFIED_NAME,
                LaravelSetList::LARAVEL_FACADE_ALIASES_TO_FULL_NAMES,
            ])
            ->withRules([
                // Replace $this->faker with the fake() helper function in factories.
                ReplaceFakerInstanceWithHelperRector::class,
                ReplaceServiceContainerCallArgRector::class,
                UseComponentPropertyWithinCommandsRector::class,
                WhereToWhereLikeRector::class,
                ConfigToTypedConfigMethodCallRector::class,
            ])
            ->withSkip([
                // Flips public model accessors and scopes to protected. Visibility changes on models
                // break Nova, serialization, and dynamic calls in ways a test suite does not
                // necessarily cover.
                MakeModelAttributesAndScopesProtectedRector::class,

                // Adds `use HasFactory` to every Eloquent model, whether a factory exists for it or
                // not.
                AddHasFactoryToModelsRector::class,

                // Infers "not ShouldQueue" from the declared type, which misses jobs built via
                // factories that return an interface while the concrete class IS ShouldQueue.
                // Rewriting dispatch() to dispatch_sync() there turns an async job synchronous, and
                // tests cannot catch it because they fake the queue.
                //
                // Rector reports this skip as unregistered in THIS repository, because the Laravel
                // version sets it belongs to resolve to nothing without Laravel installed. It does
                // register in a real consumer. Do not delete it to silence the warning.
                DispatchNonShouldQueueToDispatchSyncRector::class,

                // Converts route handlers [Handler::class, 'method'] into a closure
                // fn() => new Handler()->method(), which breaks route caching. The same applies to
                // config/, which has to stay serialisable for `php artisan config:cache`.
                ArrayToFirstClassCallableRector::class => [
                    '*/routes/*',
                    '*/config/*',
                    '*/app/Providers/*',
                ],
            ]);
    }

    /**
     * Pest rules, when `pestphp/pest-plugin-rector` is installed.
     *
     * Applied by {@see self::library()} and {@see self::laravel()}; call it directly only for a
     * project that uses Pest without either.
     *
     * `PestSetList::CODING_STYLE` is deliberately NOT imported. It bundles 59 rules, and among them
     * are the chain-manipulating kind (`ChainExpectCallsRector`, `EnsureTypeChecksFirstRector`) that
     * corrupted chained expectations under the package this replaced, plus one-shot Pest 2 to Pest 3
     * migration rules that have no business running on every pass. Only individually vetted rules are
     * enabled below.
     *
     * A repository that wants the full set can opt in locally, and should review the diff carefully:
     *
     * ```php
     * use Pest\Rector\Set\PestSetList;
     *
     * return Preset::laravel(RectorConfig::configure())
     *     ->withSets([PestSetList::CODING_STYLE]);
     * ```
     */
    public static function pest(RectorConfigBuilder $config): RectorConfigBuilder
    {
        if (
            self::isApplied($config, __FUNCTION__)
            || ! self::has(SimplifyToLiteralBooleanRector::class)
        ) {
            return $config;
        }

        return $config
            ->withRules([
                SimplifyToLiteralBooleanRector::class,
                SimplifyToBeTruthyFalsyRector::class,
                UseEachModifierRector::class,
                UseToBeFileRector::class,
                UseToBeInRector::class,
                UseToBeListRector::class,
                UseToContainOnlyInstancesOfRector::class,
                UseToHaveKeysRector::class,
            ]);
    }

    /**
     * Whether an optional rule provider is installed.
     *
     * A missing provider downgrades the preset instead of failing: these repositories are a mix of
     * Laravel applications, composer packages and plain scripts, and a shared preset that fataled on
     * the ones without Laravel would just get copy-pasted instead of installed.
     */
    private static function has(string $probeClass): bool
    {
        return class_exists($probeClass);
    }

    /**
     * Whether a preset has already been applied to this builder, recording it if not.
     *
     * @see self::$applied
     */
    private static function isApplied(RectorConfigBuilder $config, string $preset): bool
    {
        $id = spl_object_id($config);

        if (in_array($preset, self::$applied[$id] ?? [], true)) {
            return true;
        }

        self::$applied[$id][] = $preset;

        return false;
    }
}
