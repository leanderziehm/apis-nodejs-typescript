2 02:
	cd 02_api-kv && npm run container
1 01:
	cd 01_api-texts && npm run container
	
kill-all k ka kall:
	podman kill $(podman ps -q)