_.I("_scripts/json.js");
_.I("_scripts/std.js");
_.I("_scripts/file.js");

var _genID = function(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/-";
	for(var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}
		
var $auth = {
	login: function(user) {
		if (user == "" || user.indexOf("%") !== -1)
			return "";
		var uuid = _genID(32);
		var users = $json.parse($file.read("data/sessions.txt")[0]);
		users[user] = uuid;
		$file.write("data/sessions.txt", [$json.stringify(users)]);
		return uuid;
	},
	check: function(user, uuid) {
		var users = $json.parse($file.read("data/sessions.txt")[0]);
		if (users[user] == undefined) return false;
		return users[user] == uuid;
	},
	logout: function(user) {
		var users = $json.parse($file.read("data/sessions.txt")[0]);
		if (users[user] == undefined) return;
		delete users[user];
		$file.write("data/sessions.txt", [$json.stringify(users)]);
	}
}