/*
 * 今ココなう！ with Google Maps API v3
 *
 * Shintaro Inagaki
 *
 * 【利用者の方へ】
 * マーカーをクリックするとズームインしてその人を追跡します。マーカー以外の地図部分をクリックすると全体を表示します。
 * マーカーがクリックされた状態で、もう一度マーカーをクリックすると情報ウィンドウを表示します。
 *
 * 【開発者の方へ】
 * このJavaScriptはふじたろんさんのscript.jsを参考に、Google Maps API v3へ対応させたものです。
 * v3対応の地図を作るときなどの参考として、自由にご利用ください。
 *
 * できるだけ動作を軽量化するために、必要最低限な機能のみとなっています。
 * マーカーで利用される画像は、CSS Spriteにてひとつの画像にまとめています。
 * ・現在位置矢印アイコン（120パターン） http://proxy.imacoconow.com/img/middle_arrow_mini.png
 * ・現在位置アイコン http://proxy.imacoconow.com/img/direction_icon.png
 * ・ストリームアイコン http://proxy.imacoconow.com/img/stream_icon.png
 *
 *
 * 今ココなう！
 * http://imakoko-gps.appspot.com/
 * http://imakoko-gps.appspot.com/static/script.js
 *
 * 今ココなう！プロキシ
 * http://proxy.imacoconow.com/
 */

// 設定（参考）
/*
var plot_mode = 0;
var plot_count = 1000;
var user_list = [ 'all' ];
var group_name = '';
var trace_user = 'all';
var map_region;
*/

// グローバル変数
var map;
var users;
var region;
var timer;
var plotmode = 0;
var plotcount = 1000;
var plot_icon;
var group_revision = '';
var traceuser = '';
var prev_trace = '';

var icon_image_value = 11;
var initializeFlag = true;
var defaultDirectionIcon = new Array();
var directionIcon = new Array();
var mapLoadedFlag = false;

var styles = {
        'Red': [
          {
            featureType: 'all',
            stylers: [{hue: '#ff0000'}]
          }
        ],
        'Countries': [
          {
            featureType: 'all',
            stylers: [
              {visibility: 'off'}
            ]
          },
          {
            featureType: 'water',
            stylers: [
              {visibility: 'on'},
              {lightness: -100 }
            ]
          }
        ],
        'Night': [
          {
            featureType: 'all',
            stylers: [{invert_lightness: 'true'}]
          }        
        ],
        'Blue': [
          {
            featureType: 'all',
            stylers: [
              {hue: '#0000b0'},
              {invert_lightness: 'true'},
              {saturation: -30}
            ]
          }
        ],
        'Greyscale': [
          {              
            featureType: 'all',
            stylers: [
              {saturation: -100},
              {gamma: 0.50}
            ]
          }
        ],
        'No roads': [
          {
            featureType: 'road',
            stylers: [
              {visibility: 'off'}
            ]
          }
        ],
        'Mixed': [
          {
            featureType: 'landscape',
            stylers: [{hue: '#00dd00'}]
          }, {
            featureType: 'road',
            stylers: [{hue: '#dd0000'}]
          }, {
            featureType: 'water',
            stylers: [{hue: '#000040'}]
          }, {
            featureType: 'poi.park',
            stylers: [{visibility: 'off'}]
          }, {
            featureType: 'road.arterial',
            stylers: [{hue: '#ffff00'}]
          }, {
            featureType: 'road.local',
            stylers: [{visibility: 'off'}]
          }            
        ],
        'Chilled': [
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{'visibility': 'simplified'}]
          }, {
            featureType: 'road.arterial',
            stylers: [
             {hue: 149},
             {saturation: -78},
             {lightness: 0}
            ]
          }, {
            featureType: 'road.highway',
            stylers: [
              {hue: -31},
              {saturation: -40},
              {lightness: 2.8}
            ]
          }, {
            featureType: 'poi',
            elementType: 'label',
            stylers: [{'visibility': 'off'}]
          }, {
            featureType: 'landscape',
            stylers: [
              {hue: 163},
              {saturation: -26},
              {lightness: -1.1}
            ]
          }, {
            featureType: 'transit',
            stylers: [{'visibility': 'off'}]
          }, {
            featureType: 'water',
              stylers: [
              {hue: 3},
              {saturation: -24.24},
              {lightness: -38.57}
            ]
          }
        ]
      };

// 初期化処理
function initialize() {

	// Google Maps API v3
	if(map_style){
		map = new google.maps.Map(document.getElementById('map'), {
			mapTypeControlOptions: {
				mapTypeIds: [google.maps.MapTypeId.ROADMAP, google.maps.MapTypeId.SATELLITE, map_style]
			},
			center : new google.maps.LatLng(35.658634, 139.745411),
			mapTypeId: map_style,
			scaleControl : true,
			streetViewControl : false,
			zoom : 10
		});
		
	    if(map_style == "OSM"){
	        var mapTypeIds = [];
	        for(var type in google.maps.MapTypeId) {
	            mapTypeIds.push(google.maps.MapTypeId[type]);
	        }
	        mapTypeIds.push("OSM");
	        
	    	map.mapTypes.set("OSM", new google.maps.ImageMapType({
	            getTileUrl: function(coord, zoom) {
	                return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
	            },
	            tileSize: new google.maps.Size(256, 256),
	            name: "OpenStreetMap",
	            maxZoom: 18
	        }));
	    }else{
		    var styledMapType = new google.maps.StyledMapType(styles[map_style], {name: map_style});
		    map.mapTypes.set(map_style, styledMapType);
	    }
	}else{
		map = new google.maps.Map(document.getElementById('map'), {
			center : new google.maps.LatLng(35.658634, 139.745411),
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			scaleControl : true,
			streetViewControl : false,
			zoom : 10
		});
	}
	
	map.mapTypes.set("OSM", new google.maps.ImageMapType({
        getTileUrl: function(coord, zoom) {
            return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
        },
        tileSize: new google.maps.Size(256, 256),
        name: "OpenStreetMap",
        maxZoom: 18
    }));

	// 地図表示範囲の設定
	if (isDefined('map_region')) {
		var min_lat = 91;
		var min_lon = 181;
		var max_lat = -91;
		var max_lon = -181;

		for (var idx in map_region) {
			if (map_region[idx].lat < min_lat) {
				min_lat = map_region[idx].lat;
			}
			if (max_lat < map_region[idx].lat) {
				max_lat = map_region[idx].lat;
			}
			if (map_region[idx].lon < min_lon) {
				min_lon = map_region[idx].lon;
			}
			if (max_lon < map_region[idx].lon) {
				max_lon = map_region[idx].lon;
			}
		}
		// 全体が表示できる矩形座標を計算
		region = new google.maps.LatLngBounds(
			new  google.maps.LatLng(min_lat, min_lon),
			new  google.maps.LatLng(max_lat, max_lon)
		);
		// 全体が表示できるように位置とズームを設定
		map.fitBounds(region);
	} else if(sensor){
		map.setZoom(12);
	} else {
		region = new google.maps.LatLngBounds(
			new  google.maps.LatLng(33, 130),
			new  google.maps.LatLng(43, 140)
		);
		// 全体が表示できるように位置とズームを設定
		map.fitBounds(region);
	}
	
	// プロットアイコン
	plot_icon = new google.maps.MarkerImage(
		'/img/aka.png',
		new google.maps.Size(4, 4),
		null,
		new google.maps.Point(2, 2)
	);

	// 標準マーカーの作成
	for ( var i = 0; i < 120; i++) {
		defaultDirectionIcon[i] = makeDirectionIcon(i, 0);
	}
	for ( var i = 0; i < icon_image_value; i++) {
		directionIcon[i] = makeDirectionIcon(NaN, i);
	}

	// 初期化
	users = new Object();

	if (isDefined('plot_mode')) {
		plotmode = plot_mode;
	}

	if (isDefined('plot_count')) {
		plotcount = plot_count;
	}

	if (isDefined('trace_user')) {
		if (trace_user != 'all' && trace_user != '__nouser__') {
			initUser(trace_user, true);
		}
		setTraceUser(trace_user);
	}

	// 地図をクリックしたときのイベント
	google.maps.event.addListener(map, 'click', function() {
		if (traceuser && traceuser != 'all') {
			map.fitBounds(region);
			if(prev_trace) {
				setTraceUser(prev_trace);
			}
			prev_trace = "";
		}
	});

	// ロード後の更新開始
	google.maps.event.addListener(map,"tilesloaded",function() {
		if(!mapLoadedFlag){
			update();
			timer = window.setInterval(update, 10000);
			mapLoadedFlag = true;
		}
	});
}

// 更新処理
function update() {
	// 位置情報を取得する
	$.getJSON('/api/latest',
		{
			t : new Date().getTime()
		},
		function(json){
            updateMap(json);
        }
	);
}

//位置情報を描画
function updateMap(json, trace) {
	if (json.result) {
		// 全体を表示するための範囲情報
		var min_lat = 91;
		var min_lon = 181;
		var max_lat = -91;
		var max_lon = -181;
		var valid_users = 0;

		// 更新チェックフラグのリセット
		for (var u in users) {
			users[u].update = false;
		}

		var viewArea = map.getBounds();

		// 全員分ループ
		for ( var i = 0; i < json.points.length; i++) {
			var data = json.points[i];

			// ユーザーID
			var username = data.user;

			// ユーザーが定義されてない場合は、ユーザーを初期化
			if (!isDefined(username, 'users')) {
				// 表示するユーサーにフラグを付ける
				if (!user_list || user_list[0] == 'all') {
					initUser(username, true);
				} else {
					var found = false;
					for (var user in user_list) {
						if (user_list[user] == username) {
							initUser(username, true);
							found = true;
							break;
						}
					}
					if(!found) {
						initUser(username, false);
					}
				}
			}
			var user = users[username];

			// 更新チェックフラグ
			user.update = true;

			// ニックネーム・緯度・経度・方位・高度・速度・アイコン種別・生放送の情報
			var nickname = data.nickname;
			var lat = parseFloat(data.lat);
			var lon = parseFloat(data.lon);
			var td = parseFloat(data.dir);
			var altitude = parseFloat(data.altitude);
			var velocity = parseFloat(data.velocity);
			var type = parseInt(data.type);
			if(type != 99 && (type < 0 || type > 10)){
				type = 0;
			}
			var ustream_status = data.ustream_status;

			var pt = new google.maps.LatLng(lat, lon);

			// 地図の描画範囲外のアイコンは削除する
			if (traceuser != 'all' && traceuser != username && !viewArea.contains(pt)) {
                if (!trace){
    				removeUserMarker(user);
    				continue;
                }
			}

			// 表示するユーザーのみプロットする
			if(user.watch) {
				// 前回の座標と違った場合はプロットする
				if (checkMoving(user.lat, user.lon, lat, lon)) {
					// 現在地アイコンマーカー
					if(user.direction_marker){
						user.direction_marker.setIcon(getDirectionIcon(td, type, username));
						user.direction_marker.setPosition(pt);
					} else {
						user.direction_marker = createClickableMarker(pt, username);
						user.direction_marker.setIcon(getDirectionIcon(td, type, username));
					}

					// ニックネームマーカー
					if(user.nick_marker){
						user.nick_marker.setPosition(pt);
					} else {
						user.nick_marker = new google.maps.Marker( {
							clickable : false,
							icon : user.nick_icon,
							position : pt,
							map : map,
							zIndex : 3
						});
					}

					// ストリームマーカー
					if(user.stream_marker) {
						if(ustream_status && ustream_status != 'offline') {
							if (user.stream_status != ustream_status) {
								user.stream_marker.setMap(null);
								user.stream_marker = makeStreamMarker(data.ustream_status, pt);
							} else {
								user.stream_marker.setPosition(pt);
							}
						} else {
							user.stream_marker.setMap(null);
						}
					} else {
						if(ustream_status && ustream_status != 'offline') {
							user.stream_marker = makeStreamMarker(data.ustream_status, pt);
						}
					}

					// トラッキングのプロットとパス
					user.plot.push(pt);
					if (user.plot.length > plotcount) {
						user.plot.shift();
					}

					if(plotmode == 1) {
						var marker = new google.maps.Marker( {
							clickable : false,
							icon : plot_icon,
							position : pt,
							map : map,
							zIndex : 0
						});
						user.plot_markers.push(marker);

						if(user.plot_markers.length > plotcount) {
							marker = user.plot_markers.shift();
							marker.setMap(null);
						}
					} else if(plotmode == 2) {
						user.plot_path.setPath(user.plot);
						user.plot_path.setMap(map);
					}
				}

				// 次回のためにマーカーと位置情報を保存
				user.nickname = nickname;
				user.lat = lat;
				user.lon = lon;
				user.td = td;
				user.altitude = altitude;
				user.velocity = velocity;
				user.type = type;
				user.ustream_status = ustream_status;

				// 追跡するユーザーにパン
				if (user.trace) {
					if(initializeFlag){
						map.setZoom(14);
						initializeFlag = false;
					}
					if(user.infowindow) {
						$("#infowindow").html(updateInformation(username));
					}
					map.panTo(pt);
				}

				// 地図表示範囲計算のセット
				min_lat = Math.min(lat, min_lat);
				max_lat = Math.max(lat, max_lat);
				min_lon = Math.min(lon, min_lon);
				max_lon = Math.max(lon, max_lon);
				valid_users++;
			}
		}

		// 更新チェックフラグの確認とユーザー情報の削除
		for(var u in users) {
			if (!users[u].update) {
				removeUserMarker(users[u]);
			}
		}

		// 地図表示範囲の設定
		if (traceuser == 'all' && valid_users > 0) {
			var avg_lat = (min_lat + max_lat) / 2;
			var avg_lon = (min_lon + max_lon) / 2;
			var ct = new google.maps.LatLng(avg_lat, avg_lon);
			if (valid_users == 1) {
				map.setCenter(ct);
				map.setZoom(14);
			} else {
				// 全体が表示できる矩形座標を計算
				region = new google.maps.LatLngBounds(
					new  google.maps.LatLng(min_lat, min_lon),
					new  google.maps.LatLng(max_lat, max_lon)
				);
				// 全体が表示できるように位置とズームを設定
				map.fitBounds(region);
			}
		}
	}
}


// 現在地アイコンの作成（CSS Spriteを使う）
function makeDirectionIcon(td, type) {
	var ic;

	if (!isNaN(td)) {
		ic = new google.maps.MarkerImage(
			'/img/middle_arrow_mini.png',
			new google.maps.Size(34, 34),
			new google.maps.Point(parseInt(td) * 34, 0),
			new google.maps.Point(17, 17)
		);
	} else {
		ic = new google.maps.MarkerImage(
			'/img/direction_icon.png',
			new google.maps.Size(32, 32),
			new google.maps.Point(type * 32, 0),
			new google.maps.Point(16, 16)
		);
	}
	return ic;
}

// 現在地アイコンの取得
function getDirectionIcon(td, type, username) {
	if (!isNaN(td) && type == 0) {
		td = Math.round(td / 3);
		td %= 120;
		return defaultDirectionIcon[td];
	} else if (type == 99) {
		if(twitter_icon){
			if(users[username].twitter_icon == 'no_twitter_id') {
				return directionIcon[0];
			} else if (users[username].twitter_icon) {
				return users[username].twitter_icon;
			} else {
				// アイコンを取得する
				$.ajax({
					type : 'GET',
					url : '/api/getuserinfo',
					data :
						{
							user : username,
							t : new Date().getTime()
						},
					dataType : 'json',
					async : false,
					success : function(res){
						if (res.twitter_image_url) {
							var ic = new google.maps.MarkerImage(
								res.twitter_image_url,
								new google.maps.Size(32, 32),
								null,
								new google.maps.Point(16, 16),
								new google.maps.Size(32, 32)
							);
							users[username].twitter_icon = ic;
						} else {
							users[username].twitter_icon = 'no_twitter_id';
						}
					}
				});
	
				if (users[username].twitter_icon && users[username].twitter_icon != 'no_twitter_id') {
					return users[username].twitter_icon;
				} else {
					return directionIcon[0];
				}
			}
		} else{
			var ic = new google.maps.MarkerImage(
				'/img/direction_icon.png',
				new google.maps.Size(32, 32),
				new google.maps.Point(11 * 32, 0),
				new google.maps.Point(16, 16)
			);
			users[username].twitter_icon = ic;
			return users[username].twitter_icon;
		}
	} else {
		return directionIcon[type];
	}
}

// ストリームマーカーの作成
function makeStreamMarker(stream, pt) {
	var origin;
	if (stream == 'live') {
		// ustream.tv
		origin = 0;
	} else if (stream == 'justin.tv') {
		// justin.tv
		origin = 1;
	} else if (stream.match(/^nicolive/)) {
		// ニコニコ生放送
		origin = 2;
	}
	ic = new google.maps.MarkerImage(
		'/img/stream_icon.png',
		new google.maps.Size(16, 16),
		new google.maps.Point(16 * origin, 0),
		new google.maps.Point(-6, -6)
	);

	var marker = new google.maps.Marker( {
		clickable : false,
		icon : ic,
		position : pt,
		map : map,
		zIndex : 2
	});

	return marker;
}

// ユーザー情報を初期化
function initUser(username, flag) {
	if (username) {
		var nick_icon = new google.maps.MarkerImage(
			'/user/' + encodeURIComponent(username) + '.png',
			null,
			null,
			new google.maps.Point(0, 24)
		);

		var plot_path = new google.maps.Polyline({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 3
		});

		user = new Object();
		user.watch = flag;
		user.update = false;
		user.lat = 0;
		user.lon = 0;
		user.plot = new Array();
		user.nick_icon = nick_icon;
		user.plot_markers = new Array();
		user.plot_path = plot_path;
		user.infowindow = null;

		user.trace = false;

		users[username] = user;
	}
}

// 注目するユーザーを設定
function setTraceUser(username) {
	// まず全員のフラグをクリア
	for (var user in users) {
		users[user].trace = false;
	}

	if (username != '__nouser__' && isDefined(username, 'users')) {
		// 引数のユーザーがいた
		var user = users[username];
		user.trace = true;
		if (user.lat != 0 && user.lon != 0) {
			map.setCenter(new google.maps.LatLng(user.lat, user.lon));
		}
	}
	traceuser = username;
}

// 移動したかどうかをチェックする
// 注意：簡易的に緯度経度の変化のみ見ることにする
function checkMoving(lat_from, lon_from, lat_to, lon_to) {
	return (lat_from != lat_to || lon_from != lon_to);
}

// ユーザーのマーカーを消す
function removeUserMarker(user) {
	if(user.direction_marker) {
		user.direction_marker.setMap(null);
		user.direction_marker = null;
	}
	if(user.nick_marker) {
		user.nick_marker.setMap(null);
		user.nick_marker = null;
	}
	if(user.stream_marker) {
		user.stream_marker.setMap(null);
		user.stream_marker = null;
	}
	if(user.plot_path) {
		user.plot_path.setMap(null);
	}
	while (user.plot_markers.length > 0) {
		var mk = user.plot_markers.shift();
		mk.setMap(null);
	}
	if (users.infowindow) {
		users.infowindow.close();
	}
	user.lat = 0;
	user.lon = 0
	user.plot = new Array();
}


// マーカーイベント
function createClickableMarker(pt, username) {

	var mk  = new google.maps.Marker( {
		position : pt,
		map : map,
		title : username,
		zIndex : 1
	});

	// マーカーをクリックしたときのイベント
	google.maps.event.addListener(mk, 'click', function() {
		if(traceuser == username){
			// 他の情報ウィンドウを閉じておく
			for (var u in users) {
				if (users[u].infowindow) {
					users[u].infowindow.close();
				}
			}

			if (!users[username].user_info || users[username].user_info == "") {
				// ユーザー情報がなければサーバからとってくる

				// 位置情報を取得する
				$.ajax({
					type : 'GET',
					url : '/api/getuserinfo',
					data :
						{
							user : username,
							t : new Date().getTime()
						},
					dataType : 'json',
					async : false,
					success : function(res){
						var txt;
						if (res.popup) {
							txt =
								'<div id="infowindow">%user%%liveinfo%<hr />' +
								res.popup +
								'</div>';
						} else {
							txt =
								'<div id="infowindow">%user%%liveinfo%<hr />' +
								'最終表示時刻 %plottime%<br />%profile%<br />%userweb%<br />%twitter%<br />%ustream%' +
								'</div>';
						}
						users[username].jtv = res.jtv;
						users[username].ust = res.ust;
						txt = txt.replace('%profile%', res.url ? '<a target="_blank" href="/home/' + username + '">profile</a>' : '');
						txt = txt.replace('%userweb%', res.url ? '<a target="_blank" href="' + res.url + '">HomePage</a>' : '');
						txt = txt.replace('%twitter%', res.twitter ? '<a target="_blank" href="http://twitter.com/' + res.twitter + '">' + res.twitter + ' on Twitter</a>' : '');
						txt = txt.replace('%ustream%', res.ust ? '<a target="_blank" href="http://www.ustream.tv/channel/' + res.ust + '">' + res.ust + ' on USTREAM</a>' : '');
						txt = txt.replace('%justin%', res.jtv ? '<a target="_blank" href="http://www.justin.tv/' + res.jtv + '">' + res.jtv + ' on Justin.tv</a>' : '');
						users[username].user_info = txt;
					},
					error : function(json){
						users[username].user_info = '情報の取得に失敗しました';
					}
				});
			}
			// 情報ウィンドウを開く
			users[username].infowindow = new google.maps.InfoWindow({
		        content: updateInformation(username),
		        maxWidth: 250
		    });
			users[username].infowindow.open(map, users[username].direction_marker);
		} else {
			if (prev_trace == '') {
				prev_trace = traceuser;
			}
			setTraceUser(username);
			map.setZoom(14);
		}
	});
	return mk;
}



// 情報ウィンドウの更新
function updateInformation(username) {
	var txt = users[username].user_info.
		replace(/%user%/g, username).
		replace(/%plottime%/g, makeTimeString()).
		replace(/%latitude%/g, users[username].lat).
		replace(/%longitude%/g, users[username].lon).
		replace(/%direction%/g, users[username].td).
		replace(/%altitude%/g, users[username].altitude).
		replace(/\\n/g, "<br />").
		replace(/%hr%/g, "<hr />");

	if (users[username].ustream_status) {
		var bc = users[username].ustream_status;
		if (bc == 'live' && users[username].ust) {
			txt = txt.replace('%liveinfo%', '&nbsp;<a target="_blank" href="http://www.ustream.tv/channel/' + users[username].ust + '"><b>LIVE on USTREAM.tv</b></a>');
			txt = txt.replace('%nicolive%', '');
		} else if (bc == 'justin.tv' && users[username].jtv) {
			txt = txt.replace('%nicolive%', '');
			txt = txt.replace('%liveinfo%', '&nbsp;<a target="_blank" href="http://www.justin.tv/' + users[username].jtv + '"><b>LIVE on Justin.tv</b></a>');
		} else if( users[username].ustream_status.match(/^nicolive:(.+)/)) {
			nicolive = RegExp.$1;
			txt = txt.replace('%nicolive%', '<a target="_blank" href="http://live.nicovideo.jp/watch/lv' + nicolive + '">ニコニコ生放送中</a>');
			txt = txt.replace('%liveinfo%', '&nbsp;<a target="_blank" href="http://live.nicovideo.jp/watch/lv' + nicolive + '"><b>ニコニコ生放送中</b></a>');
		} else {
			txt = txt.replace('%nicolive%', '');
			txt = txt.replace('%liveinfo%', '');
		}
	} else {
		txt = txt.replace('%nicolive%', '');
		txt = txt.replace('%liveinfo%', '');
	}

	if (users[username].velocity || users[username].velocity == 0) {
		txt = txt.replace(/%velocity%/g, users[username].velocity);
	} else {
		txt = txt.replace(/%velocity%/g, '非公開');
	}

	return txt;
}

// 現在時刻文字列作成
function makeTimeString() {
	var mySysDate = new Date();
	var myYear = mySysDate.getFullYear();
	var myMonth = mySysDate.getMonth() + 1;
	var myDate = mySysDate.getDate();
	var myHour = mySysDate.getHours();
	var myMin = mySysDate.getMinutes();
	var mySec = mySysDate.getSeconds();
	if (myMonth < 10) {
		myMonth = '0' + myMonth;
	}
	if (myDate < 10) {
		myDate = '0' + myDate;
	}
	if (myHour < 10) {
		myHour = '0' + myHour;
	}
	if (myMin < 10) {
		myMin = '0' + myMin;
	}
	if (mySec < 10) {
		mySec = '0' + mySec;
	}
	return myYear + '-' + myMonth + '-' + myDate + ' ' + myHour + ':' + myMin + ':' + mySec;
}

// グローバル変数が定義済みかどうか
function isDefined(v, obj) {
	if (obj == undefined) {
		obj = 'window';
	}
	var ret = typeof(eval(obj)[v]) != 'undefined';
	return ret;
}
