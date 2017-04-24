(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS()
	$auth.register(qs.user, qs.password);
:js)