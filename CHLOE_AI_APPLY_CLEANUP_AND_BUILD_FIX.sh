#!/usr/bin/env bash
set -euo pipefail

# Run this script from a local clone of Chloe-final-version.
# It keeps local data files on disk but removes them from Git tracking.

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "ERROR: lance ce script depuis un clone Git du dépôt CHLOÉ AI." >&2
  exit 1
}
cd "$ROOT"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PATCH_FILE="${1:-$SCRIPT_DIR/CHLOE_AI_BUILD_FIX.patch}"

if [[ ! -f "$PATCH_FILE" ]]; then
  echo "ERROR: patch introuvable: $PATCH_FILE" >&2
  echo "Place CHLOE_AI_BUILD_FIX.patch à côté de ce script ou passe son chemin en argument." >&2
  exit 1
fi

# Refuse to overwrite unrelated local edits in the files targeted by the patch.
if ! git apply --check "$PATCH_FILE"; then
  echo "ERROR: le patch ne correspond pas exactement à cette version du dépôt." >&2
  echo "Mets d'abord main à jour et examine tes modifications locales; aucun changement n'a été appliqué par ce script." >&2
  exit 1
fi

git apply "$PATCH_FILE"

# Remove sensitive runtime data from the Git index only. The local files remain on disk.
for path in \
  "data/chloe_store.json" \
  "data/ai_providers.json" \
  "android/local.properties"; do
  if git ls-files --error-unmatch "$path" >/dev/null 2>&1; then
    git rm --cached -- "$path"
  fi
done

# Remove all tracked backup files under data/backups while preserving the local copies.
while IFS= read -r -d '' path; do
  git rm --cached -- "$path"
done < <(git ls-files -z -- 'data/backups')

git add .gitignore android/app/build.gradle .github/workflows/android-apk.yml

echo
echo "=== Changements préparés ==="
git status --short

echo
echo "Les fichiers privés locaux n'ont pas été effacés; ils ne seront plus suivis par Git."
echo "Vérifie le diff, puis lance:"
echo '  git diff --cached --stat'
echo '  git diff --stat'
echo '  git commit -m "Secure private data and fix Android Kotlin build"'
echo '  git push origin main'
echo
echo "Le push sur main déclenchera le workflow Android. L'APK ne sera validé qu'après un run GitHub Actions vert et un artefact présent."
