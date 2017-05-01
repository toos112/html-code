_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");
_.I("_scripts/encode.js");
_.I("scripts/login.js");
_.I("scripts/command.js");

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
	
	this.ws.handler("message", new EventListener(function(e) {
		var payload = e.message.substr(1).trim();
		
		if (e.message.startsWith("/")) {
			log(this.username + ": " + e.message);
			command(this, payload.split(" "));
		} else if (e.message.startsWith("@")) {
			payload = payload.split(">");
			if ($auth.check(payload[0], payload[1]) && this.username == "") {
				this.username = payload[0];
				var udata = getUserData(this.username);
				if (!udata.ghost) broadcast("<+" + this.username);
			}
		} else if (e.message.startsWith(":") && this.username != "") {
			var udata = getUserData(this.username);
			if ($.time() > udata.timeout) {
				udata.timeout = $.time() + udata.slow;
				writeUserData(this.username, udata);
				payload = $.escape(payload);
				if (payload != "") {
					addToCache(this.username, payload);
					log(this.username + ": " + payload);
					broadcast(this.username + ">" + payload);
				}
			}
		}
	}, this));
}

$ws.addProtocol("chat");
$event.handler("ws_new", new EventListener(function(e) {
	if (e.ws.protocol == "chat") {
		chatList.push(new ChatClient(e.ws));
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

_.loop(60000, function() {
	var sessions = $json.parse($file.read("data/sessions.txt")[0]);
	for (var key in sessions)
		if (sessions[key].expire < $.time())
			delete sessions[key];
	$file.write("data/sessions.txt", [$json.stringify(sessions)]);
});