#!/usr/bin/env bash

if [[ -n "$C9_HOSTNAME" ]]; then
    echo "Serving on Cloud9..."
    vue-cli-service serve --port 8080 --host 0.0.0.0 --public $C9_HOSTNAME
else
    echo "Serving locally..."
    vue-cli-service serve
fi