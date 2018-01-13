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
					var errorPlace = document.getElementById("errorPlace");
					setCookie("user", htmlName);
					setCookie("UUID", this.responseText.trim());
					loggedIn = true;
					goTo("/home.html");
					errorPlace.parentElement.removeChild(errorPlace);
				} else {
					wrongInput("Your username or password was incorrect");
				}
			}
		}
	}
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
			<span class = \"center\" id = \"nameText\" style = \"margin-top: 6px; width : calc(100% - 4px); color: #ccc; height: 42px;\">\
				By creating a account you agree to<br/>our <span onclick = \"service();\">terms of service</span>.\
			</span><br/>\
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

function service() {
	var service = new WindowAlert(640, 740);
	service.getTitleBar().insert(new AlertButton("close", function () {service.close();}));
	service.insert(toElemArray("\
	<div style = 'height: 720px; width: 640px; padding: 2px;'>\
		<span class = 'big'>Terms of service</span><br/>\
		<div style = 'height: calc(100% - 66px); width: calc(100% - 14px); margin-top: 20px;'>\
			<span style = 'white-space: normal; overflow-y: scroll; height: 100%; width: 100%; text-align: left;'>\
				Don't take these too seriously, this whole page (including this sentence) is an inside joke you probably don't understand.\
				\
				By creating a account you agree to all of the points below.<br/>\
				By creating a account you agree to all of the below.<br/>\
				<br/>\
				You agree not abuse any bugs you may find. You agree to report any bugs you may find. You can do so using the chat function.<br/>\
				<br/>\
				You agree to respect the copyright which includes the ideas of the website and the website itself. It also includes the style and mechanics of the website.<br/>\
				<br/>\
				You agree that your account may be terminated at any time of you do not obey the following rules.<br/>\
				1.  You listen to the staff it is their free time aswell yes staff is not payed.<br/>\
				2.  Do not use excessive language.<br/>\
				3.  Do not threaten anybody on our website.<br/>\
				4.  Do not threaten the website.<br/>\
				5.  Do not spam anything.<br/>\
				6.  Have respect for those who dare to use the chat.<br/>\
				7.  Do not troll to hard it should be fun for everybody. This does mean trolling is allowed.<br/>\
				8.  Do not advertise anything without proper premission.<br/>\
				9.  In general the chat should be a English chat.<br/>\
				10. No sexism or racism or any other discrimination.<br/>\
				11. No evasions of the sentence that was made by staff<br/>\
				12. Use common sence before you say something.<br/>\
				<br/>\
				You agree to us using cookies to make the experience on our website better and safer.<br/>\
				<br/>\
				We are in our right to terminate or suspend access to this website immediately. We will try to notify you if we do but we are not required to do so.<br/>\
				<br/>\
				Our server allows you to chat. Our website is not responsible or in any way related with what is posted in the chat.<br/>\
				<br/>\
				Our server may contain links to third-party web sites or services that are not owned or controlled by this website. This website has no control over, and assumes no responsibility for, the content,privacy policies, or practices of any third party web sites or services. You further acknowledge and agree that this website shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with use of or reliance on any such content, goods or services available on or through any such web sites or services.<br/>\
				<br/>\
				We do safe all the private information that you give us. This information is saved on our server. This information will never be used for any third-company and not for advertising either.<br/>\
				We do safe all the private information that you give us. This information is saved on our server. This information will never be shared to any third-company and will not be shared to adverisers either.<br/>\
				<br/>\
				We are in our right to change the Terms of Service at any time. We will try to notify you if we do but we are not required to do so.<br/>\
				<br/>\
				If you violate the Terms of Service at any time in any way we are in our right to ban your ip and/or terminate your account and/or press charges against you.<br/>\
				<br/>\
				This website is owned by its creators. Chen, Brandon and Gidion .\
				This website is owned by its creators Chen and Gidion.\
			</span>\
		</div>\
	</div>\
	"));
	service.open();
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
	if (name.length >= 6  && name.length <= 16 && email.indexOf("@") != -1 && email.indexOf(".", email.indexOf("@")) != -1 && password1.length > 6 && password1.length <= 24 && password1 == password2) {
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("GET", "auth/register.js?user=" + name + "&email=" + email + "&password=" + password1, true);
		xmlhttp.send();
		xmlhttp.onreadystatechange = function () {
			if (this.readyState == 4 && this.status == 200) {
				if (this.responseText.trim() == "0") {
					location.replace("index.html");
				} else if (this.responseText.trim() == "1") {
					wrongInput("An error accoured.<br/>Please try again.");
				} else if (this.responseText.trim() == "2") {
					wrongInput("Username is already in use");
				} else if (this.responseText.trim() == "3") {
					wrongInput("Email is already in use");
				} else if (this.responseText.trim() == "4"){
					wrongInput("Your username has a invalid carracter");
				} else {
					wrongInput("Internal server error");
				}
			}
		}
	} else if (name == "") {
		wrongInput("Please enter your username");
	} else if (name.length < 5) {
		wrongInput("Please enter a longer username");
	} else if (name.length >= 16) {
		wrongInput("Please enter a shorter username");
	} else if (email.indexOf("@") == -1) {
		wrongInput("Please enter a valid email");
	} else if (email.indexOf(".", email.indexOf("@")) == -1) {
		wrongInput("Please enter a valid email");
	} else if (password1.length <= 6) {
		wrongInput("Please enter a longer password");
	} else if (password1.length >= 24) {
		wrongInput("Please enter a shorter password");
	} else if (password1 != password2) {
		wrongInput("Please repeat your password");
	} else {
		wrongInput("An error accoured.<br/>Please try again.");
	}
}