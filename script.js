const API = "https://api.cobalt.tools/api/json";

async function extract() {
  const url = document.getElementById('urlInput').value.trim();
  const result = document.getElementById('result');
  const loading = document.getElementById('loading');

  if (!url) {
    result.innerHTML = '<p style="color:#ff2e2e;">Isi link dulu pakcik.</p>';
    return;
  }

  loading.textContent = "Lagi extract... sabar.";
  result.innerHTML = "";

  // Deteksi direct link media
  const lower = url.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/)) {
    loading.textContent = "";
    result.innerHTML = renderImage(url);
    return;
  }
  if (lower.match(/\.(mp4|webm|mkv|mov)(\?.*)?$/)) {
    loading.textContent = "";
    result.innerHTML = renderVideo(url);
    return;
  }
  if (lower.match(/\.(mp3|wav|m4a|flac|ogg)(\?.*)?$/)) {
    loading.textContent = "";
    result.innerHTML = renderAudio(url);
    return;
  }

  // Platform → pake cobalt API
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ url, vQuality: "1080" })
    });
    const data = await res.json();

    if (data.status === "stream" || data.status === "redirect") {
      loading.textContent = "";
      result.innerHTML = renderVideo(data.url) + renderDownload(data.url);
    } else if (data.status === "picker") {
      loading.textContent = "";
      let html = '<div class="card"><span class="tag">PILIH KUALITAS</span>';
      data.picker.forEach(item => {
        html += `<div style="margin-bottom:10px;">
          <a href="${item.url}" target="_blank">${item.quality || 'default'} → download</a>
        </div>`;
      });
      html += '</div>';
      result.innerHTML = html;
    } else {
      loading.textContent = "";
      result.innerHTML = `<p style="color:#ff2e2e;">Gagal extract: ${data.text || 'unknown'}</p>`;
    }
  } catch (e) {
    loading.textContent = "";
    result.innerHTML = `<p style="color:#ff2e2e;">Error: ${e.message}</p>`;
  }
}

function renderImage(url) {
  return `<div class="card"><span class="tag">IMAGE</span>
    <img src="${url}" referrerpolicy="no-referrer">
    ${renderDownload(url)}</div>`;
}
function renderVideo(url) {
  return `<div class="card"><span class="tag">VIDEO</span>
    <video controls src="${url}" referrerpolicy="no-referrer"></video>
    ${renderDownload(url)}</div>`;
}
function renderAudio(url) {
  return `<div class="card"><span class="tag">AUDIO</span>
    <audio controls src="${url}" referrerpolicy="no-referrer"></audio>
    ${renderDownload(url)}</div>`;
}
function renderDownload(url) {
  return `<a href="${url}" download target="_blank">⬇ Download langsung</a>`;
}

function clearAll() {
  document.getElementById('urlInput').value = "";
  document.getElementById('result').innerHTML = "";
  document.getElementById('loading').textContent = "";
}

// Auto-load dari query ?url=
window.onload = () => {
  const q = new URLSearchParams(location.search).get('url');
  if (q) {
    document.getElementById('urlInput').value = q;
    extract();
  }
};
