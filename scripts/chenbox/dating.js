var ROUND_TIME = 30000;
var CHOOSE_TIME = 15000;
var DISPLAY_TIME = 3000;
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
	this.endTime = -1;
	this.round = 0;

	this._choiceIndex = -1;
	this._messageIndex = 0;
	this._displayPhase = 0;
	this._skipChoice = {};

	this._start = function() {
		this.round = 0;
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
		this.endTime = $.time() + ROUND_TIME;
		this.broadcast("/game >begin !" + ROUND_TIME);
	};

	this._pick = function() {
		this.isChatting = false;
		this.isChoosing = true;
		this.endTime = $.time() + CHOOSE_TIME;
		this.broadcast("/game >pick !" + CHOOSE_TIME);
	};

	this._end = function() {
		this.isChoosing = false;
		this.broadcast("/game >end");
		this.endTime = $.time() + DISPLAY_TIME;
		this.isDisplaying = true;
	};

	this._showNext = function() {
		if (this._displayPhase == 0) {
			this._messageIndex = -1;
			do { this._choiceIndex++;
			} while (this._choiceIndex < this.choices.length && this._skipChoice[this.choices[this._choiceIndex].from]);
			if (this._choiceIndex >= this.choices.length) {
				this._choiceIndex = -1;
				this._displayPhase = 2;
				this._showNext();
			} else {
				this.endTime = $.time() + DISPLAY_TIME;
				this.broadcast("/game >rchoice #" + this.choices[this._choiceIndex].from + "," + this.choices[this._choiceIndex].to);
				for (var i = 0; i < this.choices.length; i++)
					if (this.choices[this._choiceIndex].to == this.choices[i].from && this.choices[this._choiceIndex].from == this.choices[i].to) this._skipChoice[this.choices[i].from] = true;
				this._displayPhase = 1;
			}
		} else if (this._displayPhase == 1) {
			do { this._messageIndex++;
			} while (this._messageIndex < this.messages.length && !((this.messages[this._messageIndex].from == this.choices[this._choiceIndex].from && this.messages[this._messageIndex].to == this.choices[this._choiceIndex].to)
				|| (this.messages[this._messageIndex].from == this.choices[this._choiceIndex].to && this.messages[this._messageIndex].to == this.choices[this._choiceIndex].from)));
			if (this._messageIndex >= this.messages.length) {
				var isMatch = false;
				for (var i = 0; i < this.choices.length; i++)
					if (this.choices[this._choiceIndex].to == this.choices[i].from && this.choices[i].to == this.choices[this._choiceIndex].from) isMatch = true;
				this.endTime = $.time() + DISPLAY_TIME;
				if (isMatch) this.broadcast("/game >rtrue #" + this.choices[this._choiceIndex].from + "," + this.choices[this._choiceIndex].to);
				else this.broadcast("/game >rfalse #" + this.choices[this._choiceIndex].from + "," + this.choices[this._choiceIndex].to);
				this._displayPhase = 0;
			} else {
				this.endTime = $.time() + DISPLAY_TIME;
				this.broadcast("/game >rmsg #" + this.messages[this._messageIndex].from + "," + this.messages[this._messageIndex].to + " @" + this.messages[this._messageIndex].msg);
			}
		} else if (this._displayPhase == 2) {
			do { this._choiceIndex++;
			} while (this._choiceIndex < this.ingame.length && function() {
				for (var i = 0; i < thisRef.choices.length; i++)
					if (thisRef.choices[i].from == thisRef._choiceIndex) return true;
				return false;
			}());
			if (this._choiceIndex >= this.ingame.length) {
				this.isDisplaying = false;
				this._reset();
				this._begin();
			} else {
				this.endTime = $.time() + DISPLAY_TIME;
				this.broadcast("/game >rnochoice #" + this._choiceIndex);
			}
		}
	};

	this._reset = function() {
		this.choices = [];
		this.messages = [];
		this._skipChoice = {};
		this._choiceIndex = -1;
		this._displayPhase = 0;
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
				var alreadyVoted = false;
				for (var i = 0; i < this.choices.length; i++)
					if (this.choices[i].from == user.id) alreadyVoted = true;
				if (alreadyVoted) user._ws.write("/err #9");
				else if (this.choose(user.id, parseInt(msg["#"]))) user._ws.write("/ok");
				else user._ws.write("/err #6");
			} else user._ws.write("/err #9");
		}
	};

	_.loop(100, function() {
		if ($.time() >= thisRef.endTime && thisRef.isChatting) {
			thisRef._pick();
		} else if ($.time() >= thisRef.endTime && thisRef.isChoosing) {
			thisRef._end();
		} else if ($.time() >= thisRef.endTime && thisRef.isDisplaying) {
			thisRef._showNext();
		}
	});
}
