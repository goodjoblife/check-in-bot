#!/bin/sh

REPO="059402281999.dkr.ecr.ap-northeast-1.amazonaws.com/goodjob/check-in-bot"

apk add -q --update py-pip && pip install -q awscli || exit 1
eval `aws ecr get-login --no-include-email --region ap-northeast-1` || exit 1

set -x

docker push "${REPO}:latest" || exit 1

docker tag "${REPO}:latest" "${REPO}:${CIRCLE_SHA1}" || exit 1
docker push "${REPO}:${CIRCLE_SHA1}" || exit 1

# stage image should be replaced on master branch
if [ "${CIRCLE_BRANCH}" == "master" ]; then
    docker tag "${REPO}:latest" "${REPO}:stage" || exit 1
    docker push "${REPO}:stage" || exit 1
fi
