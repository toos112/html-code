(js:
	_.I("scripts/login.js");
	
	ret = $auth.check($.getQS().user, $.getQS().uuid);
:js)