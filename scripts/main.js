_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");

var chatList = [];

function ChatClient(ws) {
	this._ws = ws;
	this.username = "Anonymous";
	
	this._ws.handler("message", function(ee) {
		ee.message = ee.message.replaceAll("<", "&lt;");
		ee.message = ee.message.replaceAll(">", "&gt;");
		
		var prefix = ee.message.substr(0, 1);
		var payload = ee.message.substr(1, ee.message.length - 1);
		
		if (prefix.startsWith("@"))
			username = payload;
		else if (prefix.startsWith(":")) {
			var file = $file.read("data/chat.txt");
			file.push(payload);
			if (file.length > 16)
				file.splice(0, file.length - 16);
			$file.write("data/chat.txt", file);
			for (var i = 0; i < chatList.length; i++)
				chatList[i].write(payload);
		}
	});
	this._ws.handler("close", function(ee) {
		chatList.splice(chatList.indexOf(e.ws), 1);
	});
}

$ws.addProtocol("chat");
$event.handler("ws_new", function(e) {
	if (e.ws.protocol == "chat") {
		chatList.push(new ChatClient(e.ws));
	}
});