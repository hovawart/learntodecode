function passcode() {
  var pass = prompt("enter password");
  if (pass != "1234") {
    alert("incorrect password");
    location.href = "#";
  } else if (pass == "1234") {
    console.log("hey!");
    location.href = "pages/resources/resources.html";
  }
}
