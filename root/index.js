check(function(success) {
	if (success) {
		setLoggedIn();
	}
});

function setLoggedIn() {
	var title = document.getElementById("title");
	var div = document.getElementById("nameInput");
	title.innerHTML = "Home";
	div.innerHTML = "\
		<span class = \"center\" id = \"nameText\" style = \"width: 250px; color: #ccc;\">\
			You have logged in.\
		</span>\
		<button onclick = \"logout();\" style \"width: 96px;\">\
			<span>\
				Logout\
			</span>\
		</button><br/>\
		<button onclick = \"goToChat();\" style = \"margin-top: 6px; width: 96px;\">\
			<span>\
				Chat\
			</span>\
		</button>";
}

function enterPress(e) {
	if (e.keyCode == 13 && loggedIn == false) {
		send();
	}
}

function send() {
	var htmlName = document.getElementById("name");
	var htmlPassword = document.getElementById("password");
	var xmlhttp = new XMLHttpRequest();
	var name = htmlName.value;
	if (name != "") {
		xmlhttp.open("GET", "auth/login.js?user=" + htmlName.value + "&password=" + htmlPassword.value, true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.trim() != "") {
					setCookie("user", name);
					setCookie("UUID", this.responseText);
					loggedIn = true;
					setLoggedIn();
				} else {
					wrongInput("Your username or password was incorrect");
				}
			}
		}
	}
}

function goToChat() {
	location.replace("chat.html");
}

function logout() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/logout.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), true);
	xmlhttp.send();
	setCookie("user", "null");
	setCookie("UUID", "null");
	location.replace("index.html");
}

function register() {
	var title = document.getElementById("title");
	var div = document.getElementById("input");
	title.innerHTML = "Register";
	div.innerHTML = "\
		<div id = \"errorPlace\">\
		</div><br/>\
		<div class = \"center\" style = \"margin-top: 5px; width: calc(40% + 84px); padding: 2px; border : 2px solid #444;\">\
			<span class = \"center\" style = \"width : 160px; color: #ccc;\">\
				Username: \
			</span>\
			<input type = \"text\" id = \"name\" placeholder = \"Type your Username here\" style = \"width: calc(100% - 164px);\"/><br/>\
			<span class = \"center\" id = \"nameText\" style = \"margin-top: 6px; width : 160px; color: #ccc;\">\
				Email: \
			</span>\
			<input type = \"text\" id = \"email\" placeholder = \"Type your Email here\" style = \"margin-top: 6px; width: calc(100% - 164px);\"/><br/>\
			<span class = \"center\" id = \"nameText\" style = \"margin-top: 6px; width : 160px; color: #ccc;\">\
				Password: \
			</span>\
			<input type = \"password\" id = \"password1\" placeholder = \"Type your Password here\" style = \"margin-top: 6px; width: calc(100% - 164px);\"/><br/>\
			<span class = \"center\" id = \"nameText\" style = \"margin-top: 6px; width : 160px; color: #ccc;\">\
				Password: \
			</span>\
			<input type = \"password\" id = \"password2\" placeholder = \"Repeat your Password\" style = \"margin-top: 6px; width: calc(100% - 164px);\"/><br/>\
			<button onclick = \"home();\" id = \"button\" style = \"margin-top: 6px; width: 96px;\">\
				<span>\
					Cancel\
				</span>\
			</button>\
			<button onclick = \"commit();\" id = \"button\" style = \"margin-left: 6px; margin-top: 6px; width: 96px;\">\
				<span>\
					Commit\
				</span>\
			</button>\
		</div>";
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

function commit() {
	var name = document.getElementById("name").value;
	var email = document.getElementById("email").value;
	var password1 = document.getElementById("password1").value;
	var password2 = document.getElementById("password2").value;
	if (name.length > 5  && name.length <= 16 && email.indexOf("@") != -1 && email.indexOf(".") > email.indexOf("@") && password1.length > 6 && password1.length <= 24 && password1 == password2) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", "auth/register.js?user=" + name + "&email=" + email + "&password=" + password1, true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.trim() != "0") {
					location.replace("index.html");
				} else if (this.responseText.trim() != "1") {
					wrongInput("An error accoured.<br/>Please try again.");
				} else if (this.responseText.trim() != "2") {
					wrongInput("Username is already in use");
				} else if (this.responseText.trim() != "3") {
					wrongInput("Email is already in use");
				} else {
					wrongInput("Internal server error");
				}
			}
	} else if (name == "") {
		wrongInput("Please enter your username");
	} else if (name.length < 5) {
		wrongInput("Please enter a longer username");
	} else if (name.length >= 16) {
		wrongInput("Please enter a shorter username");
	} else if (email.indexOf("@") == -1) {
		wrongInput("Please enter a  valid email");
	} else if (email.indexOf(".") < email.indexOf("@")) {
		wrongInput("Please enter a valid email");
	} else if (password1.length < 6) {
		wrongInput("Please enter a longer password");
	} else if (password1.length >= 24) {
		wrongInput("Please enter a shorter password");
	} else if (password1 != password2) {
		wrongInput("Please repeat your password");
	} else {
		wrongInput("An error accoured.<br/>Please try again.");
	}
}