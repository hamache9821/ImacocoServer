#!/bin/sh
imgpath="../wui/img/user/"
url="http://localhost/user/"

for file in `\find ${imgpath} -maxdepth 1 -type f |  awk -F/ '{print $NF}'`; do
    echo $file
    `curl -s ${url}${file} > /dev/null`
done

