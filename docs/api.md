# 今ココなう（仮）API仕様書

## 概要
これは今ココなう（仮）のAPI仕様書です。  
内容は作者の気分によって予告なく変更される可能性があります。  


## ユーザ関係
### GET /api/logintest :lock:
 > ログインテストを実行します

#### request

#### response

### GET /api/getuserinfo
 > 指定したユーザーの情報を取得します

#### request

#### response

### GET /api/user_list
 > アクティブユーザー一覧を取得します

#### request

#### response



## 位置関係

### POST /api/post :lock:

 > 位置情報の送信  

#### request


|| |
|---|---|
|ContentType|application/x-www-form-urlencoded|  



||name|description|
|---|---|---|
||time|時刻。YYYY-MM-DD'T'hh:mm:ss.sssZZZZZ形式(必須)|
||lat|緯度(°)。10進形式(必須)|
||lon|経度(°)。10進形式(必須)|
||gpsq|fix情報(省略可)|
||gpsn|衛星捕捉数(省略可)|
||gpsh|高度(m) (省略可)|
||gpsd|方位(°)。北を0とした時計回りの角度(省略可)|
||gpsv|速度(km/h)(省略可)|
||save|サーバにデータを保存するなら'1'。しないなら'0'。デフォルト'1'(省略可)|
||t|マーカータイプ。<br>'0':矢印 '1':携帯電話 '2':飛行機 '3':電車 '4':新幹線<br>'5':バス '6':自転車 '7':徒歩, '8':バイク, '9':ヘリコプター,'10':船<br> デフォルト'0'(省略可)|

#### response
|| |
|---|---|
|ContentType|text/plain; charset=utf-8|
|Response Body|成功の場合'OK'、失敗/エラーの場合'NG'|


### GET /api/latest
 > 最新の位置情報を取得します

#### request


#### response

#### 備考

### GET /api/getaddress :lock:

 > 逆ジオコードを行います

#### request


#### response

#### 備考

