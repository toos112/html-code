var goodClose = false;
var ws;
check(function(success) {
	if (!success) {
		location.replace("index.html");
	} else {
		if (location.protocol == "https:")
			ws = new WebSocket("wss://" + location.host, "chat");
		else ws = new WebSocket("ws://" + location.host, "chat");
		
		ws.onmessage = function(e) {
			var htmlChat = document.getElementById("chat");
			if (e.data.startsWith("<")) {
				if (e.data.startsWith("<+") || e.data.startsWith("<-")) {
					var message = e.data.substr(2) + " has " + (e.data.startsWith("<+") ? "joined." : "left.");
					htmlChat.innerHTML += "<span style = 'color: #eee;'>" + message + "</span><br/>";
				} else {
					var message = e.data.substr(1);
					if (message.startsWith("!")) {
						message = message.substr(1);
						if (message.startsWith("cmd")) {
							message = "Not a valid command.";
						} else if (message.startsWith("args")) {
							message = "Not enough arguments.";
						} else if (message.startsWith("offline")) {
							message = message.substr(8) + " is not online right now.";
						} else if (message.startsWith("target")) {
							message = message.substr(7) + " is not a valid target.";
						} else if (message.startsWith("time")) {
							message = message.substr(5) + " is not a valid time.";
						} else if (message.startsWith("long")) {
							message = "The time you entered is to long";
						} else if (message.startsWith("reason")) {
							message = "Please enter a valid reason.";
						} else if (message.startsWith("user")) {
							message = message.substr(5) + " is not a user";
						} else if (message.startsWith("banned")) {
							message = "Your banned from this server. Turn arround and never come back to this realm of the wild internet.";
						} else {
							message = "An error occured";
						}
						htmlChat.innerHTML += "<span style = 'color: #c22;'>" + message + "</span><br/>";
					} else if (message.startsWith("*")) {
						message = message.substr(1);
						htmlChat.innerHTML += "<span style = 'color: #f70;'>You were warned becouse: \"" + message + "\".</span><br/>";
					} else if (message.startsWith("?")) {
						message = message.substr(1);
						var height = 1;
						while (-1 != message.indexOf("\n")) {
							message = message.replace("\n", "<br/>");
							height++;
						}
						height = height * 20;
						htmlChat.innerHTML += "<span style = 'white-space: pre; color: #862; height: " + height + "px;'>" + message + "</span><br/>";
					} else if (message.startsWith("@")) {
						var fakeMessage = message.substr(1);
						fakeMessage = fakeMessage.split(",");
						var realMessage = "Users online: " + fakeMessage[0];
						for (i = 1; i < fakeMessage.length; i++) {
							realMessage += ", " + fakeMessage[i];
						}
						htmlChat.innerHTML += "<span style = 'color: #862;'>" + realMessage + ".</span><br/>";
					}
				}
			} else {
				var message = e.data.split(">");
				var height = 1;
				while (-1 != message[1].indexOf("\n")) {
					message[1] = message[1].replace("\n", "<br/>  ");
					height++;
				}
				height = height * 20;
				htmlChat.innerHTML += "<span style = 'color: #48c;'>" + message[0] + "</span><span style = 'white-space: pre; color: #ccc; height: " + height + "px;'>: " + message[1] + "</span><br/>";
			}
			htmlChat.scrollTop = htmlChat.scrollHeight;
		};
		
		ws.onopen = function(e) {
			ws.send("@" + getCookie("user") + ">" + getCookie("UUID"));
		}
		
		ws.onclose = function(e) {
			if (goodClose == false) {
				home();
			}
		}
		
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", "server/getChat.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				var htmlHistory = document.getElementById("history");
				htmlHistory.innerHTML = this.responseText;
			}
		}
	}
});

var currentMessage = "";
var messages = getCookie("messages") == undefined ? [] : getCookie("messages").split(",");
var p = false;
var messageCount = -1;
function onKeyDown(e) {
	var htmlMessage = document.getElementById("message");
	if (e.keyCode == 16) {
		p = true;
	} else if (e.keyCode == 38) {
		if (messages.length > 0) {
			if (messageCount == -1) {
				currentMessage = htmlMessage.value;
			}
			messageCount++;
			if ((messages.length - 1) < messageCount) {
				messageCount = messages.length - 1;
			}
			htmlMessage.value = messages[messageCount];
		}
	} else if (e.keyCode == 40) {
		messageCount--;
		if (messageCount < 0) {
			messageCount = -1;
			htmlMessage.value = currentMessage;
		} else {
			htmlMessage.value = messages[messageCount];
		}
	}
}

function onKeyUp(e) {
	if (e.keyCode == 16) {
		p = false;
	}
}

function onKeyPress(e) {
	if (e.keyCode == 13 && p != true) {
		send();
	}
}

function send() {
	var htmlMessage = document.getElementById("message").value;
	if (htmlMessage == "") return;
	messages.unshift(htmlMessage.replace(",", "&comma;"));
	messages = messages.slice(0, 16);
	messageCount = -1;
	setCookie("messages", messages.join(","));
	if (htmlMessage.startsWith("/") == true) {
		if (htmlMessage.startsWith("/disconnect") == true) {
			ws.close();
			goodClose = true;
		} else if (htmlMessage.startsWith("/clear") == true) {
			var htmlChat = document.getElementById("chat");
			htmlChat.innerHTML = "";
		} else {
			ws.send(htmlMessage);
		}
	} else {
		ws.send(":" + htmlMessage);
	}
	setTimeout(function() {document.getElementById("message").value = "";},1);
}