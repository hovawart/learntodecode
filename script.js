
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

(async () => {
  document.getElementById('navbar').innerHTML = await (await fetch('navbar.html')).text();
  document.getElementById('jumbotron').innerHTML = await (await fetch('jumbotron.html')).text();
  // document.getElementById('featured').innerHTML = await (await fetch('featured.html')).text();
  document.getElementById('footer').innerHTML = await (await fetch('footer.html')).text();

  let name = location.hash.substring(1).replaceAll("+", " ").replaceAll("%2B", "+");
  if (name.startsWith('/')) name = name.substring(1);

  const content = document.getElementById('content');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = await (await fetch(`content/${name ? name : "home"}.html`)).text();

  // Append the parsed HTML elements one by one
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.tagName === 'SCRIPT') {
      const script = document.createElement('script');
      if (node.src) {
        script.src = node.src; // Copy src if external script
      } else {
        script.textContent = node.textContent; // Copy inline script
      }
      document.body.appendChild(script);
    } else {
      content.appendChild(node);
    }
  });
  document.getElementById("title").innerHTML = document.querySelector(".meta-data.title").innerHTML;
})();

window.addEventListener("hashchange", async (ev) => {
  let name = location.hash.substring(1).replaceAll("+", " ").replaceAll("%2B", "+");
  if (name.startsWith('/')) name = name.substring(1);

  const content = document.getElementById('content');

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = await (await fetch(`content/${name ? name : "home"}.html`)).text();

  // Append the parsed HTML elements one by one
  Array.from(tempDiv.childNodes).forEach(node => {
    if (node.tagName === 'SCRIPT') {
      const script = document.createElement('script');
      if (node.src) {
        script.src = node.src; // Copy src if external script
      } else {
        script.textContent = node.textContent; // Copy inline script
      }
      document.body.appendChild(script);
    } else {
      content.appendChild(node);
    }
  });
  document.getElementById("title").innerHTML = document.querySelector(".meta-data.title").innerHTML;
});