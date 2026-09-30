#!/usr/bin/env bash
# Import a ZITADEL release into this slim fork as refs/tags/upstream/<tag>.
#
# The release history is rewritten with git filter-repo so that only the Login
# app and the sources it builds from remain. The filter must stay identical for
# every import: the same upstream commit then always maps to the same slim
# commit, and later releases merge cleanly on top of earlier ones. Changing
# .vern/slim-paths rewrites every hash and breaks those merges.
#
# Usage: scripts/filter-upstream.sh <tag> [<source-repository>]
#   <source-repository> defaults to https://github.com/zitadel/zitadel.git.

set -euo pipefail

tag="${1:?Usage: scripts/filter-upstream.sh <tag> [<source-repository>]}"
source_repo="${2:-https://github.com/zitadel/zitadel.git}"
root="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel)"

if ! git filter-repo --version >/dev/null 2>&1; then
  echo "git filter-repo is required: https://github.com/newren/git-filter-repo" >&2
  exit 1
fi

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

git init --quiet --bare "$work/upstream.git"
git -C "$work/upstream.git" fetch --quiet --no-tags "$source_repo" "refs/tags/${tag}:refs/tags/${tag}"
# Filter a plain branch so annotated and lightweight tags import the same way.
commit="$(git -C "$work/upstream.git" rev-parse "refs/tags/${tag}^{commit}")"
git -C "$work/upstream.git" update-ref refs/heads/upstream "$commit"
git -C "$work/upstream.git" update-ref -d "refs/tags/${tag}"

filter_args=()
while IFS= read -r arg; do
  filter_args+=("$arg")
done < <(grep -Ev '^[[:space:]]*(#|$)' "$root/.vern/slim-paths")
(cd "$work/upstream.git" && git filter-repo --quiet --force "${filter_args[@]}")

git -C "$root" fetch --quiet --no-tags "$work/upstream.git" "+refs/heads/upstream:refs/tags/upstream/${tag}"
echo "upstream/${tag} -> $(git -C "$root" rev-parse "refs/tags/upstream/${tag}")"
