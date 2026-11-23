#!/usr/bin/env bash
set -euo pipefail

archive="${1:?Pass an output tarball path}"
export LC_ALL=C

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

if [[ -e "$archive" ]]; then
  echo "Package output already exists" >&2
  exit 1
fi

tar -cf - -T "$staging/files" | tar -xf - -C "$staging"
cp pnpm-lock.yaml "$staging/"
pnpm_config_ignore_scripts=true pnpm --dir "$staging" pack --out "$staging/package.tgz" --silent

sed 's|^|package/|' "$staging/files" | sort > "$staging/expected"
tar -tzf "$staging/package.tgz" | sort > "$staging/actual"
diff -u "$staging/expected" "$staging/actual"
mv "$staging/package.tgz" "$archive"
