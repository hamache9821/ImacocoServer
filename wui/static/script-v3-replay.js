/*
 * 今ココなう！ with Google Maps API v3
 *
 * Shintaro Inagaki
 *
 * 2017 modify by hamache9821
 */

$(function() {

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
var static_file_site = '/img/';
var icon_image_value = 11;
var initializeFlag = true;
var defaultDirectionIcon = new Array();
var directionIcon = new Array();
var nodata_count = 0;

var mapOptions = {
	center : new  google.maps.LatLng(35.658634, 139.745411),
	mapTypeId : google.maps.MapTypeId.ROADMAP,
	streetViewControl : false,
	zoom : 10
}

// Google Maps API v3
map = new google.maps.Map(document.getElementById('map'), mapOptions);


// 初期化処理
function initialize() {
	// 地図をクリックしたときのイベント
	google.maps.event.addListener(map, 'click', function() {
		if (traceuser && traceuser != 'all') {
			map.fitBounds(region);
			if(prev_trace) {
				setTraceUser(prev_trace);
			}
			prev_trace = '';
		}
	});

	// プロットアイコン
	plot_icon = new google.maps.MarkerImage(
		static_file_site + '/aka.png',
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

	 window.setTimeout(wait, 1000);
}

// 地図表示範囲の設定
function setMapRegion(){
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
	} else {
		region = new google.maps.LatLngBounds(
			new  google.maps.LatLng(33, 130),
			new  google.maps.LatLng(43, 140)
		);
		// 全体が表示できるように位置とズームを設定
		map.fitBounds(region);
	}
}

// ウェイト
function wait() {
	update();
	timer = window.setInterval(update, replayUpdateInterval);
	loadingOverlay.close();
}


// 更新処理
function update() {
	// 位置情報を取得する
	if(replayLocate == 1440) {
		return false;
	} else if(lastReplayLocate == replayLocate) {
	//	replayLocate += replayPlay;
	//	return false;
	} else if (replayLocate > 1440) {
		replayLocate = 1439;
	}
	var responseText = replayData[replayLocate];
	var json = eval(responseText);

	$('#clock').html(makeTimeString(replayYear, replayMonth, replayDay, replayLocate));
	lastReplayLocate = replayLocate;
	replayLocate += replayPlay;
	$('#slider').slider('option', 'value', replayLocate);

	if(json.points.length == 0){
		nodata_count++;
		if(nodata_count < 5){
			return;
		}
	}else{
		nodata_count = 0;
	}

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

			var nickicon = data.nickicon;

			var pt = new google.maps.LatLng(lat, lon);

			// 地図の描画範囲外のアイコンは削除する
			if (traceuser != 'all' && traceuser != username && !viewArea.contains(pt)) {
				removeUserMarker(user);
				continue;
			}

			// 表示するユーザーのみプロットする
			if(user.watch) {

				// ニックネームマーカーの更新
				if(nickicon && nickicon != user.nickicon){
					user.nickicon = nickicon;

					if(user.nick_marker) {
						var image = new google.maps.MarkerImage(
							'/user/' + user.nickicon + '.png',
							null,
							null,
							new google.maps.Point(0, 24)
						);
						user.nick_marker.setIcon(image);
					}
				}

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
						if(!user.nickicon) {
							user.nickicon = nicknameList[username]['nickicon'];
						}

						var image = new google.maps.MarkerImage(
							'/user/' + user.nickicon + '.png',
							null,
							null,
							new google.maps.Point(0, 24)
						);

						user.nick_marker = new google.maps.Marker( {
							clickable : false,
							icon : image,
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
				user.stream_status = ustream_status;

				// 追跡するユーザーにパン
				if (user.trace) {
					if(initializeFlag){
						map.setZoom(12);
						initializeFlag = false;
					}
					if(controlDisplayFlag) {
						map.panTo(pt);
					} else {
						map.setCenter(pt);
					}
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

//現在地アイコンの作成（CSS Spriteを使う）
function makeDirectionIcon(td, type) {
	var ic;

	if (!isNaN(td)) {
		ic = new google.maps.MarkerImage(
			static_file_site + 'middle_arrow_mini.png?v=2',
			new google.maps.Size(34, 34),
			new google.maps.Point(parseInt(td) * 34, 0),
			new google.maps.Point(17, 17)
		);
	} else {
		ic = new google.maps.MarkerImage(
			static_file_site + 'direction_icon.png',
			new google.maps.Size(32, 32),
			new google.maps.Point(type * 32, 0),
			new google.maps.Point(16, 16)
		);
	}
	return ic;
}

//現在地アイコンの取得
function getDirectionIcon(td, type, username) {
	if (!isNaN(td) && type == 0) {
		td = Math.round(td / 3);
		td %= 120;
		return defaultDirectionIcon[td];
	} else if (type == 99) {
		if(users[username].twitter_icon == 'no_twitter_id') {
			return directionIcon[0];
		} else if (users[username].twitter_icon) {
			return users[username].twitter_icon;
		} else {
/*
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
							new google.maps.Point(16, 16)
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
*/
			var ic = new google.maps.MarkerImage(
				static_file_site + 'direction_icon.png',
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
		static_file_site + 'stream_icon.png',
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

//ユーザー情報を初期化
function initUser(username, flag) {
	if (username) {
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
		user.nickicon = '';
		user.plot_markers = new Array();
		user.plot_path = plot_path;

		user.trace = false;

		users[username] = user;
	}
}

//注目するユーザーを設定
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
	if(traceuser != '__nouser__') {
		$('#info-trace').html(traceuser);
	} else {
		$('#info-trace').html('---');
	}
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
		if (prev_trace == '') {
			prev_trace = traceuser;
		}
		setTraceUser(username);
		map.setZoom(14);
	});
	return mk;
}

// グローバル変数が定義済みかどうか
function isDefined(v, obj) {
	if (obj == undefined) {
		obj = 'window';
	}
	var ret = typeof(eval(obj)[v]) != 'undefined';
	return ret;
}

/*
 * replay 追加
 */
	var mousedownFlag = false;
	var clockDisplayFlag = true;
	var controlDisplayFlag = true;

	$('#info-speed').html('×' + replaySpeedList[replaySpeed]);
	var loadingOverlay = new $.overlay({
		bg_color: 'black',
		opacity: 0.7,
		overlay_class: 'loadingOverlay'
	});
	var helpOverlay = new $.overlay({
		bg_color: 'black',
		click_close: false,
		opacity: 0.9
	});

    //前後日付
    $('#link-date-yesterday').html(makeDateString(replayYear, replayMonth , replayDay - 1));
    $('#link-date-tomorrow').html(makeDateString(replayYear, replayMonth , replayDay + 1));

	// ローディング中のオーバーレイ
	loadingOverlay.open(function(){
		$(window).load(function(){
			loadingOverlay.close();
		});
	});

	// 地図表示範囲の設定
    setMapRegion();

	// JSON読み込み
	$.getJSON('/replay/nickname/' + replayDate + '.json?' + (new Date()).getHours(), function(json){
		nicknameList = eval(json);

		$.getJSON('/replay/latest/' + replayDate + '.json?' + (new Date()).getHours(), function(json){
			// 画像のプリロード
			$('#preload').append('<img src="' + static_file_site + 'middle_arrow_mini.png" />');
			$('#preload').append('<img src="' + static_file_site + 'direction_icon.png" />');
			$('#preload').append('<img src="' + static_file_site + 'stream_icon.png" />');

			replayData = eval(json);
			initialize();
		});

	});

	// CSSホバー
	$('#control').hover(
		function() { $(this).fadeTo('normal', 1.0); },
		function() { $(this).fadeTo('normal', 0.6); }
	);
	$('#control').fadeTo('normal', 0.6);

	$('#control-panel a').hover(
		function() { $(this).addClass('ui-state-hover'); },
		function() { $(this).removeClass('ui-state-hover'); }
	);

	// イベント
	$('#slider').slider({
		value: replayLocate,
		min: 0,
		max: 1439,
		step: 1,
		slide: function(event, ui) {
			replayLocate = ui.value;
		}
	});
	replayLocate = $('#slider').slider('value');

	$('#slider').mousedown(function(){
		if(replayPlay){
			mousedownFlag = true;
		}
		replayPlay = 0;
	});
	$('#slider').mouseup(function(){
		if(mousedownFlag){
			replayPlay = 1;
			mousedownFlag = false;
		}
	});

	$('#control-play').click(
		function() {
			if(replayPlay){
				replayPlay = 0;
				$(this).html('<span class="ui-icon ui-icon-play"></span>');
				$(this).attr('title', '再生 [Space]');
			}else{
				replayPlay = 1;
				$(this).html('<span class="ui-icon ui-icon-pause"></span>');
				$(this).attr('title', '停止 [Space]');
			}
			return false;
		}
	);
	$('#control-seek-first').click(
		function() {
			replayLocate = 0;
			return false;
		}
	);
	$('#control-seek-prev').click(
		function() {
			replayLocate --;
			return false;
		}
	);
	$('#control-seek-next').click(
		function() {
			replayLocate ++;
			return false;
		}
	);

	// キーボードショートカット
	$(document).bind('keydown', 'j',
		function(){
			replayLocate ++;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'k',
		function(){
			replayLocate --;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'Shift+j',
		function(){
			replayLocate += 5;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'Shift+k',
		function(){
			replayLocate -= 5;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'n',
		function(){
			replayLocate += 60;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'p',
		function(){
			replayLocate -= 60;
			checkLocate();
		}
	);
	$(document).bind('keydown', 'space',
		function() {
			if(replayPlay){
				replayPlay = 0;
				$('#control-play').html('<span class="ui-icon ui-icon-play"></span>');
				$('#control-play').attr('title', '再生 [Space]');
			}else{
				replayPlay = 1;
				$('#control-play').html('<span class="ui-icon ui-icon-pause"></span>');
				$('#control-play').attr('title', '停止 [Space]');
			}
		}
	);
	$(document).bind('keydown', 'r',
		function(){
			replayLocate = 0;
		}
	);
	$(document).bind('keydown', 'a',
		function(){
			if(replaySpeed < replaySpeedList.length - 1){
				replaySpeed++;
				replayUpdateInterval = 60000 / replaySpeedList[replaySpeed];
				clearInterval(timer);
				timer = window.setInterval(update, replayUpdateInterval);
				$('#info-speed').html('×' + replaySpeedList[replaySpeed]);
			}
		}
	);
	$(document).bind('keydown', 's',
		function(){
			if(replaySpeed > 0){
				replaySpeed--;
				replayUpdateInterval = 60000 / replaySpeedList[replaySpeed];
				clearInterval(timer);
				timer = window.setInterval(update, replayUpdateInterval);
				$('#info-speed').html('×' + replaySpeedList[replaySpeed]);
			}
		}
	);
	$(document).bind('keydown', 't',
		function(){
			if(controlDisplayFlag) {
				if(clockDisplayFlag) {
					$('#info, #clock, #link-date').fadeOut('slow');
					clockDisplayFlag = false;
				} else {
					$('#info, #clock, #link-date').fadeIn('slow');
					clockDisplayFlag = true;
				}
			} else {
				if(clockDisplayFlag) {
					$('#clock').fadeOut('slow');
					clockDisplayFlag = false;
				} else {
					$('#clock').fadeIn('slow');
					clockDisplayFlag = true;
				}
			}
		}
	);
	$(document).bind('keydown', 'c',
		function(){
			if(controlDisplayFlag) {
				$('#control, #info, #link-date').fadeOut();
				$('#clock').addClass('ui-corner-all').css('left', 14).css('top', 14);
				mapOptions = {
					center : map.getCenter(),
					mapTypeId : map.getMapTypeId(),
					zoom : map.getZoom(),
					mapTypeControl : false,
					streetViewControl : false,
					navigationControl : false
				}
				map = new google.maps.Map(document.getElementById('map'), mapOptions);
				users = new Object();
				if (traceuser != 'all' && traceuser != '__nouser__') {
					initUser(traceuser, true);
					setTraceUser(traceuser);
				}
				lastReplayLocate --;
				controlDisplayFlag = false;
			} else {
				$('#clock').removeClass('ui-corner-all').css('left', 80).css('top', 27);
				if(clockDisplayFlag) {
					$('#control, #info, #link-date').fadeIn();
				} else {
					$('#control').fadeIn();
				}
				mapOptions = {
					center : map.getCenter(),
					mapTypeId : map.getMapTypeId(),
					streetViewControl : false,
					zoom : map.getZoom()
				}
				map = new google.maps.Map(document.getElementById('map'), mapOptions);
				users = new Object();
				if (traceuser != 'all' && traceuser != '__nouser__') {
					initUser(traceuser, true);
					setTraceUser(traceuser);
				}
				lastReplayLocate --;
				controlDisplayFlag = true;
			}
		}
	);
	function checkLocate(){
		if(replayLocate >= 1440){
			replayLocate = 1439;
		}else if(replayLocate < 0){
			replayLocate = 0;
		}
	}
	$('#control-help').click(
		function() {
			helpOverlay.open(function(){
				$('#help').load('/help.html').fadeIn();
			});
			return false;
		}
	);
	$('#help').click(
		function() {
			$('#help').fadeOut();
			helpOverlay.close();
			return false;
		}
	);

	// 日時文字列作成
	function makeTimeString(year, month, day, locate) {
		var mySysDate = new Date(year, month - 1, day);
		mySysDate.setMinutes(locate);
		var myYear = mySysDate.getFullYear();
		var myMonth = mySysDate.getMonth()+1;
		var myDate = mySysDate.getDate();
		var myHour = mySysDate.getHours();
		var myMin = mySysDate.getMinutes();
		var mySec = mySysDate.getSeconds();
		if(myMonth < 10) {
			myMonth = '0' + myMonth;
		}
		if(myDate < 10) {
			myDate = '0' + myDate;
		}
		if(myHour < 10) {
			myHour = '0' + myHour;
		}
		if(myMin < 10) {
			myMin = '0' + myMin;
		}
		if(mySec < 10) {
			mySec = '0' + mySec;
		}

		return '<span id="clock-date">' + myYear + '年' + myMonth + '月' + myDate + '日' + '</span><span id="clock-time"><span class="digit">' + myHour + '</span>時<span class="digit">' + myMin + '</span>分</span>';
	}

	// 日付文字列作成
	function makeDateString(year, month, day) {
		var dt = new Date(year, month - 1, day);
        var today = new Date();

        var s = ('0000' + dt.getFullYear()).slice(-4)
              + ('00' + (dt.getMonth()+1)).slice(-2)
              + ('00' + dt.getDate()).slice(-2);

        var ss = ('0000' + today.getFullYear()).slice(-4)
               + ('00' + (today.getMonth()+1)).slice(-2)
               + ('00' + today.getDate()).slice(-2);

        if (parseInt(s) > parseInt(ss)) {
            return '&nbsp;';
        } else {
            if (! map_region) {
                return '<a href="' + s + '">' + s + '</a>';
    	    } else {
                return '<a href="' + s + location.search + '">' + s + '</a>';
            }
	    }
	}
});