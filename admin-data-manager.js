// ========== 数据管理 - 从 GitHub 读取 JSON 文件 ==========
const DATA_CONFIG = {
  repo: 'wqzsky/us',
  branch: 'main',
  baseUrl: 'https://raw.githubusercontent.com/wqzsky/us/main/data'
};

// 从 GitHub 读取数据
async function fetchFromGitHub(filename) {
  try {
    const response = await fetch(`${DATA_CONFIG.baseUrl}/${filename}?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${filename}:`, error);
    return [];
  }
}

// 通过 GitHub API 更新数据（需要 token）
async function updateToGitHub(type, data) {
  const GITHUB_TOKEN = 'YOUR_GITHUB_TOKEN'; // ⚠️ 实际使用时不要硬编码，用环境变量或后端代理
  const repo = DATA_CONFIG.repo;
  
  try {
    // 1. 触发 GitHub Actions
    const response = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event_type: 'update-data',
        client_payload: {
          type: type,
          data: JSON.stringify(data, null, 2)
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return { success: true, message: '数据已提交，约 1 分钟后更新' };
  } catch (error) {
    console.error('Update failed:', error);
    return { success: false, error: error.message };
  }
}

// ========== 初始化加载数据 ==========
let momentsData = [];
let leavesData = [];
let photosData = [];
let listsData = [];

async function initApp() {
  // 从 GitHub 加载所有数据
  momentsData = await fetchFromGitHub('moments.json');
  leavesData = await fetchFromGitHub('leaves.json');
  photosData = await fetchFromGitHub('photos.json');
  listsData = await fetchFromGitHub('lists.json');
  
  // 渲染页面
  renderMoments();
  renderLeaves();
  renderPhotos();
  renderLists();
  updateStats();
}

// ========== 渲染函数 ==========
function renderMoments() {
  const container = document.getElementById('momentsList');
  if (momentsData.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;color:#9A9A9A;padding:40px;">还没有记录，快来添加第一条吧</div>';
    return;
  }
  container.innerHTML = momentsData.map((m, i) => `
    <div class="list-item">
      <div class="list-content">
        <div class="list-title">${m.title}</div>
        <div class="list-meta">📅 ${m.date} · ${getTypeName(m.type)}</div>
        <div style="margin-top:8px;color:#5A5A5A;">${m.content}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-sm" onclick="editMoment(${i})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteMoment(${i})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderLeaves() {
  const container = document.getElementById('leavesList');
  if (leavesData.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;color:#9A9A9A;padding:40px;">还没有留言</div>';
    return;
  }
  container.innerHTML = leavesData.map((l, i) => `
    <div class="list-item">
      <div class="list-content">
        <div class="list-title">${l.name}</div>
        <div class="list-meta">📅 ${l.date}</div>
        <div style="margin-top:8px;color:#5A5A5A;">${l.content}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-sm btn-danger" onclick="deleteLeave(${i})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderPhotos() {
  const container = document.getElementById('photosList');
  if (photosData.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;color:#9A9A9A;padding:40px;grid-column:1/-1;">还没有照片，快来上传第一张吧</div>';
    return;
  }
  container.innerHTML = photosData.map((p, i) => `
    <div style="background:white;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(232,165,152,0.1);">
      <img src="${p.img}" style="width:100%;aspect-ratio:1;object-fit:cover;">
      ${p.caption ? `<div style="padding:12px;font-size:13px;color:#5A5A5A;">${p.caption}</div>` : ''}
      <div style="padding:12px;display:flex;gap:8px;">
        <button class="btn btn-sm" onclick="editPhoto(${i})" style="flex:1;">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deletePhoto(${i})" style="flex:1;">🗑️</button>
      </div>
    </div>
  `).join('');
}

function renderLists() {
  const container = document.getElementById('listsList');
  if (listsData.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;color:#9A9A9A;padding:40px;">还没有心愿，快来添加第一个吧</div>';
    return;
  }
  container.innerHTML = listsData.map((l, i) => `
    <div class="list-item">
      <div class="list-content">
        <div class="list-title" style="${l.done?'text-decoration:line-through;color:#9A9A9A':''}">${l.title}</div>
        <div class="list-meta">${l.done ? '✅ 已完成' : '⏳ 未完成'}</div>
      </div>
      <div class="list-actions">
        <button class="btn btn-sm" onclick="toggleList(${i})">${l.done ? '↩️' : '✅'}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteList(${i})">🗑️</button>
      </div>
    </div>
  `).join('');
}

function updateStats() {
  document.getElementById('statMoments').textContent = momentsData.length;
  document.getElementById('statLeaves').textContent = leavesData.length;
  document.getElementById('statPhotos').textContent = photosData.length;
  document.getElementById('statLists').textContent = listsData.length;
}

function getTypeName(type) {
  const names = { love: '💕 恋爱', food: '🍽️ 美食', travel: '✈️ 旅行', daily: '📅 日常' };
  return names[type] || type;
}

// ========== 数据操作函数 ==========
async function addMoment() {
  const date = document.getElementById('momentDate').value;
  const title = document.getElementById('momentTitle').value;
  const content = document.getElementById('momentContent').value;
  const type = document.getElementById('momentType').value;

  if (!date || !title) {
    alert('请填写日期和标题');
    return;
  }

  momentsData.unshift({ date, title, content, type, createdAt: new Date().toISOString() });
  
  const result = await updateToGitHub('moments', momentsData);
  if (result.success) {
    alert('✅ ' + result.message);
    closeModal('momentModal');
    // 清空表单
    document.getElementById('momentDate').value = '';
    document.getElementById('momentTitle').value = '';
    document.getElementById('momentContent').value = '';
    // 重新加载数据
    setTimeout(() => initApp(), 60000); // 1 分钟后刷新
  } else {
    alert('❌ 更新失败：' + result.error);
  }
}

async function deleteMoment(index) {
  if (confirm('确定要删除这条记录吗？')) {
    momentsData.splice(index, 1);
    const result = await updateToGitHub('moments', momentsData);
    if (result.success) {
      alert('✅ ' + result.message);
      setTimeout(() => initApp(), 60000);
    } else {
      alert('❌ 更新失败：' + result.error);
    }
  }
}

async function deleteLeave(index) {
  if (confirm('确定要删除这条留言吗？')) {
    leavesData.splice(index, 1);
    const result = await updateToGitHub('leaves', leavesData);
    if (result.success) {
      alert('✅ ' + result.message);
      setTimeout(() => initApp(), 60000);
    } else {
      alert('❌ 更新失败：' + result.error);
    }
  }
}

async function deletePhoto(index) {
  if (confirm('确定要删除这张照片吗？')) {
    photosData.splice(index, 1);
    const result = await updateToGitHub('photos', photosData);
    if (result.success) {
      alert('✅ ' + result.message);
      setTimeout(() => initApp(), 60000);
    } else {
      alert('❌ 更新失败：' + result.error);
    }
  }
}

async function deleteList(index) {
  if (confirm('确定要删除这个心愿吗？')) {
    listsData.splice(index, 1);
    const result = await updateToGitHub('lists', listsData);
    if (result.success) {
      alert('✅ ' + result.message);
      setTimeout(() => initApp(), 60000);
    } else {
      alert('❌ 更新失败：' + result.error);
    }
  }
}

async function toggleList(index) {
  listsData[index].done = !listsData[index].done;
  const result = await updateToGitHub('lists', listsData);
  if (result.success) {
    setTimeout(() => initApp(), 60000);
  } else {
    alert('❌ 更新失败：' + result.error);
  }
}

// ========== 页面加载 ==========
document.addEventListener('DOMContentLoaded', initApp);
