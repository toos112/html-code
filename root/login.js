if () {
	
}

function setLoggedIn() {
	var div = document.getElementById("nameInput");
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
		xmlhttp.open("GET", "auth/auth.js?user=" + htmlName.value /*+ "&password=" + htmlPassword.value*/, "true");
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				setCookie("user", name);
				setCookie("UUID", this.responseText);
				loggedIn = true;
				setLoggedIn();
			}
		}
	}
}

function goToChat() {
	location.href = "index.html?user=" + getCookie("user") + "&uuid=" + getCookie("UUID");
}

function logout() {
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "auth/logout.js?user=" + getCookie("user") + "&uuid=" + getCookie("UUID"), "true");
	xmlhttp.send();
	setCookie("user", "null");
	setCookie("UUID", "null");
	location.href = "login.html"
}