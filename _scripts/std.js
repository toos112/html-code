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
	escape: function(str) {
		str = str.replaceAll("<", "&lt;");
		str = str.replaceAll(">", "&gt;");
		return str;
	},
	time: function() {
		return 0 + _.getTime();
	}
};