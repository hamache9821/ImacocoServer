#!/bin/sh

url1='http://replay.imacoconow.com/json/'
saveto='../wui/json/'

#処理日付チェック
if [ $# -ne 2 ]; then
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

for i in `seq 1 $2`
do
    DATE2=$((DATE1 + ((i - 1) * 86400)))

    tmp=""`date -d @"$DATE2" +%Y%m%d`

    echo "download $saveto$tmp.json"
    curl -s -H "Accept-Encoding:gzip,deflate" $url1`date --date "$DATE0" +%Y`"/${tmp}.json" | gunzip -c > "${saveto}${tmp}.json"

    echo "download $saveto$tmp-nickname.json"
    curl -s -H "Accept-Encoding:gzip,deflate" $url1`date --date "$DATE0" +%Y`"/${tmp}-nickname.json" | gunzip -c > "${saveto}${tmp}-nickname.json"

done

