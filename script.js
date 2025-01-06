
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

  let html = await (await fetch(`content/${name ? name : "home"}.html`)).text();
  if (!html) {
    html = await (await fetch(`content/not-found.html`)).text();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const content = document.getElementById('content');
  content.innerHTML = "";

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
  const titleElement = document.querySelector(".meta-data.title");
  document.getElementById("title").innerHTML = titleElement ? titleElement.innerHTML : "Not Found";
})();

window.addEventListener("hashchange", async (ev) => {
  let name = location.hash.substring(1).replaceAll("+", " ").replaceAll("%2B", "+");
  if (name.startsWith('/')) name = name.substring(1);

  let html = await (await fetch(`content/${name ? name : "home"}.html`)).text();
  if (!html) {
    html = await (await fetch(`content/not-found.html`)).text();
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const content = document.getElementById('content');
  content.innerHTML = "";

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

  const titleElement = document.querySelector(".meta-data.title");
  document.getElementById("title").innerHTML = titleElement ? titleElement.innerHTML : "Not Found";
});

$(window).on("scroll", function () {
  if ($(window).scrollTop() > 50) {
    document.getElementById("navbar").classList.add("active");
  } else {
    document.getElementById("navbar").classList.remove("active");
  }
});