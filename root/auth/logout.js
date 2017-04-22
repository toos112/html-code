(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS();
	ret = $auth.check(qs.user, qs.uuid);
	if (ret) $.auth.logout(qs.user);
:js)