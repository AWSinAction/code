#!/bin/bash -ex

mkdir -p build
zip build/worker.zip lib.js package.json worker.js
zip build/server.zip lib.js package.json server.js
