(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS()
	ret = $auth.register(qs.user, qs.password);
:js)