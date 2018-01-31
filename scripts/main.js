_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");
_.I("_scripts/cmd.js");
_.I("_scripts/encode.js");
_.I("scripts/login.js");
_.I("scripts/command.js");
_.I("scripts/svrcmd.js");
_.I("scripts/chenbox/chenbox.js");

var chatList = [];

function log(str) {
	var date = new Date();
	var filename = "" + date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
	var file = $file.read("data/chat/log/" + filename + ".txt");
	str = $.replaceAll(str, "\n", "\\n");
	file.push("[" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "] " + str);
	$file.write("data/chat/log/" + filename + ".txt", file);
}

function addToCache(user, str) {
	var file = $file.read("data/chat/chat.txt");
	str = $.replaceAll(str, "\n", " ");
	file.push(user + ": " + str);
	if (file.length > 16)
		file.splice(0, file.length - 16);
	$file.write("data/chat/chat.txt", file);
}

function broadcast(str) {
	for (var i = 0; i < chatList.length; i++)
		chatList[i].ws.write(str);
}

function ChatClient(ws) {
	this.ws = ws;
	this.username = "";

	this._listener = new EventListener(function(e) {
		var payload = e.message.substr(1).trim();

		if (e.message.startsWith("/")) {
			log(this.username + ": " + e.message);
			command(this, payload.split(" "));
		} else if (e.message.startsWith("@")) {
			payload = payload.split(">");
			var udata = getUserData(payload[0]);
			if (udata.banned > $.time() || udata.banned == -1) {
				_invalid(this, "banned");
			} else if ($auth.check(payload[0], payload[1]) && this.username == "") {
				chatList.push(this);
				this.username = payload[0];
				if (!udata.ghost) broadcast("<+" + this.username);
				else ws.write("<?Your are still a ghost!");
			}
		} else if (e.message.startsWith(":") && this.username != "") {
			var udata = getUserData(this.username);
			if ($.time() > udata.timeout) {
				udata.timeout = $.time() + udata.slow;
				writeUserData(this.username, udata);
				payload = $.escape(payload);
				if (payload != "") {
					var escapedUser = $.escape(this.username);
					addToCache(escapedUser, payload);
					log(this.username + ": " + payload);
					broadcast(escapedUser + ">" + payload);
				}
			}
		}
	}, this);

	this.ws.handler("message", this._listener);
}

$ws.addProtocol("chat");
$event.handler("ws_new", new EventListener(function(e) {
	if (e.ws.protocol == "chat") {
		var ipbans = $json.parse($file.read("data/chat/ipban.txt")[0]);
		if (ipbans.indexOf(e.ws.address) != -1) {
			_invalid({ws:e.ws}, "banned");
			this.ws.close();
		} else new ChatClient(e.ws);
	}
}, null));
$event.handler("ws_close", new EventListener(function(e) {
	if (e.ws.protocol == "chat") {
		var name = "";
		for (var i = 0; i < chatList.length; i++) {
			if (chatList[i].ws.equals(e.ws)) {
				name = chatList[i].username;
				chatList.splice(i, 1);
				break;
			}
		}
		var udata = getUserData(name);
		if (name != "" && !udata.ghost)
			broadcast("<-" + name);
	}
}, null));

$event.handler("cmd", new EventListener(function(e) {
	handlecmd(e.cmd);
}, null));

_.loop(60000, function() {
	var sessions = $json.parse($file.read("data/sessions.txt")[0]);
	for (var key in sessions)
		if (sessions[key].expire < $.time())
			delete sessions[key];
	$file.write("data/sessions.txt", [$json.stringify(sessions)]);
});
