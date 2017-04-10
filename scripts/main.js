_.I("_scripts/std.js");
_.I("_scripts/event.js");
_.I("_scripts/websocket.js");

$ws.addProtocol("chat");
$event.handler("ws_new", function(e) {
	e.ws.handler("message", function(ee) {
		$.write(ee.message);
	});
});