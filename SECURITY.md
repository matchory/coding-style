# Security

This package is a dependency of every Matchory repository, in three ecosystems. That makes it a
high-value target: a malicious version would execute inside our CI and on developer machines. The
controls below exist to make a compromise require more than one stolen credential.

## Reporting a vulnerability

Report privately through [GitHub Security
Advisories](https://github.com/matchory/coding-style/security/advisories/new), or email
security@matchory.com. Please do not open a public issue.

We aim to acknowledge within two business days.

## Verifying what you installed

Every published artefact carries provenance tying it to a specific commit and workflow run in this
repository.

**npm** — published with [npm provenance](https://docs.npmjs.com/generating-provenance-statements).
The package page shows a "Built and signed on GitHub Actions" badge, and:

```bash
npm audit signatures
```

**PyPI** — published with [PEP 740](https://peps.python.org/pep-0740/) attestations, visible under
the file's details on PyPI.

**GitHub artefact attestations** — both the npm tarball and the Python distributions are attested and
attached to the release:

```bash
gh attestation verify <file> --repo matchory/coding-style
```

**Composer** — Packagist serves this repository's git tags directly and builds no artefact, so there
is nothing to attest and no provenance mechanism to use. Composer has no equivalent of npm provenance.
What you can verify is the tag itself:

```bash
git verify-tag v1.2.3
```

Its integrity rests on this repository's protections rather than on a signed artefact. That is a real
asymmetry, and worth knowing when reasoning about the PHP package.

## How releases are protected

The publish path is `.github/workflows/release.yml`. Every property below is enforced by the workflow
or by repository configuration, not by convention.

| Control | What it prevents |
|---|---|
| **No registry credentials at all.** npm and PyPI both authenticate via OIDC trusted publishing. npm's package-creation problem was solved with a deprecated placeholder rather than a CI token. | There is no token in this repository or its secrets to steal, at any point in its history. |
| **`release` environment, restricted to `v*` tags.** | A workflow run from a branch or pull request cannot obtain an OIDC token whose environment claim the registries accept. |
| **`release` environment requires a human approval.** | An automated or accidental tag push cannot publish unattended. |
| **Signed, annotated tags only.** The workflow rejects a lightweight tag and asks GitHub whether the signature verifies. | An attacker with push access but no signing key cannot trigger a release. |
| **Tag must be an ancestor of `main`.** | Publishing from an unreviewed side branch. |
| **CI must have passed for the tagged commit.** | Publishing a commit whose tests and analysis never ran. |
| **Build once, attest, publish that artefact.** Publish jobs download the built artefact and verify its SHA-256 before uploading. | A compromised publish step substituting different content for what was attested. |
| **`permissions: {}` at workflow level.** Only the two publish jobs receive `id-token: write`; nothing receives `contents: write` except the release-notes job. | A compromised build step writing to the repository or minting an identity token. |
| **All actions pinned to full commit SHAs**, enforced by a CI job that fails on any unpinned `uses:`. | An action author moving a tag to different code that then runs with our token. |
| **No third-party actions in the publish path.** Only `actions/*` and `pypa/*`. | Widening the trusted set on the most sensitive job. |
| **`persist-credentials: false` on every checkout.** | A later step, or a dependency's build script, reusing the job token. |
| **`--ignore-scripts` when installing to build.** | A dependency lifecycle hook executing on the machine that produces a published artefact. |
| **Lockfile enforced** (`--frozen-lockfile`). | A resolution change slipping in between review and release. |
| **Version agreement checked** across all three manifests and the tag. | Publishing artefacts nobody can correlate across ecosystems. |
| **`--registry` pinned on the publish command.** | An ambient `.npmrc` redirecting a provenance-signed release to another registry. `publishConfig.registry` does *not* beat an `@scope:registry` entry, and npm's provenance code does not validate the destination registry. |
| **dist-tag derived from the version.** A prerelease publishes to `rc`/`beta`/`next`, never `latest`. | A prerelease silently becoming the default install for every consumer. |

## Repository configuration

Enforced through GitHub settings rather than files:

- `main` is protected and requires a pull request with review (organisation ruleset).
- Signed commits are required (organisation ruleset).
- The default `GITHUB_TOKEN` permission is **read**, and Actions may not approve pull requests.
- Dependabot security updates are enabled. Version updates are Renovate's job — see the README for
  why running both would duplicate every bump.
- CodeQL runs on the JavaScript, Python and Actions sources. It has no PHP analyser; PHPStan covers the
  PHP presets in `ci.yml`.
- Dependency review blocks pull requests introducing advisories or copyleft licences incompatible with
  shipping MIT.
- OpenSSF Scorecard runs weekly and publishes its result.

### Consuming a compromised upstream

The Renovate presets set a repository-wide `minimumReleaseAge` cooldown, so a dependency version stays
unadopted for several days after publication. Most malicious npm and PyPI releases in recent memory
were detected and yanked within hours; a cooldown converts that class of attack into a non-event
without needing anyone to be paying attention at the right moment.

Linters and formatters additionally never automerge, at any update type.

## Known gaps

Stated explicitly rather than left for someone to discover:

- **Composer has no artefact provenance.** See above. The mitigation is repository protection plus
  signed tags.
- **`@matchory/coding-style@0.0.0` was published from a maintainer machine and has no provenance.** npm
  cannot configure a trusted publisher for a package that does not exist, so something had to be
  published first. The placeholder contains only a README and the licence, is deprecated, and is not
  under the `latest` dist-tag. Every version anyone would actually install is published through OIDC
  with provenance. No npm token has ever been stored in this repository.
- **A single maintainer can both author and approve a release.** `prevent_self_review` is off on the
  `release` environment because the team is small enough that enabling it would block releases
  entirely. Adding a second reviewer is the fix, and is a people problem rather than a configuration
  one.
- **Secret scanning is currently disabled** by an organisation-level security configuration, which a
  repository administrator cannot override. It is free for public repositories and should be enabled
  org-wide.
- **Immutable releases** are not exposed through the REST API. A repository ruleset covers the
  important half: `refs/tags/v*` cannot be deleted, updated, force-pushed, or created unsigned, so a
  published version tag cannot be moved to different code. Confirm the GitHub-native setting in
  Settings → General as well, if it is available to the organisation.
- **The build/publish split is not npm's documented shape.** npm's recommended workflow publishes from
  the source directory in a single job; this one builds a tarball, attests it, and publishes that
  artefact from a separate job. The split was kept because it is what makes "publish cannot substitute
  content" true, and because it matches PyPA's recommendation for PyPI. It was verified against npm's
  implementation rather than assumed: `libnpmpublish` derives the provenance subject from the tarball's
  own integrity digest and the build metadata from GitHub Actions environment variables, so no source
  directory is required and provenance is generated identically either way.
- **No egress filtering on runners.** `step-security/harden-runner` is the usual recommendation and
  would detect a build step phoning home. It is deliberately absent: adding a third-party action to
  the publish path widens the trusted set on exactly the job where that matters most. Worth revisiting
  as a CI-only measure.

## One-time registry setup

Trusted publishing has to be configured on each registry before the first release. These cannot be
done from this repository.

### PyPI

PyPI supports *pending* publishers, so this works before the project exists:

1. https://pypi.org/manage/account/publishing/
2. Add a new pending publisher:
   - PyPI project name: `matchory-coding-style`
   - Owner: `matchory`
   - Repository: `coding-style`
   - Workflow: `release.yml`
   - Environment: `release`

### npm

npm cannot configure a trusted publisher for a package that does not exist, and offers no way to
reserve a name — there is no equivalent of PyPI's pending publishers. The package therefore has to
exist before OIDC can be used at all.

That gap is crossed with a **deprecated `0.0.0` placeholder**, published manually, so that no token
ever enters this repository and the first version anyone installs (`0.1.0`) is published entirely
through OIDC with provenance.

#### Step 1 — publish the placeholder

From a maintainer machine, `npm login` first: the `--registry` flag is required because an
`@matchory:registry` entry in a developer `.npmrc` points the scope at GitHub Packages and beats
`publishConfig.registry`.

```bash
npm login --registry https://registry.npmjs.org
```

Then publish a package containing nothing but a README and the licence, under a dist-tag that is not
`latest`:

```bash
npm publish --registry https://registry.npmjs.org --access public --tag placeholder
```

#### Step 2 — configure the trusted publisher

At `https://www.npmjs.com/package/@matchory/coding-style/access` — not the account-level packages page:

- Organisation/repository: `matchory/coding-style`
- Workflow: `release.yml`
- Environment: `release`

Then set **Publishing access** to *Require trusted publishing*, which disallows token-based publishing
outright, and enable **Require two-factor authentication** for the package.

#### Step 3 — release normally

Tag `v0.1.0`. The workflow sees that the package exists and that no `NPM_TOKEN` secret is set, so it
authenticates via OIDC. `0.1.0` becomes `latest`.

#### Step 4 — tidy up

```bash
npm deprecate @matchory/coding-style@0.0.0 "Placeholder with no contents; install 0.1.0 or later."
npm dist-tag rm @matchory/coding-style placeholder
```

#### The token path exists but is a fallback

`release.yml` still accepts an `NPM_TOKEN` secret on the `release` environment, for the case where a
future package has to be bootstrapped the other way. It is self-limiting: the workflow **refuses to
use a token once the package exists on npmjs**, so a bootstrap credential cannot quietly become
permanent. If you ever use it, make it a granular token scoped to `@matchory` with the shortest
available expiry, store it as an environment secret rather than a repository one, and delete it
immediately afterwards — the next release fails until you do.

### Packagist

1. Submit `https://github.com/matchory/coding-style` at https://packagist.org/packages/submit
2. Configure the GitHub service hook so tags are picked up automatically.
3. There is nothing further to harden on the Packagist side; see the Composer note above.
