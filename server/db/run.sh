#!/bin/bash

if [ -t 0 ]; then
	docker-compose exec morchat-db "$@"
else
	docker-compose exec -T morchat-db "$@"
fi
