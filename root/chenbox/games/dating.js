var DatingRoom = function(id) {
	Room.call(this, id);
	this.ingame = [];
	this.selectedChat = null;
	this.chatHistory = {};

	let WAIT_SCR = document.getElementById("wait");
	let START_SCR = document.getElementById("start");
	let CHAT_SCR = document.getElementById("dchat");

	this.parse = function(msg) {
		if (msg[">"] == "start") {
			this.ingame = msg["*"].split(",");
			this.ingame.forEach(function(o, i, a) { a[i] = parseInt(o), this.chatHistory[o] = ""; }, this);
		} else if (msg[">"] == "begin") {
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

	this.start = function() {
		CLIENT.send("/game >start");
	};

	this.onload = function() {
		this.setScr(this.isOwner ? START_SCR : WAIT_SCR);
	};
}
