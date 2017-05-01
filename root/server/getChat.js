(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("scripts/login.js");
	
	var qs = $.getQS();
	if ($auth.check(qs.user, qs.uuid))
		$file.read("data/chat/chat.txt").join("<br/>") + "<br/>";
:js)