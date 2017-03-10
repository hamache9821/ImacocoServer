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

###環境構築方法(Debianの場合)  
* nvmとNode.jsをインストール
``` sh
$ curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | sh
$ . ./.bashrc
$ nvm install 5.6.0
$ npm install node-dev -g
$ npm install forever -g
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

### 使い方

```sh
$ git clone https://github.com/hamache9821/ImacocoServer.git
$ cd ImacocoServer
$ npm install
$ npm start
```

~~（適当にサービスとして登録するためのスクリプトがあったほうがいいかもしれない）~~  
↑いま作ってるので完成したらこんな感じでいけるようにする予定  
（もしくはinstall.sh ）  
```sh
$ cd ImacocoServer
$ npm install
$ cp ./scripts/imacoco-server /etc/init.d/
$ chmod +x /etc/init.d/imacoco-server
$ update-rc.d /etc/init.d/imacoco-server defaults
```

MongoDBのindex作成  

```sh
> db.locinfos.createIndex({time : 1,  user : 1});
> db.locinfos.createIndex({time : -1, user : 1});
> db.locinfos.createIndex({"location" : "2dsphere"});
```


ログを残さないならttl-indexしちゃったほうがよさげ  
```sh
> db.locinfos.createIndex({"location" : "2dsphere"});
> db.locinfos.createIndex({time : 1},  { expireAfterSeconds: 600 });
```




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
