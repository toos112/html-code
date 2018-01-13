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

let setContent = function(url, func) {
    HTTP_GET(url, function(content) {
		BODY.innerHTML = content;
		if (func) func();
	});
};

let clientJoinRoom = function() {
	setContent("room.html");
};

let d = function(msg) {
	CLIENT.send(msg, function(msg) {
		console.log(msg);
	});
}

let Client = function() {
    if (location.protocol == "https:") this._ws = new WebSocket("wss://" + location.host, "chenbox");
    else if (location.protocol == "http:") this._ws = new WebSocket("ws://" + location.host, "chenbox");
	let _this = this;
	this._Q = [];
	this.id = null;
	this.name = null;
	this.room = null;

	this.send = function(msg, func) {
		this._Q.push(func);
		this._ws.send(msg);
	};

	this._parse = function(msg) {
		console.log(msg);
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
		this.name = name;
		this.send("/name @" + name);
	};

	this.joinRoom = function(id) {
		this.send("/>room #" + id, function(msg) {
			if (msg["/"] == "ok") {
				this.room = id;
				clientJoinRoom();
			}
		});
	};

	this._ws.onopen = function(e) {
		this.send("/me", function(msg) {
			this.id = parseInt(msg["#"]);
		});
	};
};

let loadRooms = function() {
	let roomList = document.getElementById("roomList");
	let table = roomList.getElementsByTagName("table")[0];
	let tbody = roomList.getElementsByTagName("tbody")[0];
	tbody.innerHTML = "";
	CLIENT.send("/rooms", function(msg) {
		let ids = msg["*"].split(",");
		if (ids[0] == "") ids = [];
		for (let i = 0; i < ids.length; i++) {
			tbody.innerHTML += "\
			<tr>\
				<td f='f32' id='rn#" + ids[i] + "'>loading...</td>\
				<td f='f32' id='rm#" + ids[i] + "'></td>\
				<td id='rj#" + ids[i] + "'></td>\
			</tr>";
			CLIENT.send("/?room #" + ids[i], function(msg) {
				let name = document.getElementById("rn#" + msg["#"]);
				let mode = document.getElementById("rm#" + msg["#"]);
				let join = document.getElementById("rj#" + msg["#"]);
				name.innerHTML = msg["@"];
				mode.innerHTML = msg["!"];
				join.innerHTML = "<button f='f32' style='width: 100%;' onclick='CLIENT.joinRoom(" + msg["#"] + ");'>Join</button>";
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
	let mode = document.getElementById("mr#mode").value;
	CLIENT.send("/+room @" + s2u(name) + " !" + mode, function(msg) {
		if (msg["/"] == "err") return;
		CLIENT.room = parseInt(msg["#"]);
		clientJoinRoom();
	});
	alert.close();
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
