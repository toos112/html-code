_.I("_scripts/json.js");
_.I("_scripts/file.js");

var _perms = $json.parse($file.read("data/perms.txt").join(" "));

var $perm = {
	gPerm: function(group, perm) {
		if (_perms[group].perms[perm] != undefined)
			return _perms[group].perms[perm];
		for (var i = 0; i < _perms[group].inherit.length; i++) {
			var inherit = _perms[group].inherit[i];
			if (_perms[inherit].perms[perm] != undefined)
				return _perms[inherit].perms[perm];
		}
		return {"has":false};
	},
	uPerm: function(user, perm) {
		return $perm.gPerm($perm.group(user), perm);
	},
	group: function(user) {
		var users = $json.parse($file.read("data/users.txt")[0]);
		return users[user].group;
	}
}