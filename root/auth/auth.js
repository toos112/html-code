(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS()
	ret = $auth.login(qs.user);
:js)