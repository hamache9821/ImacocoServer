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
var dbHost = 'localhost';
var dbName = 'ImacocoDB';


//モジュール宣言
require('date-utils');
var util = require('./common-utils.js');
var fs = require('fs');
var http = require('http');
var express = require('express');
var domain = require('express-domain-middleware');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var BasicStrategy = require('passport-http').BasicStrategy;
var Canvas = require('canvas')

//Express関係
var app = express();
app.use(domain);
app.use(function(err, req, res, next) {logger.error.fatal(err);}); //例外ハンドラ
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());
app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

//--------- MongoDB設定 -----------
var db = mongoose.createConnection('mongodb://' + dbHost + '/' + dbName, function(error, res){});

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
    time           : {type: Date,    required: true},
    user           : {type: String,  required: true},
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
                  return done(null, false, {message: 'invalid userid.'});
              }
              if (user.password != util.getHash(password)) {
                  return done(null, false, {message: 'invalid passwords.'}); 
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
//今ココリプレイ的なアレ
app.get('/date/*', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//今ココリプレイ的なアレ
app.get('/api/json/*.json', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
/*
    /api/latestの処理をベースに一日分抽出したらできそうだけど、負荷を考えないと

    /
    db.locinfos.distinct("user",
        {time:{"$gte" : ISODate("2016-03-04T00:00:00Z"), "$lte" : ISODate("2016-03-04T23:59:59Z")}}
    );

    //その日のユーザー数*1440回のループとかちょっとアレ
    db.locinfos.find(
        {time:{"$gte" : ISODate("2016-02-24T01:49:00Z"), "$lte" : ISODate("2016-02-24T01:49:59Z")}},
        {_id : 0, __v : 0, time : 0, flag : 0, saved : 0}
    ).sort({time: -1}).limit(1);
*/

});

//そのうち
//全体地図を表示
app.get('/static/view.html', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//地図上で指定したユーザーの位置を表示するHTMLを出力
app.get('/view', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//過去に記録したデータを地図上にプロット
//リプレイ実装するならそれでいいんじゃないの説
app.get('/view_data', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//ユーザー情報を表示
app.get('/home/*', function(req, res){
    util.setConsolelog(req);
    
//    console.log();
    var userid = req.url.split('/')[2];

    if (userid === undefined) {
        res.status(404).send('Sorry, we cannot find that!!');
        return;
    }

    UserInfo.findOne(
        {userid : userid},
        function (err, result) {
            if (err || result === null) {
                res.status(404).send('Sorry, we cannot find that!');
            } else {
                var username = result.nickname + '(' + userid + ')';
                
                res.render('userhome',
                           {userid      : userid,
                            nickname    : result.nickname,
                            username    : username,
                            twitter     : result.twitter,
                            web         : result.web,
                            description : result.description
                           }
                          );
            }
        }
    );
});


//そのうち
//ユーザ作成
app.get('/create_user', function(req, res){
    util.setConsolelog(req);

    res.render('create_user',
               {}
              );
});

//ユーザ作成
app.post('/create_user', function(req, res){
    util.setConsolelog(req);

    console.log('nickname:'     + req.body.nickname);
    console.log('email:'          + req.body.email);
    console.log('username:'          + req.body.username);
    console.log('password:'     + req.body.password);
    console.log('password2:'         + req.body.password2);


    //todo ユーザ存在チェック
    
/*
    var _User = new UserInfo();
    _User.userid   = req.body.username;
    _User.nickname = req.body.nickname;
    _User.password = getHash(req.body.password);
    _User.email    = req.body.email;
*/

//    _User.save();


    util.inspect(req.body);
    
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//パスワード変更受付
app.post('/change_password_request', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});


//--------- /user -----------

//優先度高め
//ユーザー名のpng画像を返す
app.get('/user/*.png', function(req, res){
    util.setConsolelog(req);
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

//ユーザ情報の編集ページを表示
app.get('/user', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);

    UserInfo.findOne(
        {userid : req.user.userid},
        function (err, result) {
            if (err || result === null) {
                res.status(404).send('Sorry, we cannot find that!');
            } else {
                res.render('user',
                           {userid      : req.user.userid,
                            nickname    : result.nickname,
                            twitter     : result.twitter,
                            ust         : result.ust,
                            jtv         : result.htv,
                            nicolive    : result.nicolive,
                            web         : result.web,
                            description : result.description,
                            show        : Boolean(result.show),
                            speed       : Boolean(result.speed),
                            popup       : result.popup
                           }
                          );
            }
        }
    );
});

//いつかやる
//過去に保存したデータをGPXフォーマットでダウンロード
app.get('/user/gpx', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);
    console.log('id:' + req.query.id);

    res.set('Content-Type', 'text/xml; charset=utf-8');
    res.status(404).send('Sorry, we cannot find that!\n' + util.getHash(req.query.id + '0000'));
});

//ユーザー情報を更新
//RESTFulならPUT
app.post('/user/update_userinfo', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid);

    //パスワード変更判定
    var passwd = '';
    if (req.body.password){
        passwd = util.getHash(req.body.password);
    } else {
        passwd = req.user.password;
    }

    //ユーザデータ更新処理
    UserInfo.update(
        {userid : req.user.userid},
        {$set : { password    : passwd,
                  nickname    : req.body.nickname,
                  ust         : req.body.ust,
                  jtv         : req.body.jtv,
                  nicolive    : req.body.nicolive,
                  show        : req.body.show,
                  web         : req.body.web,
                  description : req.body.description,
                  popup       : req.body.popup,
                  speed       : req.body.speed,
                  twitter     : req.body.twitter
                }
        },
        {upsert : false, multi : false },
         function(err, results) {
            var d={};
            if (err) {
                d.result = 0;
                d.errmsg = err;
            } else {
                d.result = 1;
            }
            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(d) + ')'); 
        }
    );
});

//そのうち
//指定した過去データを削除
//RESTFulならDELETE
app.get('/user/delete_data', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);
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
    util.setConsolelog(req);
    console.log('id:' + req.query.id);
    console.log('flag:' + req.query.flag);

    var d={};
    d.result = 0;
    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(d) + ')'); 
});

//指定したユーザーの情報を取得
app.get('user/getuserinfo', function(req, res){
    util.setConsolelog(req);
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
                    d.name         = result.nickname    ;
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
//座標データを登録します
app.post('/api/post', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid);

    var locinfo = new LocInfo();
    locinfo.valid          = true;
    locinfo.time           = req.body.time;
    locinfo.user           = req.user.userid;
    locinfo.nickname       = req.user.nickname;
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
    util.setConsolelog(req);

    //直近5分以内にデータ送信のあったユーザをアクティブとする
    LocInfo.aggregate(
        {$match : {time : {"$gte" : util.addMinutes(new Date, -5)}}},
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
    util.setConsolelog(req, ' user:' + req.query.user);

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
        {$or : req_user, time:{"$gte" : util.addMinutes(new Date, -5)}},
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
                    {user : result[i], time:{"$gte" : util.addMinutes(new Date, -5)}},
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
    util.setConsolelog(req);
    console.log('lat:' + req.query.lat);
    console.log('lon:' + req.query.lon);

    res.set('text/plain; charset=utf-8');
    res.send('');
});

//--------- -----------

//優先度高め
//指定したユーザーの情報を取得
app.get('/api/getuserinfo', function(req, res){
    util.setConsolelog(req);
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
    util.setConsolelog(req);
    console.log('group:' + req.query.group);

    console.log(util.addMinutes(new Date(),-1));
    util.inspect(util.getHash("hoge"));
    

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
    util.setConsolelog(req);
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
    util.setConsolelog(req);
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
    util.setConsolelog(req);
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
    util.setConsolelog(req);
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
    util.setConsolelog(req);
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
    util.setConsolelog(req);
    util.inspect(req.body);
    
    //指定した時間-5分くらいのユーザデータを消す？
    
    res.send('OK');
});

//ログインテスト
app.get('/api/logintest', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid + ":" + req.user.password);
    
    //ユーザー登録APIを作るまでの暫定対応
    //todo 本家鯖からユーザー名のpng画像を取得する

    res.send('OK');
});

//テスト用
app.get('/api/test.png',  function(req, res){
    util.setConsolelog(req, req.query.userid);
    //http://qiita.com/EafT/items/d5afef65081b7fdf60cc

    if(!req.query.userid){
        res.status(404).send('invalid requests!');
        return;
    }
    var font = '30px Impact';

    var canvas = new Canvas(10, 20);
//    var Image = Canvas.Image;
    var ctx = canvas.getContext('2d');
    ctx.font = font;
    var te = ctx.measureText(req.query.userid);
    utill.inspect(te);

    canvas = new Canvas(te.width, te.emHeightAscent + te.actualBoundingBoxDescent);
    ctx = canvas.getContext('2d');
    ctx.font = font;
//    ctx.rotate(.1);
    ctx.fillStyle = 'rgba(128, 100, 162,1)';

    ctx.fillText(req.query.userid, 0, 0);

//    var te = ctx.measureText(req.query.userid);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.lineTo(0, 102);
    ctx.lineTo(0 + te.width, 102);
    ctx.stroke();

    utill.inspect(te);

//    console.log('<img src="' + canvas.toDataURL() + '" />');
//    var imagedata;
console.log("1");

    //http://www.html5.jp/canvas/how3.html
    var filename = "/tmp/" + req.query.userid + ".png" ;
    var buffer = new Buffer(canvas.toDataURL().split(',')[1], 'base64');
    fs.writeFile(filename, buffer, function(){
        console.log("saved to " + filename);
    });

    fs.readFile(filename,
                function(err, data){
                    if (err) {
                        //なければ本家から取得する
                        res.status(404).send('Sorry, we cannot find that!');
                    } else {
                        res.send(data, { 'Content-Type': 'image/png' }, 200);
                    }
                }
               );


//    res.send('OK');
});


//サーバー起動
http.createServer(app).listen(app.get('port'), function(){
  console.log('[INFO] ImacocoNow server listening on port: ' + app.get('port'));
//  console.log('['+ cyan +'INFO' + reset + '] ImacocoNow server listening on port: ' + app.get('port'));

});
