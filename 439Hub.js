document.addEventListener('DOMContentLoaded', () => {

  // theme toggle persistence
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const root = document.documentElement;
  const stored = localStorage.getItem('439hub-theme');
  if (stored === 'dark') {
    root.setAttribute('data-theme','dark');
    themeIcon.textContent = '☀️';
  } else {
    themeIcon.textContent = '🌙';
  }
  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    if (current === 'dark') {
      root.removeAttribute('data-theme');
      localStorage.setItem('439hub-theme','light');
      themeIcon.textContent = '🌙';
    } else {
      root.setAttribute('data-theme','dark');
      localStorage.setItem('439hub-theme','dark');
      themeIcon.textContent = '☀️';
    }
  });

  // password show/hide toggle
  document.body.addEventListener('click', e => {
    if (e.target.matches('.eye-toggle')) {
      const wrapper = e.target.closest('.password-wrapper');
      if (!wrapper) return;
      const input = wrapper.querySelector('input');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = '🙈';
      } else {
        input.type = 'password';
        e.target.textContent = '👁️';
      }
    }
  });

  // tabs
  document.querySelectorAll('.tab-btn, .switch-to').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      if (!target) return;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      if (btn.classList.contains('tab-btn')) btn.classList.add('active');
      else document.querySelector(`.tab-btn[data-target="${target}"]`)?.classList.add('active');
      document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(target).classList.add('active');
      clearErrors();
    });
  });

  // storage helpers
  function getUsers() {
    try { return JSON.parse(localStorage.getItem('users') || '{}'); }
    catch { return {}; }
  }
  function saveUsers(u) { localStorage.setItem('users', JSON.stringify(u)); }

  // show main
  function showMain() {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('mainContent').removeAttribute('aria-hidden');
    addSignOut();
    populateAccountInMenu();
  }

  if (localStorage.getItem('loggedInUser')) showMain();

  // signup
  document.getElementById('signupForm').addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const pass = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    if (!name || !email || !pass || !confirm) {
      showError('signupError','All fields are required.');
      return;
    }
    if (pass !== confirm) {
      showError('signupError','Passwords do not match.');
      return;
    }
    const users = getUsers();
    if (users[email]) {
      showError('signupError','User already exists.');
      return;
    }
    users[email] = { name, email, password: pass };
    saveUsers(users);
    localStorage.setItem('loggedInUser', email);
    showMain();
  });

  // login
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    clearErrors();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) {
      showError('loginError','Email and password required.');
      return;
    }
    const users = getUsers();
    const user = users[email];
    if (!user || user.password !== pass) {
      showError('loginError','Invalid credentials.');
      return;
    }
    if (document.getElementById('rememberMe').checked) {
      localStorage.setItem('loggedInUser', email);
    } else {
      localStorage.removeItem('loggedInUser');
    }
    showMain();
  });

  function clearErrors() {
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
  }
  function showError(id,msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
  }

  // account/menu
  function populateAccountInMenu() {
    const logged = localStorage.getItem('loggedInUser');
    if (!logged) return;
    const users = getUsers();
    const user = users[logged];
    if (!user) return;
    const nameEl = document.getElementById('menuName');
    const emailEl = document.getElementById('menuEmail');
    const avatarEl = document.getElementById('menuAvatar');
    if (nameEl) nameEl.textContent = user.name || logged.split('@')[0];
    if (emailEl) emailEl.textContent = user.email || logged;
    if (avatarEl) {
      if (user.avatar) {
        avatarEl.innerHTML = `<img src="${user.avatar}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        const initials = (user.name || '').split(' ').map(p=>p[0]).filter(Boolean).slice(0,2).join('').toUpperCase();
        avatarEl.textContent = initials || (logged[0]||'U').toUpperCase();
      }
    }
  }

  // Google stub (replace client ID)
  const googleClientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  function handleGoogleCredential(response) {
    try {
      const parts = response.credential.split('.');
      if (parts.length !== 3) throw new Error('Invalid token');
      const payload = JSON.parse(atob(parts[1].replaceAll('-','+').replaceAll('_','/')));
      const email = (payload.email || '').toLowerCase();
      const name = payload.name || email.split('@')[0];
      if (!email) throw new Error('No email in token');
      const users = getUsers();
      if (!users[email]) {
        users[email] = { name, email, password: null, google: true };
        saveUsers(users);
      }
      localStorage.setItem('loggedInUser', email);
      showMain();
    } catch (err) {
      console.error(err);
      alert('Google sign-in failed.');
    }
  }
  function initGoogle() {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
        ux_mode: 'popup'
      });
      google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { type: 'standard', size: 'large', text: 'signin_with' }
      );
      google.accounts.id.renderButton(
        document.getElementById('googleSignupButton'),
        { type: 'standard', size: 'large', text: 'signup_with' }
      );
    } else {
      setTimeout(initGoogle, 100);
    }
  }
  initGoogle();

  // side menu toggle
  const menuBtn = document.querySelector('.menu');
  const sideMenu = document.getElementById('sideMenu');
  const backdrop = document.getElementById('menuBackdrop');
  const closeBtn = document.querySelector('.close-btn');
  function openMenu() {
    sideMenu.classList.add('open');
    backdrop.classList.add('visible');
  }
  function closeMenu() {
    sideMenu.classList.remove('open');
    backdrop.classList.remove('visible');
  }
  menuBtn.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  backdrop.addEventListener('click', closeMenu);

  document.querySelectorAll('.side-menu .item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.side-menu .item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      let label = item.textContent.trim();
      if (label.toLowerCase() === 'home') label = 'Home';
      document.getElementById('currentSection').querySelector('.section-label').textContent = label;
      closeMenu();
    });
  });
  document.querySelector('.logo')?.addEventListener('click', () => {
    document.getElementById('currentSection').querySelector('.section-label').textContent = 'Home';
    document.querySelectorAll('.side-menu .item').forEach(i => i.classList.remove('active'));
  });

  // sign out in header
  function addSignOut() {
    if (document.getElementById('signOutBtn')) return;
    const nav = document.querySelector('.nav-right');
    const out = document.createElement('button');
    out.id = 'signOutBtn';
    out.textContent = 'Sign Out';
    out.className = 'primary-btn';
    out.style.padding = '6px 12px';
    out.style.fontSize = '0.75rem';
    out.addEventListener('click', () => {
      document.getElementById('authWrapper').style.display = '';
      document.getElementById('mainContent').setAttribute('aria-hidden','true');
      localStorage.removeItem('loggedInUser');
    });
    nav.appendChild(out);
  }

  document.querySelector('.logout-btn').addEventListener('click', () => {
    document.getElementById('authWrapper').style.display = '';
    document.getElementById('mainContent').setAttribute('aria-hidden','true');
    localStorage.removeItem('loggedInUser');
    closeMenu();
  });

  // create post modal logic
  const openPostModalBtn = document.getElementById('openPostModal');
  const postModal = document.getElementById('postModal');
  const postBackdrop = document.getElementById('postBackdrop');
  const closePostModal = document.getElementById('closePostModal');
  const impactButtons = document.querySelectorAll('.impact-btn');
  let selectedPair = '';
  let selectedImpact = '';
  let mediaData = null;

  function resetPostModal() {
    selectedPair = '';
    selectedImpact = '';
    mediaData = null;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
    impactButtons.forEach(b => b.classList.remove('selected'));
    document.getElementById('postContent').value = '';
    const placeholder = document.getElementById('uploadBox').querySelector('.placeholder');
    placeholder.innerHTML = `
      <div class="icon">🖼️</div>
      <div>Choose an image or video</div>
      <input type="file" id="mediaInput" accept="image/*,video/*" />
    `;
    attachMediaListener();
  }

  function showPostModal(type) {
    resetPostModal();
    document.getElementById('mediaSection').style.display = type === 'image' || type === 'video' ? 'block' : 'block';
    postModal.classList.add('active');
    postBackdrop.classList.add('visible');
  }
  function hidePostModal() {
    postModal.classList.remove('active');
    postBackdrop.classList.remove('visible');
  }

  openPostModalBtn.addEventListener('click', () => showPostModal('image'));
  document.querySelectorAll('.share-buttons button').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      showPostModal(type);
    });
  });
  closePostModal.addEventListener('click', hidePostModal);
  postBackdrop.addEventListener('click', hidePostModal);

  // currency selection
  document.querySelectorAll('.pill').forEach(p => {
    p.addEventListener('click', () => {
      document.querySelectorAll('.pill').forEach(x => x.classList.remove('selected'));
      p.classList.add('selected');
      selectedPair = p.dataset.pair;
    });
  });

  // impact selection
  impactButtons.forEach(b => {
    b.addEventListener('click', () => {
      impactButtons.forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedImpact = b.dataset.impact;
    });
  });

  // media listener
  function attachMediaListener() {
    const mediaInput = document.getElementById('mediaInput');
    if (!mediaInput) return;
    mediaInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        mediaData = { name: file.name, type: file.type, src: reader.result };
        const placeholder = document.getElementById('uploadBox').querySelector('.placeholder');
        placeholder.innerHTML = '';
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = reader.result;
          placeholder.appendChild(img);
        } else if (file.type.startsWith('video/')) {
          const vid = document.createElement('video');
          vid.src = reader.result;
          vid.controls = true;
          placeholder.appendChild(vid);
        }
      };
      reader.readAsDataURL(file);
    });
  }
  attachMediaListener();

  // submit post
  document.getElementById('submitPost').addEventListener('click', () => {
    if (!selectedImpact) {
      alert('Select market impact');
      return;
    }
    const content = document.getElementById('postContent').value.trim();
    if (!content && !mediaData) {
      alert('Add content or media');
      return;
    }
    const authorEmail = localStorage.getItem('loggedInUser') || '';
    const users = getUsers();
    const user = users[authorEmail] || {};
    const authorName = user.name || authorEmail.split('@')[0];
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString();

    let tagClass = '';
    switch (selectedImpact) {
      case 'Very Bearish': tagClass = 'very-bearish'; break;
      case 'Bearish': tagClass = 'bearish'; break;
      case 'Neutral': tagClass = 'neutral'; break;
      case 'Bullish': tagClass = 'bullish'; break;
      case 'Very Bullish': tagClass = 'very-bullish'; break;
    }

    const posts = document.getElementById('postsContainer');
    const card = document.createElement('article');
    card.className = 'post-card';
    const currencyHTML = selectedPair ? `<div class="currency-pair">${selectedPair}</div>` : '';
    let mediaHTML = '';
    if (mediaData) {
      if (mediaData.type.startsWith('image/')) {
        mediaHTML = `
          <div class="post-image" style="padding-top:56%;position:relative;">
            <img src="${mediaData.src}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-bottom:1px solid rgba(0,0,0,0.05);border-radius:0;"/>
          </div>`;
      } else if (mediaData.type.startsWith('video/')) {
        mediaHTML = `
          <div class="post-image" style="padding-top:56%;position:relative;">
            <video controls src="${mediaData.src}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-bottom:1px solid rgba(0,0,0,0.05);border-radius:0;"></video>
          </div>`;
      }
    } else {
      mediaHTML = `
        <div class="post-image">
          <div class="placeholder">
            <div class="title">[Chart / Visual]</div>
          </div>
        </div>`;
    }

    let avatarHtml = '';
    if (user.avatar) {
      avatarHtml = `<div class="avatar"><img src="${user.avatar}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;"></div>`;
    } else {
      const initials = (authorName || 'U').slice(0,2).toUpperCase();
      avatarHtml = `<div class="avatar">${initials}</div>`;
    }

    const sentimentText = selectedImpact === 'Neutral'
      ? '= Neutral'
      : (selectedImpact.toLowerCase().includes('bullish') ? '↗️ ' + selectedImpact : '↘️ ' + selectedImpact);

    card.innerHTML = `
      <div class="post-header">
        ${avatarHtml}
        <div class="user-info">
          <div class="user-name">${authorName} <span class="verified">✓</span></div>
          <div class="timestamp">${timeStr}</div>
        </div>
        <div class="tag ${tagClass}">${sentimentText}</div>
      </div>
      ${mediaHTML}
      <div class="post-body">
        ${currencyHTML}
        <p>${content}</p>
      </div>
      <div class="post-footer">
        <div class="actions">
          <button aria-label="like" class="like-btn">❤️ <span class="count">0</span></button>
          <button aria-label="comment" class="comment-btn">💬 <span class="count">0</span></button>
        </div>
        <div class="footer-label">b.hub.439hub.example</div>
      </div>
    `;
    posts.prepend(card);
    hidePostModal();
  });

  // like & comment interactions
  document.getElementById('postsContainer').addEventListener('click', e => {
    const likeBtn = e.target.closest('.like-btn');
    if (likeBtn) {
      const countSpan = likeBtn.querySelector('.count');
      const liked = likeBtn.classList.toggle('liked');
      let current = parseInt(countSpan.textContent || '0');
      if (liked) {
        current += 1;
        likeBtn.style.color = 'var(--like-red)';
      } else {
        current = Math.max(0, current - 1);
        likeBtn.style.color = '';
      }
      countSpan.textContent = current;
    }
    const commentBtn = e.target.closest('.comment-btn');
    if (commentBtn) {
      openCommentModal(commentBtn);
    }
  });

  // comment modal logic
  const commentBackdrop = document.getElementById('commentBackdrop');
  const commentModal = document.getElementById('commentModal');
  const closeCommentModal = document.getElementById('closeCommentModal');
  let activeCommentPost = null;
  function openCommentModal(btn) {
    activeCommentPost = btn.closest('.post-card');
    document.getElementById('commentText').value = '';
    const placeholder = document.getElementById('commentUpload').querySelector('.placeholder');
    placeholder.innerHTML = `
      <div class="icon">📎</div>
      <div>Image or video</div>
      <input type="file" id="commentFile" accept="image/*,video/*" />
    `;
    attachCommentFile();
    commentModal.classList.add('active');
    commentBackdrop.classList.add('visible');
  }
  function closeComment() {
    commentModal.classList.remove('active');
    commentBackdrop.classList.remove('visible');
    activeCommentPost = null;
  }
  closeCommentModal.addEventListener('click', closeComment);
  commentBackdrop.addEventListener('click', closeComment);

  function attachCommentFile() {
    const input = document.getElementById('commentFile');
    if (!input) return;
    input.addEventListener('change', () => {
      // preview could be implemented per need
    });
  }

  document.getElementById('submitComment').addEventListener('click', () => {
    if (!activeCommentPost) return;
    const text = document.getElementById('commentText').value.trim();
    if (!text) {
      alert('Comment empty.');
      return;
    }
    const countSpan = activeCommentPost.querySelector('.comment-btn .count');
    let cnt = parseInt(countSpan.textContent || '0') + 1;
    countSpan.textContent = cnt;
    // append comment under post (simple)
    let commentsContainer = activeCommentPost.querySelector('.comments-section');
    if (!commentsContainer) {
      commentsContainer = document.createElement('div');
      commentsContainer.className = 'comments-section';
      commentsContainer.style.padding = '10px 16px';
      commentsContainer.style.borderTop = '1px solid rgba(31,45,58,0.08)';
      activeCommentPost.appendChild(commentsContainer);
    }
    const commentEl = document.createElement('div');
    commentEl.style.marginTop = '8px';
    commentEl.innerHTML = `<strong>Comment:</strong> <span>${text}</span>`;
    commentsContainer.appendChild(commentEl);
    closeComment();
  });

  // profile modal controls
  const profileModal = document.getElementById('profileModal');
  function openProfile() {
    populateProfileFields();
    profileModal.classList.add('visible');
    profileModal.removeAttribute('aria-hidden');
  }
  function closeProfile() {
    profileModal.classList.remove('visible');
    profileModal.setAttribute('aria-hidden','true');
  }
  document.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('click', openProfile);
  });
  document.querySelector('.close-profile')?.addEventListener('click', closeProfile);

  function populateProfileFields() {
    const logged = localStorage.getItem('loggedInUser');
    if (!logged) return;
    const users = getUsers();
    const user = users[logged];
    if (!user) return;
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    const avatarEl = document.getElementById('profileAvatar');
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="avatar">`;
    } else {
      const initials = (user.name||'').split(' ').map(p=>p[0]).slice(0,2).join('').toUpperCase();
      avatarEl.textContent = initials || (logged[0]||'U').toUpperCase();
    }
  }

  // profile avatar upload
  document.getElementById('avatarInput')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result;
      const logged = localStorage.getItem('loggedInUser');
      if (!logged) return;
      const users = getUsers();
      if (!users[logged]) return;
      users[logged].avatar = data;
      localStorage.setItem('users', JSON.stringify(users));
      populateProfileFields();
      populateAccountInMenu();
    };
    reader.readAsDataURL(file);
  });

  // save profile edits
  document.getElementById('saveProfile')?.addEventListener('click', () => {
    const logged = localStorage.getItem('loggedInUser');
    if (!logged) return;
    const users = getUsers();
    if (!users[logged]) return;
    const newName = document.getElementById('profileName').value.trim();
    const newEmail = document.getElementById('profileEmail').value.trim().toLowerCase();
    if (newEmail && newEmail !== logged) {
      if (users[newEmail]) {
        alert('Email already in use.');
        return;
      }
      users[newEmail] = { ...users[logged], email: newEmail };
      delete users[logged];
      localStorage.setItem('loggedInUser', newEmail);
    }
    const finalKey = localStorage.getItem('loggedInUser');
    if (newName) users[finalKey].name = newName;
    if (newEmail) users[finalKey].email = newEmail;
    localStorage.setItem('users', JSON.stringify(users));
    populateAccountInMenu();
    closeProfile();
  });

  // profile logout
  document.getElementById('profileLogout')?.addEventListener('click', () => {
    document.getElementById('authWrapper').style.display = '';
    document.getElementById('mainContent').setAttribute('aria-hidden','true');
    localStorage.removeItem('loggedInUser');
    closeProfile();
  });

  // initial show if logged in
  if (localStorage.getItem('loggedInUser')) showMain();

})();
