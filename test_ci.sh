#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

GADGET_CLI=$(realpath "$SCRIPT_DIR/src/cli.js")

npx -y toolproof --placeholders gadget_cli="$GADGET_CLI"