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

//ろけぽす連携
var locapos_client_id = 'rkUfa9ey6WFXKa1LtrWzZe4zYllCuxIjh+/1yHG7Omg2hl0r';
var locapos_redirect_url = 'http://imacoco.589406.com/user';

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
var geocoder = require('geocoder');
var locapos = require('locapos');

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
mongoose.Promise = global.Promise;
var db = mongoose.createConnection('mongodb://' + dbHost + '/' + dbName, function(error, res){});

//ユーザ認証モデル
var UserSchema = new mongoose.Schema({
    userid        : {type: String, required: true},
    password      : {type: String, required: true},
    email         : {type: String, required: true},
    nickname      : {type: String, required: true},
    ust           : {type: String},
    jtv           : {type: String},
    nicolive      : {type: String},
    show          : {type: String},
    web           : {type: String},
    description   : {type: String},
    popup         : {type: String},
    speed         : {type: String},
    twitter       : {type: String},
    locapos_token : {type: String},
    locapos_valid : {type: Boolean}
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
    saved          : {type: String},
    relay_service  : {type: String},
    location       : {type: Array}
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
//互換性維持のためにbasic認証
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
              return done(null, user);
            });
        });
    }
));

//--------- 全体向け -----------
//静的なファイルのルーティング
app.use(express.static('wui'));

//
getRelayData();

app.get('/api/test', function(req, res){
    util.setConsolelog(req,'');
    res.send('OK');
});

//そのうち
//今ココリプレイ用
app.get('/replay*', function(req, res){
    util.setConsolelog(req);

//    var day =req.url.split('/')[3].replace('.json','');

    res.render('replay',
               {today : '20160525',
                yesterday : '20160524'
                
                
                }
              );
});

/*
var timer = setInterval(function(){
    console.log('timer');
    
    
    }, 5000);
*/


//そのうち
//今ココリプレイ用
app.get('/replay/date/*', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち
//今ココリプレイ用
app.get('/api/json/*.json', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');

    var day =req.url.split('/')[3].replace('.json','');
    //http://momentjs.com/timezone/
    //http://qiita.com/masato/items/32464b45c78962cb5831
    
    
    util.inspect(day);

    var gt_date = new Date(day.substr(0, 4), day.substr(4, 2) - 1, day.substr(6, 2),  0,  0,  0,0);
    var lt_date = new Date(day.substr(0, 4), day.substr(4, 2) - 1, day.substr(6, 2), 23, 59, 59,0);

/*
    /api/latestの処理をベースに一日分抽出したらできそうだけど、負荷を考えないと
    //リアルタイム集計はさすがに負荷が高すぎるので、バッチ処理で専用テーブル持ったほうがよさげ

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
/*
    //ユーザ座標
    var points = [];
    var day_points = [];

    //現在オンラインのユーザー探す
    LocInfo.distinct(
        "user",
        {time:{"$gte" : gt_date, "$lte" : lt_date}},
        function(err, result){
            //何かしらのエラー
            if (err) {
                var d    = {};
                d.result = 0;
                d.errmsg = 'api/json is error.(distinct)';
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

            for (var x = 0; x < 1440; x++) {
//util.inspect(x);

                //オンラインユーザの直近の位置を取得
                for (var i = 0; i < result.length; i++) {
//                    console.log(x + ':' + result[i] );

                    LocInfo.find(
                        {user : result[i], time:{"$gt" : util.addMinutes(gt_date, x), "$lt" : util.addMinutes(gt_date, x + 1)}},
                        {_id : 0, __v : 0, time : 0, flag : 0, saved : 0},

                        function(err, results){
                            if (results[0] != undefined){
                                points.push(results[0]);
//                                util.inspect(results[0]);
                            }
                            if (points.length >= result.length){

                                var d={};
                                d.result = 1;
                                d.points = points;
                                
                                day_points.push(d);
//                                util.inspect(day_points);

                              //  res.set('Content-Type', 'text/javascript; charset=utf-8');
                              //  res.send('(' + JSON.stringify(d) + ')');
                           }
                           
                        }
                    ).sort({time: -1}).limit(1);
                    


                }
            // util.inspect(day_points);
             
            }
            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(day_points) + ')');
        }
    );
*/

});


//今ココリプレイ用
app.get('/api/json2/*.json', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');

    var day =req.url.split('/')[3].replace('.json','');
    //http://momentjs.com/timezone/
    //http://qiita.com/masato/items/32464b45c78962cb5831
    
    //todo static file にしたほうが負荷減る？
    util.inspect(day);
    var s = new Date(1331209044000).toISOString();

    var gt_date = new Date(day.substr(0, 4), day.substr(4, 2) - 1, day.substr(6, 2),  0,  0,  0,0);
    var lt_date = new Date(day.substr(0, 4), day.substr(4, 2) - 1, day.substr(6, 2), 23, 59, 59,0);

/*
    /api/latestの処理をベースに一日分抽出したらできそうだけど、負荷を考えないと
    //リアルタイム集計はさすがに負荷が高すぎるので、バッチ処理で専用テーブル持ったほうがよさげ

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
/*
    //ユーザ座標
    var points = [];
    var day_points = [];

    //現在オンラインのユーザー探す
    LocInfo.distinct(
        "user",
        {time:{"$gte" : gt_date, "$lte" : lt_date}},
        function(err, result){
            //何かしらのエラー
            if (err) {
                var d    = {};
                d.result = 0;
                d.errmsg = 'api/json is error.(distinct)';
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

            for (var x = 0; x < 1440; x++) {
//util.inspect(x);

                //オンラインユーザの直近の位置を取得
                for (var i = 0; i < result.length; i++) {
//                    console.log(x + ':' + result[i] );

                    LocInfo.find(
                        {user : result[i], time:{"$gt" : util.addMinutes(gt_date, x), "$lt" : util.addMinutes(gt_date, x + 1)}},
                        {_id : 0, __v : 0, time : 0, flag : 0, saved : 0},

                        function(err, results){
                            if (results[0] != undefined){
                                points.push(results[0]);
//                                util.inspect(results[0]);
                            }
                            if (points.length >= result.length){

                                var d={};
                                d.result = 1;
                                d.points = points;
                                
                                day_points.push(d);
//                                util.inspect(day_points);

                              //  res.set('Content-Type', 'text/javascript; charset=utf-8');
                              //  res.send('(' + JSON.stringify(d) + ')');
                           }
                           
                        }
                    ).sort({time: -1}).limit(1);
                    


                }
            // util.inspect(day_points);
             
            }
            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(day_points) + ')');
        }
    );
*/

});



//全体地図を表示
app.get('/static/view.html', function(req, res){
    util.setConsolelog(req);
    res.redirect(301, '/view');
});

//地図上で指定したユーザーの位置を表示するHTMLを出力
app.get('/view', function(req, res){
    util.setConsolelog(req);

    //http://proxy2.imacoconow.com/

    var region =[];
    var title = '';

    //追跡ユーザ
    if (req.query.trace === undefined){
        req.query.trace = '__nouser__';
    }

    //表示ユーザ
    switch (req.query.user){
        case undefined:
        case 'all':
        case '':
        console.log('1');
            var tmp = [];
            tmp.push("all");
            req.query.user = tmp;
            break;
        default:
            var tmp = [];
            var ls = req.query.user.split(',');
            
            for (var i = 0; i < ls.length; i++) {
                tmp.push(ls[i]);
            }
            req.query.user = tmp;
    }

    //表示エリア
    switch (req.query.region){
        case 'hokkaido':
            title = '：地図モード（北海道）';
            region.push({'lat':45.383019, 'lon':144.920654 });
            region.push({'lat':41.47566,  'lon':139.75708 });
            break;
        case 'tohoku':
            title = '：地図モード（東北）';
            region.push({'lat':40.934265, 'lon':142.058716 });
            region.push({'lat':38.565348, 'lon':139.334106 });
            break;
        case 'tokyo':
            title = '：地図モード（関東）';
            region.push({'lat':35.951329861522666, 'lon':139.01275634765625 });
            region.push({'lat':35.26580442886754,  'lon':140.25283813476562 });
            region.push({'lat':35.266925688950074, 'lon':139.04983520507812 });
            region.push({'lat':35.968003617226884, 'lon':140.21575927734375 });
            break;
        case 'hokuriku':
            title = '：地図モード（北陸）';
            region.push({'lat':35.469618, 'lon':135.362549 });
            region.push({'lat':37.905199, 'lon':139.042969 });
            break;
        case 'nagoya':
            title = '：地図モード（中京）';
            region.push({'lat':35.64836915737426,  'lon':136.2249755859375 });
            region.push({'lat':34.279914398549934, 'lon':138.1805419921875 });
            break;
        case 'osaka':
            title = '：地図モード（関西）';
            region.push({'lat':35.64836915737426, 'lon':136.2249755859375 });
            region.push({'lat':33.8339199536547,  'lon':134.1485595703125 });
            break;
        case 'kyusyu':
            title = '：地図モード（九州）';
            region.push({'lat':33.92513,  'lon':131.973267 });
            region.push({'lat':31.071756, 'lon':129.578247 });
            break;
        case undefined:
        case 'japan':
        default:
            title = '：地図モード（全国）';
            region.push({'lat':25.99755, 'lon':126.738281 });
            region.push({'lat':45.521744, 'lon':145.283203 });
            break;
    }

    //現在位置
    if (req.query.sensor === undefined){
        req.query.sensor = false;
    }

    if (req.query.mapstyle === undefined){
        req.query.mapstyle = '';
    }


    //todo　センサとマップタイプ
    res.render('index',
               {title       : title,
                user        : JSON.stringify(req.query.user),
                trace_user  : req.query.trace,
                region      : JSON.stringify(region),
                sensor      : Boolean(req.query.sensor),
                map_style   : req.query.mapstyle
               }
              );
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

//新規ユーザ作成
app.get('/create_user', function(req, res){
    util.setConsolelog(req);

    res.render('create_user',
               {}
              );
});

//新規ユーザ作成
app.post('/create_user', function(req, res){
    util.setConsolelog(req);
    util.inspect(req.body);

    if (req.body.username === undefined || req.body.username === ''){
        var d={};
        d.result = 0;
        d.errmsg = 'username can not be set to null';

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('(' + JSON.stringify(d) + ')'); 

    } else if (req.body.email === undefined || req.body.email === ''){
        var d={};
        d.result = 0;
        d.errmsg = 'email can not be set to null';

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('(' + JSON.stringify(d) + ')'); 

    } else {
        UserInfo.findOne(
            {email : req.body.email},
            function (err, result) {
                var d={};

                if (err && result === null) {
                    d.result = 0;
                    d.errmsg = 'db err';
                    res.set('Content-Type', 'text/javascript; charset=utf-8');
                    res.send('(' + JSON.stringify(d) + ')'); 
                } else if (result === null){
                    UserInfo.findOne(
                        {userid : req.body.username},
                        function (err, result) {
                            if (err && result === null) {
                                d.result = 0;
                                d.errmsg = 'db err';
                            } else if (result === null){

                                if (req.body.nickname === ''){
                                    req.body.nickname = req.body.username;
                                }

                                //ユーザー作成
                                var _User = new UserInfo();
                                _User.userid   = req.body.username;
                                _User.nickname = req.body.nickname;
                                _User.password = util.getHash(req.body.password);
                                _User.email    = req.body.email;
                                _User.save();

                                //nickname画像生成
                                var filename = util.getUserNameImg(req.body.username, req.body.nickname, '#ffffff');

                                d.result = 1;
                                d.errmsg = 'ok';

                            } else {
                                d.result = 0;
                                d.errmsg = 'username is already exists';
                            }

                            res.set('Content-Type', 'text/javascript; charset=utf-8');
                            res.send('(' + JSON.stringify(d) + ')'); 
                        }
                    );

                } else {
                    d.result = 0;
                    d.errmsg = 'email is already exists';
                    res.set('Content-Type', 'text/javascript; charset=utf-8');
                    res.send('(' + JSON.stringify(d) + ')'); 
                }
            }
        );
    }
});

//そのうち
//パスワード変更受付
app.post('/change_password_request', function(req, res){
    util.setConsolelog(req);
    res.status(404).send('Sorry, we cannot find that!');
});

//--------- /user -----------
//ユーザー名のpng画像を返す
app.get('/user/*.png', function(req, res){
//    util.setConsolelog(req);
//    console.log(req.url);

    fs.readFile('./wui/img' + req.url,
                function(err, data){
                    if (err) {
                        //todo なければ生成を試みる？
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
    
    var locapos_url = '';
    
    if (locapos_client_id != '') {
        locapos_url = 'https://locapos.com/oauth/authorize'
                    + '?response_type=token'
                    + '&redirect_uri=' + encodeURIComponent(locapos_redirect_url)
                    + '&state=' + encodeURIComponent(req.user.userid)
                    + '&client_id=' + encodeURIComponent(locapos_client_id);
    }
    
    
    UserInfo.findOne(
        {userid : req.user.userid},
        function (err, result) {
            if (err || result === null) {
                res.status(404).send('Sorry, we cannot find that!');
            } else {
                res.render('user',
                           {userid        : req.user.userid,
                            nickname      : result.nickname,
                            twitter       : result.twitter,
                            ust           : result.ust,
                            jtv           : result.htv,
                            nicolive      : result.nicolive,
                            web           : result.web,
                            description   : result.description,
                            show          : Boolean(result.show),
                            speed         : Boolean(result.speed),
                            popup         : result.popup,
                            locapos_url   : locapos_url,
                            locapos_token : result.locapos_token
                           }
                          );
            }
        }
    );
});


//
app.get('/gpslive', function(req, res){
    util.setConsolelog(req);

    res.render('gpslive',
               {}
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

    //todo locapos_valid

    //ユーザデータ更新処理
    UserInfo.update(
        {userid : req.user.userid},
        {$set : { password      : passwd,
                  nickname      : req.body.nickname,
                  ust           : req.body.ust,
                  jtv           : req.body.jtv,
                  nicolive      : req.body.nicolive,
                  show          : req.body.show,
                  web           : req.body.web,
                  description   : req.body.description,
                  popup         : req.body.popup,
                  speed         : req.body.speed,
                  twitter       : req.body.twitter,
                  locapos_token : req.body.locapos_token
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

            //nickname画像生成
            var filename = util.getUserNameImg(req.user.userid, req.body.nickname, '#ffffff');

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
    util.setConsolelog(req, req.user.userid + ' ' + req.body.time);

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
    locinfo.location = [parseFloat(req.body.lon), parseFloat(req.body.lat)];

    locinfo.save(function(err){
        if(err){
            res.send('NG');
        } else {
            res.send('OK');
        }
    });
    
    //locaposにデータ送信
    if (req.user.locapos_token != undefined) {
        var client = new locapos(req.user.locapos_token);
        client.locations.update(req.body.lat, req.body.lon, req.body.gpsd, {},
                                function(err,res) {
                                    if (res) {console.log('ok');}
                                });
    }
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

    //https://www.npmjs.com/package/litecache

    //ユーザ座標
    var points = [];
    var req_user = [];

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
                    {_id : 0, __v : 0, time : 0, flag : 0, saved : 0,location : 0, relay_service : 0},

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

//近接ユーザの位置情報を取得
app.get('/api/nearuser', function(req, res){
    util.setConsolelog(req, ' user:' + req.query.user);

    if (req.query.lat === undefined){
        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('({errmsg : "lat is null"})'); 
        return;
    }

    if (req.query.lon === undefined){
        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('({errmsg : "lon is null"})'); 
        return;
    }

    if (req.query.distance === undefined){
        req.query.distance = 1000;  //1km
    }

/*
Building.geoNear(
    [long, lat], 
    { maxDistance: 300, spherical: true },
    function(err, results, stats) {
        // results is an array of result objects like:
        // {dis: distance, obj: doc}
    }
);
*/

    //https://www.npmjs.com/package/litecache

    //ユーザ座標
    var points = [];
    var req_user = [];

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
        {$or : req_user,
         time:{"$gte" : util.addMinutes(new Date, -5)},
         location : { $nearSphere : 
                         {$geometry : 
                             { type : "Point",
                               coordinates : [parseFloat(req.query.lat), parseFloat(req.query.lon)]
                             },
                          $maxDistance : parseFloat(req.query.distance)
                         }
                     }
        },
        function(err, result){
            //何かしらのエラー
            if (err) {
                var d    = {};
                d.result = 0;
                d.errmsg = 'api/nearuser is error.(distinct)';
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
                    {user : result[i],
                     time : {"$gte" : util.addMinutes(new Date, -5)}
                    },
                    {_id : 0, __v : 0, time : 0, flag : 0, saved : 0,location : 0, relay_service : 0},

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

//逆ジオコード変換
app.get('/api/getaddress', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);

    geocoder.reverseGeocode(req.query.lat, req.query.lon, function ( err, data ) {
        if (data.status == 'OK'){
            res.set('text/plain; charset=utf-8');
            res.send(data.results[0].formatted_address);
        }
    }, { language: 'ja' });
});

//逆ジオコード変換(json返却)
app.get('/api/getaddress.json', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);

    geocoder.reverseGeocode(req.query.lat, req.query.lon, function ( err, data ) {
        if (data.status == 'OK'){
            res.set('text/plain; charset=utf-8');
            res.send('(' + JSON.stringify(data.results[0]) + ')');
        } else {
            res.set('text/plain; charset=utf-8');
            res.send('err');
        }
    }, { language: 'ja' });
});

//--------- -----------

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

//直近の座標を削除？
//RESTFulならDELETE
app.get('/api/delpost', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req);
    util.inspect(req.body);

    //本家はsession-idみたいなのがあったらしい
    //指定した時間-5分くらいのユーザデータを消す？
    
    res.send('OK');
});

//ログインテスト
app.get('/api/logintest', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid + ":" + req.user.password);
    res.send('OK');
});

//サーバー起動
http.createServer(app).listen(app.get('port'), function(){
  console.log('[INFO] ImacocoNow server listening on port: ' + app.get('port'));
//  console.log('['+ cyan +'INFO' + reset + '] ImacocoNow server listening on port: ' + app.get('port'));

});

//外部サービス情報を取得(20sごとに取得)
function getRelayData(){
    setInterval(function(){
        var url = 'http://dorakoko.rdy.jp/AllUser.json';
        http.get(url, function(resp){
            var body = '';
            resp.setEncoding('utf8');

            resp.on('data', function(chunk){
                body += chunk;
            });
            resp.on('end', function(resp){
                if (body.length == 0){
                    console.log('null');
                    return;
                }
                
                try{
                    var latest = JSON.parse(body.slice(1,body.length -1));
                    var points = latest.points;

                    //位置情報保存
                    for (var x = 0; x < points.length; x++){
                        var locinfo = new LocInfo();
                        locinfo.valid          =  points[x].valid;
                        locinfo.time           =  new Date;
                        locinfo.user           =  points[x].user;
                        locinfo.nickname       =  points[x].nickname;
                        locinfo.lat            =  points[x].lat;
                        locinfo.lon            =  points[x].lon;
                        locinfo.dir            =  points[x].dir;
                        locinfo.altitude       =  points[x].altitude;
                        locinfo.velocity       =  points[x].velocity;
                        locinfo.type           =  points[x].type;
                        locinfo.flag           = '1';
                        locinfo.saved          = '0';
                        locinfo.ustream_status = 'offline';
                        locinfo.relay_service  = 'dorakoko';
                        locinfo.location = [parseFloat(points[x].lon), parseFloat(points[x].lat)];

                        locinfo.save(function(err){
                            if(err){
                                console.log('err');
                            }
                        });
                    }
                } catch(e){
                    console.log('error!!');
                }
            });
        }).on('error', function(e){
            console.log(e.message); //エラー時
        });
    }, 20000);

    //ユーザ名画像作成(60sごとに生成)
    setInterval(function(){
        var url = 'http://dorakoko.rdy.jp/AllUser.json';
        http.get(url, function(resp){
            var body = '';
            resp.setEncoding('utf8');

            resp.on('data', function(chunk){
                body += chunk;
            });
            resp.on('end', function(resp){
                var latest = JSON.parse(body.slice(1,body.length -1));
                var points = latest.points;
                
                for (var x = 0; x < points.length; x++){
                    //nickname画像生成 todo uid重複チェック
                    var filename = util.getUserNameImg(points[x].user, points[x].nickname, '#f5f6ce');
                }
                //console.log('setDorakokoImg');
            });
        }).on('error', function(e){
            console.log(e.message); //エラー時
        });
    }, 60000);
}
