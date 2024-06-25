#!/usr/bin/env bash

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

GADGET_DIR=$(realpath "$SCRIPT_DIR/src/")

npx -y toolproof --placeholders gadget_dir="$GADGET_DIR"