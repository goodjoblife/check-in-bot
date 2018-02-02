#!/bin/sh

set -x

apk add -q --update py-pip && pip install -q docker-compose
