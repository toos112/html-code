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

let qs = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

let s2u = function(str) {
	return str.split(" ").join("_");
};

let u2s = function(str) {
	return str.split("_").join(" ");
};

let setContent = function(url, func, element = BODY) {
    HTTP_GET(url, function(content) {
		element.innerHTML = content;
		if (func) func();
	});
};

let updateUserId = 0;
let updateUserList = function() {
	let thisId = ++updateUserId;
	let userList = document.getElementById("userList");
	if (userList != undefined) {
		let list = userList.getElementsByTagName("ul")[0];
		list.innerHTML = "";
		for (let i = 0; i < CLIENT.room.users.length; i++) {
			CLIENT.send("/?user #" + CLIENT.room.users[i], function(msg) {
				if (thisId < updateUserId) return;
				list.innerHTML += "<li f='f24'>" + u2s(msg["@"]) + "</li>";
			});
		}
	}
};

let clientJoinRoom = function(mode, id) {
	setContent("room.html", function() {
		setContent("games/" + mode + ".html", function() {
			CLIENT.room = constructRoom(mode, id);
		}, document.getElementById("game"));
	});
};

let d = function(msg) {
	CLIENT.send(msg, function(msg) {
		console.log(msg);
	});
};

let Room = function(id) {
	let _this = this;
	this.id = id;
	this.users = [];
	this.isOwner = null;
	this._lastScr = null;

	this.onload = function() {};

	this.setScr = function(elem) {
		if (this._lastScr != null)
			this._lastScr.style.display = "none";
		this._lastScr = elem;
		elem.style.display = "inline-block";
	};

	CLIENT.send("/?room #" + id, function(msg) {
		_this.isOwner = (parseInt(msg["$"]) == CLIENT.id);
		let users = msg["*"].split(",");
		for (let i = 0; i < users.length; i++)
			_this.users.push(parseInt(users[i]));
		updateUserList();
		_this.onload();
	});
};

let constructRoom = function(mode, id) {
	if (mode == "dating") return new DatingRoom(id);
	return null
};

let Client = function(func) {
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
		if (msg["/"] == "join") {
			this.room.users.push(parseInt(msg["#"]));
			updateUserList();
		} else if (msg["/"] == "exit") {
			this.room.users.splice(this.room.users.indexOf(parseInt(msg["#"])), 1);
			updateUserList();
		} else if (msg["/"] == "game") {
			this.room.parse(msg);
		}
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

	this.setName = function(name, func) {
		this.name = name;
		this.send("/name @" + s2u(name), function(msg) {
			if (func) func();
		});
	};

	this.joinRoom = function(id) {
		this.send("/>room #" + id, function(msg) {
			if (msg["/"] == "ok") {
				this.send("/?room #" + id, function(msg) {
					clientJoinRoom(id, msg["!"]);
				});
			}
		});
	};

	this._ws.onopen = function(e) {
		_this.send("/me", function(msg) {
			_this.id = parseInt(msg["#"]);
		});
		if (func) func();
	};
};

let loadRoomsId = 0;
let loadRooms = function() {
	let thisId = ++loadRoomsId;
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
				if (thisId < loadRoomsId) return;
				let name = document.getElementById("rn#" + msg["#"]);
				let mode = document.getElementById("rm#" + msg["#"]);
				let join = document.getElementById("rj#" + msg["#"]);
				name.innerHTML = u2s(msg["@"]);
				mode.innerHTML = u2s(msg["!"]);
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
		clientJoinRoom(mode, parseInt(msg["#"]));
	});
	alert.close();
};

let login = function() {
    let userInput = document.getElementById("user");
    USERNAME = userInput.value;
    CLIENT.setName(USERNAME);
    setContent("browse.html", loadRooms);
};

window.addEventListener("load", function() {
	BODY = document.getElementsByTagName("body")[0];
	CLIENT = new Client(function() {
		if (qs("u") != undefined) {
			CLIENT.setName(qs("u"), function() {
				if (qs("r") != undefined) {
					client.joinRoom(parseInt(qs("r")));
				} else if (qs("mr") != undefined) {
					let rp = JSON.parse(qs("mr"));
					CLIENT.send("/+room @" + s2u(rp.name) + " !" + rp.mode, function(msg) {
						if (msg["/"] == "err") return;
						clientJoinRoom(rp.mode, parseInt(msg["#"]));
					});
				} else setContent("browse.html", loadRooms);
			});
		} else setContent("login.html");
	});
});
