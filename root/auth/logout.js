(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS();
	var ret = $auth.check(qs.user, qs.uuid);
	if (ret) $auth.logout(qs.user);
	ret;
:js)