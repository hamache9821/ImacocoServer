# ImacocoServer
[今ココなう！](http://www.imacoconow.net/ "今ココなう！")互換のサーバを作るプロジェクト


### なにこれ
* 今ココなうがOverQuota連発で息していないの！助けて！
* APIまわりを解析するとそんなに難しくなさそう
* 実をいうと2007年頃に今ココみたいなシステムを組もうとしていた（測地系変換クラスとか組んでた）
* だったらNode.jsとMongoDBの勉強も兼ねて実用的なものを作ってみようか←いまここ

### 動作環境
* Node.js と MongoDBの動くマシン
* ストレージを積めるだけ
* > 1ユーザが8,640Post/Day(10秒に一回で24時間)データを送信した場合に、約1.3MBのストレージが必要です。

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
* user/getuserinfo
* api/post
* api/user_list
* api/latest
* api/getuserinfo　※user絞り込みは未実装
* api/logintest

### ユーザー登録とか
そのうちAPIの中身を実装しますので、できるまではmongoのconsoleで適当に追加してください。

```mongo
> use ImacocoDB
> db.users.insert({userid : "testuser", password : "hashed_password", email : "testuser@example.com", nickname : "testuser", ust : "", jtv : "", nicolive : "", show : "", web : "http://example.com", description : "", popup : "", speed : "", twitter : ""});
```
こんなかんじ

※パスワードは適当にハッシュ化してね




ライセンス
----
MIT

なので、商用利用したいとか、こういう機能が欲しいとかは勝手にforkしてやればいいと思うよ。
