var $ = {
	write: function(string) {
		_.out(string);
	},
	writeObj: function(obj) {
		_.out(JSON.stringify(obj));
	}
};