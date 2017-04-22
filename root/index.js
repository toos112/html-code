var ws = new WebSocket("ws://" + location.host, "chat");
function check() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/check.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), "true");
	xmlhttp.send();
	xmlhttp.onreadystatechange = function () {
		if (this.readyState == 4 && this.status == 200) {
			if (this.responseText.trim() == "false") {
				location.href = "login.html"
			}
		}
	}
};
check();

ws.onmessage = function(e) {
	var htmlChat = document.getElementById("chat");
	if (e.data.startsWith("<")) {
		var message = e.data.substr(2) + " has " + (e.data.startsWith("<+") ? "joined." : "left.");
		htmlChat.innerHTML += "<span style = 'color: #eee;'>" + message + "</span><br/>";
	} else {
		var message = e.data.split(">");
		htmlChat.innerHTML += "<span style = 'color: #48c;'>" + message[0] + "</span><span style = 'color: #ccc;'>: " + message[1] + "</span><br/>";
	}
	htmlChat.scrollTop = htmlChat.scrollHeight;
};

function enterPress(e) {
	if (e.keyCode == 13) {
		send();
	}
}

function send() {
	var htmlMessage = document.getElementById("message");
	ws.send(htmlMessage.value);
}