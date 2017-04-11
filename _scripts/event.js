function EventDispatcher() {
	this._handlers = {};
	this.handler = function(type, context, func) {
		if (this._handlers[type] === undefined)
			this._handlers[type] = [];
		this._handlers[type].push([context, func]);
	};
	this.trigger = function(type, e) {
		if (this._handlers[type] != undefined)
			for (var i = 0; i < this._handlers[type].length; i++)
				this._handlers[type][i][1].apply(this._handlers[type][i][0], [e]);
	};
}

var $event = new function() {
	this._dispatcher = new EventDispatcher();
	this.handler = function(type, context, func) {
		this._dispatcher.handler(type, context, func);
	};
	this._trigger = function(type, e) {
		this._dispatcher.trigger(type, e);
	};
};