var toElemArray = function(s) {
	var e = document.createElement("div");
	e.innerHTML = s;
	return e.childNodes;
};

var _makeAlert = function(w, h, x, y) {
	var e = document.createElement("div");
	e.className = "alert";
	e.style.display = "none";
	e.style.position = "absolute";
	e.style.width = w + "px";
	e.style.height = h + "px";
	if (x != undefined) e.style.left = x + "px";
	else e.style.left = window.innerWidth / 2 - w / 2 + "px";
	if (y != undefined) e.style.top = y + "px";
	else e.style.top = window.innerHeight / 2 - h / 2 + "px";
	e.style.opacity = 0;
	return e;
};

var _makeButton = function(id) {
	var e = document.createElement("button");
	e.className = id;
	return e;
}

var _makeTitleBar = function(w) {
	var e = document.createElement("div");
	e.className = "bar"
	e.style.width = w + "px";
	return e;
};

var _makeContent = function(w) {
	var e = document.createElement("div");
	e.className = "content"
	e.style.width = w + "px";
	return e;
};

var _fade = function(e, f, func) {
	if (f > 0) e.style.display = "block";
	var op = f > 0 ? 0 : 1;
	var timer = setInterval(function() {
		if (op < 0 || op > 1) {
			if (f < 0) e.style.display = "none";
			clearInterval(timer);
			if (func != undefined)
				func();
		}
		e.style.opacity = op;
		op += f;
	}, 50);
};

function _isNodeList(nodes) {
    var stringRepr = Object.prototype.toString.call(nodes);
    return typeof nodes === 'object' &&
        /^\[object (HTMLCollection|NodeList|Object)\]$/.test(stringRepr) &&
        (typeof nodes.length === 'number') &&
        (nodes.length === 0 || (typeof nodes[0] === "object" && nodes[0].nodeType > 0));
};

function _Draggable(alert) {
	var thisRef = this;
	alert.getTitleBar().element.addEventListener("mousedown", function(e) {
		thisRef.prevX = e.pageX;
		thisRef.prevY = e.pageY;
		thisRef.dragging = true;
	});
	document.addEventListener("mouseup", function(e) {
		thisRef.dragging = false;
	});
	document.addEventListener("mousemove", function(e) {
		if (thisRef.dragging) {
			var rect = alert.element.getBoundingClientRect();
			alert.element.style.top = rect.top + e.pageY - thisRef.prevY + "px";
			alert.element.style.left = rect.left + e.pageX - thisRef.prevX + "px";
			thisRef.prevX = e.pageX;
			thisRef.prevY = e.pageY;
		}
	});
}

function _AlertTitleBar(w) {
	this.element = _makeTitleBar(w);
	this.insert = function(e) {
		if (_isNodeList(e))
			while (e.length > 0)
				this.element.appendChild(e[0].element);
		else this.element.appendChild(e.element);
	};
}

function Alert(w, h, x, y) {
	this.element = _makeAlert(w, h, x, y);
	this.content = _makeContent(w);
	this.open = function(func, f) {
		if (f == undefined) f = 0.5;
		_fade(this.element, f, func);
	};
	this.close = function(func, f) {
		if (f == undefined) f = 0.5;
		_fade(this.element, -f, func);
	};
	this.insert = function(e) {
		if (_isNodeList(e))
			while (e.length > 0)
				this.content.appendChild(e[0]);
		else this.content.appendChild(e);
	};
	this.remove = function(e) {
		this.content.removeChild(e);
	};
	
	this.element.appendChild(this.content);
	document.getElementsByTagName("body")[0].appendChild(this.element);
}

function AlertButton(id, func) {
	this.element = _makeButton(id);
	this.element.addEventListener("click", function() {
		func();
	});
}

function WindowAlert(w, h, x, y) {
	this.element = _makeAlert(w, h, x, y);
	this.titleBar = new _AlertTitleBar(w);
	this.content = _makeContent(w);
	this.open = function(func, f) {
		if (f == undefined) f = 0.5;
		_fade(this.element, f, func);
	};
	this.close = function(func, f) {
		if (f == undefined) f = 0.5;
		_fade(this.element, -f, func);
	};
	this.insert = function(e) {
		if (_isNodeList(e))
			while (e.length > 0)
				this.content.appendChild(e[0]);
		else this.content.appendChild(e);
	};
	this.remove = function(e) {
		this.content.removeChild(e);
	};
	this.getTitleBar = function() {
		return this.titleBar;
	};
	
	this.draggable = new _Draggable(this);
	this.element.appendChild(this.titleBar.element);
	this.element.appendChild(toElemArray("<br/>")[0]);
	this.element.appendChild(this.content);
	document.getElementsByTagName("body")[0].appendChild(this.element);
}