_.I("_scripts/std.js");
_.I("_scripts/json.js");
_.I("_scripts/file.js");
_.I("scripts/perms.js");

var _help = $json.parse($file.read("data/chat/help.txt").join(" "));

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
};

var _getByName = function(user) {
	for (var key in chatList)
		if (chatList[key].username == user)
			return chatList[key];
	return undefined;
};

var _parseTime = function(time) {
	if (time == "-1") return -1;
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
					return -2;
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
};

var _saveOffense = function(user, cmd, reason, time) {
	var offenses = $json.parse($file.read("data/chat/offenses.txt")[0]);
	if (offenses[user] == undefined) offenses[user] = [];
	if (time == undefined) time = "";
	else if (time == -1) time = "forever";
	else time = " for " + time;
	offenses[user].push(user + " was " + cmd + time + " because " + reason);
	$file.write("data/chat/offenses.txt", [$json.stringify(offenses)])
};

var getUserData = function(user) {
	var udata = $json.parse($file.read("data/chat/userdata.txt")[0]);
	if (udata[user] == undefined) {
		udata[user] = {
			timeout: $.time(),
			ghost: false
		}
		$file.write("data/chat/userdata.txt", [$json.stringify(udata)]);
	}
	return udata[user];
};

var writeUserData = function(user, data) {
	var udata = $json.parse($file.read("data/chat/userdata.txt")[0]);
	udata[user] = data;
	$file.write("data/chat/userdata.txt", [$json.stringify(udata)]);
};

var getReason = function(cmd, start) {
	var reason = "";
	for (var i = start; i < cmd.length; i++)
		reason += cmd[i];
	return reason.trim();
};

var command = function(cc, cmd) {
	var perm = $perm.uPerm(cc.username, "chat." + cmd[0]);
	
	if (!perm.has) _invalid(cc, "cmd");
	else if (cmd.length < 1) _invalid(cc, "args");
	else if (cmd[0] == "help") {
		var result = "<?";
		for (var key in _help) {
			var perm2 = $perm.uPerm(cc.username, key);
			if (perm2.has) {
				if (perm2.level != undefined)
					result += _help[key][perm2.level - 1] + "\n";
				else result += _help[key] + "\n";
			}
		}
		if (result.endsWith("\n"))
			result = result.substring(0, result.length - 1);
		cc.ws.write(result);
	} else if (cmd[0] == "timeout") {
		if (cmd.length < 3) _invalid(cc, "args");
		else {
			if (!_online(cmd[1])) _invalid(cc, "offline," + cmd[1]);
			else {
				if (perm.users.indexOf($perm.group(cmd[1])) == -1) _invalid(cc, "target," + cmd[1]);
				else {
					var time = _parseTime(cmd[2]);
					if (time == -2) _invalid(cc, "time," + cmd[2]);
					else if (time > perm.time && !(perm.time == -1)) _invalid(cc, "long");
					else {
						var data = getUserData(cmd[1]);
						data.timeout = $.time() + time;
						writeUserData(cmd[1], data);
						var reason = getReason(cmd, 3);
						if (reason == "") _invalid(cc, "reason")
						else {
							_getByName(cmd[1]).ws.write("<?You have been timed out for " + cmd[2] + "! reason: " + reason);
							_saveOffense(cmd[1], "timed out", reason, time);
						}
					}
				}
			}
		}
	} else if (cmd[0] == "list") {
		var result = "<@";
		if (perm.level == 1) {
			for (var user in chatList) {
				var data = getUserData(chatList[user].username);
				if (!data.ghost)
					result += chatList[user].username + ",";
			}
		} else if (perm.level == 2) {
			for (var user in chatList) {
				var data = getUserData(chatList[user].username);
				if (!data.ghost || $perm.group(chatList[user].username) != "owner")
					result += chatList[user].username + ",";
			}
		} else if (perm.level == 3) {
			for (var user in chatList)
				result += chatList[user].username + ",";
		}
		if (result.endsWith(","))
			result = result.substring(0, result.length - 1);
		cc.ws.write(result);
	} else if (cmd[0] == "ghost") {
		if (perm.level == 1 || cmd.length == 1) {
			var data = getUserData(cc.username);
			data.ghost = !data.ghost;
			writeUserData(cc.username, data);
			if (data.ghost) {
				cc.ws.write("<?You are now a ghost!");
				broadcast("<-" + cc.username);
			} else {
				cc.ws.write("<?You are no longer a ghost!");
				broadcast("<+" + cc.username);
			}
		} else if (perm.level == 2) {
			if (!_online(cmd[1])) _invalid(cc, "offline," + cmd[1]);
			else {
				var data = getUserData(cmd[1]);
				data.ghost = !data.ghost;
				writeUserData(cmd[1], data);
				if (data.ghost)  {
					cc.ws.write("<?" + cmd[1] + " is now a ghost!");
					broadcast("<-" + cc.username);
				} else {
					cc.ws.write("<?" + cmd[1] + " is no longer a ghost!");
					broadcast("<-" + cc.username);
				}
			}
		}
	} else if (cmd[0] == "info") {
		
	} else _invalid(cc, "cmd");
};