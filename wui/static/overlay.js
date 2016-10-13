(function($){//BEGIN $ = jQuery
	
	//$.pageSize使うよ。なきゃここで。
	$.pageSize = $.pageSize || function(){
		var xScroll, yScroll;
		if(window.innerHeight && window.scrollMaxY){
			xScroll = window.innerWidth + window.scrollMaxX;
			yScroll = window.innerHeight + window.scrollMaxY;
		}else if(document.body.scrollHeight > document.body.offsetHeight){
			xScroll = document.body.scrollWidth;
			yScroll = document.body.scrollHeight;
		}else{
			xScroll = document.body.offsetWidth;
			yScroll = document.body.offsetHeight;
		}
		
		var windowWidth, windowHeight;
		if(self.innerHeight) {
			if(document.documentElement.clientWidth){
				windowWidth = document.documentElement.clientWidth; 
			} else {
				windowWidth = self.innerWidth;
			}
			windowHeight = self.innerHeight;
		}else if(document.documentElement && document.documentElement.clientHeight){
			windowWidth = document.documentElement.clientWidth;
			windowHeight = document.documentElement.clientHeight;
		}else if(document.body){
			windowWidth = document.body.clientWidth;
			windowHeight = document.body.clientHeight;
		}
		
		var pageWidth = xScroll < windowWidth ? xScroll : windowWidth;
		var pageHeight = yScroll < windowHeight ? windowHeight : yScroll;
		
		return [pageWidth,pageHeight,windowWidth,windowHeight];
	};
	
	//initialize
	$.overlay = function(settings){
		var _this = this;
		settings = $.extend({
			  bg_color: "#000000"
			, opacity: 0.5
			, fade_speed: 400
			, overlay_class: "pageOverlay"
			, click_close: true // true|falseか、this.closeへの引数（引数が複数なら配列で）。
		}, settings);
		var click_close = settings.click_close;
		
		var pageSize = $.overlay.pageSize = $.pageSize();
		
		this.fade_speed = settings.fade_speed;
		this.opacity = settings.opacity;
		this.overlay_id = settings.overlay_class + $.overlay.uid++;
		this.click_close = settings.click_close;
		this.$select;
		this.opend = false;
		
		//overlay
		var $overlay = this.$obj = $('<div></div>').attr({
				  'class': settings.overlay_class
				, id: this.overlay_id
			}).css({
				  display:			"none"
				, width: pageSize[2]
				, height: pageSize[1]
				, position:			"absolute"
				, top:				0
				, left:				0
				, backgroundColor:	settings.bg_color
				, opacity:			0
			});
		$overlay.appendTo($('body'));
		$.overlay.$objs = $.overlay.$objs.add($overlay);
		
		//click_close
		if(click_close){
			$overlay.click(function(){
				if(click_close === true){
					_this.close();
				}else{
					_this.close.apply(_this, $.makeArray(click_close));
				}
			});
		}
		
		//onresize
		$(window).unbind('resize.overlay_resize').bind('resize.overlay_resize', function(){
			pageSize = $.overlay.pageSize = $.pageSize();
			$.overlay.$objs.css({
				width: pageSize[2],
				height: pageSize[1]
			});
		});
	}
	
	//uid
	$.overlay.uid = 0;
	
	//jQuery objects
	$.overlay.$objs = $([]);
	
	//pageSize
	$.overlay.pageSize = [];
	
	//prototype
	$.overlay.prototype = {
		//open
		  open: function(speed, callback){
			var _this = this;
			var $overlay = this.$obj;
			this.$select = $('select:visible').hide();
			if(!callback && $.isFunction(speed)){
				callback = speed;
				speed = null;
			}
			$overlay
				.show()
				.fadeTo(speed || this.fade_speed, this.opacity, function(){
					_this.opend = true;
					if(callback && $.isFunction(callback)) callback.apply(this, arguments);
				});
		}
		//close
		, close: function(speed, callback){
			var _this = this;
			if(_this.opend){
				var $overlay = this.$obj;
				var $select = this.$select;
				if(!callback && $.isFunction(speed)){
					callback = speed;
					speed = null;
				}
				_this.opend = false;
				$overlay
					.stop()
					.fadeTo(speed || this.fade_speed, 0, function(){
						$overlay.hide();
						$select.show();
						if(callback && $.isFunction(callback)) callback.apply(this, arguments);
					});
			}
		}
	};
	
	
})(jQuery);//END $ = jQuery
