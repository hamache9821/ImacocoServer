/***********************************************************
 *  今ココなう！クライアント向け互換サーバスクリプト       *
 *                                                         *
 *  Copyright (c) 2016 @Hamache9821                        *
 *  Released under the MIT license                         *
 *  http://opensource.org/licenses/mit-license.php         *
 ***********************************************************/

//api仕様
//http://www.imacoconow.net/api.html

//todo log4jsあたり検討
//todo 括り文字の使い分け ex node:'' mongo:""


//サーバー設定
var port = process.env.PORT || 80;
var hashSecretKey = 'some_random_secret';   // シークレットは適当に変えてください

//console.log用定数
var black   = '\u001b[30m';
var red     = '\u001b[31m';
var green   = '\u001b[32m';
var yellow  = '\u001b[33m';
var blue    = '\u001b[34m';
var magenta = '\u001b[35m';
var cyan    = '\u001b[36m';
var white   = '\u001b[37m';
var reset   = '\u001b[0m';

//モジュール宣言
require('date-utils');
var fs = require('fs');
var http = require('http');
var express = require('express');
var domain = require('express-domain-middleware');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var crypto = require("crypto");
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;


//デバッグ用
var utill = require('util');

//Express関係
var app = express();
app.use(domain);
app.use(function(err, req, res, next) {logger.error.fatal(err);}); //例外ハンドラ
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());
app.set('port', port);


//todo このへんのはそのうちモジュール化したい
//パスワードをハッシュ化するやつ
var getHash = function(target)
    {var sha = crypto.createHmac('sha256', hashSecretKey);
     sha.update(target);
     return sha.digest('hex');
    };

//アクセス表示
var cInfo = function(req, msg)
    {
        var s = '';
        if (msg === undefined){
            msg = req.headers['x-forwarded-for'] + ' ' + req.headers['user-agent'];
        }

        //表示時間
        var dt = new Date();
        var formatted = dt.toFormat(" HH24:MI:SS ");

        switch (req.method){
            case 'GET':
                s = '[' + green   + 'CALL' + reset + ']' + dt.toFormat(" HH24:MI:SS ") + req.url + ': ';
                break;
            case 'POST':
                s = '[' + magenta + 'CALL' + reset + ']' + dt.toFormat(" HH24:MI:SS ") + req.url + ': ';
                break;
            default:
                break;
                s = '[' + yellow  + 'CALL' + reset + ']' + dt.toFormat(" HH24:MI:SS ") + req.url + ': ';
        }

        console.log(s + msg);
        return;
    };

//時間計算関数
var addMinutes = function(date, minutes)
    {
        return new Date(date.getTime() + minutes * 60000);
    };


//--------- MongoDB設定 -----------
var db = mongoose.createConnection('mongodb://localhost/ImacocoDB', function(error, res){});

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

//位置情報保持モデル
var LocSchema = new mongoose.Schema({
    valid          : {type: Boolean, required: true},
    time           : {type: Date, required: true},
    user           : {type: String, required: true},
    nickname       : {type: String},
    lat            : {type: Number},
    lon            : {type: Number},
    dir            : {type: Number},
    altitude       : {type: Number},
    velocity       : {type: Number},
    type           : {type: String},
    flag           : {type: String},
    ustream_status : {type: String},
    saved          : {type: String}
});

//todo グループ管理モデル
//http://yone-public.blogspot.jp/2012/11/mongoose1.html
/* 構造案
    groupname  
    users      
    description
    marker:{{   desc
                lat
                lon
                _id
            }
           }
*/

var UserInfo = db.model('User', UserSchema);
var LocInfo  = db.model('Locinfo', LocSchema);

//認証ロジック
//互換性のためにとりあえずbasic認証
passport.use(new BasicStrategy(
    function(userid, password, done) {
        process.nextTick(function(){
            UserInfo.findOne({ userid: userid }, function (err, user) {
              if (err) {
                  return done(err);
              }
              if (!user) {
                  return done(null, false, {message: 'ユーザーが見つかりませんでした。'});
              }
              if (user.password != getHash(password)) {
                  return done(null, false, {message: 'パスワードが間違っています。'}); 
              }
              //todo password隠蔽化
              return done(null, user);
            });
        });
    }
));

//--------- 全体向け -----------

//静的なファイルのルーティング
app.use(express.static('wui'));

//そのうち
//全体地図を表示
app.get('/static/view.html', function(req, res){
    cInfo(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//地図上で指定したユーザーの位置を表示するHTMLを出力
app.get('/view', function(req, res){
    cInfo(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//過去に記録したデータを地図上にプロット
app.get('/view_data', function(req, res){
    cInfo(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//ユーザー情報を表示
app.get('/home/*', function(req, res){
    cInfo(req);
    res.status(404).send('Sorry, we cannot find that!');
});


//--------- /user -----------

//優先度高め
//ユーザー名のpng画像を返す
app.get('/user/*.png', function(req, res){
    cInfo(req);
    console.log(req.url);

    fs.readFile('./wui/img' + req.url,
                function(err, data){
                    if (err) {
                        //todo なければ本家から取得する
                        res.status(404).send('Sorry, we cannot find that!');
                    } else {
                        res.send(data, { 'Content-Type': 'image/png' }, 200);
                    }
                }
               );

});

//優先度高めだけどあとで
//ユーザーページを表示
//独自実装？
app.get('/user', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    //todo ユーザ情報の編集ページを返す
    res.status(404).send('Sorry, we cannot find that!');
});

//優先度高めだけどあとで
//ユーザ情報を更新
//独自実装？
//RESTFulならPUT
app.post('/user', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    //編集ページからのデータを更新
    // user/update_userinfo でもいいんじゃないかなこれ
    
    res.status(404).send('Sorry, we cannot find that!');
});

//いつかやる
//過去に保存したデータをGPXフォーマットでダウンロード
app.get('/user/gpx', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('id:' + req.query.id);

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(404).send('Sorry, we cannot find that!\n' + getHash(req.query.id + '0000'));
});

//そのうち
//ユーザー情報を更新
//RESTFulならPUT
app.post('/user/update_userinfo', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
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

/*
    var _User = new UserInfo();
    _User.userid   = "botuser";
    _User.nickname = "botuser";
    _User.password = getHash("botuser");
    _User.email    = "botuser@example.com";
*/

//    _User.save();

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//指定した過去データを削除
//RESTFulならDELETE
app.get('/user/delete_data', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('id:' + req.query.id);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//指定した過去データの公開・非公開を設定
//RESTFulならPUT
app.get('/user/set_public', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('id:' + req.query.id);
    console.log('flag:' + req.query.flag);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//指定したユーザーの情報を取得
app.get('user/getuserinfo', function(req, res){
    cInfo(req);
    console.log('user:' + req.query.user);

    if (req.query.user === undefined){
        var d={};
        d.result = 0;

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('(' + JSON.stringify(d) + ')'); 

    } else {
        UserInfo.findOne(
            {userid : req.query.user},
            function (err, result) {
                var d={};

                if (err || result === null) {
                    d.result = 0;
                } else {
                    d.result       = 1;
                    d.name         = result.nickname    ;// todo nullと文字化け対策
                    d.ust          = result.ust         ;
                    d.channel_id   = result.nicolive    ;
                    d.chat_channel = ""                 ;
                    d.jtv          = result.jtv         ;
                    d.url          = result.web         ;
                    d.twitter      = result.twitter     ;
                    d.description  = result.description ;
                    d.popup        = result.popup       ;
                }

                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('(' + JSON.stringify(d) + ')'); 
            }
        );
    }
});

//--------- /api 座標関係 -----------

//優先度高め
//座標データを登録します
app.post('/api/post', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req, req.user.userid);

    var locinfo = new LocInfo();
    locinfo.valid          = true;
    locinfo.time           = req.body.time;     //日付がUTCで入る
    locinfo.user           = req.user.userid;
    locinfo.nickname       = req.user.nickname; //todo 文字化け対策
    locinfo.lat            = req.body.lat;
    locinfo.lon            = req.body.lon;
    locinfo.dir            = req.body.gpsd;
    locinfo.altitude       = req.body.gpsh;
    locinfo.velocity       = req.body.gpsv;
    locinfo.type           = req.body.t;
    locinfo.flag           = '1';
    locinfo.saved          = req.body.save;     //jsonの互換性のために残してるだけ
    locinfo.ustream_status = 'offline';         //jsonの互換性のために残してるだけ

    locinfo.save(function(err){
        if(err){
            res.send('NG');
        } else {
            res.send('OK');
        }
    });
});

//現在のユーザー一覧を取得
app.get('/api/user_list', function(req, res){
    cInfo(req);

    //直近5分以内にデータ送信のあったユーザをアクティブとする
    LocInfo.aggregate(
        {$match : {time : {"$gte" : addMinutes(new Date, -5)}}},
        {$group : {_id  : {valid : "$valid",
                           user  : "$user"
                          }
                  }
        },
        function (err, result){
            var d    = {};
            var list = [];

            if (err) {
                d.result = 0;
                d.errmsg = 'api/user_list is error.';
                console.log(err);
            } else {
                //もうちょっといいやり方探す
                for (var i = 0; i < result.length; i++) {
                    list.push(result[i]['_id']);
                }
                d.result = 1;
                d.list = list;
            }
            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(d) + ')'); 
        }
    );
});

//最新の位置情報を取得
app.get('/api/latest', function(req, res){
    cInfo(req, ' user:' + req.query.user);

    //ユーザ座標
    var points = [];
    var req_user =[];

    //ユーザ絞込み
    switch (req.query.user){
        case undefined:
        case 'all':
            var x ={};
            req_user.push(x);
            break;
        default:
            var temp = req.query.user.split(',');

            for (var i = 0 ; i < temp.length ; i++){
                var x ={};
                x.user = temp[i];
                req_user.push(x);
            }
            break;
    }

    //現在オンラインのユーザー探す
    LocInfo.distinct(
        "user",
        {$or : req_user, time:{"$gte" : addMinutes(new Date, -5)}},
        function(err, result){
            //何かしらのエラー
            if (err) {
                var d    = {};
                d.result = 0;
                d.errmsg = 'api/latest is error.(distinct)';
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('(' + JSON.stringify(d) + ')'); 
                return;
            }

            //該当ユーザなし
            if (result.length === 0) {
                var d    = {};
                d.result = 1;
                d.points = points;
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('(' + JSON.stringify(d) + ')');
                return;
            }

            //オンラインユーザの直近の位置を取得
            for (var i = 0; i < result.length; i++) {
                LocInfo.find(
                    {user : result[i], time:{"$gte" : addMinutes(new Date, -5)}},
                    {_id : 0, __v : 0, time : 0, flag : 0, saved : 0},

                    function(err, results){
                        points.push(results[0]);

                        if (points.length >= result.length){

                            var d={};
                            d.result = 1;
                            d.points = points;
                            //todo グループ機能やることがあれば対応
                            //そもそもAPI仕様書に存在しない
                            //d.group_updated = false;

                            res.set('Content-Type', 'text/javascript; charset=utf-8');
                            res.send('(' + JSON.stringify(d) + ')');
                       }
                    }
                ).sort({time: -1}).limit(1);
            }
        }
    );
});

//やらない
//逆ジオコード変換
app.get('/api/getaddress', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('lat:' + req.query.lat);
    console.log('lon:' + req.query.lon);

    res.set('text/plain; charset=utf-8');
    res.send('');
});

//--------- -----------

//優先度高め
//指定したユーザーの情報を取得
app.get('/api/getuserinfo', function(req, res){
    cInfo(req);
    console.log('user:' + req.query.user);

    if (req.query.user === undefined){
        var d={};
        d.result = 0;

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('(' + JSON.stringify(d) + ')'); 

    } else {
        UserInfo.findOne(
            {userid : req.query.user},
            function (err, result) {
                var d={};

                if (err || result === null) {
                    d.result = 0;
                } else {
                    d.result       = 1;
                    d.name         = result.nickname    ;//todo nullと文字化け対策
                    d.ust          = result.ust         ;
                    d.channel_id   = result.nicolive    ;
                    d.chat_channel = ""                 ;
                    d.jtv          = result.jtv         ;
                    d.url          = result.web         ;
                    d.twitter      = result.twitter     ;
                    d.description  = result.description ;
                    d.popup        = result.popup       ;
                }

                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send('(' + JSON.stringify(d) + ')'); 
            }
        );
    }
});

//そのうち
//グループ情報を取得
app.get('/api/getgroupinfo', function(req, res){
    cInfo(req);
    console.log('group:' + req.query.group);

    var d={};
    d.result       = 0;
    d.groupname    = '';
    d.users        = '';
    d.description  = '';

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//グループを作成
app.post('/api/creategroup', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//グループ情報を更新
//RESTFulならPUT
app.post('/api/updategroup', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);
    console.log('users:' + req.body.users);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//グループ情報を削除
//RESTFulならDELETE
app.get('/api/deletegroup', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('group:' + req.query.group);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//グループ共有マーカーを追加
app.post('/api/addmarker', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('group:' + req.body.group);
    console.log('desc:' + req.body.desc);
    console.log('lat:' + req.body.lat);
    console.log('lon:' + req.body.lon);

    var d={};
    d.result       = 0;
    d.key          = "";
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//そのうち
//グループ共有マーカーを削除
//RESTFulならDELETE
app.get('/api/deletemarker', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log('group:' + req.query.group);
    console.log('key:' + req.query.key);

    var d={};
    d.result       = 0;
    d.errmsg       = "Sorry, we cannot find that!";

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//仕様調べる
//直近の座標を削除？
//RESTFulならDELETE
app.get('/api/delpost', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req);
    console.log(utill.inspect(req.body));
    
    //指定した時間-5分くらいのユーザデータを消す？
    
    res.send('OK');
});

//ログインテスト
app.get('/api/logintest', passport.authenticate('basic', { session: false }), function(req, res){
    cInfo(req, req.user.userid + ":" + req.user.password);
    
    //ユーザー登録APIを作るまでの暫定対応
    //todo 本家鯖からユーザー名のpng画像を取得する

    res.send('OK');
});

//サーバー起動
http.createServer(app).listen(app.get('port'), function(){
  console.log('['+ cyan +'INFO' + reset + '] ImacocoNow server listening on port: ' + app.get('port'));
});
