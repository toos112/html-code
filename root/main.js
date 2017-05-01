function key(length) {
	var key = new Array(length);
	for (var i; i < length; i++) {
		key[i] = Math.floor(Math.random() * 10);
	}
	return key;
}

var handShakeDone = false;
function handShake(func) {
	var ws = new WebSocket("ws://" + location.host, "enc_setup");
	ws.onmessage = function(e) {
		var arr = e.data.split(":");
		arr[0] = strToBigUInt(arr[0]);
		func(key);
	}
	handShakeDone = true;
}

function encrypt(str) {
	if (handShakeDone == false) {
		handShake(function(key) {
			
		});
	}
	
}

function check(func) {
	var success = false;
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/check.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), true);
	xmlhttp.send();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (this.responseText.trim() == "true") {
				success = true;
			}
			func(success);
		}
	}
};

function getCookie(name) {
	var cookies = document.cookie.split("; ");
	for (var i = 0; i < cookies.length; i++) {
		cookies[i] = cookies[i].split("=");
		if (cookies[i][0] == name) return cookies[i][1];
	}
	return undefined;
}

function setCookie(name, worth) {
	document.cookie = name + "=" + worth;
}

function home() {
	location.replace("index.html");
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	};
}