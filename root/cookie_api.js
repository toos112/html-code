let _parse_cookie = function() {
	let result = {};
	let cookies = document.cookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		if (cookies[i].length <= 1) continue;
		let cookie = cookies[i].split("=");
		result[cookie[0].trim()] = cookie[1].trim();
	}
	return result;
};

let $cookie = {
	get: function(name) {
		return _parse_cookie()[name];
	},
	
	set: function(name, val) {
		document.cookie = name + "=" + val;
	},
	
	remove: function(name) {
		document.cookie = name + "=";
	}
};