_.I("_scripts/event.js");

_.event("cmd", function(e) {
	$event._trigger("cmd", {
		cmd : "" + e.getCmd()
	});
});