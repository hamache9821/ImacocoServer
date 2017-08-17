/***********************************************************
 *  今ココなう！クライアント向け互換サーバスクリプト       *
 *  共通ライブラリ                                         *
 *  Copyright (c) 2016 @Hamache9821                        *
 *  Released under the MIT license                         *
 *  http://opensource.org/licenses/mit-license.php         *
 ***********************************************************/
module.exports = (function(){
    "use strict";

    const utill = require('util')
        , crypto = require("crypto")
        , http = require('http')
        , fs = require('fs')
        , Canvas = require('canvas')
        , config = require('config')
        , db = require('./db.js');

    //console.log用定数
    const black   = '\u001b[30m'
        , red     = '\u001b[31m'
        , green   = '\u001b[32m'
        , yellow  = '\u001b[33m'
        , blue    = '\u001b[34m'
        , magenta = '\u001b[35m'
        , cyan    = '\u001b[36m'
        , white   = '\u001b[37m'
        , reset   = '\u001b[0m';

    return {
        inspect :
            function(value){
                console.log(utill.inspect(value));
            },
        getHash :
             function(target){
                var sha = crypto.createHmac('sha256', config.hashSecretKey);
                sha.update(target);
                return sha.digest('hex');
            },
        getMD5Hash :
            function (src){
                var md5hash = crypto.createHash('md5');
                md5hash.update(src, 'binary');
                return md5hash.digest('hex');
            },
        setConsolelog :
            function(req, msg){
                var s = '';
                if (msg === undefined){
                    msg = req.headers['x-forwarded-for'] + ' ' + req.headers['user-agent'];
                }

                //表示時間
                var dt = new Date();
                var formatted = dt.toFormat("YYYY/MM/DD HH24:MI:SS ");

                switch (req.method){
                    case 'GET':
                        s = '[CALL] ' + formatted + '[' + green   + req.method + reset + '] ' + req.url + ': ';
                        break;
                    case 'POST':
                        s = '[CALL] ' + formatted + '[' + magenta + req.method + reset + '] ' + req.url + ': ';
                        break;
                    default:
                        break;
                        s = '[CALL] ' + formatted + '[' + yellow  + req.method + reset + '] ' + req.url + ': ' ;
                }

                console.log(s + msg);
                return;
            },
        setConsoleInfo:
            function(msg){
                //表示時間
                var dt = new Date();
                var formatted = dt.toFormat("YYYY/MM/DD HH24:MI:SS ");
                var s = '[\u001b[32mINFO\u001b[0m] ' + formatted;

                console.log(s + msg);
                return;
            },
        addMinutes :
            function(date, minutes){
                return new Date(date.getTime() + minutes * 60000);
            },
        getUserNameImg :
            function(userid, txt, fillStyle){

                var font = '12px Roboto';
                var canvas = new Canvas(10, 20);
                var ctx = canvas.getContext('2d');
                ctx.font = font;

                //文字幅の計算
                var te = ctx.measureText(txt);

                //外枠
                canvas = new Canvas(te.width + 16, 24);
                ctx = canvas.getContext('2d');

                //背景塗りつぶし
                ctx.beginPath(); 
                ctx.moveTo(8, 0); 
                ctx.lineTo(te.width + 16, 0);
                ctx.lineTo(te.width + 16, 16);
                ctx.lineTo(8, 16);
                ctx.closePath(); 
                ctx.fillStyle = fillStyle; 
                ctx.fill(); 

                //枠
                ctx.beginPath(); 
                ctx.moveTo(8, 1); 
                ctx.lineTo(te.width + 16, 1); 
                ctx.lineTo(te.width + 16, 16);
                ctx.lineTo(8, 16);
                ctx.closePath(); 
                ctx.lineWidth = 1; 
                ctx.stroke(); 

                //斜線
                ctx.beginPath(); 
                ctx.moveTo(0, 24); 
                ctx.lineTo(8, 16); 
                ctx.closePath(); 
                ctx.lineWidth = 1; 
                ctx.stroke(); 

                //文字
                ctx.font = font;
                ctx.fillStyle = '#000000';
                ctx.textBaseline = 'top';
                ctx.textAlign    = 'start';
                ctx.fillText(txt, 12, 1.5);

                //保存先の判定
                if (config.nickname_saveto_db){
                    db.NicknameInfo.update(
                    {filename :  userid + '.png'},
                    {$set : { data : canvas.toDataURL().split(',')[1]}},
                    {upsert : true, multi : false },
                    function(err, results){
                        if(err){
                            console.log('NG');
                        } else {
                            //console.log('OK');
                        }
                    });

                } else {
                    var filename = './wui/img/user/' + userid + '.png';
                    var buffer = new Buffer(canvas.toDataURL().split(',')[1], 'base64');
                    fs.writeFile(filename, buffer, function(){
                        //console.log("saved to " + filename);
                    });
                }
                return filename;
            },
        wget :
            function(url, saveto){
                var outFile = fs.createWriteStream(saveto);

                var req = http.get(url,
                    function (res) {
                        res.pipe(outFile);
                        res.on('end',
                                function () {
                                    outFile.close();
                                }
                              ); 
                    }
                   );
                return;
            },
        parseGeocode :
            function(data){
                var geocode = {
                    'location'            : {'lat': data.geometry.location.lat, 'lon' : data.geometry.location.lng},
                    'postal_code'         : null,
                    'country'             : null,
                    'prefecture'          : null,
                    'city'                : null,
                    'ward'                : null,
                    'sublocality_level_1' : null,
                    'sublocality_level_2' : null,
                    'sublocality_level_3' : null,
                    'sublocality_level_4' : null,
                    'route'               : null,
                    'formatted_address'   : ''
                };

                for (var i = 0; i< data.address_components.length ; i++){
                    var typ = data.address_components[i].types;

                    switch (typ.length){
                        case 1:
                            if (typ.indexOf('route') > -1){
                                geocode['route'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('postal_code') > -1){
                                geocode['postal_code'] = data.address_components[i].long_name;
                            }
                            break;
                        case 2:
                            if (typ.indexOf('locality') > -1 && typ.indexOf('political') > -1){
                                geocode['city'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('administrative_area_level_1') > -1 && typ.indexOf('political') > -1){
                                geocode['prefecture'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('country') > -1 && typ.indexOf('political') > -1){
                                geocode['country'] = data.address_components[i].long_name;
                            }
                            break;
                        case 3:
                            if (typ.indexOf('sublocality_level_1') > -1 && typ.indexOf('sublocality') > -1 && typ.indexOf('political') > -1){
                                geocode['sublocality_level_1'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('sublocality_level_2') > -1 && typ.indexOf('sublocality') > -1 && typ.indexOf('political') > -1){
                                geocode['sublocality_level_2'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('sublocality_level_3') > -1 && typ.indexOf('sublocality') > -1 && typ.indexOf('political') > -1){
                                geocode['sublocality_level_3'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('sublocality_level_4') > -1 && typ.indexOf('sublocality') > -1 && typ.indexOf('political') > -1){
                                geocode['sublocality_level_4'] = data.address_components[i].long_name;
                            } else if (typ.indexOf('ward') > -1 && typ.indexOf('locality') > -1 && typ.indexOf('political') > -1){
                                geocode['ward'] = data.address_components[i].long_name;
                            }
                            break
                        default:
                            return;
                    }

                }

                if (geocode.prefecture)          { geocode['formatted_address'] += geocode.prefecture;}
                if (geocode.city)                { geocode['formatted_address'] += geocode.city;}
                if (geocode.ward)                { geocode['formatted_address'] += geocode.ward; }
                if (geocode.sublocality_level_1) { geocode['formatted_address'] += geocode.sublocality_level_1; }
                if (geocode.sublocality_level_2) { geocode['formatted_address'] += geocode.sublocality_level_2; }
                if (geocode.sublocality_level_3) { geocode['formatted_address'] += geocode.sublocality_level_3 + '-'; }
                if (geocode.sublocality_level_4) { geocode['formatted_address'] += geocode.sublocality_level_4; }


                return geocode;
            }
    }
})();
