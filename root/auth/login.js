(js:
	_.I("scripts/login.js");
	
	var qs = $.getQS()
	$auth.login(qs.user, qs.password);
:js)