var $file = {
	read: function(path) {
		return ("" + _.readf(path)).split("\n");
	},
	write: function(path, text) {
		_.writef(path, text.join("\n"))
	}
}