var ROUND_TIME = 30000;
var CHOOSE_TIME = 30000;
var DISPLAY_TIME = 2000;
var ROUNDS = 5;

var DatingRoom = function(name, owner) {
	Room.call(this, name, owner);
	var thisRef = this;
	this.mode = "dating";
	this.ingame = [];
	this.messages = [];
	this.choices = [];
	this.isStarted = false;
	this.isChatting = false;
	this.isChoosing = false;
	this.isDisplaying = false;
	this.beginTime = -1;
	this.round = 0;

	this._choiceIndex = 0
	this._messageIndex = 0;
	this._skipChoice = [];

	this._start = function() {
		this.ingame = this.players.slice(0);
		this.broadcast("/game >start *" + idList(this.ingame).join(","));
		this.isStarted = true;
		this._begin();
	};

	this._begin = function() {
		this.round++;
		if (this.round > ROUNDS) {
			this._stop();
			return;
		}
		this.isChatting = true;
		this.beginTime = $.time();
		this.broadcast("/game >begin");
	};

	this._pick = function() {
		this.isChatting = false;
		this.isChoosing = true;
		this.beginTime = $.time();
		this.broadcast("/game >pick");
	};

	this._end = function() {
		this.isChoosing = false;
		this.broadcast("/game >end");
		this.beginTime = $.time();
		this.isDisplaying = true;
	};

	this._showNext = function() {
		if (this._choiceIndex >= this.choices.length) {
			this._isDisplaying = false;
			this._reset();
			this._begin();
		}
		for (var i = this._choiceIndex + 1; i < this.choices.length; i++) {
			if (this.choices[this._choiceIndex].to == this.choices[i].from) {
				if (this.choices[i].to == this.choices[this._choiceIndex].from) {
					this._skipChoice.push(i);
				}
				break;
			}
		}
		var validMessage = false;
		for (var i = this._messageIndex; i < this.messages.length; i++) {
			if (this.messages[i].from == this.choices[this._choiceIndex].from && this.messages[i].to == this.choices[this._choiceIndex].to) validMessage = true;
			if (this.messages[i].to == this.choices[this._choiceIndex].from && this.messages[i].from == this.choices[this._choiceIndex].to) validMessage = true;
			if (validMessage) {
				this._messageIndex = i + 1;
				this.beginTime = $.time();
				this.broadcast("/game >rmsg #" + this.messages[i].from + "," + this.messages[i].to + " @" + this.messages[i].msg);
				break;
			}
		}
		if (!validMessage) {
			do {
				this._choiceIndex++;
			} while (this._choiceIndex < this.choices.length && this._skipChoice.indexOf(this.choices[this._choiceIndex].from) != -1);
			this._messageIndex = 0;
			this._showNext();
		}
	};

	this._reset = function() {
		this.choices = {};
		this.messages = [];
		this._choiceIndex = 0;
		this._messageIndex = 0;
	};

	this._stop = function() {
		this.isStarted = false;
		this.ingame = [];
		this.broadcast("/game >stop");
	};

	this.chat = function(from, to, msg) {
		var player = getUserById(to, this.ingame);
		if (player == undefined) return false;
		player._ws.write("/game >msg #" + from + " @" + msg);
		this.messages.push({ from : from, to : to, msg : msg });
		return true;
	};

	this.choose = function(from, to) {
		var player = getUserById(to, this.ingame);
		if (player == undefined) return false;
		this.choices.push({ from : from, to : to });
		return true;
	};

	this.parse = function(user, msg) {
		if (msg[">"] == "msg") {
			if (this.isChatting && getUserById(user.id, this.ingame) != undefined) {
				if (this.chat(user.id, parseInt(msg["#"]), msg["@"])) user._ws.write("/ok");
				else user._ws.write("/err #6");
			} else user._ws.write("/err #9");
		} else if (msg[">"] == "start") {
			if (user.ownsRoom()) {
				if (!this.isStarted) {
					this._start();
					user._ws.write("/ok");
				} else user._ws.write("/err #9");
			} else user._ws.write("/err #8");
		} else if (msg[">"] == "choose") {
			if (this.isChoosing && getUserById(user.id, this.ingame) != undefined) {
				if (this.choices[user.id] != undefined) user._ws.write("/err #9");
				else if (this.choose(user.id, parseInt(msg["#"]), msg["@"])) user._ws.write("/ok");
				else user._ws.write("/err #6");
			} else user._ws.write("/err #9");
		}
	};

	_.loop(100, function() {
		if ($.time() - ROUND_TIME >= thisRef.beginTime && thisRef.isChatting) {
			thisRef._pick();
		} else if ($.time() - CHOOSE_TIME >= thisRef.beginTime && thisRef.isChoosing) {
			thisRef._end();
		} else if ($.time() - DISPLAY_TIME >= thisRef.beginTime && thisRef.isDisplaying) {
			thisRef._showNext();
		}
	});
}
