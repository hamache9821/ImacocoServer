# ImacocoServer
----
[今ココなう！](http://www.imacoconow.net/ "今ココなう！")互換のサーバを作るプロジェクト


### なにこれ
* 今ココなうがOverQuota連発で息していないの！助けて！
* APIまわりを解析するとそんなに難しくなさそう
* だったらNode.jsとMongoDBの勉強も兼ねて実用的なものを作ってみよう
* 最低限のサーバ機能とリプレイ機能できたところでちょっと飽きてきた←いまここ

### 動作環境
* Node.js と MongoDBの動くマシン
* ストレージを積めるだけ  
> 1ユーザが8,640Post/Day(10秒に一回で24時間)データを送信した場合に、約1.3MBのストレージが必要です。

###環境構築方法(Debianの場合)  
* nvmとNode.jsをインストール
``` sh
 curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | sh
 . ./.bashrc
 nvm install 5.6.0
 npm install node-dev -g
 npm install pm2 -g
```  
* [MongoDB](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/)をインストール  
``` sh
 sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
 echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
 sudo apt-get update
 sudo apt-get install -y mongodb-org
```
* node-canvas用
```sh
 apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```

### 使い方

```sh
 git clone https://github.com/hamache9821/ImacocoServer.git
 cd ImacocoServer
 npm install
 npm start
```


#### デーモン化（pm2で対応）  

```sh
 cd ImacocoServer
 pm2 start processes.json
 pm2 startup
 pm2 save
```


必要ならlogrotateを設定（後で書く）  

```sh
 pm2 install pm2-logrotate

```


MongoDBのindex作成  

```sh
 db.locinfos.createIndex({time : 1,  user : 1});
 db.locinfos.createIndex({time : -1, user : 1});
 db.locinfos.createIndex({"location" : "2dsphere"});
 db.geocoders.createIndex({"location" : "2dsphere"});
```


ログを残したくないならttl-indexしちゃったほうがよさげ  
```sh
 db.locinfos.createIndex({time : 1},  { expireAfterSeconds: 600 });
```


https対応  (let's encryptで証明書取得する場合)  
let's encryptの使い方はググってください   

```sh
 git clone https://github.com/letsencrypt/letsencrypt.git
 cd letsencrypt
 ./certbot-auto certonly --standalone -m admin@example.com -d imacoco.example.com
 ln -s /etc/letsencrypt/live/example.com/privkey.pem /usr/ImacocoServer/cert/private_key.pem
 ln -s /etc/letsencrypt/live/example.com/cert.pem /usr/ImacocoServer/cert/certificate.pem
```

```default.json
    "listen_type" : ["http"],
```
を
```default.json
    "listen_type" : ["https"],
```
または

```default.json
    "listen_type" : ["http", "https"],
```
に設定



### APIの実装状況
基本的には[今ココなう！(β):API](http://www.fujita-lab.com/imakoko/api.html "今ココなう！(β):API")の仕様を踏襲していますので、  
各クライアントツールとproxyの接続先サーバを自前のものに変えるだけで動きます。素敵！  
※googleMap API Key等は各自で用意してください。  

[API仕様書](https://github.com/hamache9821/ImacocoServer/blob/master/docs/api.md)

現時点で実装しているAPI  
* home/
* view
* create_user
* user
 * /
 * /update_userinfo
 * /getuserinfo
* api
 * /post
 * /user_list
 * /latest
 * /getuserinfo
 * /logintest

### ユーザー登録方法
create_userを呼び出すことで、登録フォームが出るので、そちらで登録してください。  
またはmongoのconsoleで適当に追加してください。  

```mongo
> use ImacocoDB
> db.users.insert({userid : "testuser", password : "hashed_password", email : "testuser@example.com", nickname : "testuser",   
ust : "", jtv : "", nicolive : "", show : "1", web : "http://example.com", description : "", popup : "", speed : "0", twitter : ""});
```
こんなかんじ  
※パスワードは適当にハッシュ化してね

ライセンス
----
MIT

なので、商用利用したいとか、こういう機能が欲しいとかは勝手にforkしてやればいいと思うよ。

###その他
 Q.インストール方法教えて！  
 A.お 前 の 目 は 節 穴 か
 
 Q.なんかおかしいんだけど  
 A.エスパーじゃないので、何がおかしいか具体的に言ってもらわないとわかんないです。  
   というか、現段階ではソース読んで何が起きるのかわからない人にはお勧めできません。
