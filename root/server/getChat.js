(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("_scripts/client.js");
	_.I("scripts/login.js");
	_.I("scripts/command.js")
	
	var qs = $.getQS();
	var ipbans = $json.parse($file.read("data/chat/ipban.txt")[0]);
	var udata = getUserData(qs.user);
	if ($auth.check(qs.user, qs.uuid) && ipbans.indexOf($client.getAddress()) == -1 && !(udata.banned > $.time() || udata.banned == -1))
		$file.read("data/chat/chat.txt").join("<br/>") + "<br/>";
:js)