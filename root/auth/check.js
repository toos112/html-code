(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS();
	$auth.check(qs.user, qs.uuid);
:js)