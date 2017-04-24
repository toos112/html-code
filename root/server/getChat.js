(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("scripts/login.js");
	
	var qs = $.getQS();
	if ($auth.check(qs.user, qs.uuid))
		ret = $file.read("data/chat.txt").join("<br/>") + "<br/>";
:js)