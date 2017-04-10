_.I("_scripts/event.js");

var $ws = {
	addProtocol: function(name) {
		_.getWSMan().addProtocol(name);
	}
};

_.event("ws.new", function(e) {
	var websocket = new function() {
		this._ws = e.getWS();
		this._dispatcher = new EventDispatcher();
		this.handler = function(type, func) {
			this._dispatcher.handler(type, func);
		};
		this._trigger = function(type, e) {
			this._dispatcher.trigger(type, e);
		};
		this.write = function(string) {
			this._ws.out(string);
		};
	};
	e.getWS().event("receive", function(ee) {
		websocket._trigger("message", {
			message: ee.getMessage()
		});
	});
	$event._trigger("ws_new", {
		ws: websocket
	});
});