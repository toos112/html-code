_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");

var chatList = [];

function ChatClient(ws) {
	this.ws = ws;
	this.username = "Anonymous";
	
	this.ws.handler("message", this, function(e) {
		e.message = e.message.replaceAll("<", "&lt;");
		e.message = e.message.replaceAll(">", "&gt;");
		
		var prefix = e.message.substr(0, 1);
		var payload = e.message.substr(1, e.message.length - 1);
		
		if (prefix.startsWith("@")) {
			this.username = payload;
		} else if (prefix.startsWith(":")) {
			var message = this.username + " : " + payload;
			var file = $file.read("data/chat.txt");
			file.push(message);
			if (file.length > 16)
				file.splice(0, file.length - 16);
			$file.write("data/chat.txt", file);
			for (var i = 0; i < chatList.length; i++)
				$.write(chatList[i].username);
		}
	});
}

$ws.addProtocol("chat");
$event.handler("ws_new", null, function(e) {
	if (e.ws.protocol == "chat")
		chatList.push(new ChatClient(e.ws));
	$.write(chatList.length);
});
$event.handler("ws_close", null, function(e) {
	$.write("close");
	if (e.ws.protocol == "chat") {
		for (var i = 0; i < chatList.length; i++) {
			if (chatList[i].ws.equals(e.ws)) {
				chatList.splice(i, 1);
				break;
			}
		}
	}
});