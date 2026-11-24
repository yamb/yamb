#!/usr/bin/env bash
set -euo pipefail

output="${1:?Pass an output directory}"
export LC_ALL=C
mkdir -p "$output"
output="$(cd "$output" && pwd)"

staging="$(mktemp -d)"
trap 'rm -rf "$staging"' EXIT

git ls-files -- LICENSE package.json ':(glob)src/**/*.js' > "$staging/files"
test -s "$staging/files"
while IFS= read -r file; do
  if [[ ! -f "$file" || -L "$file" ]]; then
    echo "Unexpected package input: $file" >&2
    exit 1
  fi
done < "$staging/files"

for file in LICENSE package.json src/index.js; do
  grep -Fxq "$file" "$staging/files"
done

version="$(jq -er '.version' package.json)"
jq -e '.name == "yamb"' package.json > /dev/null

mkdir "$staging/package"
tar -cf - -T "$staging/files" | tar -xf - -C "$staging/package"
cp pnpm-lock.yaml "$staging/package/"
sed 's|^|package/|' "$staging/files" | sort > "$staging/expected"

pack() {
  local archive="$output/$1-$version.tgz"

  if [[ -e "$archive" ]]; then
    echo "Package output already exists" >&2
    exit 1
  fi

  pnpm_config_ignore_scripts=true pnpm --dir "$staging/package" pack --out "$staging/result.tgz" --silent
  tar -tzf "$staging/result.tgz" | sort > "$staging/actual"
  diff -u "$staging/expected" "$staging/actual"
  mv "$staging/result.tgz" "$archive"
}

pack npm-yamb

jq '.name = "@yamb/core" | .publishConfig.registry = "https://npm.pkg.github.com/"' \
  package.json > "$staging/package/package.json"
pack yamb-core
