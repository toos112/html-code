_.I("_scripts/json.js");

var $ = {
	write: function(string) {
		_.out(string);
	},
	writeObj: function(obj) {
		_.out(JSON.stringify(obj));
	},
	getQS: function() {
		return JSON.parse(_qs);
	},
	replaceAll: function(str, s1, s2) {
		return str.split(s1).join(s2);
	},
	escape: function(str) {
		str = $.replaceAll(str, "<", "&lt;");
		str = $.replaceAll(str, ">", "&gt;");
		return str;
	},
	time: function() {
		return 0 + _.getTime();
	}
};