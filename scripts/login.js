_.I("_scripts/json.js");
_.I("_scripts/std.js");
_.I("_scripts/file.js");
_.I("_scripts/encode.js");

var _genID = function(length) {
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
	for(var i = 0; i < length; i++)
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
};
		
var $auth = {
	login: function(user, pass) {
		if (user == "" || user.indexOf("%") !== -1)
			return "";
		var sessions = $json.parse($file.read("data/sessions.txt")[0]);
		var users = $json.parse($file.read("data/users.txt")[0]);
		if (users[user] == undefined) return "";
		if (users[user].pass == $hash.sha256(pass + users[user].salt)) {
			var uuid = _genID(32);
			sessions[user] = {
				uuid: uuid,
				expire: $.time() + 86400000
			};
			$file.write("data/sessions.txt", [$json.stringify(sessions)]);
			return uuid;
		} else return "";
	},
	register: function(user, pass, email) {
		if (user.indexOf(":") != -1) return "4";
		if (user.length > 5  && user.length <= 16 && pass.length > 6 && pass.length <= 24) {
			var users = $json.parse($file.read("data/users.txt")[0]);
			if (users[user] != undefined) return "2";
			for (var key in users)
				if (users[key].email == email) return "3";
			var newSalt = _genID(32);
			users[user] = {
				salt : newSalt,
				pass : $hash.sha256(pass + newSalt),
				email : email,
				group : "user"
			};
			$file.write("data/users.txt", [$json.stringify(users)]);
		} else return "1";
		return "0";
	},
	check: function(user, uuid) {
		var sessions = $json.parse($file.read("data/sessions.txt")[0]);
		if (sessions[user] == undefined) return false;
		sessions[user].expire = $.time() + 86400000;
		$file.write("data/sessions.txt", [$json.stringify(sessions)]);
		return sessions[user].uuid == uuid;
	},
	logout: function(user) {
		var sessions = $json.parse($file.read("data/sessions.txt")[0]);
		if (sessions[user] == undefined) return;
		delete sessions[user];
		$file.write("data/sessions.txt", [$json.stringify(sessions)]);
	}
};