// List API extractor (fallback berurutan)
const APIS = [
  "https://api.cobalt.tools/api/json",
  "https://co.wuk.sh/api/json",
  "https://cobalt-api.kwiatekmiki.com/api/json"
];

// Proxy CORS (buat bypass CORS dari GitHub Pages)
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://cors-anywhere.herokuapp.com/"
];

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

  const lower = url.toLowerCase();

  // 1. Cek direct link media
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
  if (lower.match(/\.(pdf)(\?.*)?$/)) {
    loading.textContent = "";
    result.innerHTML = `<div class="card"><span class="tag">PDF</span>
      <iframe src="${url}" width="100%" height="500px" style="border-radius:8px;margin-top:8px;"></iframe>
      ${renderDownload(url)}</div>`;
    return;
  }

  // 2. Coba semua API + proxy (fallback berurutan)
  let lastError = "";

  for (const api of APIS) {
    for (const proxy of CORS_PROXIES) {
      try {
        const target = proxy + encodeURIComponent(api);
        const res = await fetch(target, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ url, vQuality: "1080", isNoTTWatermark: true })
        });

        if (!res.ok) {
          lastError = `API ${api} → HTTP ${res.status}`;
          continue;
        }

        const data = await res.json();
        loading.textContent = "";

        // Format response cobalt
        if (data.status === "stream" || data.status === "redirect" || data.url) {
          result.innerHTML = renderVideo(data.url) + renderDownload(data.url);
          return;
        }

        if (data.status === "picker" && data.picker) {
          let html = '<div class="card"><span class="tag">PILIH KUALITAS</span>';
          data.picker.forEach(item => {
            html += `<div style="margin-bottom:10px;">
              <a href="${item.url}" target="_blank">${item.quality || 'default'} → download</a>
            </div>`;
          });
          html += '</div>';
          result.innerHTML = html;
          return;
        }

        if (data.status === "error") {
          lastError = data.text || "API error";
          continue;
        }

        // Fallback: kalo ada url apapun di response
        if (data.url) {
          result.innerHTML = renderVideo(data.url) + renderDownload(data.url);
          return;
        }

      } catch (e) {
        lastError = e.message;
        continue;
      }
    }
  }

  // Semua API gagal
  loading.textContent = "";
  result.innerHTML = `<div class="card">
    <span class="tag">ERROR</span>
    <p style="color:#ff2e2e;font-size:13px;line-height:1.6;">
      Gagal extract semua API.<br>
      <small style="color:#666;">Last error: ${lastError || 'unknown'}</small><br><br>
      <b style="color:#e0e0e0;">Kemungkinan penyebab:</b><br>
      - API cobalt lagi down<br>
      - CORS proxy limit<br>
      - Link bukan media yang didukung<br><br>
      <b style="color:#e0e0e0;">Solusi:</b><br>
      1. Tes pake link direct media (.mp4/.jpg/.mp3)<br>
      2. Kalo direct link jalan, berarti API nya down<br>
      3. Setup backend sendiri pake yt-dlp (Vercel/Cloudflare)
    </p>
  </div>`;
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

window.onload = () => {
  const q = new URLSearchParams(location.search).get('url');
  if (q) {
    document.getElementById('urlInput').value = q;
    extract();
  }
};
