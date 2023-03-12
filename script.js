function passcode() {
	var pass = prompt("enter password")
	if (pass != "1234") {
		alert("incorrect password")
		location.href = "#"
	} else if (pass == "1234") {
		location.href="resources.html"
	}
}
