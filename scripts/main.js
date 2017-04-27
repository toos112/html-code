_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");
_.I("_scripts/bigint.js");
_.I("scripts/login.js");

var chatList = [];

function addToCache(str) {
	var file = $file.read("data/chat.txt");
	file.push(str);
	if (file.length > 16)
		file.splice(0, file.length - 16);
	$file.write("data/chat.txt", file);
}

function ChatClient(ws) {
	this.ws = ws;
	this.username = "";
	
	this.ws.handler("message", new EventListener(function(e) {
		var payload = e.message.substr(1);
		if (e.message.startsWith("@")) {
			payload = payload.split(">");
			if ($auth.check(payload[0], payload[1]) && this.username == "") {
				this.username = payload[0];
				for (var i = 0; i < chatList.length; i++)
					chatList[i].ws.write("<+" + this.username);
			}
		} else if (e.message.startsWith(":") && this.username != "") {
			payload = $.escape(payload);
			addToCache(this.username + ": " + payload);
			for (var i = 0; i < chatList.length; i++)
				chatList[i].ws.write(this.username + ">" + payload);
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