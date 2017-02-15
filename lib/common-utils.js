/***********************************************************
 *  今ココなう！クライアント向け互換サーバスクリプト       *
 *  共通ライブラリ                                         *
 *  Copyright (c) 2016 @Hamache9821                        *
 *  Released under the MIT license                         *
 *  http://opensource.org/licenses/mit-license.php         *
 ***********************************************************/
module.exports = (function(){
    "use strict";

    var http = require('http');
    var fs = require('fs');
    var Canvas = require('canvas')

    // シークレットは適当に変えてください
    var hashSecretKey = 'some_random_secret';

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
    var utill = require('util');
    var crypto = require("crypto");

    return {
        inspect :
            function(value){
                console.log(utill.inspect(value));
            },
        getHash :
             function(target){
                var sha = crypto.createHmac('sha256', hashSecretKey);
                sha.update(target);
                return sha.digest('hex');
            },
        setConsolelog :
            function(req, msg){
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

                var filename = './wui/img/user/' + userid + '.png';
                var buffer = new Buffer(canvas.toDataURL().split(',')[1], 'base64');
                fs.writeFile(filename, buffer, function(){
                    //console.log("saved to " + filename);
                });

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
            }
    }
})();
