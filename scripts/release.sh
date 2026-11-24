#!/usr/bin/env bash
set -euo pipefail

directory="${1:?Pass the verified release directory}"
assets=("${ASSET:?Missing GitHub archive name}" "${NPM_ASSET:?Missing npm archive name}")
download="$(mktemp -d)"
trap 'rm -rf "$download"' EXIT

source_commit() {
  local reference kind tagged comparison
  reference="$(gh api "repos/$GH_REPO/git/ref/tags/$REF" --jq '.object | [.type, .sha] | join(" ")')"
  read -r kind tagged <<< "$reference"
  if [[ "$kind" == tag ]]; then
    reference="$(gh api "repos/$GH_REPO/git/tags/$tagged" --jq '.object | [.type, .sha] | join(" ")')"
    read -r kind tagged <<< "$reference"
  fi
  [[ "$kind" == commit && "$tagged" == "$COMMIT" ]] || return 1
  comparison="$(gh api "repos/$GH_REPO/compare/$COMMIT...${BRANCH}?per_page=1" --jq .status)"
  [[ "$comparison" == identical || "$comparison" == ahead ]]
}

retry() {
  local count="$1" attempt
  shift
  for ((attempt = 1; attempt <= count; attempt++)); do
    if "$@"; then return 0; fi
    if ((attempt < count)); then sleep 2; fi
  done
  return 1
}

source_commit
for asset in "${assets[@]}"; do
  retry 5 gh attestation verify "$directory/$asset" --repo "$GH_REPO" \
    --signer-workflow "$GH_REPO/.github/workflows/ci.yml" --signer-digest "$COMMIT" \
    --source-digest "$COMMIT" --source-ref "refs/tags/$REF" --deny-self-hosted-runners
done

api="repos/$GH_REPO/releases"
release="$(gh api --paginate --slurp "$api?per_page=100" |
  jq -c --arg ref "$REF" '[.[][] | select(.tag_name == $ref)] | if length > 1 then error("Duplicate release") else .[0] end')"
if [[ "$release" == null ]]; then
  release="$(gh api --method POST "$api" -f tag_name="$REF" -f name="$REF" -F draft=true)"
fi
id="$(jq -er '.id | numbers' <<< "$release")"
draft="$(jq -r '.draft' <<< "$release")"
jq -e --arg tag "$REF" '.tag_name == $tag and (.draft | type == "boolean")' <<< "$release" > /dev/null

rows() {
  gh api --paginate --slurp "$api/$id/assets?per_page=100" | jq -c 'add // []'
}

for asset in "${assets[@]}"; do
  entry="$(rows | jq -c --arg name "$asset" '.[] | select(.name == $name)')"
  if [[ "$draft" == true && -n "$entry" ]] && jq -e '.state == "starter" and .size == 0' <<< "$entry" > /dev/null; then
    gh api --method DELETE "$api/assets/$(jq -er .id <<< "$entry")"
    entry=''
  fi
  if [[ -z "$entry" ]]; then
    [[ "$draft" == true ]]
    entry="$(curl --fail-with-body --silent --show-error --max-time 40 --request POST \
      --header "Authorization: Bearer $GH_TOKEN" --header 'Content-Type: application/gzip' \
      --data-binary "@$directory/$asset" "https://uploads.github.com/$api/$id/assets?name=$asset")"
  fi
  asset_id="$(jq -er --arg name "$asset" 'select(.name == $name and .state == "uploaded") | .id' <<< "$entry")"
  curl --fail --silent --show-error --location --max-time 40 --header "Authorization: Bearer $GH_TOKEN" \
    --header 'Accept: application/octet-stream' "https://api.github.com/$api/assets/$asset_id" --output "$download/$asset"
  cmp "$directory/$asset" "$download/$asset"
done

complete() {
  rows | jq -e --arg a "$ASSET" --arg b "$NPM_ASSET" 'map(.name) | sort == ([$a,$b] | sort)' > /dev/null
}
retry 5 complete
if [[ "$draft" == true ]]; then
  source_commit
  gh api --method PATCH "$api/$id" -F draft=false > /dev/null
fi

immutable() {
  gh api "$api/$id" | jq -e '.immutable == true and .draft == false' > /dev/null
}
retry 10 immutable
for asset in "${assets[@]}"; do
  retry 15 gh release verify-asset "$REF" "$directory/$asset" --repo "$GH_REPO"
done
source_commit
