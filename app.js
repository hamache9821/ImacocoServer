/*
    今ココなう！クライアント向け互換サーバスクリプト

    Copyright (c) 2016 @Hamache9821
    The MIT License (MIT)
*/

//api仕様
//http://www.imacoconow.net/api.html

//todo log4jsあたり検討



//サーバー設定
var port = process.env.PORT || 80;
var hashSecretKey = "some_random_secret";   // シークレットは適当に変えてください

//モジュール宣言
require('date-utils');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require("mongoose");
var crypto = require("crypto");

//デバッグ用
var fs = require('fs');
var util = require('util');

//Express関係
var app = express();
app.set('port', port);
app.use(bodyParser.urlencoded({extended: true}));

//パスワードをハッシュ化するやつ
var getHash = function(target)
    {
        var sha = crypto.createHmac("sha256", hashSecretKey);
        sha.update(target);
        return sha.digest("hex");
    };

//--------- MongoDB設定 -----------
var db = mongoose.createConnection("mongodb://localhost/ImacocoDB", function(error, res){});

//ユーザ認証モデル
var UserSchema = new mongoose.Schema({
    userid      : {type: String, required: true},
    password    : {type: String, required: true},
    email       : {type: String, required: true},
    nickname    : {type: String, required: true},
    ust         : {type: String},
    jtv         : {type: String},
    nicolive    : {type: String},
    show        : {type: String},
    web         : {type: String},
    description : {type: String},
    popup       : {type: String},
    speed       : {type: String},
    twitter     : {type: String}
});

//todo 位置情報保持モデル
//http://yone-public.blogspot.jp/2012/11/mongoose1.html
var LocSchema = new mongoose.Schema({
    valid          : {type: Boolean, required: true},
    time           : {type: Date, required: true},
    user           : {type: String, required: true},
    nickname       : {type: String},
    lat            : {type: String},
    lon            : {type: String},
    dir            : {type: String},
    altitude       : {type: String},
    velocity       : {type: String},
    type           : {type: String},
    ustream_status : {type: String}
});

var User    = db.model("User", UserSchema);
var LocInfo = db.model("Locinfo", LocSchema);

//テスト用のやつ
if(User.count({}) == 0){
    var _User = new User();
    _User.userid   = "botuser";
    _User.nickname = "botuser";
    _User.password = getHash("botuser");
    _User.email    = "botuser@example.com";
    _User.save();
}

//passport初期設定
var passport = require('passport')
var BasicStrategy = require('passport-http').BasicStrategy;
app.use(passport.initialize());
app.use(passport.session());

//認証ロジック
passport.use(new BasicStrategy(
    function(userid, password, done) {
        process.nextTick(function(){
            User.findOne({ userid: userid }, function (err, user) {
              if (err) {
                  return done(err);
              }
              if (!user) {
                  return done(null, false, {message: "ユーザーが見つかりませんでした。"});
              }
              if (user.password != getHash(password)) {
                  return done(null, false, {message: "パスワードが間違っています。"}); 
              }
              //todo password隠蔽化
              return done(null, user);
            });
        });
    }
));

//デバッグ用のグローバル変数
 _TEST_ = {};
 _TEST_BOT_DIR_ = 0;


//--------- -----------

//そのうち
//全体地図を表示
app.get('/static/view.html', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//地図上で指定したユーザーの位置を表示するHTMLを出力
app.get('/view', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//過去に記録したデータを地図上にプロット
app.get('/view_data', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//優先度高め
//静的なファイルのルーティング


//優先度高め
//ユーザー名のpng画像を生成
app.get('/user/*.png', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//優先度高めだけどあとで
//ユーザーページを表示
//独自実装？
app.get('/user', passport.authenticate('basic', { session: false }), function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//優先度高めだけどあとで
//ユーザ情報を更新
//独自実装？
app.post('/user', passport.authenticate('basic', { session: false }), function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//いつかやる
//過去に保存したデータをGPXフォーマットでダウンロード
app.get('/user/gpx', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/update_userinfo');
    console.log('id:' + req.query.id);

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//ユーザー情報を更新
app.post('/user/update_userinfo', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/update_userinfo');//body
    console.log('nickname:'     + req.body.nickname);
    console.log('ust:'          + req.body.ust);
    console.log('jtv:'          + req.body.jtv);
    console.log('nicolive:'     + req.body.nicolive);
    console.log('show:'         + req.body.show);
    console.log('web:'          + req.body.web);
    console.log('description:'  + req.body.description);
    console.log('popup:'        + req.body.popup);
    console.log('speed:'        + req.body.speed);
    console.log('twitter:'      + req.body.twitter);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//指定した過去データを削除
app.get('/user/delete_data', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/delete_data');
    console.log('id:' + req.query.id);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//指定した過去データの公開・非公開を設定
app.get('/user/set_public', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/set_public');
    console.log('id:' + req.query.id);
    console.log('flag:' + req.query.flag);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//優先度高め
//指定したユーザーの情報を取得
app.get('user/getuserinfo', function(req, res){
    console.log('[CALL] /api/getuserinfo');
    console.log('user:' + req.query.user);

    //todo mongodbしらべる
    // api/getuserinfoと同じ？

    var d={};
    d.result       = 0;
    d.name         = "";
    d.ust          = "";
    d.channel_id   = "";
    d.chat_channel = "";
    d.jtv          = "";
    d.url          = "";
    d.twitter      = "";
    d.description  = "";
    d.popup        = "";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//優先度高め
//座標データを登録します
app.post('/api/post', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/post:' + req.user.userid);

    //データ保存するか
    //todo リプレイ用にとっておくなら無視？
    if (req.body.save){
    }

    //テスト用にとりあえず変数に保持
    _TEST_.valid          = true;
    _TEST_.time           = req.user.time;
    _TEST_.user           = req.user.userid;
    _TEST_.nickname       = req.user.nickname;
    _TEST_.lat            = req.body.lat;
    _TEST_.lon            = req.body.lon;
    _TEST_.dir            = req.body.gpsd;
    _TEST_.altitude       = req.body.gpsh;
    _TEST_.velocity       = req.body.gpsv;
    _TEST_.type           = req.body.t;
    _TEST_.ustream_status = "offline";


    //todo 日付がUTCで入る
    var locinfo = new LocInfo();
    locinfo.valid          = true;
    locinfo.time           = req.body.time; //Date.parse(req.body.time);
    locinfo.user           = req.user.userid;
    locinfo.nickname       = req.user.nickname;
    locinfo.lat            = req.body.lat;
    locinfo.lon            = req.body.lon;
    locinfo.dir            = req.body.gpsd;
    locinfo.altitude       = req.body.gpsh;
    locinfo.velocity       = req.body.gpsv;
    locinfo.type           = req.body.t;
    locinfo.ustream_status = "offline";

    locinfo.save(function(err){
        if(err){
            res.send('NG');
        } else {
            res.send('OK');
        }
    });
});

//優先度高め
//現在のユーザー一覧を取得
app.get('/api/user_list', function(req, res){
    console.log('[CALL] /api/user_list');
//    console.log(util.inspect(req.headers));

    var d={};
    var list = [];
    var user_list ={};
    
    if (false){
        d.result = 0;
        d.errmsg = "err test msg.";
    } else {
        //test bot
        user_list.valid = true;
        user_list.user  = "testbot";
        list.push(user_list);

        //todo オンラインのユーザ判定
        //最終データ時間で見る？
        
        user_list ={};
        user_list.valid = true;
        user_list.user  = "hmx9821";
        list.push(user_list);

        d.result = 1;
        d.list = list;
    }

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
    
});

//優先度高め
//最新の位置情報を取得
app.get('/api/latest', function(req, res){
    console.log('[CALL] /api/latest:' +
                req.headers['x-forwarded-for'] + ' ' + req.headers['user-agent'] + " user:" + req.query.user);

    var d={};
    var points = [];
    var latest ={};

    //todo ユーザ絞込み
    switch (req.query.user){
        case undefined:
        case 'all':
            break;
        default:
            break;
    }

    
    if (false){
        d.result = 0;
        d.errmsg = "err test msg.";
    } else {
        //test bot
        //test ほぼ大阪城
        latest ={};
        latest.valid          = true;
        latest.user           = "testbot";
        latest.nickname       = "testbot";
        latest.lat            = 34.6873316;
        latest.lon            = 135.5238653;
        latest.dir            = 0;
        latest.altitude       = 3600;
        latest.velocity       = 0;
        latest.type           = 0;
        latest.ustream_status = "offline";
        
        points.push(latest); //大阪城
        points.push(_TEST_); //クライアントから
        
        //仕様固まったらmongodb使う
        
        d.result = 1;
        d.points = points;
//        d.group_updated = false;

    }
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")");
});

//やらない
//逆ジオコード変換
app.get('/api/getaddress', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/getaddress');
    console.log('lat:' + req.query.lat);
    console.log('lon:' + req.query.lon);

    res.set('text/plain; charset=utf-8');
    res.send('');
});

//優先度高め
//指定したユーザーの情報を取得
app.get('/api/getuserinfo', function(req, res){
    console.log('[CALL] /api/getuserinfo');
    console.log('user:' + req.query.user);


    if (req.query.user === undefined){
        var d={};
        d.result = 0;

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send("(" + JSON.stringify(d) + ")"); 

    } else {
        //todo mongodbしらべる
        User.findOne({userid: req.query.user}, function (err, udata) {
            var d={};

            if (err) {
                d.result = 0;
            } else {
                d.result       = 1;
//                d.name         = udata.nickname    ;
                d.ust          = udata.ust         ;
                d.channel_id   = udata.nicolive    ;
                d.chat_channel = ""                ;
                d.jtv          = udata.jtv         ;
                d.url          = udata.web         ;
                d.twitter      = udata.twitter     ;
                d.description  = udata.description ;
                d.popup        = udata.popup       ;
            }

            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send("(" + JSON.stringify(d) + ")"); 
        });
    }
});

//そのうち
//グループ情報を取得
app.get('/api/getgroupinfo', function(req, res){
    console.log('[CALL] /api/getgroupinfo');
    console.log('group:' + req.query.group);

    var d={};
    d.result       = 0;
    d.groupname    = "";
    d.users        = "";
    d.description  = "";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//グループを作成
app.post('/api/creategroup', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/creategroup');
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//グループ情報を更新
app.post('/api/updategroup', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/updategroup');
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);
    console.log('users:' + req.body.users);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//グループ情報を削除
app.get('/api/deletegroup', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/deletegroup');
    console.log('group:' + req.query.group);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//グループ共有マーカーを追加
app.post('/api/addmarker', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/addmarker');
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);
    console.log('lat:' + req.body.lat);
    console.log('lon:' + req.body.lon);

    var d={};
    d.result       = 0;
    d.key          = "";
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//そのうち
//グループ共有マーカーを削除
app.get('/api/deletemarker', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/deletemarker');
    console.log('group:' + req.query.group);
    console.log('key:' + req.query.key);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); 
});

//使ってない？
//直近の座標を削除？
app.get('/api/delpost', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/delpost');
    console.log(util.inspect(req.body));
    res.send('OK');
});

//ログインテスト
app.get('/api/logintest', passport.authenticate('basic', { session: false }), function(req, res){
    console.log('[CALL] /api/logintest:' + req.user.userid);
    res.send('OK');
});

//サーバー起動
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

//app.listen(port);
