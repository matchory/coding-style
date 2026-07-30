<?php

declare(strict_types=1);

namespace Pest\Arch {

    class PendingArchExpectation {}
}

namespace Pest\Expectations {

    class EachExpectation {}

    class OppositeExpectation {}
}

namespace Pest\Mixins {

    use Pest\Expectation;
    use Pest\Expectations\OppositeExpectation;

    /**
     * @template-covariant TValue
     *
     * @property OppositeExpectation $not Creates the opposite expectation.
     *
     * @mixin Expectation<TValue>
     */
    class Expectation {}
}

namespace Pest {

    use Closure;
    use Pest\Arch\PendingArchExpectation;
    use Pest\Expectations\EachExpectation;
    use Pest\Expectations\OppositeExpectation;

    /**
     * @formatter:off
     *
     * @template TValue of mixed
     *
     * @property PendingArchExpectation $classes
     * @property EachExpectation        $each       Creates an expectation on each element on the traversable value.
     * @property PendingArchExpectation $enums
     * @property PendingArchExpectation $interfaces
     * @property OppositeExpectation    $not        Creates the opposite expectation.
     * @property PendingArchExpectation $traits
     *
     * @mixin \Pest\Mixins\Expectation<TValue>
     * @mixin TValue
     * @mixin PendingArchExpectation
     *
     * @formatter:on
     */
    class Expectation
    {
        /**
         * @param Closure(mixed $value): Expectation<TValue> $extend
         *
         * @param-closure-this static                        $extend
         */
        public function extend(string $name, Closure $extend): void {}

        /**
         * Creates a new expectation.
         *
         * @template TAndValue
         *
         * @param TAndValue $value
         *
         * @return Expectation<TAndValue>
         */
        public function and(mixed $value): Expectation {}
    }
}

namespace Illuminate\Testing {

    use Pest\Expectation;

    /**
     * @phpstan-ignore
     *
     * @formatter:off
     *
     * @method Expectation<covariant TestResponse> toHaveStatus(int $status)
     * @method Expectation<covariant TestResponse> toBeRedirectedTo(string $urlFragment)
     * @method Expectation<covariant TestResponse> toHaveJsonStructure(array<array-key, covariant mixed> $structure)
     * @method Expectation<covariant TestResponse> toHaveJsonFragment(array<array-key, covariant mixed> $fragment)
     * @method Expectation<covariant TestResponse> toBeJsonError()
     * @method Expectation<covariant TestResponse> toBeJsonErrorWithType(string $error)
     * @method Expectation<covariant TestResponse> toBeJsonErrorWithMessage(string $message)
     * @method Expectation<covariant TestResponse> toHaveValidationErrors(array<array-key, covariant mixed> $fields)
     * @method Expectation<covariant TestResponse> toBeApiResource()
     * @method Expectation<covariant TestResponse> toBeApiResourceWithId(string $id)
     * @method Expectation<covariant TestResponse> toBeApiResourceWithType(string $type)
     * @method Expectation<covariant TestResponse> toBeApiResourceWithAttributes(array<array-key, covariant mixed> $attributes)
     * @method Expectation<covariant TestResponse> toBeApiResourceWithMeta(array<array-key, covariant mixed> $meta)
     * @method Expectation<covariant TestResponse> toBeApiResourceAndHaveAttributes(array<array-key, covariant mixed> $attributes)
     * @method Expectation<covariant TestResponse> toBeApiResourceWithRelationships(array<array-key, covariant mixed> $attributes)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollection()
     * @method Expectation<covariant TestResponse> toBeEmptyApiResourceCollection()
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionOfLength(int $length)
     * @method Expectation<covariant TestResponse> toBeOrderedApiResourceCollectionWithIds(array<array-key, covariant mixed> $ids)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionWithIds(array<array-key, covariant mixed> $ids)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionWithTypes(array<array-key, covariant mixed>|string $typesPerId)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionWithAttributes(array<array-key, covariant mixed> $attributesPerId)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionWithMeta(array<array-key, covariant mixed> $metasPerId)
     * @method Expectation<covariant TestResponse> toBeApiResourceCollectionWithRelationships(array<array-key, covariant mixed> $relationshipsPerId)
     * @method Expectation<covariant TestResponse> toHaveApiResourceCollectionMeta(array<array-key, covariant mixed> $meta)
     * @method Expectation<covariant TestResponse> toIncludeApiResources()
     * @method Expectation<covariant TestResponse> toIncludeApiResourcesWithIds(array<array-key, covariant mixed> $ids)
     * @method Expectation<covariant TestResponse> toIncludeApiResourcesWithTypes(array<array-key, covariant mixed> $typesPerId)
     * @method Expectation<covariant TestResponse> toIncludeApiResourcesWithAttributes(array<array-key, covariant mixed> $attributesPerId)
     * @method Expectation<covariant TestResponse> toIncludeApiResourcesWithMeta(array<array-key, covariant mixed> $metaPerId)
     * @method Expectation<covariant TestResponse> toIncludeApiResourcesWithCanonicalMeta(string $key, array<array-key, covariant mixed> $valuesPerId)
     * @method Expectation<covariant TestResponse> toBeResponseWithToken()
     * @method Expectation<covariant TestResponse> toHaveClaimInToken(string $key, mixed $value)
     * @method Expectation<covariant TestResponse> toHaveAudienceInToken(string $value)
     * @method Expectation<covariant TestResponse> toHaveSubjectInToken(string $value)
     * @method Expectation<covariant TestResponse> toHaveActorSubjectInToken(string $value)
     * @method Expectation<covariant TestResponse> toHaveExactScopesInToken(array<array-key, covariant mixed> $scopes)
     * @method Expectation<covariant TestResponse> toHaveScopesInToken(array<array-key, covariant mixed> $scopes)
     * @method Expectation<covariant TestResponse> toNotHaveAnyScopesInToken(array<array-key, covariant mixed> $scopes)
     *
     * @formatter:on
     */
    class TestResponse
    {
        public function getStatusCode(): int {}
    }
}
