_.I("_scripts/std.js");
_.I("_scripts/json.js");
_.I("_scripts/file.js");
_.I("scripts/perms.js");

//var _help = $json.parse($file.read("data/help.txt").join(" "));

var _invalid = function(cc, err) {
	cc.ws.write("<!" + err);
};

var _online = function(user) {
	for (var key in chatList)
		if (chatList[key].username == user)
			return true;
	return false;
};

var _exists = function(user) {
	var users = $json.parse($file.read("data/users.txt")[0]);
	return users[user] != undefined;
}

var _getByName = function(user) {
	for (var key in chatList)
		if (chatList[key].username == user)
			return chatList[key];
	return undefined;
}

var _parseTime = function(time) {
	var timeArr = {
		"ms" : 1,
		"s" : 1000,
		"m" : 60000,
		"h" : 3600000,
		"d" : 86400000,
		"w" : 604800000,
		"f" : 1209600000,
		"M" : 2592000000,
		"Y" : 31536000000,
		"D" : 315360000000,
		"C" : 3153600000000
	}
	var result = 0;
	var temp = 0;
	var end = false;
	var str = "";
	for (var i = 0; i < time.length; i++) {
		var ch = time.charAt(i);
		var num = parseInt(ch);
		if (isNaN(num)) {
			end = true;
			str += ch;
		} else {
			if (end) {
				if (timeArr[str] == undefined)
					return -1;
				result += temp * timeArr[str];
				str = "";
				end = false;
				temp = 0;
			}
			temp = temp * 10 + num;
		}
	}
	result += temp * timeArr[str];
	return result;
}

var getUserData = function(user) {
	var udata = $json.parse($file.read("data/userdata.txt")[0]);
	if (udata[user] == undefined) {
		udata[user] = {
			timeout: $.time()
		}
		$file.write("data/userdata.txt", [$json.stringify(udata)]);
	}
	return udata[user];
};

var writeUserData = function(user, data) {
	var udata = $json.parse($file.read("data/userdata.txt")[0]);
	udata[user] = data;
	$file.write("data/userdata.txt", [$json.stringify(udata)]);
}

var command = function(cc, cmd) {
	var perm = $perm.uPerm(cc.username, "chat." + cmd[0]);
	
	if (!perm.has) _invalid(cc, "cmd");
	else if (cmd.length < 1) _invalid(cc, "args");
	else if (cmd[0] == "help") {
		var result = "<?\n";
		for (var key in _help) {
			var perm2 = $perm.uPerm(cc.username, key);
			if (perm2.has) {
				if (perm2.level == undefined)
					result += _help[key] + "\n";
				else result += _help[key + ":" + perm2.level] + "\n";
			}
		}
		cc.ws.write(result.substring(0, result.length - 1));
	} else if (cmd[0] == "timeout") {
		if (cmd.length < 3) _invalid(cc, "args");
		else {
			if (!_online(cmd[1])) _invalid(cc, "offline");
			else {
				if (perm.users.indexOf($perm.group(cmd[1])) == -1) _invalid(cc, "target");
				else {
					var time = _parseTime(cmd[2]);
					if (time == -1) _invalid(cc, "time");
					else {
						var data = getUserData(cmd[1]);
						data.timeout = $.time + _parseTime(cmd[2]);
						writeUserData(cmd[0], data);
						_getByName(user).ws.send("You have been timed out!");
					}
				}
			}
		}
	} else _invalid(cc, "cmd");
};