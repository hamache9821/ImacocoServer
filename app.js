/*
    今ココなう！クライアント向け互換サーバスクリプト

    Copyright (c) 2016 @Hamache9821
    The MIT License (MIT)
*/

//http://www.imacoconow.net/api.html

//モジュール宣言
var fs = require('fs');
var util = require('util');
var port = process.env.PORT || 80;
var basicAuth = require('basic-auth-connect');

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

//todo mongodb

//test location
 _TEST_ = {};
 _TEST_BOT_DIR_ = 0;


//todo 認証回りの仕様調査まだ
app.all('/user/*', basicAuth(function(user, password) {
     return user === 'username' && password === 'password';
}));


//そのうち
app.get('/static/view.html', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});


//そのうち
app.get('/view', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});


//そのうち
app.get('/view_data', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//わりと肝だけどあとで
app.get('/user', function(req, res){
    console.log(req.query);
    var name = "";
    if (req.query.name) {
    name = req.query.name;
    }
    res.send('');
});

//わりと肝だけどあとで auth
app.post('/user', function(req, res){
    console.log(req.query);
    var name = "";
    if (req.query.name) {
    name = req.query.name;
    }
    res.send('');
});

//いつかやる auth
app.get('/user/gpx', function(req, res){
    res.status(404).send('Sorry, we cannot find that!');
});

//そのうち auth https
app.post('/user/update_userinfo', function(req, res){
    console.log('CALL /api/update_userinfo');
    res.send('');

});

//そのうち https
app.get('/user/delete_data', function(req, res){
    console.log('CALL /api/delete_data');
    res.send('');

});

//そのうち https
app.get('/user/set_public', function(req, res){
    console.log('CALL /api/set_public');
    res.send('');

});

//わりと肝 https
app.get('user/getuserinfo', function(req, res){
    console.log('CALL /api/getuserinfo');
//    console.log(util.inspect(req.body));
    console.log('user:' + req.query.user);
    res.send('');
});

//わりと肝 auth 認証方法考える
app.post('/api/post', function(req, res){
    console.log('CALL /api/post:' );
//    console.log(util.inspect(req));
//    console.log(util.inspect(req.body));

    //todo mongodb, userIdどこに入ってるか調べる
    //テスト用にとりあえず変数に保持
    _TEST_.valid          = true;
    _TEST_.user           = "testbot2";
    _TEST_.nickname       = "testbot2";
    _TEST_.lat            = req.body.lat;
    _TEST_.lon            = req.body.lon;
    _TEST_.dir            = req.body.gpsd;
    _TEST_.altitude       = req.body.gpsh;
    _TEST_.velocity       = req.body.gpsv;
    _TEST_.type           = req.body.t;
    _TEST_.ustream_status = "offline";

    console.log(util.inspect(_TEST_));
/*
    //デバッグ用のやつ
    fs.writeFile('writetest.txt', util.inspect(req.body) , function (err) {
        console.log(err);
    });
*/
    res.send('OK');
});

//わりと肝
app.get('/api/user_list', function(req, res){
    console.log('CALL /api/user_list');
    console.log(util.inspect(req.headers));

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

        user_list ={};
        user_list.valid = true;
        user_list.user  = "testbot2";
        list.push(user_list);

        d.result = 1;
        d.list = list;
    }

    res.set('Content-Type', 'text/javascript; charset=utf-8');
    res.send("(" + JSON.stringify(d) + ")"); //そのうち書き直す
    
});

//わりと肝
app.get('/api/latest', function(req, res){
    console.log('CALL /api/latest');
    console.log(util.inspect(req.headers));

    var d={};
    var points = [];
    var latest ={};
    
    if (false){
        d.result = 0;
        d.errmsg = "err test msg.";
    } else {
        //test bot
        ++_TEST_BOT_DIR_;

        if (_TEST_BOT_DIR_ = 360)
        {
            _TEST_BOT_DIR_ = 0;
        }

        //test ほぼ大阪城
        latest ={};
        latest.valid          = true;
        latest.user           = "testbot";
        latest.nickname       = "testbot";
        latest.lat            = 34.6873316;
        latest.lon            = 135.5238653;
        latest.dir            = _TEST_BOT_DIR_;
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
    res.send("(" + JSON.stringify(d) + ")");//そのうち書き直す
});

//使ってない？ auth
app.get('/api/getaddress', function(req, res){
    console.log('CALL /api/getaddress');
    console.log(util.inspect(req.body));
    res.send('OK');

});

//わりと肝
app.get('/api/getuserinfo', function(req, res){
    console.log('CALL /api/getuserinfo');
    console.log(util.inspect(req.headers));

    res.send('OK');
});

//そのうち
app.get('/api/getgroupinfo', function(req, res){
    console.log('CALL /api/getgroupinfo');
    console.log(util.inspect(req.body));
    res.send('OK');


});

//そのうち https
app.post('/api/creategroup', function(req, res){
    console.log('CALL /api/creategroup');
    console.log(util.inspect(req.body));
    res.send('OK');


});

//そのうち https
app.post('/api/updategroup', function(req, res){
    console.log('CALL /api/updategroup');
    console.log(util.inspect(req.body));
    res.send('OK');


});

//そのうち https
app.get('/api/deletegroup', function(req, res){
    console.log('CALL /api/deletegroup');
    console.log(util.inspect(req.body));


});

//そのうち auth
app.post('/api/addmarker', function(req, res){
    console.log('CALL /api/addmarker');
    console.log(util.inspect(req.body));
    res.send('OK');


});

//そのうち auth
app.get('/api/deletemarker', function(req, res){
    console.log('CALL /api/deletemarker');
    console.log(util.inspect(req.body));
    res.send('OK');


});

//使ってない？
app.get('/api/delpost', function(req, res){
    console.log('CALL /api/delpost');
    console.log(util.inspect(req.body));
    res.send('OK');

});

//わりと肝
app.get('/api/logintest', function(req, res){
    console.log('CALL /api/logintest');
    console.log(util.inspect(req.body));
    res.send('OK');
    
});

app.listen(port);
