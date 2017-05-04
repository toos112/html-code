_.I("_scripts/event.js");

var $ws = {
	addProtocol: function(name) {
		_.getWSMan().addProtocol(name);
	}
};

function _WebSocketWrapper(e) {
	this._ws = e.getWS();
	this._dispatcher = new EventDispatcher();
	this.handler = function(type, listener) {
		this._dispatcher.handler(type, listener);
	};
	this._trigger = function(type, ee) {
		this._dispatcher.trigger(type, ee);
	};
	this.write = function(string) {
		this._ws.out(string);
	};
	this.close = function() {
		this._ws.close();
	}
	this.protocol = "" + this._ws.getProtocol();
	this.address = "" + this._ws.getAddress().substr(1);
	this.equals = function(other) {
		return this._ws == other._ws;
	}
};

_.event("ws.new", function(e) {
	var websocket = new _WebSocketWrapper(e);
	e.getWS().event("receive", function(ee) {
		websocket._trigger("message", {
			message: "" + ee.getMessage()
		});
	});
	e.getWS().event("close", function(ee) {
		websocket._trigger("close", { 
			timeout: ee.getTimeout() ? true : false
		});
	});
	$event._trigger("ws_new", {
		ws: websocket
	});
});

_.event("ws.close", function(e) {
	$event._trigger("ws_close", {
		ws: new _WebSocketWrapper(e)
	})
});