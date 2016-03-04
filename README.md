# ImacocoServer
----
[今ココなう！](http://www.imacoconow.net/ "今ココなう！")互換のサーバを作るプロジェクト


### なにこれ
* 今ココなうがOverQuota連発で息していないの！助けて！
* APIまわりを解析するとそんなに難しくなさそう
* 実をいうと2007年頃に今ココみたいなシステムを組もうとしていた（測地系変換クラスとか組んでた）
* だったらNode.jsとMongoDBの勉強も兼ねて実用的なものを作ってみようか←いまここ

### 動作環境
* Node.js と MongoDBの動くマシン
* ストレージを積めるだけ  
> 1ユーザが8,640Post/Day(10秒に一回で24時間)データを送信した場合に、約1.3MBのストレージが必要です。

### 使い方

こんな感じで動くようにする予定

```sh
$ git clone https://github.com/hamache9821/ImacocoServer.git
$ cd ImacocoServer
$ npm install
$ node app.js
```

### APIの実装状況
基本的には[今ココなう！(β):API](http://www.fujita-lab.com/imakoko/api.html "今ココなう！(β):API")の仕様を踏襲していますので、  
各クライアントツールとproxyの接続先サーバを自前のものに変えるだけで動きます。素敵！  
※googleMap API Key等は各自で用意してください。  

現時点で実装しているAPI
* home/*
* user/getuserinfo
* api/post
* api/user_list
* api/latest
* api/getuserinfo
* api/logintest

### ユーザー登録方法
APIの実装がまだなので、使いたい方はmongoのconsoleで適当に追加してください。

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

###環境構築方法(Debianの場合・他は知らない)  
* nvmとNode.jsをインストール
``` sh
$ curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | sh
$ nvm install 5.6.0
```  
* [MongoDB](https://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/)をインストール  
``` sh
$ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
$ echo "deb http://repo.mongodb.org/apt/debian wheezy/mongodb-org/3.2 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
$ sudo apt-get update
$ sudo apt-get install -y mongodb-org
```
* node-canvas用
```sh
apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++
```

###その他
 Q.インストール方法教えて！
 A.お 前 の 目 は 節 穴 か
 
 Q.なんかおかしいんだけど  
 A.エスパーじゃないので、何がおかしいか具体的に言ってもらわないとわかんないです。  
   というか、現段階ではソース読んで何が起きるのかわからない人にはお勧めできません。
