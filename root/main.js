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

function goTo(page) {
	var name = document.getElementById("title").value;
	history.pushState(undefined, name, location.href);
	location.replace(page);
	
}

function logout() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/logout.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), true);
	xmlhttp.send();
	setCookie("user", "null");
	setCookie("UUID", "null");
	location.replace("index.html");
}

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
	location.replace("home.html");
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position) {
		position = position || 0;
		return this.indexOf(searchString, position) === position;
	};
}

function wrongInput(text) {
	var div = document.getElementById("errorPlace");
	div.className += "center";
	div.style.marginTop = "5px";
	div.style.width = "calc(40% + 84px)";
	div.style.padding = "2px";
	div.style.border = "2px solid #444";
	div.innerHTML = "<span style = \"height: auto;\">" + text + "</span>";
}