function send() {
	var htmlName = document.getElementById("name");
	var htmlPassword = document.getElementById("password");
	var div = document.getElementById("nameInput");
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open("GET", "verifyUser.js?user=" + htmlName.value /*+ "&password=" + htmlPassword.value*/, "true");
	xmlhttp.send();
	//.send("??" + htmlPassword)
	div.innerHTML = "<span class = \"center\" id = \"nameText\" style = \"width : calc(100% - 4px); color: #ccc;\">You have loged in.</span>";
}