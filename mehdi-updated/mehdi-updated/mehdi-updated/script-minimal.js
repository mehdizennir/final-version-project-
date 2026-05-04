// --- DATA MANAGEMENT ---
function getStorage(key) {
    var data = localStorage.getItem('gymfit_' + key);
    try { return data ? JSON.parse(data) : null; } catch (error) { return null; }
}
function setStorage(key, value) {
    localStorage.setItem('gymfit_' + key, JSON.stringify(value));
}

var GYM = {
    getMembers: function () {
        var members = getStorage('members');
        if (!members) {
            members = [{ id: 1248, name: 'Ahmed Bensalem', email: 'ahmed@example.com', plan: 'Gold', joinDate: '08 Mar 2026', status: 'Active' }, { id: 1247, name: 'Fatima Zidane', email: 'fatima@example.com', plan: 'Silver', joinDate: '07 Mar 2026', status: 'Active' }, { id: 1246, name: 'Mehdi Kaci', email: 'mehdi@example.com', plan: 'Bronze', joinDate: '06 Mar 2026', status: 'Active' }, { id: 1245, name: 'Sonia Ait Ali', email: 'sonia@example.com', plan: 'Silver', joinDate: '05 Mar 2026', status: 'Expired' }, { id: 1244, name: 'Riad Meziane', email: 'riad@example.com', plan: 'Gold', joinDate: '04 Mar 2026', status: 'Active' }];
            setStorage('members', members);
        }
        return members;
    },
    saveMembers: function (data) { setStorage('members', data); },
    getPlans: function () {
        var plans = getStorage('plans');
        if (!plans) {
            plans = [{ id: 1, name: '🥉 Bronze', price: '2,500 DA', duration: '1 Month', features: 'Gym floor, Cardio, 1 class/week', status: 'Active' }, { id: 2, name: '🥈 Silver', price: '6,500 DA', duration: '3 Months', features: 'Bronze + Unlimited classes, 1 PT, Pool', status: 'Active' }, { id: 3, name: '🥇 Gold', price: '22,000 DA', duration: '12 Months', features: 'Silver + 4 PT, Priority booking, Merch', status: 'Active' }, { id: 4, name: '🎓 Student', price: '1,800 DA', duration: '1 Month', features: 'Gym floor only, off-peak hours', status: 'Inactive' }];
            setStorage('plans', plans);
        }
        return plans;
    },
    savePlans: function (data) { setStorage('plans', data); },
    getNextId: function (type) {
        var list = (type === 'members') ? this.getMembers() : this.getPlans();
        var maxId = 0;
        for (var i = 0; i < list.length; i++) { if (list[i].id > maxId) maxId = list[i].id; }
        return maxId + 1;
    },
    getTrash: function (type) { return getStorage('trash_' + type) || []; },
    saveTrash: function (type, data) { setStorage('trash_' + type, data); },
    moveToTrash: function (type, item) {
        var trash = this.getTrash(type);
        item.deletedAt = new Date().toLocaleString('en-GB');
        trash.push(item);
        this.saveTrash(type, trash);
    }
};

// --- UI COMPONENTS ---
function showToast(message, type) {
    type = type || 'success';
    var wrapper = document.getElementById('gym-toast-wrap') || (function () {
        var w = document.createElement('div'); w.id = 'gym-toast-wrap'; w.className = 'gym-toast-wrap';
        document.body.appendChild(w); return w;
    })();
    var toast = document.createElement('div');
    toast.className = 'gym-toast ' + type;
    toast.textContent = message;
    wrapper.appendChild(toast);
    setTimeout(function () { toast.classList.add('show'); }, 10);
    setTimeout(function () { toast.classList.remove('show'); setTimeout(function () { toast.remove(); }, 400); }, 3200);
}

function createModal(options) {
    var id = options.id || 'gym-modal';
    var old = document.getElementById(id); if (old) old.remove();
    var modal = document.createElement('div'); modal.id = id; modal.className = 'gym-modal-overlay';
    modal.innerHTML = '<div class="gym-modal"><h3>' + options.title + '</h3>' + options.content + '<div class="gym-modal-actions"><button class="gym-modal-btn-cancel" id="' + id + '-c">Cancel</button><button class="gym-modal-btn-confirm" id="' + id + '-ok">Confirm</button></div></div>';
    document.body.appendChild(modal);
    modal.onclick = function (event) { if (event.target === modal) modal.remove(); };
    document.getElementById(id + '-c').onclick = function () { modal.remove(); };
    document.getElementById(id + '-ok').onclick = function () { if (options.onConfirm) options.onConfirm(); modal.remove(); };
}

// --- ANIMATION HELPERS ---
function splitTextToSpans(selector, type) {
    var elements = document.querySelectorAll(selector);
    elements.forEach(function (element) {
        var text = element.innerText;
        element.innerHTML = '';
        element.classList.add(type === 'word' ? 'cin-section-title' : 'reveal-text');
        var parts = text.split(' ');
        parts.forEach(function (word, wordIndex) {
            var wrap = document.createElement('span');
            wrap.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;';
            if (type === 'char') {
                word.split('').forEach(function (character, charIndex) {
                    var span = document.createElement('span'); span.innerText = character; span.className = 'char';
                    if (word.toUpperCase() === 'BODY') { span.style.color = 'var(--accent)'; span.style.fontStyle = 'italic'; }
                    span.style.transitionDelay = (wordIndex * 0.1 + charIndex * 0.03) + 's';
                    wrap.appendChild(span);
                });
            } else {
                var span = document.createElement('span'); span.innerText = word; span.className = 'cin-word';
                span.style.transitionDelay = (wordIndex * 0.1) + 's';
                wrap.appendChild(span);
            }
            element.appendChild(wrap);
            element.appendChild(document.createTextNode('\u00A0'));
        });
    });
}

function observeAnimations(selector, className) {
    var elements = document.querySelectorAll(selector);
    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add(className || 'show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    elements.forEach(function (element) { observer.observe(element); });
}

// --- INITIALIZERS ---
function initDashboard() {
    var tbody = document.querySelector('.admin-table tbody'); if (!tbody) return;
    function render() {
        var members = GYM.getMembers();
        tbody.innerHTML = members.map(function (member) { return '<tr data-id="' + member.id + '"><td>' + member.id + '</td><td>' + member.name + '</td><td>' + member.email + '</td><td>' + member.plan + '</td><td>' + member.joinDate + '</td><td><span class="' + (member.status === 'Active' ? 'status-active' : 'status-inactive') + '">' + member.status + '</span></td><td><button class="btn-edit" data-id="' + member.id + '">Edit</button> <button class="btn-delete" data-id="' + member.id + '">Delete</button></td></tr>'; }).join('');
        tbody.querySelectorAll('.btn-delete').forEach(function (button) {
            button.onclick = function () {
                var id = parseInt(this.dataset.id); var member = members.find(function (m) { return m.id === id; });
                createModal({ title: 'Delete Member?', content: '<p class="gym-modal-p">Move <strong>' + member.name + '</strong> to trash?</p>', onConfirm: function () { GYM.moveToTrash('members', member); GYM.saveMembers(members.filter(function (m) { return m.id !== id; })); render(); showToast('Moved to Trash'); } });
            };
        });
        tbody.querySelectorAll('.btn-edit').forEach(function (button) {
            button.onclick = function () {
                var id = parseInt(this.dataset.id); var member = members.find(function (m) { return m.id === id; });
                var html = '<div class="gym-modal-grid"><div><label class="gym-lbl">Name</label><input id="e-n" class="gym-inp" value="' + member.name + '"></div><div><label class="gym-lbl">Email</label><input id="e-e" class="gym-inp" value="' + member.email + '"></div><div class="gym-modal-grid-2"><div><label class="gym-lbl">Plan</label><select id="e-p" class="gym-sel">' + ['Bronze', 'Silver', 'Gold', 'Student'].map(function (p) { return '<option ' + (member.plan === p ? 'selected' : '') + '>' + p + '</option>' }).join('') + '</select></div><div><label class="gym-lbl">Status</label><select id="e-s" class="gym-sel">' + ['Active', 'Expired', 'Suspended'].map(function (s) { return '<option ' + (member.status === s ? 'selected' : '') + '>' + s + '</option>' }).join('') + '</select></div></div></div>';
                createModal({ title: 'Edit Member #' + member.id, content: html, onConfirm: function () { member.name = document.getElementById('e-n').value; member.email = document.getElementById('e-e').value; member.plan = document.getElementById('e-p').value; member.status = document.getElementById('e-s').value; GYM.saveMembers(members); render(); showToast('Updated'); } });
            };
        });
        var totalMembersEl = document.querySelector('.stat-card.blue .stat-value');
        var activeMembersEl = document.querySelector('.stat-card.green .stat-value');
        if (totalMembersEl) {
            // Using 1,243 as base so that with the 5 default members the total is 1,248
            var baseCount = 1243;
            totalMembersEl.textContent = (baseCount + members.length).toLocaleString();
        }
        if (activeMembersEl) {
            var activeCount = members.filter(function (m) { return m.status === 'Active'; }).length;
            activeMembersEl.textContent = activeCount;
        }
    }
    var top = document.querySelector('.admin-topbar');
    if (top && !document.getElementById('add-m-btn')) {
        var btn = document.createElement('button'); btn.id = 'add-m-btn'; btn.className = 'btn btn-sm'; btn.textContent = '+ Add Member';
        btn.onclick = function () {
            var html = '<div class="gym-modal-grid"><div><label class="gym-lbl">Name</label><input id="a-n" class="gym-inp"></div><div><label class="gym-lbl">Email</label><input id="a-e" class="gym-inp"></div><div class="gym-modal-grid-2"><div><label class="gym-lbl">Plan</label><select id="a-p" class="gym-sel"><option>Bronze</option><option>Silver</option><option>Gold</option><option>Student</option></select></div><div><label class="gym-lbl">Status</label><select id="a-s" class="gym-sel"><option>Active</option><option>Expired</option></select></div></div></div>';
            createModal({
                title: 'Add Member', content: html, onConfirm: function () {
                    var name = document.getElementById('a-n').value, email = document.getElementById('a-e').value; if (!name || !email) return showToast('Required fields missing', 'error');
                    var list = GYM.getMembers(); list.unshift({ id: GYM.getNextId('members'), name: name, email: email, plan: document.getElementById('a-p').value, status: document.getElementById('a-s').value, joinDate: new Date().toLocaleDateString('en-GB') });
                    GYM.saveMembers(list); render(); showToast('Added!');
                }
            });
        };
        top.appendChild(btn);
    }
    render();
}

function initPlans() {
    var tbody = document.querySelector('.admin-table tbody'), form = document.querySelector('form'); if (!tbody || !form) return;
    function render() {
        var plans = GYM.getPlans();
        tbody.innerHTML = plans.map(function (plan) { return '<tr><td>' + plan.id + '</td><td>' + plan.name + '</td><td>' + plan.price + '</td><td>' + plan.duration + '</td><td>' + plan.features + '</td><td><span class="' + (plan.status === 'Active' ? 'status-active' : 'status-inactive') + '">' + plan.status + '</span></td><td><button class="btn-edit" data-id="' + plan.id + '">Edit</button> <button class="btn-delete" data-id="' + plan.id + '">Delete</button></td></tr>'; }).join('');
        tbody.querySelectorAll('.btn-delete').forEach(function (button) {
            button.onclick = function () {
                var id = parseInt(this.dataset.id); var plan = plans.find(function (p) { return p.id === id; });
                createModal({ title: 'Delete Plan?', content: '<p class="gym-modal-p">Move to trash?</p>', onConfirm: function () { GYM.moveToTrash('plans', plan); GYM.savePlans(plans.filter(function (p) { return p.id !== id; })); render(); showToast('Deleted'); } });
            };
        });
        tbody.querySelectorAll('.btn-edit').forEach(function (button) {
            button.onclick = function () {
                var id = parseInt(this.dataset.id); var plan = plans.find(function (p) { return p.id === id; });
                var html = '<div class="gym-modal-grid"><div class="gym-modal-grid-2"><div><label class="gym-lbl">Name</label><input id="ep-n" class="gym-inp" value="' + plan.name + '"></div><div><label class="gym-lbl">Price</label><input id="ep-p" class="gym-inp" value="' + plan.price + '"></div></div><div class="gym-modal-grid-2"><div><label class="gym-lbl">Duration</label><select id="ep-d" class="gym-sel">' + ['1 Month', '3 Months', '6 Months', '12 Months'].map(function (d) { return '<option ' + (plan.duration === d ? 'selected' : '') + '>' + d + '</option>' }).join('') + '</select></div><div><label class="gym-lbl">Status</label><select id="ep-s" class="gym-sel"><option ' + (plan.status === 'Active' ? 'selected' : '') + '>Active</option><option ' + (plan.status === 'Inactive' ? 'selected' : '') + '>Inactive</option></select></div></div><div><label class="gym-lbl">Features</label><input id="ep-f" class="gym-inp" value="' + plan.features + '"></div></div>';
                createModal({ title: 'Edit Plan: ' + plan.name, content: html, onConfirm: function () { plan.name = document.getElementById('ep-n').value; plan.price = document.getElementById('ep-p').value; plan.duration = document.getElementById('ep-d').value; plan.status = document.getElementById('ep-s').value; plan.features = document.getElementById('ep-f').value; GYM.savePlans(plans); render(); showToast('Updated'); } });
            };
        });
    }
    form.onsubmit = function (event) {
        event.preventDefault(); var name = document.getElementById('planName').value, price = document.getElementById('planPrice').value, duration = document.getElementById('planDuration').value;
        if (!name || !price || !duration) return showToast('Required fields missing', 'error');
        var list = GYM.getPlans(); var durationText = { '1': '1 Month', '3': '3 Months', '6 Months': '6 Months', '12': '12 Months' }[duration] || duration + ' Months';
        list.push({ id: GYM.getNextId('plans'), name: name, price: Number(price).toLocaleString() + ' DA', duration: durationText, features: document.getElementById('planFeatures').value || '—', status: document.getElementById('planStatus').value === 'active' ? 'Active' : 'Inactive' });
        GYM.savePlans(list); render(); form.reset(); showToast('Plan Created');
    };
    render();
}

function initTrash() {
    document.querySelectorAll('.trash-tab').forEach(function (tab) {
        tab.onclick = function () {
            document.querySelectorAll('.trash-tab, .trash-panel').forEach(function (panel) { panel.classList.remove('active'); });
            this.classList.add('active'); document.getElementById('panel-' + this.dataset.tab).classList.add('active');
        };
    });
    function render() {
        var memberTrash = GYM.getTrash('members'), planTrash = GYM.getTrash('plans');
        document.getElementById('count-members').textContent = memberTrash.length; document.getElementById('count-plans').textContent = planTrash.length;
        if (document.getElementById('members-trash-body')) {
            document.getElementById('members-trash-body').innerHTML = memberTrash.map(function (member) { return '<tr><td>' + member.id + '</td><td>' + member.name + '</td><td>' + member.email + '</td><td>' + member.plan + '</td><td>' + member.joinDate + '</td><td><span class="' + (member.status === 'Active' ? 'status-active' : 'status-inactive') + '">' + member.status + '</span></td><td class="td-deleted">' + (member.deletedAt || '—') + '</td><td><button class="btn-edit" onclick="restoreIt(\'members\',' + member.id + ')">Restore</button> <button class="btn-delete" onclick="killIt(\'members\',' + member.id + ')">Delete</button></td></tr>'; }).join('');
            document.getElementById('members-empty').style.display = memberTrash.length ? 'none' : 'flex';
            document.getElementById('members-trash-table').style.display = memberTrash.length ? 'table' : 'none';
        }
        if (document.getElementById('plans-trash-body')) {
            document.getElementById('plans-trash-body').innerHTML = planTrash.map(function (plan) { return '<tr><td>' + plan.id + '</td><td>' + plan.name + '</td><td>' + plan.price + '</td><td>' + plan.duration + '</td><td>' + plan.features + '</td><td><span class="' + (plan.status === 'Active' ? 'status-active' : 'status-inactive') + '">' + plan.status + '</span></td><td class="td-deleted">' + (plan.deletedAt || '—') + '</td><td><button class="btn-edit" onclick="restoreIt(\'plans\',' + plan.id + ')">Restore</button> <button class="btn-delete" onclick="killIt(\'plans\',' + plan.id + ')">Delete</button></td></tr>'; }).join('');
            document.getElementById('plans-empty').style.display = planTrash.length ? 'none' : 'flex';
            document.getElementById('plans-trash-table').style.display = planTrash.length ? 'table' : 'none';
        }
    }
    window.restoreIt = function (type, id) {
        var trash = GYM.getTrash(type), item = trash.find(function (x) { return x.id === id; }); if (!item) return;
        GYM.saveTrash(type, trash.filter(function (x) { return x.id !== id; })); delete item.deletedAt;
        var data = (type === 'members') ? GYM.getMembers() : GYM.getPlans(); data.push(item);
        (type === 'members') ? GYM.saveMembers(data) : GYM.savePlans(data); render(); showToast('Restored');
    };
    window.killIt = function (type, id) { createModal({ title: 'Permanent Delete?', content: '<p class="gym-modal-p">Cannot be undone.</p>', onConfirm: function () { GYM.saveTrash(type, GYM.getTrash(type).filter(function (x) { return x.id !== id; })); render(); showToast('Permanently Deleted'); } }); };
    var emptyBtn = document.getElementById('btn-empty-all'); if (emptyBtn) emptyBtn.onclick = function () { createModal({ title: 'Empty Trash?', content: '<p class="gym-modal-p">Delete all items permanently?</p>', onConfirm: function () { GYM.saveTrash('members', []); GYM.saveTrash('plans', []); render(); showToast('Trash Emptied'); } }); };
    render();
}

function initClasses() {
    var trainerFilter = document.getElementById('filterTrainer'), dayFilter = document.getElementById('filterDay'), diffFilter = document.getElementById('filterDiff'), tbody = document.querySelector('table tbody'); if (!trainerFilter || !tbody) return;
    var rows = tbody.querySelectorAll('tr'); function filter() {
        var trainer = trainerFilter.value.toLowerCase(), day = dayFilter.value.toLowerCase(), diff = diffFilter.value.toLowerCase();
        rows.forEach(function (row) { var match = (!trainer || row.cells[1].textContent.toLowerCase().includes(trainer)) && (!day || row.cells[2].textContent.toLowerCase() === day) && (!diff || row.cells[5].textContent.toLowerCase().includes(diff)); row.style.display = match ? '' : 'none'; });
    }
    trainerFilter.onkeyup = filter; dayFilter.onchange = filter; diffFilter.onchange = filter;
}

function initRegistration() {
    var form = document.getElementById('registrationForm');
    if (!form) return;
    form.onsubmit = function (event) {
        if (event) event.preventDefault();
        var name = document.getElementById('fullName').value;
        var email = document.getElementById('email').value;
        var planRadio = form.querySelector('input[name="plan"]:checked');
        if (!name || !email || !planRadio) return showToast('Required fields missing', 'error');
        var planName = planRadio.value.charAt(0).toUpperCase() + planRadio.value.slice(1);
        var members = GYM.getMembers();
        members.unshift({
            id: GYM.getNextId('members'),
            name: name,
            email: email,
            plan: planName,
            joinDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'Active'
        });
        GYM.saveMembers(members);
        showToast('Registration Successful! Welcome to GymFit.');
        form.reset();
        return false;
    };
}

function initLogin() {
    var form = document.querySelector('form'); if (form) form.onsubmit = function (event) {
        event.preventDefault();
        var user = document.getElementById('username').value, pass = document.getElementById('password').value;
        if (user === 'admin' && pass === 'admin123') { sessionStorage.setItem('gymfit_admin', '1'); window.location.href = 'Admin-dashboard.html'; }
        else { var err = document.getElementById('loginError'); if (err) err.style.display = 'block'; showToast('Invalid credentials', 'error'); }
    };
}

// --- MAIN INIT ---
document.addEventListener('DOMContentLoaded', function () {
    var path = window.location.pathname.toLowerCase(), isAdmin = document.body.classList.contains('admin-body');

    // Page Routing
    if (path.indexOf('login') !== -1) initLogin();
    else if (path.indexOf('dashboard') !== -1) initDashboard();
    else if (path.indexOf('plans') !== -1) initPlans();
    else if (path.indexOf('trash') !== -1) initTrash();
    else if (path.indexOf('classes') !== -1) initClasses();
    else if (path.indexOf('membership') !== -1 || document.getElementById('registrationForm')) initRegistration();

    // Intro Sequence (Home only)
    var isHome = path === '/' || path.indexOf('index.html') !== -1 || path === '';
    if (!isAdmin && isHome) {
        document.body.style.overflow = 'hidden';
        var top = document.createElement('div'); top.className = 'intro-half intro-top';
        var bot = document.createElement('div'); bot.className = 'intro-half intro-bottom';
        var content = document.createElement('div'); content.className = 'intro-content';
        content.innerHTML = '<div class="intro-line"></div><div class="intro-logo-text">' + ['G', 'Y', 'M', 'F', 'I', 'T'].map(function (l) { return '<span class="intro-char">' + l + '</span>' }).join('') + '</div><div class="intro-line"></div><p class="intro-tagline">Train &nbsp;·&nbsp; Transform &nbsp;·&nbsp; Thrive</p><div class="intro-progress"><div class="intro-progress-fill"></div></div>';
        document.body.appendChild(top); document.body.appendChild(bot); document.body.appendChild(content);
        setTimeout(function () { content.classList.add('active'); }, 100);
        setTimeout(function () { content.classList.add('exit'); top.classList.add('exit'); bot.classList.add('exit'); setTimeout(function () { top.remove(); bot.remove(); content.remove(); document.body.style.overflow = ''; }, 1000); }, 2700);
    }

    // Cinematic Reveals
    if (!isAdmin) {
        var nav = document.querySelector('nav'); if (nav) { nav.classList.add('cin-nav'); window.onscroll = function () { if (window.scrollY > 50) nav.classList.add('scrolled'); else nav.classList.remove('scrolled'); }; }

        // Split text for hero H1 and section titles
        splitTextToSpans('.hero-text h1', 'char');
        splitTextToSpans('h2.section-title', 'word');

        // Trigger reveals
        observeAnimations('.hero-text h1', 'show');
        observeAnimations('h2.section-title', 'show');
        observeAnimations('.hero-text h4, .hero-text p, .hero-text .btn', 'show');
        observeAnimations('.card, .plan-card, .trainer-card', 'show');
        observeAnimations('.cin-fade-up, p.section-sub, .footer-col, .form-card, .contact-info', 'show');
        observeAnimations('main p:not(.section-sub)', 'show');

        // Simple Parallax
        var hero = document.querySelector('.hero'); if (hero) { window.addEventListener('scroll', function () { hero.style.setProperty('--parallax-y', (window.scrollY * 0.4) + 'px'); }); }
    } else {
        // Admin Card Animations
        observeAnimations('.stat-card', 'show');
        observeAnimations('.admin-card', 'show');
        // Simple Stat Counter
        document.querySelectorAll('.stat-card .stat-value').forEach(function (valueEl) {
            var raw = valueEl.textContent.replace(/,/g, '');
            var target = parseFloat(raw);
            if (!isNaN(target) && raw.indexOf('M') === -1) {
                var current = 0;
                var interval = setInterval(function () {
                    current += Math.ceil(target / 15);
                    if (current >= target) { valueEl.textContent = target.toLocaleString(); clearInterval(interval); }
                    else { valueEl.textContent = current.toLocaleString(); }
                }, 40);
            }
        });
    }
});

});
