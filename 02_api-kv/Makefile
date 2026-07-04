run:
	bash run.sh
container:
	podman build -t api-kv . && podman run --rm -p 4001:4001 --env-file .env api-kv
debug:
	podman run -it --entrypoint sh localhost/api-kv:latest
kill-all:
	podman kill $(podman ps -q)