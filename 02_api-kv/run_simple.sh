#!/bin/bash
start=$(date +%s)

podman build -t api-kv . || exit 1

end=$(date +%s)
echo "Build time: $((end - start))s"

podman run --rm -p 4001:4001 --env-file .env api-kv