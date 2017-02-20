#!/bin/sh

url1='http://localhost/api/replay/latest/'
url2='http://localhost/api/replay/nickname/'
saveto='../wui/json/2017/'

latest=''

if [ $# -ne 1 ]; then
    echo "日付を指定してください。(YYYYMMDD)" 1>&2
    exit 1
fi

#処理対象日付
DATE1=`date --date "$1" +%s`

#1分単位で処理
for i in `seq 0 1439`
do
    DATE2=$((DATE1 + (i * 60)))

    tmp="$url1"`date -d @"$DATE2" +%Y%m%d%H%M`
#    echo "$tmp"

    if [ ${#latest}  -gt 0 ]; then 
        latest="${latest},"
    fi

    #json本体
    latest="${latest}"`curl -s $tmp` 
done
echo "[$latest]" >$saveto$1.json

curl -s $url2$1 > $saveto$1-nickname.json
