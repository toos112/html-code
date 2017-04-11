_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");

var chatList = [];

$ws.addProtocol("chat");
$event.handler("ws_new", function(e) {
	if (e.ws.protocol == "chat") {
		chatList.push(e.ws);
		e.ws.handler("message", function(ee) {
			ee.message = ee.message.replaceAll("<", "&lt;");
			ee.message = ee.message.replaceAll(">", "&gt;");
			var file = $file.read("data/chat.txt");
			file.push(ee.message);
			if (file.length > 16)
				file.splice(0, file.length - 16);
			$file.write("data/chat.txt", file);
			for (var i = 0; i < chatList.length; i++)
				chatList[i].write(ee.message);
		});
		e.ws.handler("close", function(ee) {
			chatList.splice(chatList.indexOf(e.ws), 1);
		});
	}
});