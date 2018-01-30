function EventDispatcher() {
	this._handlers = {};
	this.handler = function(type, listener) {
		if (this._handlers[type] === undefined)
			this._handlers[type] = [];
		this._handlers[type].push(listener);
	};
	this.remove = function(type, listener) {
		if (this._handlers[type] === undefined) return;
		var index = this._handlers[type].indexOf(listener);
		if (index != -1) this._handlers[type].splice(index, 1);
	};
	this.trigger = function(type, e) {
		if (this._handlers[type] != undefined)
			for (var i = 0; i < this._handlers[type].length; i++)
				this._handlers[type][i].call([e]);
	};
}

function EventListener(func, context) {
	this.context = context;
	this.func = func;
	this.call = function(e) {
		this.func.apply(this.context, e);
	};
}

var $event = new function() {
	this._dispatcher = new EventDispatcher();
	this.handler = function(type, listener) {
		this._dispatcher.handler(type, listener);
	};
	this.remove = function(type, listener) {
		this._dispatcher.remove(type, listener);
	};
	this._trigger = function(type, e) {
		this._dispatcher.trigger(type, e);
	};
};