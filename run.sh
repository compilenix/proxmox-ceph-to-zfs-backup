#!/bin/bash
set -e

. ./enable-nvm.sh

npm ci --production
node --harmony $*
