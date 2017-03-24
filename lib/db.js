/***********************************************************
 *  今ココなう！クライアント向け互換サーバスクリプト       *
 *  DBモジュール                                           *
 *  Copyright (c) 2016 @Hamache9821                        *
 *  Released under the MIT license                         *
 *  http://opensource.org/licenses/mit-license.php         *
 ***********************************************************/
"use strict";

const mongoose = require('mongoose')
    , config = require('config');

//--------- MongoDB設定 -----------
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

//ニックネーム表示ファイル保持モデル
const NicknameSchema = new mongoose.Schema({
    filename      : {type: String, required: true},
    data          : {type: String}
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

//逆ジオキーディング保持モデル
const GeocoderSchema = new mongoose.Schema({
    location            : {type: Array, required: true},
    formatted_address   : {type: String},
    route               : {type: String},
    sublocality_level_4 : {type: String},
    sublocality_level_3 : {type: String},
    sublocality_level_2 : {type: String},
    sublocality_level_1 : {type: String},
    ward                : {type: String},
    city                : {type: String},
    prefecture          : {type: String},
    country             : {type: String},
    postal_code         : {type: String}
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

module.exports = {'UserInfo'    : db.model('User', UserSchema)
                 ,'LocInfo'     : db.model('Locinfo', LocSchema)
                 ,'NicknameInfo': db.model('Nickname', NicknameSchema)
                 ,'GeocodeInfo' : db.model('Geocoder', GeocoderSchema)
                 };
