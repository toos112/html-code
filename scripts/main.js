_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");

var wsList = [];

$ws.addProtocol("chat");
$event.handler("ws_new", function(e) {
	wsList.push(e.ws);
	$.write("open");
	e.ws.handler("message", function(ee) {
		$.write(ee.message);
	});
	e.ws.handler("close", function(ee) {
		wsList.splice(wsList.indexOf(e.ws), 1);
		$.write("close " + ee.timeout);
	});
});