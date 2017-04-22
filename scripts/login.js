_.I("_scripts/json.js");
_.I("_scripts/std.js");

function _genID(length) {
	var text = "";
	var possible = "0123456789ABCDEF";
	for(var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}
		
var $auth = {
	login: function(user) {
		var uuid = _genID(16);
		var users = $json.parse($file.read("data/users.txt"));
		users[user]["uuid"] = uuid;
		$file.write($json.stringify(users));
		return uuid;
	}
}