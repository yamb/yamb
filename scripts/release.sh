#!/usr/bin/env bash
set -euo pipefail

archive="${1:?Pass the verified tarball path}"
asset="${archive##*/}"

check_source() {
  local reference tagged kind comparison
  reference="$(gh api "repos/$GH_REPO/git/ref/tags/$REF" --jq '.object | [.type, .sha] | join(" ")')"
  read -r kind tagged <<< "$reference"
  if [[ "$kind" == tag && "$tagged" =~ ^[a-f0-9]{40}$ ]]; then
    reference="$(gh api "repos/$GH_REPO/git/tags/$tagged" --jq '.object | [.type, .sha] | join(" ")')"
    read -r kind tagged <<< "$reference"
  fi
  if [[ "$kind" != commit || "$tagged" != "$COMMIT" ]]; then
    echo "::error::The release tag does not resolve to the checked commit"
    exit 1
  fi

  comparison="$(gh api "repos/$GH_REPO/compare/$COMMIT...${BRANCH}?per_page=1" --jq .status)"
  if [[ "$comparison" != identical && "$comparison" != ahead ]]; then
    echo "::error::The checked commit is outside the protected branch"
    exit 1
  fi
}

check_source
for attempt in {1..5}; do
  if gh attestation verify "$archive" --repo "$GH_REPO" --signer-workflow "$GH_REPO/.github/workflows/ci.yml" \
    --signer-digest "$COMMIT" --source-digest "$COMMIT" --source-ref "refs/tags/$REF" \
    --deny-self-hosted-runners; then
    break
  fi
  if [[ "$attempt" -eq 5 ]]; then
    echo "::error::The archive lacks provenance from the expected workflow and commit"
    exit 1
  fi
  sleep 2
done

releases() {
  gh api --paginate --slurp "repos/$GH_REPO/releases?per_page=100" |
    jq -c --arg ref "$REF" '[.[][] | select(.tag_name == $ref)] |
      if length > 1 then error("Multiple releases for tag") else .[0] end'
}

release="$(releases)"
if [[ "$release" == null ]]; then
  gh release create "$REF" --verify-tag --draft --title "$REF" --notes ""
  release="$(releases)"
fi

draft="$(jq -er '.draft | tostring' <<< "$release")"
if [[ "$draft" == true ]]; then
  starter="$(jq -r --arg asset "$asset" '
    .assets | if length == 1 and .[0].name == $asset and .[0].state == "starter" and .[0].size == 0
    then .[0].id else empty end' <<< "$release")"
  if [[ "$starter" =~ ^[0-9]+$ ]]; then
    gh api --method DELETE "repos/$GH_REPO/releases/assets/$starter"
    release="$(releases)"
  fi
fi
assets="$(jq -ec '.assets | map(.name)' <<< "$release")"
if [[ "$assets" == '[]' && "$draft" == true ]]; then
  gh release upload "$REF" "$archive"
  release="$(releases)"
fi
jq -e --arg asset "$asset" '.assets | length == 1 and .[0].name == $asset and .[0].state == "uploaded"' \
  <<< "$release" > /dev/null

download="$(mktemp -d)"
trap 'rm -rf "$download"' EXIT
gh release download "$REF" --pattern "$asset" --dir "$download"
cmp "$archive" "$download/$asset"

if [[ "$draft" == true ]]; then
  check_source
  gh release edit "$REF" --draft=false
fi

test "$(gh release view "$REF" --json isImmutable --jq .isImmutable)" = true
for attempt in {1..15}; do
  if gh release verify-asset "$REF" "$archive"; then
    check_source
    exit 0
  fi
  if [[ "$attempt" -lt 15 ]]; then
    sleep 2
  fi
done
echo "::error::The immutable release attestation could not be verified"
exit 1
