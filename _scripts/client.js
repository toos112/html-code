var $client = {
	getHeaders: function() {
		var headers = ("" + _ci.getHeaders()).split("\n");
		var result = {};
		for (var i = 0; i < headers.length; i++) {
			headers[i] = headers[i].split(": ");
			result[headers[i][0]] = headers[i][1];
		}
		return result;
	},
	getAddress: function() {
		return "" + _ci.getInetAddress();
	}
};