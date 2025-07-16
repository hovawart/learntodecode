window.addEventListener("hashchange", function(e) {
  setTimeout(function() {
    scroll(0, 0);
  }, 100);
  let hash = e.newURL;
  showDocuments(hash);
}, false);

document.addEventListener('scroll', function(e) {
  const container = document.getElementById('video-container');
  const rect = container.getBoundingClientRect();
  const video = document.getElementById('video');
  const videoSpacer = document.getElementById('video-spacer');
  const closeVideo = document.getElementById('x');
  if (rect.bottom < 0) {
    if (!video.classList.contains("video-bottom-right")) {
      videoSpacer.classList.remove("d-none");
      video.classList.add("video-bottom-right");
      closeVideo.classList.remove("d-none");
    }
  } else {
    if (video.classList.contains("video-bottom-right")) {
      videoSpacer.classList.add("d-none");
      video.classList.remove("video-bottom-right");
      video.classList.remove("d-none");
      closeVideo.classList.add("d-none");
    }
  }
});

function showDocuments(hash) {
  const indexOfHash = hash.indexOf('#');
  if (indexOfHash < 0) {
    hash = "";
  } else {
    hash = hash.substring(indexOfHash);
    if (hash.startsWith('#')) {
      hash = hash.substring(1);
    }
  }
  if (hash) {
    const hashElement = document.getElementById(hash);
    if (hashElement) {
      const youtube = hashElement.getAttribute("data-youtube");
      if (youtube) {
        document.getElementById('youtube').src = youtube + "?rel=0";
        document.getElementById('video-container').classList.remove("d-none");
      } else {
        document.getElementById('video-container').classList.add("d-none");
      }
    } else {
      document.getElementById('video-container').classList.add("d-none");
    }
  }

  if (hash) {
    document.getElementsByTagName('zero-md')[0].src = hash + '.md';
    app.render();
  } else {
    window.location.hash = "#introduction";
  }
}

document.getElementsByTagName('zero-md')[0].addEventListener('zero-md-error', function(e) {
  document.getElementsByTagName('zero-md')[0].src = 'placeholder.md';
});

document.getElementById("close-video").onclick = function(e) {
  e.preventDefault();
  document.getElementById("video").classList.add('d-none');
}

document.addEventListener("DOMContentLoaded", function(et) {
  const hash = window.location.href;
  showDocuments(hash);
});
