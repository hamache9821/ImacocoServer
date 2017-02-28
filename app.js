/***********************************************************
 *  今ココなう！クライアント向け互換サーバスクリプト       *
 *                                                         *
 *  Copyright (c) 2016-2017 @Hamache9801                   *
 *  Released under the MIT license                         *
 *  http://opensource.org/licenses/mit-license.php         *
 ***********************************************************/
"use strict";

//api仕様
//http://www.imacoconow.net/api.html

//括り文字の使い分け ex node:'' mongo:""

const config = require('config');

//必須設定チェック
if (!config.dbHost) {throw 'config `dbHost` is not set';}
if (!config.dbName) {throw 'config `dbName` is not set';}
if (!config.googlemap_api_key) {
    console.log('[\u001b[33mWARN\u001b[0m] config `googlemap_api_key` is not set');
}


//モジュール宣言
require('date-utils');

const util = require('./lib/common-utils.js')
    , fs = require('fs')
    , http = require('http')
    , express = require('express')
    , app = express()
    , domain = require('express-domain-middleware')
    , bodyParser = require('body-parser')
//    , mongoose = require('mongoose')
    , passport = require('passport')
    , BasicStrategy = require('passport-http').BasicStrategy
    , geocoder = require('geocoder')
    , locapos = require('locapos')
    , compression = require('compression')
    , db2 = require('./lib/db.js');


//グローバル変数
global.latest = {};
global.user_list = {};

//console.log(db2.UserInfo);


//Express関係
app.use(compression());
app.use(domain);
app.use(function(err, req, res, next) {logger.error.fatal(err);}); //例外ハンドラ
app.use(bodyParser.urlencoded({extended: true}));
app.use(passport.initialize());
app.use(passport.session());
app.set('port', config.port || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


//--------- MongoDB設定 -----------
/*
mongoose.Promise = global.Promise;
const db = mongoose.createConnection('mongodb://' + config.dbHost + '/' + config.dbName, function(error, res){});

//ユーザ認証モデル
const UserSchema = new mongoose.Schema({
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
const LocSchema = new mongoose.Schema({
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
*/

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

//DB定義
//var UserInfo = db.model('User', UserSchema);
//var LocInfo  = db.model('Locinfo', LocSchema);



//認証ロジック
//互換性維持のためにbasic認証
passport.use(new BasicStrategy(
    function(userid, password, done) {
        process.nextTick(function(){
            db2.UserInfo.findOne({ userid: userid }, function (err, user) {
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
//アクセス制限フィルター
app.use(function(req, res, next){
    //リプレイ作成用urlはlocalhost以外からはアクセスさせない
    if (/^\/api\/replay\/.*/.test(req.url) && !/^localhost/.test(req.headers.host)){
        console.log('[\u001b[33mWARN\u001b[0m] Unauthorized access ' + req.url + '');
        res.status(418).send('Cannot GET ' + req.url);
        return;
    } else {
        next();
    }
});


//静的なファイルのルーティング
app.use(express.static('wui'));


//外部サービスデータ取得
if (config.use_relay_service) {
    getRelayData();
}

//位置情報取得タイマ
getLatest();

//ユーザ情報取得タイマ
getUserList()


//test API
app.get('/api/test', function(req, res){
    util.setConsolelog(req,'');
    res.send('OK'+ util.getHash( '0000'));
});


//今ココリプレイ
app.get('/replay', function(req, res){
    util.setConsolelog(req);
    res.redirect(301, '/replay/date/' + new Date().toFormat("YYYYMMDD") );
});


//今ココリプレイ
app.get('/replay/date/*', function(req, res){
    util.setConsolelog(req);
    var day = '';

    try{
         day = req.url.split('/')[3].replace('.json','');
    } catch(e){
        console.log('error!!');
    }

    //日付を簡易チェックしてだめなら当日を入れる
    if (!/^[0-9]{8}$/.test(day)) {
        day = new Date().toFormat("YYYYMMDD");
    }

    res.render('replay',
               {service_name : config.service_name,
                api_key      : config.googlemap_api_key,
                today        : day
                }
              );
});


// todo: GPS Live Tracking をv3に移植する
app.get('/gpslive', function(req, res){
    util.setConsolelog(req);

    res.render('gpslive',
               {service_name : config.service_name}
              );
});


//全体地図を表示
app.get('/static/view.html', function(req, res){
    util.setConsolelog(req);
    res.redirect(301, '/view');
});


//地図上で指定したユーザーの位置を表示するHTMLを出力
app.get('/view', function(req, res){
    util.setConsolelog(req);

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
               {service_name: config.service_name,
                title       : title,
                user        : JSON.stringify(req.query.user),
                trace_user  : req.query.trace,
                region      : JSON.stringify(region),
                sensor      : Boolean(req.query.sensor),
                map_style   : req.query.mapstyle,
                api_key     : config.googlemap_api_key
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

    db2.UserInfo.findOne(
        {userid : userid},
        function (err, result) {
            if (err || result === null) {
                res.status(404).send('Sorry, we cannot find that!');
            } else {
                var username = result.nickname + '(' + userid + ')';

                res.render('userhome',
                           {service_name: config.service_name,
                            userid      : userid,
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
               {service_name: config.service_name}
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
        db2.UserInfo.findOne(
            {email : req.body.email},
            function (err, result) {
                var d={};

                if (err && result === null) {
                    d.result = 0;
                    d.errmsg = 'db err';
                    res.set('Content-Type', 'text/javascript; charset=utf-8');
                    res.send('(' + JSON.stringify(d) + ')'); 
                } else if (result === null){
                    db2.UserInfo.findOne(
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
                                var _User = new db2.UserInfo();
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
    
    console.log(config.locapos_client_id);
    if (config.locapos_client_id) {
        locapos_url = 'https://locapos.com/oauth/authorize'
                    + '?response_type=token'
                    + '&redirect_uri=' + encodeURIComponent(config.locapos_redirect_url)
                    + '&state='        + encodeURIComponent(req.user.userid)
                    + '&client_id='    + encodeURIComponent(config.locapos_client_id);
    }

    db2.UserInfo.findOne(
        {userid : req.user.userid},
        function (err, result) {
            if (err || result === null) {
                res.status(404).send('Sorry, we cannot find that!');
            } else {
                res.render('user',
                           {service_name  : config.service_name,
                            userid        : req.user.userid,
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
    db2.UserInfo.update(
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
app.get('/user/getuserinfo', function(req, res){
    getuserinfo(req, res);
});

//--------- /api 座標関係 -----------
//座標データを登録します
app.post('/api/post', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid + ' ' + req.body.time);

    var locinfo = new db2.LocInfo();
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

    try{
        //locaposにデータ送信
        if (req.user.locapos_token != undefined) {
            var client = new locapos(req.user.locapos_token);
            client.locations.update(req.body.lat, req.body.lon, req.body.gpsd, {},
                                    function(err,res) {
                                        if (res) {console.log('ok');}
                                    });
        }
    } catch(e){
        console.log('locapos error!!');
    }
});

//現在のユーザー一覧を取得
app.get('/api/user_list', function(req, res){
    util.setConsolelog(req);

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send('(' + JSON.stringify(global.user_list) + ')'); 
});

//最新の位置情報を取得
app.get('/api/latest', function(req, res){
    util.setConsolelog(req, ' user:' + req.query.user);

    //ユーザ絞込み
    switch (req.query.user){
        case undefined:
        case 'all':
            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(global.latest) + ')'); 
            break;
        default:
            var temp = req.query.user.split(',');
            var points = global.latest.points;

            var tmp = points.filter(function(item, index){
              if (temp.indexOf(item.user) != -1) return true;
            });

            var resp ={};
            resp.result = global.latest.result;
            resp.point = tmp;

            res.set('Content-Type', 'text/javascript; charset=utf-8');
            res.send('(' + JSON.stringify(resp) + ')'); 
    }
    return;
});

//近接ユーザの位置情報を取得
//テスト実装なので無保証
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
    db2.LocInfo.distinct(
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
                d.err    = err;
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
                db2.LocInfo.find(
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
    getuserinfo(req, res);
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
    //unix-timeなりで消去したい期間を渡す？
    res.send('OK');
});

//ログインテスト
app.get('/api/logintest', passport.authenticate('basic', { session: false }), function(req, res){
    util.setConsolelog(req, req.user.userid + ":" + req.user.password);
    res.send('OK');
});


//リプレイ用データ作成
app.get('/api/replay/latest/*', function(req, res){
    util.setConsolelog(req);
    var day = '';

    try{
         day = req.url.split('/')[4].replace('.json','');
    } catch(e){
        console.log('error!!');
    }

    //日付を簡易チェックしてだめなら当日を入れる
    if (!/^[0-9]{12}$/.test(day)) {
        day = new Date().toFormat("YYYYMMDDHH24MI");
    }

    var d1 = new Date(day.slice(0,4),parseInt(day.slice(4,6)) -1, day.slice(6,8),day.slice(8,10),day.slice(10),0);
    var d2 = new Date(d1.getTime() +  60000 -1);

    //ユーザ座標
    var points = [];
    var latest = {};

    //現在オンラインのユーザー探す
    db2.LocInfo.distinct(
        "user",
        { time : { "$gte" : d1, "$lte" : d2}},
        function(err, result){
            //何かしらのエラー
            if (err) {
                latest.result = 0;
                latest.errmsg = 'api/latest is error.(distinct)';
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send(JSON.stringify(latest) ); 
                return;
            }

            //該当ユーザなし
            if (result.length === 0) {
                latest.result = 1;
                latest.points = points;
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send(JSON.stringify(latest) ); 
                return;
            }

            //オンラインユーザの直近の位置を取得
            for (var i = 0; i < result.length; i++) {
                db2.LocInfo.find(
                    {user : result[i], time : { "$gte" : d1, "$lte" : d2}},
                    {_id : 0, __v : 0, time : 0, flag : 0, saved : 0,location : 0, relay_service : 0},

                    function(err, results){
                        points.push(results[0]);

                        if (points.length >= result.length){
                            latest.result = 1;
                            latest.points = points;

                            res.set('Content-Type', 'text/javascript; charset=utf-8');
                            res.send(JSON.stringify(latest) ); 
                       }
                    }
                ).sort({time: -1}).limit(1);
            }
        }
    );
});


//リプレイ用ニックネーム作成
app.get('/api/replay/nickname/*', function(req, res){
    util.setConsolelog(req);
    var day = '';

    try{
         day = req.url.split('/')[4].replace('.json','');
    } catch(e){
        console.log('error!!');
    }

    //日付を簡易チェックしてだめなら当日を入れる
    if (!/^[0-9]{8}$/.test(day)) {
        day = new Date().toFormat("YYYYMMDD");
    }

    var d1 = new Date(day.slice(0,4), parseInt(day.slice(4,6)) -1, day.slice(6,8), 0, 0, 0);
    var d2 = new Date(day.slice(0,4), parseInt(day.slice(4,6)) -1, day.slice(6,8), 23, 59, 59);

    db2.LocInfo.aggregate(
        {$match : {time : {"$gte" : d1, "$lte" : d2}}},
        {$group : {_id  : {user : "$user",
                           nickname  : "$nickname"
                          }
                  }
        },
        function (err, result){
            if (err) {
                console.log(err);
            } else {
                var _res = {};

                for (var i = 0; i < result.length; i++) {
                    var ary={};
                    ary.nickname = result[i]['_id'].nickname;
                    ary.nickicon =  util.getMD5Hash(result[i]['_id'].nickname);

                    var filename = util.getUserNameImg(ary.nickicon, ary.nickname, '#ffffff');

                    _res[result[i]['_id'].user]= ary;
                }
                res.set('Content-Type', 'text/javascript; charset=utf-8');
                res.send(JSON.stringify(_res)); 
            }
        }
    );
});

//サーバー起動
http.createServer(app).listen(app.get('port'), function(){
  console.log('[INFO] ImacocoNow server listening on port: ' + app.get('port'));
//  console.log('['+ cyan +'INFO' + reset + '] ImacocoNow server listening on port: ' + app.get('port'));

});


//===============共通処理 ===============
/* 指定したユーザーの情報を取得
   呼出元：
        /api/getuserinfo
        /user/getuserinfo
*/
function getuserinfo(req, res) {
    util.setConsolelog(req);
    console.log('user:' + req.query.user);

    if (req.query.user === undefined){
        var d={};
        d.result = 0;

        res.set('Content-Type', 'text/javascript; charset=utf-8');
        res.send('(' + JSON.stringify(d) + ')'); 

    } else {
console.log('db2');
        db2.UserInfo.findOne(
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
}


/* 最新の位置情報を取得（タイマ処理）
    呼出元：
        /api/latest
*/
function getLatest(){
    setInterval(function(){
        //ユーザ座標
        var points = [];

        //現在オンラインのユーザー探す
        db2.LocInfo.distinct(
            "user",
            { time:{"$gte" : util.addMinutes(new Date, -5)}},
            function(err, result){
                //何かしらのエラー
                if (err) {
                    global.latest.result = 0;
                    global.latest.errmsg = 'api/latest is error.(distinct)';
                    return;
                }

                //該当ユーザなし
                if (result.length === 0) {
                    global.latest.result = 1;
                    global.latest.points = points;
                    return;
                }

                //オンラインユーザの直近の位置を取得
                for (var i = 0; i < result.length; i++) {
                    db2.LocInfo.find(
                        {user : result[i], time:{"$gte" : util.addMinutes(new Date, -5)}},
                        {_id : 0, __v : 0, time : 0, flag : 0, saved : 0,location : 0, relay_service : 0},

                        function(err, results){
                            points.push(results[0]);

                            if (points.length >= result.length){
                                global.latest.result = 1;
                                global.latest.points = points;
                                //todo グループ機能やることがあれば対応
                                //そもそもAPI仕様書に存在しない
                                //d.group_updated = false;
                           }
                        }
                    ).sort({time: -1}).limit(1);
                }
            }
        );
    }, config.latest_refresh_time);
}


/* 現在のユーザー一覧を取得
    呼出元：
        /api/user_list
*/
function getUserList(){
    setInterval(function(){
        //直近5分以内にデータ送信のあったユーザをアクティブとする
        db2.LocInfo.aggregate(
            {$match : {time : {"$gte" : util.addMinutes(new Date, -5)}}},
            {$group : {_id  : {valid : "$valid",
                               user  : "$user"
                              }
                      }
            },
            function (err, result){
                var list = [];

                if (err) {
                    global.user_list.result = 0;
                    global.user_list.errmsg = 'api/user_list is error.';
                    console.log(err);
                } else {
                    for (var i = 0; i < result.length; i++) {
                        list.push(result[i]['_id']);
                    }
                    global.user_list.result = 1;
                    global.user_list.list = list;
                }
            }
        );
    }, config.latest_refresh_time);
}


//外部サービス情報を取得
function getRelayData(){
    setInterval(function(){
        var url = config.relay_service_url1;
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
                        var locinfo = new db2.LocInfo();
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
    }, config.relay_service_refresh_time1);

    //ユーザ名画像作成
    setInterval(function(){
        var url = config.relay_service_url1;
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
                    
                    for (var x = 0; x < points.length; x++){
                        //nickname画像生成 todo uid重複チェック
                        var filename = util.getUserNameImg(points[x].user, points[x].nickname, '#f5f6ce');
                    }
                    //console.log('setDorakokoImg');
                } catch(e){
                    console.log('error!!');
                }
            });
        }).on('error', function(e){
            console.log(e.message); //エラー時
        });
    }, config.relay_service_refresh_time2);
}
