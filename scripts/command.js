_.I("_scripts/std.js");
_.I("_scripts/json.js");
_.I("_scripts/file.js");
_.I("scripts/perms.js");

var _help = $json.parse($file.read("data/chat/help.txt").join(" "));

var _invalid = function(cc, err) {
	cc.ws.write("<!" + err);
};

var _online = function(exec, cmd, user) {
	var data = getUserData(user);
	if (data.ghost && $perm.uPerm(exec, "chat." + cmd).ghosts.indexOf($perm.group(user)) == -1) return false;
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

var _saveOffense = function(su, user, cmd, reason, time) {
	var offenses = $json.parse($file.read("data/chat/offenses.txt")[0]);
	if (offenses[user] == undefined) offenses[user] = [];
	if (time == undefined) time = "";
	else if (time == -1) time = "forever";
	else time = " for " + time;
	offenses[user].push(user + " was " + cmd + " by " + su + time + " because " + reason);
	$file.write("data/chat/offenses.txt", [$json.stringify(offenses)])
};

var _getOffenses = function(user) {
	if ($json.parse($file.read("data/chat/offenses.txt")[0])[user] == undefined) return [];
	return $json.parse($file.read("data/chat/offenses.txt")[0])[user];
}

var getUserData = function(user) {
	var udata = $json.parse($file.read("data/chat/userdata.txt")[0]);
	if (udata[user] == undefined) {
		udata[user] = {
			timeout: $.time(),
			ghost: false,
			slow: 0
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
		reason += cmd[i] + " ";
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
			if (!_online(cc.username, cmd[0], cmd[1]) && !cmd[1].startsWith("ALL:")) _invalid(cc, "offline," + cmd[1]);
			else {
				if (!(cmd[1].startsWith("ALL:") || !perm.users.indexOf($perm.group(cmd[1])))) _invalid(cc, "target," + cmd[1]);
				else {
					var time = _parseTime(cmd[2]);
					if (time == -2) _invalid(cc, "time," + cmd[2]);
					else if (time > perm.time && !(perm.time == -1)) _invalid(cc, "long");
					else {
						if (!cmd[1].startsWith("ALL:")) {
							var reason = getReason(cmd, 3);
							if (reason == "") _invalid(cc, "reason")
							else {
								var data = getUserData(cmd[1]);
								data.timeout = $.time() + time;
								writeUserData(cmd[1], data);
								_getByName(cmd[1]).ws.write("<?You have been timed out for " + cmd[2] + "! reason: " + reason);
								if (cc.username != cmd[1])
									_saveOffense(cc.username, cmd[1], "timed out", reason, cmd[2]);
							}
						} else if (perm.level == 1) _invalid(cc, "target,ALL");
						else {
							var users = cmd[1].substr(4).split(",");
							for (var i = 0; i < users.length; i++) {
								var rank = users[i];
								if (perm.users.indexOf(rank) == -1) {
									_invalid(cc, "target," + rank);
									return;
								}
							}
							for (var user in chatList) {
								if (users.indexOf($perm.group(chatList[user].username)) == -1) {
									var data = getUserData(chatList[user].username);
									data.timeout = $.time() + time;
									writeUserData(chatList[user].username, data);
								}
							}
							var bc = ""
							for (var i = 0; i < users.length; i++) {
								var rank = users[i];
								 bc += rank + "s and ";
							}
							if (bc != "") bc = bc.substring(0, bc.length - 5);
							broadcast("<?all " + bc + " have been timed out for " + cmd[2]);
						}
					}
				}
			}
		}
	} else if (cmd[0] == "list") {
		var result = "<@";
		for (var user in chatList) {
			var data = getUserData(chatList[user].username);
			if (perm.ghosts.indexOf($perm.group(chatList[user].username)) != -1 || !data.ghost) {
				if (data.ghost) result += "<i>" + chatList[user].username + "</i>,";
				else result += chatList[user].username + ",";
			}
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
			if (!_online(cc.username, cmd[0], cmd[1])) _invalid(cc, "offline," + cmd[1]);
			else {
				var data = getUserData(cmd[1]);
				data.ghost = !data.ghost;
				writeUserData(cmd[1], data);
				if (data.ghost)  {
					cc.ws.write("<?" + cmd[1] + " is now a ghost!");
					_getByName(cmd[1]).ws.write("<?You are now a ghost thanks to " + cc.username + "!");
					broadcast("<-" + cmd[1]);
				} else {
					cc.ws.write("<?" + cmd[1] + " is no longer a ghost!");
					_getByName(cmd[1]).ws.write("<?You no longer a ghost thanks to " + cc.username + "!");
					broadcast("<+" + cmd[1]);
				}
			}
		}
	} else if (cmd[0] == "info") {
		if (cmd.length < 2) _invalid(cc, "args");
		else {
			if (!_exists(cmd[1])) _invalid(cc, "user," + cmd[1]);
			else {
				var rank = $perm.group(cmd[1]) == "secret" && perm.level != 3 ? "user" : $perm.group(cmd[1]);
				var result = "<?[" + rank + "] " + cmd[1];
				var data = getUserData(cmd[1]);
				if (perm.ghosts.indexOf($perm.group(cmd[1])) != -1 && data.ghost)
					result += " (ghost)"
				result += " is " + ((_online(cc.username, cmd[0], cmd[1]) && (!data.ghost || perm.ghosts.indexOf($perm.group(cmd[1])))) ? "online" : "offline");
				if (perm.level == 3 && ((_online(cc.username, cmd[0], cmd[1]) && (!data.ghost || perm.ghosts.indexOf($perm.group(cmd[1]))))) result += " and their ip is " + _getByName(cmd[1]).ws.address;
				result += "\n";
				var offenses = _getOffenses(cmd[1]);
				if (offenses.length > 0) result += "Offenses:\n";
				else result += cmd[1] + " has no offenses\n";
				for (var i = 0; i < offenses.length; i++)
					result += offenses[i] + "\n";
				result = result.substring(0, result.length - 1);
				cc.ws.write(result);
			}
		}
	} else if (cmd[0] == "kick") {
		if (cmd.length < 2) _invalid(cc, "args");
		else {
			if (!_online(cc.username, cmd[0], cmd[1])) _invalid(cc, "offline," + cmd[1]);
			else {
				if (perm.users.indexOf($perm.group(cmd[1])) == -1) _invalid(cc, "target," + cmd[1]);
				else {
					var reason = getReason(cmd, 2);
					if (reason == "") _invalid(cc, "reason")
					else {
						_getByName(cmd[1]).ws.close();
						_saveOffense(cc.username, cmd[1], "kicked", reason);
					}
				}
			}
		}
	} else if (cmd[0] == "slow") {
		if (cmd.length < 3) _invalid(cc, "args");
		else {
			if (!_online(cc.username, cmd[0], cmd[1]) && !cmd[1].startsWith("ALL:")) _invalid(cc, "offline," + cmd[1]);
			else {
				if (!(cmd[1].startsWith("ALL:") || !perm.users.indexOf($perm.group(cmd[1])))) _invalid(cc, "target," + cmd[1]);
				else {
					var time = _parseTime(cmd[2]);
					if (time == -2) _invalid(cc, "time," + cmd[2]);
					else if (time > perm.time && !(perm.time == -1)) _invalid(cc, "long");
					else {
						if (!cmd[1].startsWith("ALL:")) {
							var reason = getReason(cmd, 3);
							if (reason == "" && time != 0) _invalid(cc, "reason")
							else {
								var data = getUserData(cmd[1]);
								data.slow = time;
								writeUserData(cmd[1], data);
								if (time != 0) _getByName(cmd[1]).ws.write("<?You have been slowed to 1 message every " + cmd[2] + "! reason: " + reason);
								else _getByName(cmd[1]).ws.write("<?You are nog longer slowed!");
								if (cc.username != cmd[1])
									_saveOffense(cc.username, cmd[1], "timed out", reason, cmd[2]);
							}
						} else if (perm.level == 1) _invalid(cc, "target,ALL");
						else {
							var users = cmd[1].substr(4).split(",");
							for (var i = 0; i < users.length; i++) {
								var rank = users[i];
								if (perm.users.indexOf(rank) == -1) {
									_invalid(cc, "target," + rank);
									return;
								}
							}
							for (var user in chatList) {
								if (users.indexOf($perm.group(chatList[user].username)) == -1) {
									var data = getUserData(chatList[user].username);
									data.slow = time;
									writeUserData(chatList[user].username, data);
								}
							}
							var bc = ""
							for (var i = 0; i < users.length; i++) {
								var rank = users[i];
								 bc += rank + "s and ";
							}
							if (bc != "") bc = bc.substring(0, bc.length - 5);
							if (time != 0) broadcast("<?all " + bc + " have been slowed to 1 message every " + cmd[2] + "!");
							else broadcast("<?all " + bc + " are no longer slowed!");
						}
					}
				}
			}
		}
	} else if (cmd[0] == "warn") {
		if (cmd.length < 2) _invalid(cc, "args");
		else {
			if (!_online(cc.username, cmd[0], cmd[1])) _invalid(cc, "offline," + cmd[1]);
			else {
				if (perm.users.indexOf($perm.group(cmd[1])) == -1) _invalid(cc, "target," + cmd[1]);
				else {
					var reason = getReason(cmd, 2);
					if (reason == "") _invalid(cc, "reason")
					else {
						_getByName(cmd[1]).ws.write("<*" + reason);
						cc.ws.write("<?Your warned " + cmd[1]);
						_saveOffense(cc.username, cmd[1], "warned", reason);
					}
				}
			}
		}
	} else _invalid(cc, "cmd");
};