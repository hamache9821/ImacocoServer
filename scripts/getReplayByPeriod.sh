#!/bin/sh

DATE1=`date --date "$1" +%s`

for i in `seq 1 $2`
do
        DATE2=$((DATE1 + ((i - 1) * 86400)))

    tmp=""`date -d @"$DATE2" +%Y%m%d`
#    echo "$tmp"
    ./getReplayByDate.sh $tmp
done
