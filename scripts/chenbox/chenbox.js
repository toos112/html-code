_.I("scripts/chenbox/dating.js");

var clients = [];
var nextId = 0;

var getUserById = function(id, arr) {
	if (arr == undefined) arr = clients;
	return arr.filter(function(c) {
		return c.id == id;
	})[0];
};

var getRoomById = function(id) {
	var result = clients.filter(function(c) {
		return c.ownsRoom() && c.room.id == id;
	})[0];
	if (result) return result.room;
	else return undefined;
};

var getRooms = function() {
	var result = [];
	for (var i = 0; i < clients.length; i++)
		if (clients[i].ownsRoom()) result.push(clients[i].room);
	return result;
};

var idList = function(arr) {
	var result = [];
	for (var i = 0; i < arr.length; i++)
		result.push(arr[i].id);
	return result;
};

var Room = function(name, owner) {
	this.mode = null;
    this.name = name;
    this.owner = owner;
	this.players = [owner];
	this.id = nextId++;

	this.destroy = function() {
		for (var i = this.players.length - 1; i >= 0; i--)
			this.players[i].exitRoom(true);
	};

	this.removePlayer = function(id) {
		var player = getUserById(id);
		if (this.players.indexOf(player) == -1) return;
		this.broadcast("/exit #" + player.id);
		this.players.splice(this.players.indexOf(player), 1);
	};

	this.addPlayer = function(player) {
		this.broadcast("/join #" + player.id);
		this.players.push(player);
	};

	this.broadcast = function(msg) {
		for (var i = 0; i < this.players.length; i++)
			this.players[i]._ws.write(msg);
	};
};

var makeRoom = function(name, owner, mode) {
	if (mode == "dating") return new DatingRoom(name, owner);
	return null;
};

var Client = function(ws) {
    this._ws = ws;
    this.name = null;
    this.room = null;
    this.id = nextId++;

    this.ownsRoom = function() {
        if (this.room == null) return false;
        return this.id == this.room.owner.id;
    };

	this.exitRoom = function(forced) {
		this.room.removePlayer(this.id);
		if (this.ownsRoom()) this.room.destroy();
		this.room = null;
	};

	this.joinRoom = function(id) {
		var room = getRoomById(id);
		if (room == undefined) return false;
		this.room = room;
		this.room.addPlayer(this);
		return true;
	};

    this._ws.handler("message", new EventListener(function(e) {
        var _msg = e.message.split(" ");
        var msg = {};
        for (var i = 0; i < _msg.length; i++)
            msg[_msg[i].charAt(0)] = _msg[i].substr(1);

        if (msg["/"] == "name") {
            if (this.name == null) {
                this.name = $.escape(msg["@"]);
                this._ws.write("/ok");
            } else this._ws.write("/err #0");
        } else if (msg["/"] == "+room") {
            if (this.name == null) this._ws.write("/err #2");
            else {
                if (this.room == null) {
                    this.room = makeRoom($.escape(msg["@"]), this, msg["!"]);
	                if (this.room != null) this._ws.write("/ok #" + this.room.id);
					else this._ws.write("/err #7");
                } else this._ws.write("/err #1");
            }
        } else if (msg["/"] == "-room") {
            if (this.ownsRoom()) {
				this.room.destroy();
                this._ws.write("/ok");
            } else this._ws.write("/err #3");
        } else if (msg["/"] == ">room") {
            if (this.name == null) this._ws.write("/err #2");
            else {
				if (this.room == null) {
					var result = this.joinRoom(parseInt(msg["#"]));
	                if (result) {
						this._ws.write("/ok *" + idList(this.room.players).join(","));
					} else this._ws.write("/err #4");
				} else this._ws.write("/err #1");
			}
		} else if (msg["/"] == "<room") {
			if (this.room != null) {
				this.exitRoom(false);
				this._ws.write("/ok");
			} else this._ws.write("/err #5");
		} else if (msg["/"] == "rooms") {
			this._ws.write("/ok *" + idList(getRooms()).join(","));
		} else if (msg["/"] == "?room") {
			var room = getRoomById(parseInt(msg["#"]));
			if (room != undefined) {
				this._ws.write("/ok #" + room.id + " @" + room.name + " $" + room.owner.id + " *"
					+ idList(room.players).join(",") + " !" + room.mode);
			} else this._ws.write("/err #4");
		} else if (msg["/"] == "?user") {
			var user = getUserById(parseInt(msg["#"]));
			if (user != undefined) {
				var string = "/ok #" + user.id;
				if (user.name != null) string += " @" + user.name;
				if (user.room != null) string += " $" + user.room.id;
				this._ws.write(string);
			} else this._ws.write("/err #6");
		} else if (msg["/"] == "me") {
			this._ws.write("/ok #" + this.id);
		} else if (msg["/"] == "game") {
			if (this.room != null) {
				this.room.parse(this, game);
			} else this._ws.write("/err #5");
		}
    }, this));

	this._ws.handler("close", new EventListener(function(e) {
		if (this.room != null) this.exitRoom(true);
		clients.splice(clients.indexOf(this), 1);
	}, this));
};

$ws.addProtocol("chenbox");
$event.handler("ws_new", new EventListener(function(e) {
	if (e.ws.protocol == "chenbox") {
        clients.push(new Client(e.ws));
	}
}, null));
