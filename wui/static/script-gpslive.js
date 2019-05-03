/*
 *
 * 以下のように使用します
 *---------------------------------------------------------------------------------------
<html>
<head>
  <script src="http://maps.google.com/maps?file=api&v=2&key=<Google Maps API key>"
	type="text/javascript">
  </script>
  <script type="text/javascript">
  <!--//--><![CDATA[//><!--
	var use_onload=true;
	var plot_mode=1;  // 省略可能
	var user_list = [ 'foo', 'bar' ]; // 省略可能
	var trace_user = 'foo'; // 省略可能
  //--><!]]>
  </script>
  <script src="/static/script.js" type="text/javascript">
  </script>
</head>
<body>
<div id="map" style="width:400px; height:400px"></div>
プロットしたいユーザーにチェック<br />
<div id="userlist"></div>
<div id="usercontrol">
注目したいユーザーを選択（選択したユーザーを追いかけるようになります）<br />
<select id="traceuser" onChange="setTraceUser(this.options[this.options.selectedIndex].value)">
</select>
</div>
</body>
</html>

 *---------------------------------------------------------------------------------------
 *
 * var use_onload=true;  // これを定義しないと地図は表示されません。
 *					   // 地図は表示しないけど関数を使いたい時などは定義しないかfalseを設定します
 * var plot_mode=1;	  // 定義しないor0のとき軌跡をプロットしません
 *						 // 1のとき点でプロットします。
 *					   //  １ユーザーあたり1000ポイントまで描画します。
 *					   //  それ以上になったら古いほうから消えていきます
 *					   // 2のとき線で描画します。
 *					   //  線の場合すべて描画するので長時間表示するとブラウザが重くなることがあります
 * var user_list = [ 'foo', 'bar' ];
 *					   // プロットするユーザーを配列で指定します
 * var trace_user = 'foo';
 *					   // 追いかけるユーザーを指定します
 */

$(document).ready(function() { // [ADD]

google.maps.LatLng.prototype.latRadians = function()
{
  return (Math.PI * this.lat()) / 180;
}

google.maps.LatLng.prototype.lngRadians = function()
{
  return (Math.PI * this.lng()) / 180;
}


//グローバル変数
var map;
var markeropts;
var geocoder;
var share_markers = new Array();

var hidelist = 0;
var plotmode = 0;	// 0=軌跡表示しない、1=点、2=線
var plotcount = 1000;
var fromtop = false;
var traceuser = '';
var center;
var group_revision = '';

var apiview = 0;

var prev_trace = "";

var static_file_site = '/img/'; // [CHANGE]
var api_site = 'http://' + location.hostname;

var timer;
var datetimebox;
var plot_icon;
var icon_image_value = 11;


var USTERAM_TV = 'live';
var JUSTIN_TV = 'justin.tv';

// グローバル変数 [ADD]
var altitudeGraph = new Array();
var velocityGraph = new Array();
var startPoint = new google.maps.LatLng(35, 137);
var nowPoint = new google.maps.LatLng(35, 137);
var userExist = false;
var distance = new Array();
var direction = ['北', '北北東', '北東', '東北東', '東', '東南東', '南東', '南南東', '南', '南南西', '南西', '西南西', '西', '西北西', '北西', '北北西'];

var new_styles = {
		'night': [
		  {
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#242f3e"
			  }
			]
		  },
		  {
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#746855"
			  }
			]
		  },
		  {
			"elementType": "labels.text.stroke",
			"stylers": [
			  {
				"color": "#242f3e"
			  }
			]
		  },
		  {
			"featureType": "administrative.locality",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#d59563"
			  }
			]
		  },
		  {
			"featureType": "poi",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#d59563"
			  }
			]
		  },
		  {
			"featureType": "poi.park",
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#263c3f"
			  }
			]
		  },
		  {
			"featureType": "poi.park",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#6b9a76"
			  }
			]
		  },
		  {
			"featureType": "road",
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#38414e"
			  }
			]
		  },
		  {
			"featureType": "road",
			"elementType": "geometry.stroke",
			"stylers": [
			  {
				"color": "#212a37"
			  }
			]
		  },
		  {
			"featureType": "road",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#9ca5b3"
			  }
			]
		  },
		  {
			"featureType": "road.highway",
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#746855"
			  }
			]
		  },
		  {
			"featureType": "road.highway",
			"elementType": "geometry.stroke",
			"stylers": [
			  {
				"color": "#1f2835"
			  }
			]
		  },
		  {
			"featureType": "road.highway",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#f3d19c"
			  }
			]
		  },
		  {
			"featureType": "transit",
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#2f3948"
			  }
			]
		  },
		  {
			"featureType": "transit.station",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#d59563"
			  }
			]
		  },
		  {
			"featureType": "water",
			"elementType": "geometry",
			"stylers": [
			  {
				"color": "#17263c"
			  }
			]
		  },
		  {
			"featureType": "water",
			"elementType": "labels.text.fill",
			"stylers": [
			  {
				"color": "#515c6d"
			  }
			]
		  },
		  {
			"featureType": "water",
			"elementType": "labels.text.stroke",
			"stylers": [
			  {
				"color": "#17263c"
			  }
			]
		  }
		]
};

// 初期化処理
function initialize()
{
	if (isDefined('api_view'))
	{
		apiview = api_view;
	}

	if (isDefined('hide_userlist') && hide_userlist) {
		var ul = document.getElementById('right');
		if (ul) {
			ul.style.display = 'none';
		}
		var footer = document.getElementById('footer');
		if (footer) {
			footer.style.display = 'none';
		}
		hidelist = 1;
	}

	if (isDefined('map_maximize') && map_maximize)
	{
		window.onresize = function()
		{
			resize();
		}
		resize();
	}

	// Google Maps API v3
	if(map_style){
		if (new_styles[map_style]){
			map = new google.maps.Map(document.getElementById('map'), {
				mapTypeControlOptions: {
					mapTypeIds: [google.maps.MapTypeId.ROADMAP
					, google.maps.MapTypeId.SATELLITE
					, map_style]
				},
				center : new google.maps.LatLng(35.658634, 139.745411),
				mapTypeId: map_style,
				scaleControl : true,
				streetViewControl : false,
				zoom : 10
			});

		}else{
			map = new google.maps.Map(document.getElementById('map'), {
				mapTypeControlOptions: {
					mapTypeIds: [google.maps.MapTypeId.ROADMAP
					, google.maps.MapTypeId.SATELLITE
					, map_style]
				},
				center : new google.maps.LatLng(35.658634, 139.745411),
				mapTypeId: map_style,
				scaleControl : true,
				streetViewControl : false,
				zoom : 10
			});
		}

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
			var styledMapType = new google.maps.StyledMapType(new_styles[map_style], {name: map_style});
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

	geocoder = new google.maps.Geocoder()

	if (!isDefined('use_zoom')) {
		use_zoom = 2;
	}
/*
	if (!isDefined('use_zoom') || use_zoom) {
		if ($(document.body).innerHeight() > 600) { // [CHANGE]
			map.addControl(new GLargeMapControl(), new ControlPosition(G_ANCHOR_TOP_LEFT, new google.maps.Size(5, 50))); // [CHANGE]
		} else { // [CHANGE]
			map.addControl(new GSmallMapControl(), new ControlPosition(G_ANCHOR_TOP_LEFT, new google.maps.Size(5, 50))); // [CHANGE]
		}
		map.enableContinuousZoom();
		map.enableDoubleClickZoom();
		map.enableScrollWheelZoom();
		google.maps.event.addDomListener(map, "DOMMouseScroll", CancelEvent); // Firefox
		google.maps.event.addDomListener(map, "mousewheel",     CancelEvent); // IE
	}
*/
/*
	controlGMapType = new GMapTypeControl(); // [CHANGE]
	map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(315, 5))); // [CHANGE]
	map.addControl(new GScaleControl(), new ControlPosition(G_ANCHOR_TOP_LEFT, new google.maps.Size(75, 90))); // [CHANGE]
*/
//	new GKeyboardHandler(map); // [ADD]

	// [ADD]
	if(!movie_enable){
//		map.removeControl(controlGMapType);
//		map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(10, 5)));
		$("#info").css("right", 10);
	}

	if (!isDefined('use_minimap') || use_minimap)
	{
//		map.addControl(new GOverviewMapControl());
	}

//	map.addControl(new SignatureBox(), new ControlPosition(G_ANCHOR_TOP_LEFT, new google.maps.Size(75, 45))); // [CHANGE]
	// map.addControl(new DateTimeBox()); // [CHANGE]

	// datetimebox = document.getElementById("DateTime"); // [CHANGE]

	// google.maps.event.addListener(map, "click", openMenu);
	// google.maps.event.addListener(map, "mousedown", updateOff);

	if (isDefined('map_region'))
	{
		var min_lat = 91;
		var min_lon = 181;
		var max_lat = -91;
		var max_lon = -181;

		for (var idx in map_region)
		{
			if (map_region[idx].lat < min_lat) { min_lat = map_region[idx].lat; }
			if (max_lat < map_region[idx].lat) { max_lat = map_region[idx].lat; }
			if (map_region[idx].lon < min_lon) { min_lon = map_region[idx].lon; }
			if (max_lon < map_region[idx].lon) { max_lon = map_region[idx].lon; }
		}
		var avg_lat = (min_lat + max_lat) / 2;
		var avg_lon = (min_lon + max_lon) / 2;
		var ct = new google.maps.LatLng(avg_lat, avg_lon);
		// 全体が表示できる矩形座標を計算
		var region = new google.maps.LatLngBounds(new google.maps.LatLng(min_lat, min_lon), new google.maps.LatLng(max_lat, max_lon));
		// 全体が表示できるように位置とズームを設定
		map.setCenter(ct, map.getBoundsZoomLevel(region));
		center = ct;
	}
	else
	{
		var point = new google.maps.LatLng(35.658634, 139.745411); // 初期位置は東京タワー
		map.setCenter(point, 14);
		center = point;
	}

	if (isDefined('use_rmenu') && use_rmenu)
	{
		rmenu = document.createElement("div");
		var MapPX = map.getSize();

		//右クリックメニューのスタイルを設定。
		rmenu.style.visibility = "hidden";
		rmenu.style.backgroundColor = "white";
		rmenu.style.border = "2px solid black";
		rmenu.style.padding = "2px";
		rmenu.style.fontSize = "12px";
		rmenu.style.cursor = "pointer";

		//右クリックメニューの内容(HTML）
		rmenu.innerHTML = "<div onclick='putMarker()'>この場所を共有する</div><hr>"
		                + "<div onclick='openSearchWindow()'>Googleマップで検索</div>";

		//右クリックメニューをmap内に返す
		map.getContainer().appendChild(rmenu);

		//右クリック位置を取得してメニューを表示するイベント。pointはgoogle.maps.Size(x,y)で返される。
		google.maps.event.addListener(map, "singlerightclick", function(point) {
			updateOff();
			var rmenux = point.x;
			var rmenuy = point.y;
			var latlng = map.fromContainerPixelToLatLng(point)
			rmenu_lat = latlng.lat();
			rmenu_lon = latlng.lng();

			//MapPX.width、MapPX.heightの後の74・86はメニュー全体の横幅・縦幅。
			if(rmenux > (MapPX.width - 74)) { rmenux = MapPX.width - 74; }
			if(rmenuy > (MapPX.height - 86)) { rmenuy = MapPX.height - 86; }
			var rmenu_pos = new ControlPosition(G_ANCHOR_TOP_LEFT, new google.maps.Size(rmenux, rmenuy));
			rmenu_pos.apply(rmenu);
			rmenu.style.visibility = "visible";
		});

		//地図上を左クリックしたらメニューが消える。
		google.maps.event.addListener(map, "click", function()
			{
				if (rmenu.style.visibility == "visible"){
					rmenu.style.visibility = "hidden";
				}
				if (!map.infoWindowEnabled())
				{
					updateOn();
				}
			}
		);
	}

	var icon = new google.maps.MarkerImage();
	icon.image = static_file_site + "aka.png";
	icon.iconSize = new google.maps.Size(4, 4);
	icon.iconAnchor = new google.maps.Point(0, 0);
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

	markeropts = new Object();
	markeropts.icon = icon;
	markeropts.clickable = false;

	if (isDefined('plot_mode'))
	{
		plotmode = plot_mode;
	}

	if (isDefined('plot_count'))
	{
		plotcount = plot_count;
	}

	if (isDefined('from_top'))
	{
		fromtop = from_top;
	}

	users = new Object();
	if (hidelist)
	{
		if (isDefined('user_list') && user_list[0] == 'all')
		{
			setTraceUser('all');
		}
	}
	else
	{
		if (!isDefined('user_list'))
		{
		//	loadUserList(false);
		}
		else if (user_list[0] == 'all')
		{
		//	loadUserList(true);
			setTraceUser('all');
		}
		else
		{
			for (var u in user_list)
			{
				initUser(user_list[u], true);
			}
		}
	}
	setTimeout(load_next, 10);
}

// 地図のスクロールとマーキング
function update()
{
	if (!isDefined('group_name'))
	{
		// 位置情報を取得するユーザー
		var ul = "";
		if (isDefined('user_list') && user_list[0] == 'all')
		{
			ul = 'all,';
		}
		else
		{
			for (var user in users)
			{
				if (users[user].watch)
				{
					ul += user + ",";
				}
			}
		}
		if (ul == "")
		{
			return false;
		}
		ul = 'user=' + ul.substr(0, ul.length-1);
	}
	else
	{
		ul = 'group=' + group_name;
		if (group_revision != "")
		{
			ul += ('&revision=' + group_revision);
		}
	}
	// 位置情報を取得する
	$.getJSON(api_site +  "/api/latest?escape=0&"+ ul + "&for_top=" + (fromtop ? "1" : "0"),
		{
			t : new Date().getTime()
		},
		function(json){
			var d = eval(json);
			if (!d) {
				// update();
				return false;
			}

			if (!d.result)
			{
				clearInterval(timer);
				alert(d.errmsg);
				return false;
			}

			if (datetimebox) {
				datetimebox.innerHTML = makeTimeString();
			}

			// 全体を表示するための範囲情報
			var min_lat = 91;
			var min_lon = 181;
			var max_lat = -91;
			var max_lon = -181;
			var valid_users = 0;

/* [ADD]
			// 共有マーカー表示
			if (d.group_updated == undefined || d.group_updated)
			{
				if (d.group_revision != undefined)
				{
					group_revision = d.group_revision;
				}
				if (d.group)
				{
					for (var idx in share_markers)
					{
						share_markers[idx].valid = false;
					}
					for (var grp=0; grp<d.group.length; grp++)
					{
						var key = d.group[grp].key;
						if (share_markers[key] == undefined)
						{
							share_markers[key] = new Object();
							share_markers[key].marker = createSharedMarker(new google.maps.LatLng(d.group[grp].lat, d.group[grp].lon), key, d.group[grp].desc)
							map.addOverlay(share_markers[key].marker);
						}
						share_markers[key].valid = true;
					}
					for (var idx in share_markers)
					{
						if (!share_markers[idx].valid)
						{
							map.removeOverlay(share_markers[idx].marker);
							delete share_markers[idx];
						}
					}
				}
			}
			for (var key in share_markers)
			{
				var lat = parseFloat(share_markers[key].marker.getLatLng().lat());
				var lon = parseFloat(share_markers[key].marker.getLatLng().lng());
				min_lat = Math.min(lat, min_lat);
				max_lat = Math.max(lat, max_lat);
				min_lon = Math.min(lon, min_lon);
				max_lon = Math.max(lon, max_lon);
				valid_users++;
			}
*/

			for (var u in users)
			{
				users[u].update = false;
			}

			var viewArea = map.getBounds();
			distance = new Array(); // [ADD]

			// 全員分ループ
			for (var i=0; i<d.points.length; i++)
			{
				var username = d.points[i].user;
				if (!isDefined(username, 'users'))
				{
					initUser(username, true);
				}

				var user = users[username];
				var data = d.points[i];

				user.update = true;

				// 位置・方位
				var lat = parseFloat(data.lat);
				var lon = parseFloat(data.lon);
				var td = parseFloat(data.dir);
				var velocity = parseFloat(data.velocity);
				var altitude = parseFloat(data.altitude);
				var type = parseInt(data.type);
				if(type != 99 && (type < 0 || type > 10)){
					type = 0;
				}

				// 距離計算用配列に格納 // [ADD]
				var nickname = data.nickname;
				distanceInit(username, lat, lon, nickname);

				// 地図の描画範囲外のアイコンは削除する
				var pt = new google.maps.LatLng(lat, lon);
				if (traceuser != 'all' && traceuser != username && !viewArea.contains(pt)) {
					removeUserMarker(user);
					continue;
				}

				// 無効なデータかどうか
				// if (lat == 0 && lon == 0) { continue; }

				// 前回の座標と違った場合はプロットする
				if (checkMoving(user.lat, user.lon, lat, lon))
				{
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
						if(data.ustream_status && data.ustream_status != 'offline') {
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
						if(data.ustream_status && data.ustream_status != 'offline') {
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

					// 次回のためにマーカーと位置情報を保存
					user.nickname = nickname;
					user.lat = lat;
					user.lon = lon;
					user.td = td;
					user.altitude = altitude;
					user.velocity = velocity;
					user.type = type;
					user.ustream_status = data.ustream_status;


					if (user.trace)
					{
						// 注目しているユーザーに移動
						map.panTo(pt);
						center = map.getCenter();
					}

					// データ表示するユーザー [ADD]
					if (username == view_user)
					{
						userExist = true;

						if(altitudeGraph.length > plotcount){
							altitudeGraph.shift();
						}
						if(velocityGraph.length > plotcount){
							velocityGraph.shift();
						}
						if(altitudeGraph.length == 0 && velocityGraph.length == 0){
							startPoint = new google.maps.LatLng(lat, lon);
						}
						nowPoint = new google.maps.LatLng(lat, lon);

						altitudeGraph.push(altitude);
						velocityGraph.push(velocity);

						// 情報表示ウィンドウ
						$("#infoTime").html(makeTimeString());
						if(isFinite(velocity)){
							$("#infoVelocity").html(Math.round(velocity * 10) / 10 + ' km/h');
						}else{
							$("#infoVelocity").html('--- km/h');
						}
						if(isFinite(altitude)){
							$("#infoAltitude").html(Math.round(altitude * 10) / 10 + ' m');
						}else{
							$("#infoAltitude").html('--- m');
						}

						if(altitudeGraph.length >= 2){
							$("#altitudeGraph").sparkline(altitudeGraph, { type: 'line', width: '120px', height: '20px', lineColor:'#0d0', fillColor:'#cfd', spotColor:'#f00', minSpotColor: false, maxSpotColor: false, spotRadius:2, normalRangeMin:0, normalRangeMax:0 });
						}else{
							$("#altitudeGraph").html('');
						}
						if(velocityGraph.length >= 2){
							$("#velocityGraph").sparkline(velocityGraph, { type: 'line', width: '120px', height: '20px', lineColor:'#00f', fillColor:'#cdf', chartRangeMin:0, chartRangeMax:80, spotColor:'#f00', minSpotColor: false, maxSpotColor: false, spotRadius:2 });
						}else{
							$("#velocityGraph").html('');
						}

						// 背景を点滅させて更新を知らせる
						$("#info").css("background-color", "#ff9");
						$("#info").fadeTo("slow", 1, function(){$("#info").css("background-color", "#ffc")});
						$("#info").fadeTo("slow", 0.8);
					}
				}
				min_lat = Math.min(lat, min_lat);
				max_lat = Math.max(lat, max_lat);
				min_lon = Math.min(lon, min_lon);
				max_lon = Math.max(lon, max_lon);
				valid_users++;
			}

			// データ表示するユーザーがいない [ADD]
			if(userExist && users[view_user].update == false){
				// 背景を赤くして更新されていないことを知らせる
				$("#info").css("background-color", "#faa");

				$("#address").fadeOut("slow");
				$("#address").html("");
				userExist = false;
			}

			// 近接センサーパネル [ADD]
			var distanceSort = new Array();
			for (var u in users)
			{
				if (!users[u].update)
				{
					removeUserMarker(users[u]);
				}else{
					var toPoint = new google.maps.LatLng(distance[u].lat, distance[u].lon);

					// view_userがオンライン
					if(isDefined(view_user, 'users') && users[view_user].update){
						if(u != view_user){
							distanceCalc(u, nowPoint, toPoint);
							distanceSort.push({key:u,val:distance[u].dist});
						}
					}else{
						distanceCalc(u, new google.maps.LatLng(35.658634, 139.745411), toPoint);
						distanceSort.push({key:u,val:distance[u].dist});
					}
				}
			}
			distanceSort.sort(function(a, b) {return Number(a.val) - Number(b.val);});
			var tmp = '';
			var distanceLengthMax = 5;
			if(distanceLengthMax > distanceSort.length){
					distanceLengthMax = distanceSort.length;
			}
			for(var i=0;i<distanceLengthMax;i++){
				tmp += '<tr><td class="nickname"><a href="/gpslive/' + distanceSort[i].key + '">' 
					+ distance[distanceSort[i].key].nickname + '</a></td>'
					+ '<td class="houi"><img src="' + static_file_site + 'green_arrow/arrow-' + distance[distanceSort[i].key].houi + '.png" height="16" width="16" /> ' 
						+ direction[distance[distanceSort[i].key].houi] + '</td>'
					+ '<td class="kyori">' + distance[distanceSort[i].key].kyori + '</td></tr>';
			}
			$("#kinsetsu-table").html(tmp);
			$("#imacocoUsers").html("（全体：" + d.points.length + "人）");

			if (traceuser == 'all' && valid_users > 0)
			{
				var avg_lat = (min_lat + max_lat) / 2;
				var avg_lon = (min_lon + max_lon) / 2;
				var ct = new google.maps.LatLng(avg_lat, avg_lon);
				if (valid_users == 1)
				{
					map.setCenter(ct, 14);
				}
				else
				{
					// 全体が表示できる矩形座標を計算
					var region = new google.maps.LatLngBounds(new google.maps.LatLng(min_lat, min_lon), new google.maps.LatLng(max_lat, max_lon));
					// 全体が表示できるように位置とズームを設定
					map.setCenter(ct, map.getBoundsZoomLevel(region));
				}
				center = ct;
			}
        }
	);
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
function initUser(username, flag)
{
	if (username)
	{
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

		var mo = new Object();
		mo.icon = nick_icon;
		mo.clickable = false;

		user = new Object();
		user.lat = 0;
		user.lon = 0;
		user.markeropts = markeropts;
		user.user_markeropts = mo;
		user.user_marker = new google.maps.Marker(new google.maps.LatLng(0,0), mo);
		user.linecolor = '#FF0000';
		user.linewidth = 2;
		user.transparent = 0.8;
		user.watch = flag;
		user.trace = false;
		user.track = new Array();
		user.plat = 0;
		user.plon = 0;
		user.points = "";
		user.levels = "";
		user.level_len = 0;
		user.last_level = "";
		user.update = false;
		user.broadcast = '';
		users[username] = user;
		user.plot = new Array();
		user.nick_icon = nick_icon;
		user.plot_markers = new Array();
		user.plot_path = plot_path;
		user.infowindow = null;

	}
}

// 地図の大きさを変える
function setMapSize(w, h)
{
	var d = document.getElementById("map");
	if (d && d.style)
	{
		var center = map.getCenter();
		d.style.width = w;
		d.style.height = h;
		map.checkResize();
		map.panTo(center);
	}
	return false;
}

// 注目するユーザーを設定
function setTraceUser(username, magnify)
{
	// まず全員のフラグをクリア
	for (var user in users)
	{
		users[user].trace = false;
	}

	if (username != '__nouser__' && isDefined(username, 'users'))
	{
//		alert("setTraceUser("+username+") user found");
		// 引数のユーザーがいた
		var user = users[username];
		user.trace = true;
		if (user.lat != 0 && user.lon != 0)
		{
			if (magnify != undefined)
			{
				map.setCenter(new google.maps.LatLng(user.lat, user.lon), magnify);
			}
			else
			{
				map.panTo(new google.maps.LatLng(user.lat, user.lon));
			}
			center = map.getCenter();
		}
	}
	var sel = document.getElementById("traceuser");
	if (sel) {
		for (var idx = 0; idx < sel.length; idx++)
		{
			if (sel.options[idx].value == username)
			{
				sel.options.selectedIndex = idx;
			}
		}
	}
	traceuser = username;
}

//-------------------------------------------------------------
// 移動したかどうかをチェックする(1m以上移動したかどうか)
/*
function checkMoving(lat_from, lon_from, lat_to, lon_to)
{
	var from = new google.maps.LatLng(lat_from, lon_from);
	var to = new google.maps.LatLng(lat_to, lon_to);
	return to.distanceFrom(from) > 1;
}
*/
// 注意：簡易的に緯度経度の変化のみ見ることにする
function checkMoving(lat_from, lon_from, lat_to, lon_to) {
	return (lat_from != lat_to || lon_from != lon_to);
}

// マーカーを消す
function removeUserMarker(user)
{
	if (typeof(user.prev_marker) != 'undefined')
	{
		map.removeOverlay(user.prev_marker);
		user.prev_marker = undefined;
	}
	if (user.prev_marker2 != undefined)
	{
		map.removeOverlay(user.prev_marker2);
	}
	if (user.polyline != undefined)
	{
		map.removeOverlay(user.polyline);
	}
	while (user.track.length > 0) {
		var mk = user.track.shift();
		map.removeOverlay(mk);
	}
	if (user.stream_marker)
	{
		map.removeOverlay(user.stream_marker);
		user.stream_marker = undefined;
	}
	user.lat = 0;
	user.lon = 0;
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
						txt = txt.replace('%twitter%', res.twitter ? '<a target="_blank" href="https://twitter.com/' + res.twitter + '">' + res.twitter + ' on Twitter</a>' : '');
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
function makeTimeString()
{
	var mySysDate = new Date();
	var myYear = mySysDate.getFullYear();
	var myMonth = mySysDate.getMonth()+1;
	var myDate = mySysDate.getDate();
	var myHour = mySysDate.getHours();
	var myMin = mySysDate.getMinutes();
	var mySec = mySysDate.getSeconds();
	if (myMonth < 10) { myMonth = "0" + myMonth; }
	if (myDate < 10) { myDate = "0" + myDate; }
	if (myHour < 10) { myHour = "0" + myHour; }
	if (myMin < 10) { myMin = "0" + myMin; }
	if (mySec < 10) { mySec = "0" + mySec; }
	return myYear + '-' + myMonth + '-' + myDate + ' ' + myHour + ':' + myMin + ':' + mySec;
}

// グローバル変数が定義済みかどうか
// objを指定すると、obj.vが定義済みかどうかを判定
// 指定がない場合はwindow.v(グローバル変数v)が定義済みかどうかを判定
function isDefined(v, obj)
{
	if (obj == undefined) {
		obj = 'window';
	}
	var ret = typeof(eval(obj)[v]) != 'undefined';
//	alert('variable ' + obj + '.' + v + ' is ' + (ret ? 'defined' : 'undefined'));
	return ret;
}



// メッセージ出力
function setMessage(mesg)
{
	var msg = document.getElementById('msg');
	if (msg)
	{
		msg.innerHTML = mesg;
	}
}



var iconImage = [
	{ 'path':'/car', 'direction': true, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':10,
		'path2':'/middle_arrow/arrow-', 'w2':52, 'h2':52, 'ax2':26, 'ay2':26, 'wax2':26, 'way2':20 },
	{ 'path':'/keitai', 'direction': false, 'ext':'.png', 'w':20, 'h':45, 'ax':10, 'ay':23, 'wax':10, 'way':18 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/plane', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'/train', 'direction': false, 'ext':'.png', 'w':55, 'h':45, 'ax':28, 'ay':23, 'wax':28, 'way':19 },
	{ 'path':'/shinkansen', 'direction': false, 'ext':'.png', 'w':44, 'h':42, 'ax':22, 'ay':21, 'wax':22, 'way':17 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/bus', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/cycling', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/hiker', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/motorcycling', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/helicopter', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
	{ 'path':'http://maps.google.co.jp/mapfiles/ms/icons/ferry', 'direction': false, 'ext':'.png', 'w':32, 'h':32, 'ax':16, 'ay':16, 'wax':16, 'way':16 },
];


var defaultDirectionIcon = new Array();
var directionIcon = new Array();

function createSharedMarker(pt, key, desc)
{
	var marker = new google.maps.Marker(pt);
	google.maps.event.addListener(marker, 'click', function()
		{
			updateOff();
			marker.openInfoWindowHtml('<div><pre>' + desc + '</pre></div><hr><div><button onClick=\"removeSharedMarker(\''+key+'\')\">削除</button></div>');
		}
	);
	google.maps.event.addListener(marker, 'infowindowclose', function()
		{
			updateOn();
		}
	);
	return marker;
}

function removeSharedMarker(key)
{
	if (!isDefined('group_name') || group_name == '')
	{
		alert('グループ表示モードではありません');
		return;
	}

	var req = GXmlHttp.create();
	req.open("GET", "/user/deletemarker?group=" + encodeURIComponent(group_name) + "&key=" + key , false);
	req.send("");
	if (req.status != 200 || req.responseText == "")
	{
		alert('サーバでエラーが発生しました');
		return false;
	}
	var res = eval(req.responseText);
	// 情報ウィンドウ内のHTML
	if (res && res.result)
	{
		map.removeOverlay(share_markers[key].marker);
		delete share_markers[key];
		alert('削除しました');
		return true;
	}
	else
	{
		alert('サーバでエラーが発生しました:' + res.errmsg);
		return false;
	}
}

// プロットのON/OFFの切り替え
function getCheck(obj)
{
	var user = users[obj.id.substr(3)];
	if (user) {
		user.watch = obj.checked;
		if (!obj.checked && user.prev_marker) {
			map.removeOverlay(user.prev_marker);
			user.prev_marker = null;
		}
	}
}

// 描画モードを設定
function setPlotMode(mode)
{
	plotmode = mode;
	var trace = '';
	for (user in users) {
		if (users[user].trace) {
			trace = user;
		}
		initUser(user, users[user].watch);
	}
	if (trace != '') {
		users[trace].trace = true;
	}
	map.clearOverlays();
	return false;
}

// ユーザー一覧をサーバから取得する
function loadUserList(watch)
{
	var request = GXmlHttp.create();
	request.open("GET",api_site + "/api/user_list?id="+ new Date().getTime() , false);
	request.send("");
	if (request.readyState == 4)
	{
		if (request.status != 200 || request.responseText == "")
		{
			return false;
		}
		var d = eval(request.responseText);
		if (!d) {
			// loadUserList();
			return false;
		}
		if (d.result)
		{
			var sel = document.getElementById("traceuser");
			if (sel)
			{
				sel.length = 2;
				sel.options[0].value = '__nouser__';
				sel.options[0].text = "注目しない";
				sel.options.selectedIndex = 0;
				sel.options[1].value = 'all';
				sel.options[1].text = '全体';
			}
			var list = "";
			for (var i=0; i<d.list.length; i++)
			{
				var username = d.list[i].user;
				if (!users[username])
				{
					initUser(username, watch);
				}

				if (sel)
				{
					sel.length++;
					sel.options[sel.length-1].value = username;
					sel.options[sel.length-1].text = username;
				}
				list += "<span id=\"status_" + username + "\">" + username + "</span><br>";
			}
			var p = document.getElementById("userlist");
			if (p) {
				p.innerHTML = list;
			}
		}
	}
	return false;
}


//----------------------------------------------- get_browser_width
function get_browser_width()
{
	if ( window.innerWidth )
	{
		return window.innerWidth;
	}
	else if ( document.documentElement && document.documentElement.clientWidth != 0 )
	{
		return document.documentElement.clientWidth;
	}
	else if ( document.body )
	{
		return document.body.clientWidth;
	}
	return 0;
}

//----------------------------------------------- get_browser_height
function get_browser_height()
{
	if ( window.innerHeight )
	{
		return window.innerHeight;
	}
	else if ( document.documentElement && document.documentElement.clientHeight != 0 )
	{
		return document.documentElement.clientHeight;
	}
	else if ( document.body )
	{
		return document.body.clientHeight;
	}
	return 0;
}

function resize()
{
	var winWidth = get_browser_width();
	var winHeight = get_browser_height();
	var map_div = document.getElementById("map");
	if (map_div && map_div.style)
	{
		var h = 0;
		map_div.style.width = (winWidth - 20) + "px";
		if (apiview)
		{
			if (hidelist)
			{
				h = 20;
			}
			else
			{
				h = 60;
			}
		}
		else
		{
			if (hidelist)
			{
				h = 150;
			}
			else
			{
				h = 180;
			}
		}
		map_div.style.height = (winHeight - h) + "px";
	}
	if( map )
	{
		map.checkResize();
		map.panTo(center);
	}
}

function updateOff()
{
	if (prev_trace == "")
	{
		prev_trace = traceuser;
		setTraceUser('__nouser__');
	}
}

function updateOn()
{
	if (prev_trace != "")
	{
		setTraceUser(prev_trace);
		prev_trace = "";
	}
}

var rmenu;
var rmenu_lat;
var rmenu_lon;
var rmenu_marker;

function addMarker()
{
	if (!isDefined('group_name') || group_name == '')
	{
		alert('グループ表示モードではありません');
		return;
	}

	var req = GXmlHttp.create();
	var el_desc = document.getElementById("desc");
	var data = "group=" + encodeURIComponent(group_name) + "&desc=" + encodeURIComponent(el_desc.value) + "&lat=" + rmenu_lat + "&lon=" + rmenu_lon;
	req.open("POST", "/user/addmarker" , false);
	req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8");
	req.send(data);
	if (req.status != 200 || req.responseText == "")
	{
		alert('サーバでエラーが発生しました');
		return false;
	}
	var res = eval(req.responseText);
	// 情報ウィンドウ内のHTML
	if (res && res.result)
	{
		alert('登録しました');
		return true;
	}
	else
	{
		alert('サーバでエラーが発生しました:' + res.errmsg);
		return false;
	}
}

function putMarker()
{
	rmenu.style.visibility = "hidden";

	rmenu_marker = new google.maps.Marker(new google.maps.LatLng(rmenu_lat, rmenu_lon));
	map.addOverlay(rmenu_marker);
	google.maps.event.addListener(rmenu_marker, 'infowindowclose', function()
	{
		map.removeOverlay(rmenu_marker);
		updateOn();
	});
	rmenu_marker.openInfoWindow(
		"説明：<br>" +
		"<textarea id='desc' rows='4' cols='40'></textarea><br>" +
		"<button onClick='if (addMarker()) { rmenu_marker.closeInfoWindow(); }'>登録</button><button onClick='rmenu_marker.closeInfoWindow()'>キャンセル</button>"
	);
}

function showAddress(address)
{
	geocoder.getLatLng(address, function(point)
		{
			if (!point)
			{
				alert(address + " not found");
			}
			else
			{
				map.panTo(point);
				rmenu_lat = point.lat();
				rmenu_lon = point.lng();
				putMarker();
			}
		}
	);
}

function openSearchWindow()
{
	rmenu.style.visibility = "hidden";

	map.openInfoWindow(new google.maps.LatLng(rmenu_lat, rmenu_lon),
		"Googleマップで検索<br><input size='40' id='keyword'><button onClick='showAddress(document.getElementById(\"keyword\").value)'>検索</button><button onClick='map.closeInfoWindow()'>キャンセル</button>"
	);
}

function CancelEvent(event)
{
	e = event;
	if (typeof e.preventDefault  == 'function')
		e.preventDefault();
	if (typeof e.stopPropagation == 'function')
		e.stopPropagation();
	if (window.event) {
		window.event.cancelBubble = true; // for IE
		window.event.returnValue = false; // for IE
	}
}
function SignatureBox() {}
/*
SignatureBox.prototype = new GControl();
SignatureBox.prototype.initialize = function(map)
{
	container = document.createElement("div");
	container.style.border = "0px";
	container.style.padding = "0px 0px 0px 0px";
	container.style.textAlign = "center";
	container.innerHTML = '<a href="http://imakoko-gps.appspot.com/" target="_blank"><img src="http://www.fujita-lab.com/imakoko/imakoko.png" height="33" width="114" border="0"></a>';

	map.getContainer().appendChild(container);
	return container;
}

SignatureBox.prototype.getDefaultPosition = function()
{
	return new ControlPosition(G_ANCHOR_BOTTOM_LEFT, new google.maps.Size(2, 34));
}
*/

function DateTimeBox() {}
/*
DateTimeBox.prototype = new GControl();
DateTimeBox.prototype.initialize = function(map)
{
	container = document.createElement("div");
	container.id = "DateTime";
	container.style.border = "0px";
	container.style.padding = "0px 0px 0px 0px";
	container.style.textAlign = "left";
//	container.style.backgroundColor
	container.style.color = 'black';
	container.style.fontSize = "12px";

	container.innerHTML = '';

	map.getContainer().appendChild(container);
	return container;
}

DateTimeBox.prototype.getDefaultPosition = function()
{
	return new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(6, 28));
}
*/


function load_next()
{
	if (isDefined('trace_user'))
	{
		if (trace_user != 'all' && trace_user != '__nouser__')
		{
			initUser(trace_user, true);
		}
		setTraceUser(trace_user);
	}

	if (!isDefined('use_update') || use_update) {
		update();
		timer = window.setInterval(update, 10000); // [CHANGE]
	}
}

if (typeof use_onload != 'undefined' && use_onload) {
	window.onload = initialize;
}

/*
 * ====================================================================================================
 * GPS Live Tracking : Shintaro Inagaki (2008/07/24)
 * ====================================================================================================
 */

	var reloadId;
	var twitterReloadTime = 60 * 1000;
	var tw_tl_id = 1;
	var geoCache = null;
	var docomoMap = null;
	var emobileMap = null;
	var uqwimaxMap = null;
	var geocoder = new google.maps.Geocoder();

	$("#address").hide();
	$("#chat").hide();
	$("#accordion").accordion({
		autoHeight: false,
		collapsible: true
	});

	// Twitterメッセージ表示幅の設定
	$("#twitter").css("width", $(document.body).innerWidth() - 455);
	$(window).bind(
		'resize',
		function() {
			$("#twitter").css("width", $(document.body).innerWidth() - 455);
		}
	);

	$("#loadGeocaching").click(
		function() {
			if (!geoCache) {
				geoCache = new GGeoXml("/img/gpslive/japanCaches-target.kml"); // 2008/08/09
			}

			if (this.checked) {
				map.addOverlay(geoCache);
			} else {
				map.removeOverlay(geoCache);
			}
		}
	);
/*
	$("#loadDocomo").click(
		function() {
			if (!docomoMap) {
				docomoMap = new GGroundOverlay(static_file_site + "gpslive/layer_docomo_201106.png", new google.maps.LatLngBounds(new google.maps.LatLng(21.75, 120), new google.maps.LatLng(48, 146.25))); // 2011/06
			}

			if (this.checked) {
				map.addOverlay(docomoMap);
			} else {
				map.removeOverlay(docomoMap);
			}
		}
	);

	$("#loadEmobile").click(
		function() {
			if (!emobileMap) {
				emobileMap = new GGroundOverlay(static_file_site + "gpslive/layer_emobile_201106.png", new google.maps.LatLngBounds(new google.maps.LatLng(23, 123), new google.maps.LatLng(47, 147))); // 2011/06
			}

			if (this.checked) {
				map.addOverlay(emobileMap);
			} else {
				map.removeOverlay(emobileMap);
			}
		}
	);

	$("#loadUqwimax").click(
		function() {
			if (!uqwimaxMap) {
				uqwimaxMap = new GGroundOverlay(static_file_site + "gpslive/layer_uqwimax_201106.png", new google.maps.LatLngBounds(new google.maps.LatLng(25.435, 126.86), new google.maps.LatLng(44.57, 144.94))); // 2011/06
			}

			if (this.checked) {
				map.addOverlay(uqwimaxMap);
			} else {
				map.removeOverlay(uqwimaxMap);
			}
		}
	);
*/
	$("#changeMoviePlayerUst").click(
		function() {
			$("#justin").hide("fast", function () {
				$("#ustream").show("fast");
			});
			$("#movieSize span.moviePlayer:eq(0)").css("background-color", "yellow");
			$("#movieSize span.moviePlayer:not(:eq(0))").css("background-color", "");
			return false;
		}
	);

	$("#changeMoviePlayerJtv").click(
		function() {
			$("#ustream").hide("fast", function () {
				$("#justin").show("fast");
			});
			$("#movieSize span.moviePlayer:eq(1)").css("background-color", "yellow");
			$("#movieSize span.moviePlayer:not(:eq(1))").css("background-color", "");
			return false;
		}
	);

	$("#changeMovieSizeBig").click(
		function() {
			$("#movie, #moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("width", 400);
			$("#moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("height", 320);
			$("#moviePlayer").show("normal");
			map.removeControl(controlGMapType);
			map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(415, 5)));
			$("#info").css("right", 415);
			$("#movieSize span.movieSize:eq(0)").css("background-color", "yellow");
			$("#movieSize span.movieSize:not(:eq(0))").css("background-color", "");
			return false;
		}
	);

	$("#changeMovieSizeNormal").click(
		function() {
			$("#movie, #moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("width", 300);
			$("#moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("height", 240);
			$("#moviePlayer").show("normal");
			map.removeControl(controlGMapType);
			map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(315, 5)));
			$("#info").css("right", 315);
			$("#movieSize span.movieSize:eq(1)").css("background-color", "yellow");
			$("#movieSize span.movieSize:not(:eq(1))").css("background-color", "");
			return false;
		}
	);

	$("#changeMovieSizeSmall").click(
		function() {
			$("#movie, #moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("width", 200);
			$("#moviePlayer, #ustream, #justin, #ustFlash, #jtvFlash").css("height", 160);
			$("#moviePlayer").show("normal");
			map.removeControl(controlGMapType);
			map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(220, 5)));
			$("#info").css("right", 215);
			$("#movieSize span.movieSize:eq(2)").css("background-color", "yellow");
			$("#movieSize span.movieSize:not(:eq(2))").css("background-color", "");
			return false;
		}
	);

	$("#changeMovieSizeHide").click(
		function() {
			$("#moviePlayer").hide("normal");
			map.removeControl(controlGMapType);
			map.addControl(controlGMapType, new ControlPosition(G_ANCHOR_TOP_RIGHT, new google.maps.Size(220, 5)));
			$("#info").css("right", 5);
			$("#movieSize span.movieSize:eq(3)").css("background-color", "yellow");
			$("#movieSize span.movieSize:not(:eq(3))").css("background-color", "");
			return false;
		}
	);

	$("#movieSize span.movieSize:eq(1)").css("background-color", "yellow");
	$("#movieSize span.moviePlayer:eq(0)").css("background-color", "yellow");

	$("#changeChatSizeShow").click(
		function() {
			$("#chat").show("normal");
			$("#chatSize span.chatSize:eq(0)").css("background-color", "yellow");
			$("#chatSize span.chatSize:not(:eq(0))").css("background-color", "");
			return false;
		}
	);

	$("#changeChatSizeHide").click(
		function() {
			$("#chat").hide("normal");
			$("#chatSize span.chatSize:eq(1)").css("background-color", "yellow");
			$("#chatSize span.chatSize:not(:eq(1))").css("background-color", "");
			return false;
		}
	);

	$("#chatSize span.chatSize:eq(1)").css("background-color", "yellow");

	// Twitter
//	reloadId = setTimeout(twitterUpdate, 0);

	function twitterUpdate() {
		// Twitter読み込み
		if(twitter_id){
//			getTwitterSearch();
		}
		// 逆ジオコーディング
		if(userExist){
			geocoder.getLocations(nowPoint, geocoding);
		}
		reloadId = setTimeout(twitterUpdate, twitterReloadTime);
	}

	function getTwitterSearch() {
		var tweet = new Array();

		$.ajax( {
			type : 'GET',
			url : 'http://search.twitter.com/search.json?q=' + twitter_id,
			data : {
//				since_id : tw_tl_id
			},
			dataType : 'jsonp',
			success : function(json) {
				for ( var i = json.results.length - 1; i >= 0; i--) {
					var tw_tl_text = json.results[i]['text'];

					tw_tl_text = replaceURLWithHTMLLinks(tw_tl_text);


					var tw_tl_user = json.results[i]['from_user'];
					var tw_tl_image_url = json.results[i]['profile_image_url'];
					var tw_tl_created_at = json.results[i]['created_at'];

					var created_at = tw_tl_created_at.split(" ");

					// Safari対応
					Saf = /a/.__proto__ == '//'
					if (Saf) {
						var post_date = new Date(created_at[1] + " " + created_at[2] + ", " + created_at[3] + " " + created_at[4]);
					} else {
						var post_date = new Date(created_at[4] + " " + created_at[1] + ", " + created_at[2] + " " + created_at[3]);
					}
					post_date.setHours(post_date.getHours() + 9);

					var year = post_date.getFullYear();
					var month = post_date.getMonth() + 1;
					var day = post_date.getDate();
					var hour = post_date.getHours();
					hour = (hour < 10) ? "0" + hour : hour;
					var min = post_date.getMinutes();
					min = (min < 10) ? "0" + min : min;
					var sec = post_date.getSeconds();
					sec = (sec < 10) ? "0" + sec : sec;

					var formated_time = year + '/' + month + '/' + day + ' ' + hour + ':' + min + ':' + sec;

					if(twitter_id.toLowerCase() == tw_tl_user.toLowerCase()){
						tw_tl_text = '<span style="color:#acf;">' + tw_tl_text + '</span>';
					}

					if(json.results[i]['id'] > tw_tl_id){
						tweet.unshift('<img src="' + tw_tl_image_url + '" width="16" height="16" />' + '<strong><a href="http://twitter.com/' + tw_tl_user + '" target="_blank">' + tw_tl_user + '</a></strong> ' + tw_tl_text + ' <span class="timeNew">(' + formated_time + ')</span>');
						tw_tl_id = json.results[i]['id'];
					}else{
						tweet.unshift('<img src="' + tw_tl_image_url + '" width="16" height="16" />' + '<strong><a href="http://twitter.com/' + tw_tl_user + '" target="_blank">' + tw_tl_user + '</a></strong> ' + tw_tl_text + ' <span class="time">(' + formated_time + ')</span>');
					}
					if (tweet.length > 6) {
						tweet.pop();
					}
				}
			},
			complete : function() {
				tweets = "";
				for ( var i = 0; i < tweet.length; i++) {
					tweets += tweet[i] + '<br />';
				}

				$("#twitter").html(tweets);
			}
		});
	}

	function geocoding(response) {
		if (!response || response.Status.code != 200) {
			$("#address").fadeOut("slow").html("");
		} else {
			var results = response.Placemark;
			var geocodeAddress = null;
			var geocodeRoadName = null;
			var hasAddressFlag = false;

			for(i=0; i < results.length; i++){
				if (!hasAddressFlag && results[i].AddressDetails.Accuracy != 5 && results[i].AddressDetails.Accuracy != 6) {
					if(results[i].address.indexOf("日本, 〒") == 0){
						geocodeAddress = results[i].address.substring(14);
					}else if(results[i].address.indexOf("日本, ") == 0){
						geocodeAddress = results[i].address.substring(4);
					}else{
						geocodeAddress = results[i].address;
					}
					hasAddressFlag = true;
				}else if(results[i].AddressDetails.Accuracy == 6 ){
					if(results[i].AddressDetails.Country.Thoroughfare.ThoroughfareName){
						geocodeRoadName = results[i].AddressDetails.Country.Thoroughfare.ThoroughfareName;
					}
				}
			}
			if(!geocodeAddress){
				geocodeAddress = "？";
			}else if(geocodeRoadName){
				geocodeAddress += '<span class="roadName">（' + geocodeRoadName + '）</span>';
			}

			if($("#address").html() == ""){
				$("#nickname").hide("slow");
				$("#address").html(geocodeAddress).fadeIn("slow");
			}else if($("#address").html() != geocodeAddress){
				$("#address").fadeOut("slow", function() { $("#address").html(geocodeAddress).fadeIn("slow"); });
			}
		}
	}

	function distanceInit(username, lat, lon, nickname) {

		tmp = new Object();
		tmp.lat = lat;
		tmp.lon = lon;
		if(nickname.length > 12){
			tmp.nickname = nickname.substr(0, 12) + '…';
		}else{
			tmp.nickname = nickname;
		}
		tmp.dist = 0;
		tmp.kyori = "";
		tmp.heading = 0;
		tmp.houi = "";

		distance[username] = tmp;
	}

	function distanceCalc(username, from, to) {

		var fromX = from.lngRadians();
		var fromY = from.latRadians();
		var toX = to.lngRadians();
		var toY = to.latRadians();
		var earthRadius = 6378137;
		var deltaX = earthRadius * (toX - fromX) * Math.cos(fromY);
		var deltaY = earthRadius * (toY - fromY);
		var dist = Math.sqrt( Math.pow(deltaX, 2) + Math.pow(deltaY, 2) );
		var dist2 = "";
		var heading = null;

		if(dist > 1000){
			kyori = Math.round(dist/1000*10)/10;
			kyori = kyori + " km";
		}else{
			kyori = Math.round(dist*10)/10;
			kyori = "<strong>" + kyori + " m</strong>";
		}

		if(deltaX >= 0){
			heading = 90 - Math.atan(deltaY/deltaX) / Math.PI * 180;
		}else{
			heading = 90 - Math.atan(deltaY/deltaX) / Math.PI * 180 + 180;
		}

		distance[username].dist = dist;
		distance[username].kyori = kyori;
		distance[username].heading = heading;
		distance[username].houi = headingToHoui(heading);
	}

	function headingToHoui(heading) {
		var houi = 0;

		if (heading < 11.25 || heading >= 348.75) {
			houi = "0";
		}else if (heading < 33.75) {
			houi = "1";
		}else if (heading < 56.25) {
			houi = "2";
		}else if (heading < 78.75) {
			houi = "3";
		}else if (heading < 101.25) {
			houi = "4";
		}else if (heading < 123.75) {
			houi = "5";
		}else if (heading < 146.25) {
			houi = "6";
		}else if (heading < 168.75) {
			houi = "7";
		}else if (heading < 191.25) {
			houi = "8";
		}else if (heading < 213.75) {
			houi = "9";
		}else if (heading < 236.25) {
			houi = "10";
		}else if (heading < 258.75) {
			houi = "11";
		}else if (heading < 281.25) {
			houi = "12";
		}else if (heading < 303.75) {
			houi = "13";
		}else if (heading < 326.25) {
			houi = "14";
		}else{
			houi = "15";
		}
		return houi;
	}

	function replaceURLWithHTMLLinks(text) {
	    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
	    return text.replace(exp,"<a href='$1' target='_blank'>$1</a>");
	}
});


