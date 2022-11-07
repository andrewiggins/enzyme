#!/bin/bash

pushd ~/github/preactjs/enzyme-adapter-preact-pure
yarn build
yarn build-cjs
yarn pack
mv enzyme-adapter-preact-pure-*.tgz enzyme-adapter-preact-pure.tgz
popd

cp ~/github/preactjs/enzyme-adapter-preact-pure/enzyme-adapter-preact-pure.tgz .
rm -r node_modules/
rm package-lock.json

pushd ../..
npm i
PREACT=true npm run build
popd
