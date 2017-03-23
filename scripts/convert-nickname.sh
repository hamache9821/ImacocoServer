#!/bin/sh
imgpath="../wui/img/user/"
url="http://example.com/user/"

for file in `\find ${imgpath} -maxdepth 1 -type f |  awk -F/ '{print $NF}'`; do
    `curl -s ${url}${file} > /dev/null`
done

