var DatingRoom = function(id) {
	Room.call(this, id);
	let _this = this;
	this.ingame = [];
	this.selectedChat = null;
	this.chatHistory = {};
	this.endTime = null;

	let WAIT_SCR = document.getElementById("wait");
	let START_SCR = document.getElementById("start");
	let CHAT_SCR = document.getElementById("dchat");
	let VOTE_SCR = document.getElementById("dvote");
	let REP_SCR = document.getElementById("drchat");
	let NOC_SCR = document.getElementById("drnovote");

	this.parse = function(msg) {
		if (msg[">"] == "start") {
			this.ingame = msg["*"].split(",");
			this.ingame.forEach(function(o, i, a) { a[i] = parseInt(o), this.chatHistory[o] = ""; }, this);
		} else if (msg[">"] == "begin") {
			this.endTime = new Date().getTime() + parseInt(msg["!"]);
			let ulist = CHAT_SCR.getElementsByTagName("div")[0].getElementsByTagName("div")[0];
			ulist.innerHTML = "";
			for (let i = 0; i < this.ingame.length; i++) {
				CLIENT.send("/?user #" + this.ingame[i], function(msg) {
					ulist.innerHTML += "<div class='_cell'><button f='f40' style='width: 100%;' onclick='CLIENT.room.selectChat(" + msg["#"] + ");'>" + u2s(msg["@"]) + "</button></div>";
				});
			}
			this.setScr(CHAT_SCR);
		} else if (msg[">"] == "msg") {
			this.chatHistory[parseInt(msg["#"])] += "&lt; " + u2s(msg["@"]) + "<br>";
			if (parseInt(msg["#"]) == this.selectedChat) this.updateChat();
		} else if (msg[">"] == "pick") {
			this.endTime = new Date().getTime() + parseInt(msg["!"]);
			let ulist = document.getElementById("dvotes");
			ulist.innerHTML = "";
			for (let i = 0; i < this.ingame.length; i++) {
				CLIENT.send("/?user #" + this.ingame[i], function(msg) {
					ulist.innerHTML += "<button f='f40' style='width: calc(33.333%)' onclick='CLIENT.room.vote(" + msg["#"] + ");'>" + u2s(msg["@"]) + "</button>";
				});
			}
			this.setScr(VOTE_SCR);
		} else if (msg[">"] == "end") {
			let p1d = document.getElementById("drsend");
			let p2d = document.getElementById("drreceive");
			let msgd = document.getElementById("drmsg");
			let matchd = document.getElementById("drmatch");
			p1d.innerHTML = "";
			p2d.innerHTML = "";
			msgd.innerHTML = "";
			matchd.innerHTML = "";
			this.setScr(REP_SCR);
		} else if (msg[">"] == "rchoice") {
			let ppl = msg["#"].split(",");
			let p1d = document.getElementById("drsend");
			let p2d = document.getElementById("drreceive");
			let msgd = document.getElementById("drmsg");
			let matchd = document.getElementById("drmatch");
			CLIENT.send("/?user #" + ppl[0], function(msg) {
				p1d.innerHTML = u2s(msg["@"]);
			});
			CLIENT.send("/?user #" + ppl[1], function(msg) {
				p2d.innerHTML = u2s(msg["@"]);
			});
			msgd.innerHTML = "";
			matchd.innerHTML = "";
			this.setScr(REP_SCR);
		} else if (msg[">"] == "rmsg") {
			let msgd = document.getElementById("drmsg");
			CLIENT.send("/?user #" + msg["#"].split(",")[0], function(msg2) {
				msgd.innerHTML += u2s(msg2["@"]) + ": " + u2s(msg["@"]) + "<br>";
			});
		} else if (msg[">"] == "rtrue") {
			let matchd = document.getElementById("drmatch");
			matchd.innerHTML = "true";
		} else if (msg[">"] == "rfalse") {
			let matchd = document.getElementById("drmatch");
			matchd.innerHTML = "false";
		} else if (msg[">"] == "rnochoice") {
			let userd = document.getElementById("drnvuser");
			userd.innerHTML = "";
			CLIENT.send("/?user #" + msg["#"], function(msg) {
				userd.innerHTML = u2s(msg["@"]);
			});
			this.setScr(NOC_SCR);
		}
	};

	this.selectChat = function(id) {
		this.selectedChat = id;
		this.updateChat();
	};

	this.updateChat = function() {
		let chath = document.getElementById("dchath");
		chath.innerHTML = this.chatHistory[this.selectedChat];
	};

	this.chat = function() {
		let chati = document.getElementById("dchati");
		CLIENT.send("/game >msg #" + this.selectedChat + " @" + s2u(chati.value));
		this.chatHistory[this.selectedChat] += "&gt; " + chati.value + "<br>";
		chati.value = "";
		this.updateChat();
	};

	this.vote = function(id) {
		CLIENT.send("/game >choose #" + id);
	};

	this.start = function() {
		CLIENT.send("/game >start");
	};

	this.onload = function() {
		this.setScr(this.isOwner ? START_SCR : WAIT_SCR);
	};

	setInterval(function() {
		let timers = document.getElementsByClassName("dtimer");
		let time = new Date().getTime();
		if (_this.endTime != null && time > _this.endTime) _this.endTime = null;
		if (_this.endTime != null) {
			for (let i = 0; i < timers.length; i++)
				timers[i].innerHTML = (Math.floor((_this.endTime - time) / 100) / 10).toFixed(1);
		} else for (let i = 0; i < timers.length; i++)
			timers[i].innerHTML = "";
	}, 100);
}
