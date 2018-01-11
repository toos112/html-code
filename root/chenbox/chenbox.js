let USERNAME = null;
let BODY = null;
let CLIENT = null;

let HTTP_GET = function(url, func) {
    let req;

    if (window.XMLHttpRequest) req = new XMLHttpRequest();
    else req = new ActiveXObject("Microsoft.XMLHTTP");

    req.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            func(req.responseText);
        }
    };

    req.open("GET", url, true)
    req.send();
};

let Client = function() {
    if (location.protocol == "https:") this._ws = new WebSocket("wss://" + location.host, "chenbox");
    else if (location.protocol == "http:") this._ws = new WebSocket("ws://" + location.host, "chenbox");
	let _this = this;
	this._Q = [];

	this._send = function(msg, func) {
		this._Q.push(func);
		this._ws.send(msg);
	};

	this._parse = function(msg) {

	};

    this._ws.onmessage = function(e) {
        var _msg = e.data.split(" ");
        var msg = {};
        for (var i = 0; i < _msg.length; i++)
            msg[_msg[i].charAt(0)] = _msg[i].substr(1);

		if (msg["/"] == "ok" || msg["/"] == "err") {
			let func = _this._Q.shift();
			if (func) func(msg);
		} else _this._parse(msg);
    };

	this.setName = function(name) {
		this._send("/name @" + name);
	};
};

let setContent = function(url, func) {
    HTTP_GET(url, function(content) {
		BODY.innerHTML = content;
		if (func) func();
	});
};

let loadRooms = function() {

};

let login = function() {
    let userInput = document.getElementById("user");
    USERNAME = userInput.value;
    CLIENT.setName(USERNAME);
    setContent("browse.html", function() {
		loadRooms();
	});
};

window.addEventListener("load", function() {
    BODY = document.getElementsByTagName("body")[0];
	setContent("login.html");
    CLIENT = new Client();
});
