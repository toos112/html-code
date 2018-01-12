let USERNAME = null;
let BODY = null;
let CLIENT = null;
let alert;

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

let s2u = function(str) {
	return str.split(" ").join("_");
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

		if (msg["/"] == "err") console.error("E" + msg["#"]);
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
	let roomList = document.getElementById("roomList");
	let table = roomList.getElementsByTagName("table")[0];
	let tbody = roomList.getElementsByTagName("tbody")[0];
	tbody.innerHTML = "";
	CLIENT._send("/rooms", function(msg) {
		let ids = msg["*"].split(",");
		if (ids[0] == "") ids = [];
		for (let i = 0; i < ids.length; i++) {
			tbody.innerHTML += "\
			<tr>\
				<td f='f32' id='rn#" + ids[i] + "'>loading...</td>\
				<td id='rj#" + ids[i] + "'></td>\
			</tr>";
			CLIENT._send("/?room #" + ids[i], function(msg) {
				let name = document.getElementById("rn#" + msg["#"]);
				let join = document.getElementById("rj#" + msg["#"]);
				name.innerHTML = msg["@"];
				join.innerHTML = "<button f='f32' style='width: 100%;' onclick='joinRoom(" + msg["#"] + ");'>Join</button>";
			});
		}
	});
};

let makeRoom = function() {
	alert = new WindowAlert(240, 320);
	HTTP_GET("makeRoom.html", function(html) {
		alert.insert(toElemArray(html));
	});
	alert.open();
};

let actuallyMakeRoom = function() {
	// ^^ best function name
	let name = document.getElementById("mr#name").value;
	CLIENT._send("/+room @" + s2u(name));
	alert.close();
};

let joinRoom = function(id) {
	CLIENT._send("/>room #" + id);
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
