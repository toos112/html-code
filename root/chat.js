var ws;
check(function(success) {
	if (!success) {
		location.replace("index.html");
	} else {
		ws = new WebSocket("ws://" + location.host, "chat");
		
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
							message = message.substr(8) + "is not online right now.";
						} else if (message.startsWith("target")) {
							message = message.substr(7) + "is not a valid target.";
						} else if (message.startsWith("time")) {
							message = message.substr(5) + "is not a valid time.";
						} else if (message.startsWith("long")) {
							message = "The time you entered is to long";
						} else if (message.startsWith("reason")) {
							message = "Please enter a valid reason.";
						} else {
							message = "An error occured";
						}
						htmlChat.innerHTML += "<span style = 'color: #c22;'>" + message + "</span><br/>";
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

var p = false;
function onShiftDown(e) {
	if (e.keyCode == 16) {
		p = true;
	}	
}

function onShiftUp(e) {
	if (e.keyCode == 16) {
		p = false;
	}
}

function enterPress(e) {
	if (e.keyCode == 13 && p != true) {
		send();
	}
}

function send() {
	var htmlMessage = document.getElementById("message").value;
	if (htmlMessage.startsWith("/") == true) {
		if (htmlMessage.startsWith("/disconnect") == true) {
			ws.close();
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