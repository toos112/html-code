var ws = new WebSocket("ws://" + location.host, "chat");
ws.onmessage = function(e) {
	var htmlChat = document.getElementById("chat");
	if (e.data.startsWith("<")) {
		var message = e.data.substr(1);
		if (message.startsWith("+")) {
			var joinMessage = e.data.substr(1);
			htmlChat.innerHTML += "<span style = 'color: #eee;'>" + joinMessage + " has joined.</span><br/>";
		}else if (message.startsWith("-")) {
			var leaveMessage = e.data.substr(1);
			htmlChat.innerHTML += "<span style = 'color: #eee;'>" + leaveMessage + " has left.</span><br/>";
		}
	}else {
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
	var htmlName = document.getElementById("name");
	var htmlMessage = document.getElementById("message");
	var sender = "";
	var senderOld = "";
	if (htmlName.value == "") {
		sender = "Anonymous";
	} else {
		sender = htmlName.value;
	}
	if (htmlMessage.value != "") {
		if (sender == senderOld) {
			ws.send(":" + htmlMessage.value);
		} else {
			senderOld = sender;
			ws.send("@" + sender);
			ws.send(":" + htmlMessage.value);
		}
		htmlMessage.value = "";
	}
}