#!/bin/bash

cargo build --release --target wasm32-unknown-unknown --package inscribe
candid-extractor target/wasm32-unknown-unknown/release/inscribe.wasm > src/ckscribe_backend/inscribe/inscribe.did
