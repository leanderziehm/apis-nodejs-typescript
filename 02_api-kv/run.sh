#!/bin/bash

IMAGE="api-kv"
LOG_FILE="build.log"

start=$(date +%s)
timestamp_start=$(date '+%Y-%m-%d %H:%M:%S')

git_hash=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git_state="dirty"
else
  git_state="clean"
fi

TAG="${IMAGE}:${git_hash}"

echo "[$timestamp_start] BUILD START image=$IMAGE git=$git_hash state=$git_state" | tee -a "$LOG_FILE"

podman build -t "$TAG" .
build_status=$?

end=$(date +%s)
duration=$((end - start))
timestamp_end=$(date '+%Y-%m-%d %H:%M:%S')

if [ $build_status -ne 0 ]; then
  echo "[$timestamp_end] BUILD FAILED image=$TAG duration=${duration}s git=$git_hash" | tee -a "$LOG_FILE"
  exit 1
fi

image_id=$(podman images --noheading --format "{{.ID}}" "$TAG" 2>/dev/null | head -n 1)
image_size_bytes=$(podman image inspect "$TAG" --format '{{.Size}}' 2>/dev/null)
repo_digest=$(podman image inspect "$TAG" --format '{{index .RepoDigests 0}}' 2>/dev/null)

if [ -n "$image_size_bytes" ]; then
  size_mb=$(awk "BEGIN {printf \"%.2f\", $image_size_bytes/1024/1024}")
else
  size_mb="unknown"
fi

echo "[$timestamp_end] BUILD OK image=$TAG git=$git_hash duration=${duration}s size=${size_mb}MB image_id=${image_id:-unknown} digest=${repo_digest:-unknown}" | tee -a "$LOG_FILE"

echo "[$timestamp_end] RUN image=$TAG" | tee -a "$LOG_FILE"

podman run --rm -p 4001:4001 --env-file .env "$TAG"