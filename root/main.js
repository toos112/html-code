var loggedIn;

function check() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/check.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), "true");
	xmlhttp.send();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (this.responseText.trim() == "true") {
				loggedIn = true;
			} else loggedIn = false;
		}
	}
};
check();

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
