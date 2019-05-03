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

echo "create $saveto$DATE0-nickname.json"
#nickname.json
curl -s $url2$DATE0 > /dev/null
