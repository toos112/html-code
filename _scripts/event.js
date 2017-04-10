function EventDispatcher() {
	this._handlers = {};
	this.handler = function(type, func) {
		if (this._handlers[type] === undefined)
			this._handlers[type] = [];
		this._handlers[type].push(func);
	};
	this.trigger = function(type, e) {
		for (var i = 0; i < this._handlers[type].length; i++)
			this._handlers[type][i](e);
	};
}

var $event = new function() {
	this._dispatcher = new EventDispatcher();
	this.handler = function(type, func) {
		this._dispatcher.handler(type, func);
	};
	this._trigger = function(type, e) {
		this._dispatcher.trigger(type, e);
	};
};