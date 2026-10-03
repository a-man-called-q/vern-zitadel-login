# Vern ZITADEL Login

The [ZITADEL](https://github.com/zitadel/zitadel) Login App (Login V2) with the
[Vern](https://github.com/a-man-called-q/vern) sign-in shell. It publishes the
image that Vern's local auth stack runs:

```
ghcr.io/a-man-called-q/vern-zitadel-login:<zitadel-version>-<commit-sha>
```

A fork publishes under its own name instead; see
[Publish an image from your fork](#publish-an-image-from-your-fork).

This is a slim fork: its history is ZITADEL's history filtered to the Login App
and the sources it builds from (`apps/login`, `packages/`, `proto/` and the root
files), following ZITADEL's
[fork and deploy guide](https://zitadel.com/docs/guides/integrate/login-ui/fork-and-deploy-login-app).
Upstream releases merge in as regular merges, so Vern's changes stay on top.

## What Vern changes

- **Sign-in shell** (`src/components/dynamic-theme.tsx`, `src/styles/globals.scss`):
  a full-height split screen with an art panel on the left and the form on the
  right. Every ZITADEL step renders inside it unchanged. The art panel is a slot
  filled in code (`src/components/vern-auth-aside.tsx`); below the `lg`
  breakpoint it is hidden and the logo moves above the form. Each step's
  primary button fills the width, with Back as a text link below it.
- **Username step** (`src/app/(login)/loginname/page.tsx`, `username-form.tsx`,
  `sign-in-with-idp.tsx`): identity providers above the form, with a divider;
  a user icon in the field (`input.tsx` takes an `icon`) and the English copy
  in `locales/en.json`.
- **Back button** (`back-button.tsx`): hidden when the tab has no page to go
  back to, such as a login opened from a bookmark.
- **Language switcher** (`language-switcher.tsx`): a globe icon.
- **Runtime brand** (`src/lib/vern-brand*.ts`, `vern-brand-provider.tsx`): the
  shell's logo and favicon come from a JSON file, so one image serves any brand.
- **Accent colors** follow the ZITADEL branding settings (primary color, logo,
  font) instead of a fixed palette.
- A Playwright check for the desktop and mobile layouts
  (`acceptance/tests/vern-login.spec.ts`).

## Brand file

Point `VERN_BRAND_FILE` at a JSON file mounted into the container. Every field
is optional; missing or invalid fields keep the built-in Vern values and are
logged. The file is re-read when it changes, without a restart.

```json
{
  "logo": { "light": "/brand/logo-light.svg", "dark": "/brand/logo-dark.svg" },
  "favicon": "/brand/favicon.svg"
}
```

- The art panel shows `logo.dark` in both themes, since its image stays dark.
  Its image and text are not part of the brand file: edit
  `src/components/vern-auth-aside.tsx` and rebuild the image to change them.
- Fields of older brand files (`headline`, `description`, `highlights`,
  `backdrop`) are ignored, so an existing file still loads.
- Image paths must be absolute paths on the login's own origin: the Login App's
  Content Security Policy blocks images from other hosts. Vern serves them from
  `/brand/` through its proxy.
- A logo uploaded in the ZITADEL branding settings replaces the brand file's
  logo for that organization.

## Develop

Requirements: Node.js (see `.nvmrc`), pnpm through Corepack, and Docker.

```sh
corepack enable
pnpm install --frozen-lockfile --filter @zitadel/login...
```

Build the image the way CI publishes it (the build runs inside Docker), then
start a local ZITADEL with it:

```sh
docker build -f .vern/login.Dockerfile -t vern-zitadel-login:local .
ZITADEL_VERSION="$(cat .vern/UPSTREAM_VERSION)" \
ZITADEL_LOGIN_IMAGE=vern-zitadel-login:local \
docker compose -f dev/compose.yml up -d --wait
```

The Login is at <http://localhost:8081/ui/v2/login/> and the Console at
<http://localhost:8081/ui/console/> (`zitadel-admin` / `Password1!`). To run the
Next.js dev server against it, copy the login client token out of the stack and
create `apps/login/.env.dev.local`, as the upstream guide describes:

```sh
docker compose -f dev/compose.yml cp zitadel-api:/zitadel/bootstrap/login-client.pat /tmp/login-client.pat
printf 'ZITADEL_API_URL=http://localhost:8081\nZITADEL_SERVICE_USER_TOKEN=%s\n' "$(cat /tmp/login-client.pat)" > apps/login/.env.dev.local
pnpm nx run @zitadel/login:dev
```

Checks, as CI runs them:

```sh
pnpm exec nx run @zitadel/login:build
pnpm exec nx run @zitadel/login:lint
pnpm exec nx run @zitadel/login:test-unit
dev/test-login.sh
```

`dev/test-login.sh` needs only Docker: it builds the image, starts
`dev/compose.yml` as an isolated project, and runs the Vern Playwright checks
from a container on that project's network.

## Publish an image from your fork

The **Publish Login image** workflow builds the image from `main` and pushes it
to the GitHub Container Registry under the repository's own name, so a fork
publishes to its own namespace:

```
ghcr.io/<owner>/<repository>:<zitadel-version>-<commit-sha>
```

1. Open the **Actions** tab of your fork and enable workflows; GitHub turns them
   off in forks.
2. Run **Publish Login image** once by hand (**Run workflow**). After that it runs
   on pushes to `main` that touch the Login App. A commit is published once: its
   tag is immutable.
3. GHCR creates the package private. Make it public (**Package settings → Change
   visibility**), or run `docker login ghcr.io` wherever the stack runs.
4. In your Vern project, set `ZITADEL_LOGIN_IMAGE` in `apps/auth-server/.env` to
   the published tag, and keep `ZITADEL_VERSION` equal to `.vern/UPSTREAM_VERSION`.

## Update to a new ZITADEL release

The **ZITADEL upstream sync** workflow runs weekly. For a new stable release it
imports the filtered release as the tag `upstream/<version>`, merges it into a
branch, opens a pull request and runs the checks on it. It uses the workflow's
own token, so the repository must allow GitHub Actions to create pull requests
(**Settings → Actions → General → Workflow permissions**). Run it by hand with a
`version` input to sync a specific release.

To do the same by hand:

```sh
scripts/filter-upstream.sh v4.20.0
git switch -c sync/zitadel-v4.20.0
git merge --no-ff upstream/v4.20.0
echo v4.20.0 > .vern/UPSTREAM_VERSION
git commit -am "chore: record ZITADEL v4.20.0 baseline"
git push origin refs/tags/upstream/v4.20.0 sync/zitadel-v4.20.0
```

The import must map the same upstream commit to the same slim commit every
time, or merges pull in unrelated history. So:

- Use git-filter-repo **2.47.0** (`pipx install git-filter-repo==2.47.0` or
  `brew install git-filter-repo`).
- Never change `.vern/slim-paths`. The workflow re-imports the current release
  first and stops if the hash changed.

## Publish

Every push to `main` that touches the Login sources builds a multi-platform
image tagged `<zitadel-version>-<commit-sha>`. Tags are never overwritten. The
run summary shows the two lines to set in Vern's `apps/auth-server/.env.example`
and `deploy/.env.example`;
change `ZITADEL_VERSION` and `ZITADEL_LOGIN_IMAGE` together, since the backend
and the Login App must run the same release.

## License

This repository keeps ZITADEL's licensing unchanged: the repository is
[AGPL-3.0-only](../LICENSE), with the exceptions in [LICENSING.md](../LICENSING.md)
(`apps/login` and `packages/zitadel-*` are MIT, `proto/` is Apache-2.0). Vern's
changes to `apps/login` are MIT, like the rest of that directory.
