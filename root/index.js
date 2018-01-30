check(function(success) {
	if (success) {
		goTo("/home.html");
	}
});

function enterPress(e) {
	if (e.keyCode == 13) {
		send();
	}
}

function send() {
	var htmlName = document.getElementById("name").value;
	var htmlPassword = document.getElementById("password").value;
	var xmlhttp = new XMLHttpRequest();
	if (htmlName != "") {
		xmlhttp.open("GET", "auth/login.js?user=" + htmlName + "&password=" + htmlPassword, true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.trim() != "") {
					setCookie("user", htmlName);
					setCookie("UUID", this.responseText.trim());
					loggedIn = true;
					goTo("/home.html");
				} else {
					wrongInput("Your username or password was incorrect");
				}
			}
		}
	}
}