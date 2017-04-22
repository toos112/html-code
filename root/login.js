var loggedIn;

function() {
	xmlhttp.open("GET", "auth/check.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), "true");
	xmlhttp.send();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			loggedIn = this.responseText == "true";
		}
	}
}();

function getCookies() {
	var cookies = document.cookie.split("; ");
	for (var i = 0; i < cookies.length; i++)
		cookies[i] = cookies[i].split("=");
	return cookies;
}

function getCookie(name) {
	var cookies = getCookies();
	for (var i = 0; i < cookies.length; i++)
		if (cookies[i][0] == name) return cookies[i][1];
	return undefined;
}

function setCookie(name, worth) {
	var cookies = getCookies();
	for (var i = 0; i < cookies.length; i++)
		if (cookies[i][0] == name) cookies[i][1] = worth;
	for (var i = 0; i < cookies.length; i++)
		cookies[i] = cookies[i].join("=");
	document.cookie = cookies.join("; ");
}

function createCookie (name, worth) {
	if (getCookie(name) == undefined) {
		document.cookie += name + "=" + worth + "; ";
	} else {
		setCookie(name, worth);
	}
}

function enterPress(e) {
	if (e.keyCode == 13 && loggedIn == false) {
		send();
	}
}

function send() {
	var htmlName = document.getElementById("name");
	var htmlPassword = document.getElementById("password");
	var div = document.getElementById("nameInput");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/auth.js?user=" + htmlName.value /*+ "&password=" + htmlPassword.value*/, "true");
	xmlhttp.send();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			createCookie("user", htmlName.value);
			createCookie("UUID", this.responseText);
			loggedIn = true;
			div.innerHTML = "<span class = \"center\" id = \"nameText\" style = \"width : calc(100% - 4px); color: #ccc;\">You have logged in.</span><br/><button onclick = \"goToChat();\" style = \"margin-top: 6px; width: 96px;\"><span>Chat</span></button>";
		}
	}
}

function goToChat() {
	location.href = "index.html"
}