(js:
	_.I("scripts/login.js");
	
	ret = $auth.login($.getQS().user);
:js)