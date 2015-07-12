#!/bin/bash -ex

rm -rf build/
mkdir -p build/
zip build/worker.zip lib.js package.json worker.js worker.config
zip build/server.zip lib.js package.json server.js
