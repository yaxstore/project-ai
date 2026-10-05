// ============================================
// KONFIGURASI BACKEND
// Ganti dengan URL Vercel lu setelah deploy
// Contoh: https://media-backend-xxx.vercel.app/api/extract
// ============================================
const BACKEND = "https://project-ai-rouge-nine.vercel.app/";

// ============================================
// FUNGSI UTAMA
// ============================================
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

  // ---------- Direct Link Media ----------
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

  // ---------- Pake Backend ----------
  try {
    const res = await fetch(BACKEND, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    loading.textContent = "";

    // Response stream / redirect
    if (data.status === "stream" || data.status === "redirect" || data.url) {
      result.innerHTML = renderVideo(data.url);
      return;
    }

    // Response picker (pilihan kualitas)
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

    // Response error dari backend
    result.innerHTML = `<div class="card"><span class="tag">ERROR</span>
      <p style="color:#ff2e2e;font-size:13px;">${data.text || data.error || 'Extract gagal'}</p></div>`;

  } catch (e) {
    loading.textContent = "";
    result.innerHTML = `<div class="card"><span class="tag">ERROR</span>
      <p style="color:#ff2e2e;font-size:13px;line-height:1.7;">
        Gagal extract: ${e.message}<br><br>
        <b style="color:#e0e0e0;">Cek:</b><br>
        1. Backend Vercel udah deploy?<br>
        2. URL backend udah bener?<br>
        3. Tes backend langsung di browser<br><br>
        <small style="color:#666;">Backend: ${BACKEND}</small>
      </p></div>`;
  }
}

// ============================================
// RENDER HELPER
// ============================================
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

// ============================================
// CLEAR
// ============================================
function clearAll() {
  document.getElementById('urlInput').value = "";
  document.getElementById('result').innerHTML = "";
  document.getElementById('loading').textContent = "";
}

// ============================================
// AUTO LOAD DARI QUERY ?url=
// ============================================
window.onload = () => {
  const q = new URLSearchParams(location.search).get('url');
  if (q) {
    document.getElementById('urlInput').value = q;
    extract();
  }
};
