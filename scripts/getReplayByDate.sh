#!/bin/sh

url1='http://localhost/api/replay/latest/'
url2='http://localhost/api/replay/nickname/'
saveto='../wui/json/'
latest=''

#処理日付チェック
if [ $# -ne 1 ]; then
    DATE0=`date -d "1 day ago" +%Y%m%d`
else
    DATE0=$1
fi

#処理対象日付
DATE1=`date --date "$DATE0" +%s`

#保存先チェック
saveto="$saveto"`date --date "$DATE0" +%Y`"/"

if [ ! -e $saveto ]; then
    mkdir $saveto
fi

echo "create $saveto$DATE0.json"

#1分単位で処理
for n in `seq 0 1439`
do
    DATE2=$((DATE1 + (n * 60)))

    tmp="$url1"`date -d @"$DATE2" +%Y%m%d%H%M`
#    echo "$tmp"

    if [ ${#latest}  -gt 0 ]; then 
        latest="${latest},"
    fi

    #json本体
    latest="${latest}"`curl -s $tmp` 
done

#latest.json
echo "[$latest]" > $saveto$DATE0.json

echo "create $saveto$DATE0-nickname.json"
#nickname.json
curl -s $url2$DATE0 > $saveto$DATE0-nickname.json

echo "gzip $saveto$DATE0.json $saveto$DATE0-nickname.json"
gzip -f $saveto$DATE0.json $saveto$DATE0-nickname.json
