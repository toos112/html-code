_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");
_.I("scripts/login.js");
_.I("scripts/command.js");

var chatList = [];

function addToCache(user, str) {
	var file = $file.read("data/chat.txt");
	var text = str.replaceAll("\n", new Array(user.length + 2));
	file.push(user + ": " + str);
	if (file.length > 16)
		file.splice(0, file.length - 16);
	$file.write("data/chat.txt", file);
}

function ChatClient(ws) {
	this.ws = ws;
	this.username = "";
	
	this.ws.handler("message", new EventListener(function(e) {
		var payload = e.message.substr(1);
		
		if (e.message.startsWith("/")) {
			command(this, e.message.substr(1).split(" "));
		} else if (e.message.startsWith("@")) {
			payload = payload.split(">");
			if ($auth.check(payload[0], payload[1]) && this.username == "") {
				this.username = payload[0];
				for (var i = 0; i < chatList.length; i++)
					chatList[i].ws.write("<+" + this.username);
			}
		} else if (e.message.startsWith(":") && this.username != "") {
			var udata = getUserData(this.username);
			if ($.time() > udata.timeout) {
				payload = $.escape(payload);
				addToCache(this.username, payload);
				for (var i = 0; i < chatList.length; i++)
					chatList[i].ws.write(this.username + ">" + payload);
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
		if (name != "")
			for (var i = 0; i < chatList.length; i++)
				chatList[i].ws.write("<-" + name);
	}
}, null));

_.loop(60000, function() {
	var sessions = $json.parse($file.read("data/sessions.txt")[0]);
	for (var key in sessions)
		if (sessions[key].expire < $.time())
			delete sessions[key];
	$file.write("data/sessions.txt", [$json.stringify(sessions)]);
});