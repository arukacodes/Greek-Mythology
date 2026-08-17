
const byId = Object.fromEntries(DATA.map(d=>[d.id,d]));

function childrenOf(id){
  return DATA.filter(d => d.parents && d.parents.includes(id));
}

/* ---------- Sound: synthesized in the browser, no audio files needed ---------- */
const SOUND_KEY = 'greekMythTree_sound_v1';
let soundOn = true;
try{
  const s = localStorage.getItem(SOUND_KEY);
  if(s !== null) soundOn = s === 'on';
}catch(e){ /* ignore */ }

let audioCtx = null;
function getAudioCtx(){
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return null;
  if(!audioCtx) audioCtx = new AC();
  if(audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playTone(freq, duration, type, peak, delay){
  if(!soundOn) return;
  const ctx = getAudioCtx();
  if(!ctx) return;
  const t0 = ctx.currentTime + (delay||0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak||0.12, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + (duration||0.4));
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + (duration||0.4) + 0.05);
}

const GEN_NOTES = {
  primordial:261.63, titan:293.66, olympian:329.63, hero:392.00,
  nature:440.00, zodiac:523.25, troy:587.33, philosophy:659.25, echoes:698.46
};

function playSelectSound(gen){
  const base = GEN_NOTES[gen] || 392;
  playTone(base, 0.5, 'triangle', 0.11, 0);
  playTone(base*1.5, 0.4, 'sine', 0.04, 0.03);
}

function playUnlockChime(){
  playTone(523.25, 0.35, 'triangle', 0.12, 0);
  playTone(659.25, 0.5, 'triangle', 0.12, 0.12);
}

function playEggChime(){
  playTone(659.25, 0.3, 'sine', 0.1, 0);
  playTone(830.61, 0.3, 'sine', 0.09, 0.09);
  playTone(1046.5, 0.45, 'triangle', 0.1, 0.18);
}

function playPageSound(direction){
  if(!soundOn) return;
  const ctx = getAudioCtx();
  if(!ctx) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  const startFreq = direction === 'next' ? 500 : 700;
  const endFreq = direction === 'next' ? 700 : 500;
  osc.frequency.setValueAtTime(startFreq, t0);
  osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + 0.18);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.06, t0 + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + 0.25);
}

function toggleSound(){
  soundOn = !soundOn;
  try{ localStorage.setItem(SOUND_KEY, soundOn ? 'on' : 'off'); }catch(e){}
  const btn = document.getElementById('soundToggle');
  if(btn) btn.textContent = soundOn ? '🔊 音效' : '🔇 靜音';
  if(soundOn) getAudioCtx();
}

const STORAGE_KEY = 'greekMythTree_visited_v1';
let visited = new Set();
try{
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) visited = new Set(JSON.parse(raw));
}catch(e){ /* localStorage unavailable — progress just won't persist */ }

function markVisited(id){
  visited.add(id);
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited])); }catch(e){}
  const el = document.getElementById('node-'+id);
  if(el) el.classList.add('visited');
  updateProgressCounter();
}

function updateProgressCounter(){
  const el = document.getElementById('progressCounter');
  if(!el) return;
  el.textContent = `已探索 ${visited.size} / ${DATA.length}`;
}

function renderNodes(){
  ['primordial','titan','olympian','hero','nature','zodiac','troy','philosophy','echoes'].forEach(gen=>{
    const row = document.querySelector('.gen-row[data-row="'+gen+'"]');
    DATA.filter(d=>d.gen===gen).forEach((d,i)=>{
      const el = document.createElement('div');
      el.className = 'node' + (visited.has(d.id) ? ' visited' : '');
      el.id = 'node-'+d.id;
      el.setAttribute('data-gen', gen);
      el.style.setProperty('--stagger', (i%10)*45+'ms');
      if(d.isRoman) el.setAttribute('data-roman', 'true');
      el.innerHTML = `
        <div class="medallion"><span class="zh">${d.zh}</span></div>
        <div class="gr">${d.gr}</div>
        ${d.isRoman ? '<span class="roman-badge">羅馬 ROMAN</span>' : ''}
      `;
      el.addEventListener('click', ()=>selectNode(d.id));
      row.appendChild(el);
    });
  });
  updateProgressCounter();
}

function drawConnections(){
  const wrap = document.getElementById('treeWrap');
  const svg = document.getElementById('connections');
  const wrapRect = wrap.getBoundingClientRect();
  svg.setAttribute('width', wrap.scrollWidth);
  svg.setAttribute('height', wrap.scrollHeight);
  svg.innerHTML = '';

  DATA.forEach(node=>{
    if(!node.parents || node.parents.length===0) return;
    node.parents.forEach(pid=>{
      const parentEl = document.getElementById('node-'+pid);
      const childEl = document.getElementById('node-'+node.id);
      if(!parentEl || !childEl) return;
      const pr = parentEl.getBoundingClientRect();
      const cr = childEl.getBoundingClientRect();
      const x1 = pr.left + pr.width/2 - wrapRect.left + wrap.scrollLeft;
      const y1 = pr.top + pr.height - 8 - wrapRect.top + wrap.scrollTop;
      const x2 = cr.left + cr.width/2 - wrapRect.left + wrap.scrollLeft;
      const y2 = cr.top + 8 - wrapRect.top + wrap.scrollTop;
      const midY = (y1+y2)/2;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
      path.setAttribute('class','edge');
      path.dataset.from = pid;
      path.dataset.to = node.id;
      svg.appendChild(path);
    });
  });

  const drawnCounterparts = new Set();
  DATA.forEach(node=>{
    if(!node.counterpart) return;
    const pairKey = [node.id, node.counterpart].sort().join('|');
    if(drawnCounterparts.has(pairKey)) return;
    drawnCounterparts.add(pairKey);
    const aEl = document.getElementById('node-'+node.id);
    const bEl = document.getElementById('node-'+node.counterpart);
    if(!aEl || !bEl) return;
    const ar = aEl.getBoundingClientRect();
    const br = bEl.getBoundingClientRect();
    const x1 = ar.left + ar.width/2 - wrapRect.left + wrap.scrollLeft;
    const y1 = ar.top + ar.height/2 - wrapRect.top + wrap.scrollTop;
    const x2 = br.left + br.width/2 - wrapRect.left + wrap.scrollLeft;
    const y2 = br.top + br.height/2 - wrapRect.top + wrap.scrollTop;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M ${x1} ${y1} L ${x2} ${y2}`);
    path.setAttribute('class','edge edge-counterpart');
    path.dataset.from = node.id;
    path.dataset.to = node.counterpart;
    svg.appendChild(path);
  });

  DATA.forEach(node=>{
    if(!node.links || node.links.length===0) return;
    node.links.forEach(targetId=>{
      const aEl = document.getElementById('node-'+node.id);
      const bEl = document.getElementById('node-'+targetId);
      if(!aEl || !bEl) return;
      const ar = aEl.getBoundingClientRect();
      const br = bEl.getBoundingClientRect();
      const x1 = ar.left + ar.width/2 - wrapRect.left + wrap.scrollLeft;
      const y1 = ar.top + ar.height/2 - wrapRect.top + wrap.scrollTop;
      const x2 = br.left + br.width/2 - wrapRect.left + wrap.scrollLeft;
      const y2 = br.top + br.height/2 - wrapRect.top + wrap.scrollTop;
      const midY = (y1+y2)/2;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`);
      path.setAttribute('class','edge edge-zodiac');
      path.dataset.from = node.id;
      path.dataset.to = targetId;
      svg.appendChild(path);
    });
  });
}

let currentId = null;

function animateEdgeDraw(path){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const len = path.getTotalLength();
  const isDashedType = path.classList.contains('edge-counterpart') || path.classList.contains('edge-zodiac');
  path.style.transition = 'none';
  if(!isDashedType){ path.style.strokeDasharray = len; }
  path.style.strokeDashoffset = len;
  // force reflow so the browser registers the starting state before we animate
  void path.getBoundingClientRect();
  path.style.transition = 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1), opacity .2s ease, stroke .2s ease, stroke-width .2s ease';
  path.style.strokeDashoffset = '0';
}

function selectNode(id){
  currentId = id;
  const isFirstVisit = !visited.has(id);
  document.querySelectorAll('.node').forEach(n=>n.classList.remove('active'));
  document.getElementById('node-'+id).classList.add('active');

  document.querySelectorAll('.edge').forEach(e=>{
    e.classList.remove('edge-active','edge-dim');
    if(e.dataset.from===id || e.dataset.to===id){
      e.classList.add('edge-active');
      animateEdgeDraw(e);
    } else {
      e.classList.add('edge-dim');
    }
  });

  storyOpenId = null;
  markVisited(id);
  if(isFirstVisit){ playUnlockChime(); } else { playSelectSound(byId[id].gen); }
  renderDetail(id);

  const panel = document.getElementById('detailPanel');
  panel.classList.add('open');
}

function closePanel(){
  document.getElementById('detailPanel').classList.remove('open');
}

function renderDetail(id){
  const d = byId[id];
  document.getElementById('detailEmpty').style.display = 'none';
  const content = document.getElementById('detailContent');
  content.style.display = 'block';

  const parentsChips = (d.parents||[]).map(pid=>{
    const p = byId[pid];
    return `<button class="link-chip" onclick="jumpToNode('${pid}')">${p.zh} ${p.gr}</button>`;
  }).join('') || `<span style="font-size:12.5px;color:var(--ink-soft);">${d.gen==='primordial' ? '無（原初存在）' : '無明確記載的單一親系'}</span>`;

  const kids = childrenOf(id);
  const kidsChips = kids.length
    ? kids.map(k=>`<button class="link-chip" onclick="jumpToNode('${k.id}')">${k.zh} ${k.gr}</button>`).join('')
    : '<span style="font-size:12.5px;color:var(--ink-soft);">（無記載後代）</span>';

  const counterpartRow = d.counterpart ? `
    <div class="detail-section-title">跨文化對應</div>
    <div class="link-row"><button class="link-chip" onclick="jumpToNode('${d.counterpart}')">✦ ${byId[d.counterpart].zh} ${byId[d.counterpart].gr}</button></div>
  ` : '';

  const linksRow = (d.links && d.links.length) ? `
    <div class="detail-section-title">${d.gen==='philosophy' ? '思想關聯' : '神話關聯'}</div>
    <div class="link-row">${d.links.map(lid=>`<button class="link-chip" onclick="jumpToNode('${lid}')">✧ ${byId[lid].zh} ${byId[lid].gr}</button>`).join('')}</div>
  ` : '';

  const storyParts = d.story.split('。');
  const storyHook = storyParts[0] ? storyParts[0] + '。' : d.story;
  const storyRest = storyParts.slice(1).join('。');

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-medallion" style="--ring:var(--${d.gen})">${d.zh.slice(0,1)}</div>
      <div class="detail-title">
        <h2>${d.zh}</h2>
        <div class="gr-name">${d.gr} · 羅馬名：${d.roman}</div>
      </div>
    </div>
    <div class="detail-epithet">「${d.epithet}」</div>
    <div class="detail-tags">
      <span class="tag">領域：${d.domain}</span>
      <span class="tag">象徵：${d.symbol}</span>
    </div>
    <div class="detail-story"><span class="story-hook">${storyHook}</span>${storyRest}</div>
    <button class="read-story-btn" id="storyToggleBtn" onclick="toggleStory('${d.id}')">📜 閱讀完整神話故事</button>
    <div class="full-story-box" id="fullStoryBox"></div>
    <div class="astro-box">
      <span class="astro-icon">🔭</span>
      <div class="astro-text"><span class="astro-label">在夜空中</span>${d.astro || '目前尚無明確對應的天體命名。'}</div>
    </div>
    <div class="detail-section-title">父母</div>
    <div class="link-row">${parentsChips}</div>
    <div class="detail-section-title">子嗣 / 後代</div>
    <div class="link-row">${kidsChips}</div>
    ${counterpartRow}
    ${linksRow}
  `;
}

function jumpToNode(id){
  const el = document.getElementById('node-'+id);
  el.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
  selectNode(id);
}

function jumpTo(gen){
  document.getElementById('sec-'+gen).scrollIntoView({behavior:'smooth', block:'start'});
}

let storyOpenId = null;
let storyParaIndex = 0;
let storyShowAll = false;

function toggleStory(id){
  const box = document.getElementById('fullStoryBox');
  const btn = document.getElementById('storyToggleBtn');
  if(storyOpenId === id){
    box.style.display = 'none';
    box.innerHTML = '';
    btn.textContent = '📜 閱讀完整神話故事';
    storyOpenId = null;
    return;
  }
  storyOpenId = id;
  storyParaIndex = 0;
  storyShowAll = false;
  btn.textContent = '📜 收起故事';
  box.style.display = 'block';
  renderStoryBox();
  box.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function renderStoryBox(){
  const box = document.getElementById('fullStoryBox');
  if(!box || !storyOpenId) return;
  const d = byId[storyOpenId];
  const paras = d.fullStory || [];

  if(storyShowAll){
    box.innerHTML = paras.map(p=>`<p>${p}</p>`).join('') +
      `<button class="story-mode-toggle" onclick="storyShowAll=false; storyParaIndex=0; renderStoryBox();">↩ 改成一段一段看</button>`;
    return;
  }

  const dots = paras.map((_,i)=>`<span class="story-dot ${i===storyParaIndex?'active':''}"></span>`).join('');
  box.innerHTML = `
    <p>${paras[storyParaIndex]}</p>
    <div class="story-nav">
      <button class="story-nav-btn" onclick="storyParaIndex=Math.max(0,storyParaIndex-1); playPageSound('prev'); renderStoryBox();" ${storyParaIndex===0?'disabled':''}>← 上一段</button>
      <div class="story-dots">${dots}</div>
      <button class="story-nav-btn" onclick="storyParaIndex=Math.min(${paras.length-1},storyParaIndex+1); playPageSound('next'); renderStoryBox();" ${storyParaIndex===paras.length-1?'disabled':''}>下一段 →</button>
    </div>
    <button class="story-mode-toggle" onclick="storyShowAll=true; renderStoryBox();">顯示全部段落</button>
  `;
}

function setupRevealObserver(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.node').forEach(n=>n.classList.add('revealed'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.15, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.node').forEach(n=>io.observe(n));
}

const GEN_META = [
  {id:'primordial', label:'創世 · 原初神', color:'#3B2E42'},
  {id:'titan', label:'泰坦神族', color:'#6B4A2F'},
  {id:'olympian', label:'奧林帕斯十二主神', color:'#1F4959'},
  {id:'hero', label:'凡間英雄', color:'#B5502E'},
  {id:'nature', label:'自然精靈與野性之神', color:'#4B6B3A'},
  {id:'zodiac', label:'黃道十二宮', color:'#3D3A6B'},
  {id:'troy', label:'特洛伊戰爭與奧德賽', color:'#6B2E3A'},
  {id:'philosophy', label:'哲學家與經典著作', color:'#5B5850'},
  {id:'echoes', label:'神話的現代回聲', color:'#8A6D1F'},
];

function setupProgressRail(){
  const rail = document.getElementById('progressRail');
  if(!rail) return;
  GEN_META.forEach(g=>{
    const dot = document.createElement('button');
    dot.className = 'rail-dot';
    dot.style.setProperty('--dot-color', g.color);
    dot.title = g.label;
    dot.setAttribute('aria-label', g.label);
    dot.dataset.gen = g.id;
    dot.onclick = ()=> jumpTo(g.id);
    rail.appendChild(dot);
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      const gen = entry.target.id.replace('sec-','');
      rail.querySelectorAll('.rail-dot').forEach(d=>d.classList.toggle('active', d.dataset.gen===gen));
    });
  }, {threshold:0, rootMargin:'-45% 0px -45% 0px'});
  document.querySelectorAll('.gen-section').forEach(s=>io.observe(s));
}

renderNodes();
setupRevealObserver();
setupProgressRail();
(function initSoundButton(){
  const btn = document.getElementById('soundToggle');
  if(btn) btn.textContent = soundOn ? '🔊 音效' : '🔇 靜音';
})();
window.addEventListener('load', ()=>{
  drawConnections();
  setTimeout(drawConnections, 150);
});
window.addEventListener('resize', drawConnections);
document.getElementById('treeWrap').addEventListener('scroll', drawConnections);
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(drawConnections);
}

/* ---------- Easter Egg Wall ---------- */
const EASTER_EGGS = [
  {icon:'🪐', text:'土星真的有一顆衛星叫「潘」——就卡在土星環的一道縫隙裡。'},
  {icon:'☄️', text:'小行星「伊卡洛斯」的軌道會週期性飛到離太陽超近的地方，跟神話一模一樣。'},
  {icon:'🌑', text:'月球上有一座「柏拉圖坑」，隔壁不遠處就是「亞里斯多德坑」，師生倆至今仍是鄰居。'},
  {icon:'🚀', text:'NASA真的發射了一艘叫「普緒克號」的探測船，去找一顆幾乎全是金屬的小行星。'},
  {icon:'🌫️', text:'「Panic」（恐慌）這個英文字，就是直接從牧神「潘」的名字來的。'},
  {icon:'🧪', text:'化學元素「鉭」用坦塔羅斯命名——因為它泡在強酸裡都不會被腐蝕，怎樣都「傷不了」它。'},
  {icon:'🌟', text:'科學家曾正經提出：太陽可能有一顆看不見的伴星，還把它取名叫「涅墨西斯」（死對頭）。'},
  {icon:'🛰️', text:'1960年代NASA的通訊衛星取名「Echo」——因為它跟神話裡的厄科一樣，只能反射訊號、不能主動發聲。'},
  {icon:'🌕', text:'冥王星有一顆衛星叫「倪克斯」，安靜地繞著冥界之王轉。'},
  {icon:'🪨', text:'土星最大的衛星就叫「泰坦」——整個泰坦神族幾乎承包了土星的衛星命名。'},
  {icon:'👁️', text:'水瓶座裡有個星雲被暱稱為「上帝之眼」，因為它長得真的很像一隻眼睛在看你。'},
  {icon:'🕳️', text:'銀河系中心那個超大質量黑洞，就叫「人馬座A*」。'},
  {icon:'☀️', text:'希臘七賢之首泰勒斯，兩千六百年前就準確預言了一次日食，還讓兩國因此當場停戰。'},
  {icon:'🌌', text:'雙魚座現在才是春分點真正的位置——地球自轉軸的「歲差」，把它從白羊座慢慢挪過去了。'},
  {icon:'🦂', text:'天蠍座和獵戶座永遠不會同時出現在夜空——神話裡，獵人俄里翁至今仍在躲避那隻蠍子。'},
  {icon:'🌠', text:'每年八月的英仙座流星雨，輻射點正好就在——追殺蛇髮女妖梅杜莎的英雄柏修斯的星座裡。'},
];

const EGG_KEY = 'greekMythTree_eggs_v1';
let discoveredEggs = new Set();
try{
  const raw = localStorage.getItem(EGG_KEY);
  if(raw) discoveredEggs = new Set(JSON.parse(raw));
}catch(e){ /* ignore */ }

function renderEggGrid(){
  const grid = document.getElementById('eggGrid');
  if(!grid || grid.childElementCount) { updateEggProgress(); return; }
  EASTER_EGGS.forEach((egg, i)=>{
    const card = document.createElement('div');
    card.className = 'egg-card' + (discoveredEggs.has(i) ? ' flipped' : '');
    card.dataset.index = i;
    card.innerHTML = `
      <div class="egg-card-inner">
        <div class="egg-card-front"><span class="egg-icon-hint">?</span></div>
        <div class="egg-card-back">
          <span class="egg-emoji">${egg.icon}</span>
          <span class="egg-text">${egg.text}</span>
        </div>
      </div>
    `;
    card.addEventListener('click', (ev)=> flipEgg(i, card, ev));
    grid.appendChild(card);
  });
  updateEggProgress();
}

function flipEgg(i, card, ev){
  if(discoveredEggs.has(i)) return;
  discoveredEggs.add(i);
  try{ localStorage.setItem(EGG_KEY, JSON.stringify([...discoveredEggs])); }catch(e){}
  card.classList.add('flipped');
  spawnSparkles(ev.clientX, ev.clientY);
  playEggChime();
  updateEggProgress();
}

function spawnSparkles(x, y){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const glyphs = ['✦','✧','⋆','✨'];
  for(let k=0; k<8; k++){
    const s = document.createElement('span');
    s.className = 'sparkle';
    s.textContent = glyphs[k % glyphs.length];
    const angle = (Math.PI * 2 * k) / 8;
    const dist = 40 + Math.random()*30;
    s.style.setProperty('--sx', Math.cos(angle)*dist + 'px');
    s.style.setProperty('--sy', Math.sin(angle)*dist + 'px');
    s.style.left = x + 'px';
    s.style.top = y + 'px';
    s.style.color = k % 2 === 0 ? '#E8C468' : '#fff';
    document.body.appendChild(s);
    setTimeout(()=> s.remove(), 850);
  }
}

function updateEggProgress(){
  const el = document.getElementById('eggProgress');
  if(!el) return;
  el.textContent = `已發現 ${discoveredEggs.size} / ${EASTER_EGGS.length}`;
}

function openEggWall(){
  renderEggGrid();
  document.getElementById('eggOverlay').classList.add('open');
}

function closeEggWall(){
  document.getElementById('eggOverlay').classList.remove('open');
}

/* ---------- Search ---------- */
function genColor(gen){
  const meta = GEN_META.find(g=>g.id===gen);
  return meta ? meta.color : '#A6812E';
}

function openSearch(){
  document.getElementById('searchOverlay').classList.add('open');
  const input = document.getElementById('searchInput');
  input.value = '';
  renderSearchResults();
  setTimeout(()=> input.focus(), 50);
}

function closeSearch(){
  document.getElementById('searchOverlay').classList.remove('open');
}

function matchesQuery(d, q){
  if(!q) return true;
  return d.zh.toLowerCase().includes(q) || d.gr.toLowerCase().includes(q);
}

function renderSearchResults(){
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const box = document.getElementById('searchResults');
  const matches = DATA.filter(d=>matchesQuery(d,q)).slice(0, 30);
  if(matches.length===0){
    box.innerHTML = '<div class="util-empty">找不到符合的角色，換個關鍵字試試？</div>';
    return;
  }
  box.innerHTML = matches.map(d=>`
    <button class="util-result-item" onclick="selectFromSearch('${d.id}')">
      <span class="util-result-dot" style="--dot-color:${genColor(d.gen)}"></span>
      <span>
        <div class="util-result-name">${d.zh}</div>
        <div class="util-result-gr">${d.gr}</div>
      </span>
    </button>
  `).join('');
}

function selectFromSearch(id){
  closeSearch();
  jumpToNode(id);
}

/* ---------- Relationship graph + pathfinder ---------- */
const ADJ = {};
DATA.forEach(d=>{ ADJ[d.id] = new Set(); });
DATA.forEach(d=>{
  (d.parents||[]).forEach(p=>{ if(ADJ[p]){ ADJ[d.id].add(p); ADJ[p].add(d.id); } });
  (d.links||[]).forEach(l=>{ if(ADJ[l]){ ADJ[d.id].add(l); ADJ[l].add(d.id); } });
  if(d.counterpart && ADJ[d.counterpart]){ ADJ[d.id].add(d.counterpart); ADJ[d.counterpart].add(d.id); }
});

function findPath(startId, endId){
  if(startId === endId) return [startId];
  const visited = new Set([startId]);
  const queue = [[startId]];
  while(queue.length){
    const path = queue.shift();
    const node = path[path.length-1];
    for(const neighbor of (ADJ[node] || [])){
      if(neighbor === endId) return [...path, neighbor];
      if(!visited.has(neighbor)){
        visited.add(neighbor);
        queue.push([...path, neighbor]);
      }
    }
  }
  return null;
}

let pathFromId = null;
let pathToId = null;

function openPathfinder(){
  document.getElementById('pathOverlay').classList.add('open');
  document.getElementById('pathFromInput').value = '';
  document.getElementById('pathToInput').value = '';
  document.getElementById('pathFromResults').innerHTML = '';
  document.getElementById('pathToResults').innerHTML = '';
  document.getElementById('pathResult').innerHTML = '';
  pathFromId = null;
  pathToId = null;
}

function closePathfinder(){
  document.getElementById('pathOverlay').classList.remove('open');
}

function renderPathSuggestions(field){
  const inputId = field === 'from' ? 'pathFromInput' : 'pathToInput';
  const resultsId = field === 'from' ? 'pathFromResults' : 'pathToResults';
  const q = document.getElementById(inputId).value.trim().toLowerCase();
  const box = document.getElementById(resultsId);
  if(!q){ box.innerHTML = ''; return; }
  const matches = DATA.filter(d=>matchesQuery(d,q)).slice(0, 8);
  if(matches.length===0){
    box.innerHTML = '<div class="util-empty">沒有符合的角色</div>';
    return;
  }
  box.innerHTML = matches.map(d=>`
    <button class="util-result-item" onclick="pickPathNode('${field}','${d.id}','${d.zh.replace(/'/g,"\\'")}')">
      <span class="util-result-dot" style="--dot-color:${genColor(d.gen)}"></span>
      <span>
        <div class="util-result-name">${d.zh}</div>
        <div class="util-result-gr">${d.gr}</div>
      </span>
    </button>
  `).join('');
}

function pickPathNode(field, id, zh){
  if(field === 'from'){
    pathFromId = id;
    document.getElementById('pathFromInput').value = zh;
    document.getElementById('pathFromResults').innerHTML = '';
  } else {
    pathToId = id;
    document.getElementById('pathToInput').value = zh;
    document.getElementById('pathToResults').innerHTML = '';
  }
}

function runPathfinder(){
  const resultBox = document.getElementById('pathResult');
  if(!pathFromId || !pathToId){
    resultBox.innerHTML = '<div class="path-none">請先從下拉建議中，各自選一個角色。</div>';
    return;
  }
  const path = findPath(pathFromId, pathToId);
  if(!path){
    resultBox.innerHTML = '<div class="path-none">目前收錄的故事裡，這兩位之間還沒有已知的關聯路徑——也許是個值得加進去的新連結？</div>';
    return;
  }
  const chain = path.map(id=>{
    const d = byId[id];
    return `<button class="path-chip" style="--dot-color:${genColor(d.gen)}" onclick="jumpToNode('${id}')">${d.zh}</button>`;
  }).join('<span class="path-chip-arrow">→</span>');
  resultBox.innerHTML = `
    <div class="path-result-chain">${chain}</div>
    <div class="path-degrees">共 ${path.length - 1} 度關聯</div>
  `;
  highlightPath(path);
  closePathfinder();
}

function highlightPath(path){
  document.querySelectorAll('.node').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.edge').forEach(e=>{
    e.classList.remove('edge-active','edge-dim');
    e.classList.add('edge-dim');
  });
  for(let i=0;i<path.length-1;i++){
    const a = path[i], b = path[i+1];
    document.querySelectorAll('.edge').forEach(e=>{
      if((e.dataset.from===a && e.dataset.to===b) || (e.dataset.from===b && e.dataset.to===a)){
        e.classList.remove('edge-dim');
        e.classList.add('edge-active');
        animateEdgeDraw(e);
      }
    });
  }
  path.forEach(id=>{
    const el = document.getElementById('node-'+id);
    if(el) el.classList.add('active');
  });

  const names = path.map(id=>byId[id].zh).join(' → ');
  const banner = document.getElementById('pathBanner');
  document.getElementById('pathBannerText').textContent = `🧭 ${names}`;
  banner.classList.add('show');

  const firstEl = document.getElementById('node-'+path[0]);
  if(firstEl) firstEl.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
}

function clearPathHighlight(){
  document.querySelectorAll('.node').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.edge').forEach(e=>{
    e.classList.remove('edge-active','edge-dim');
  });
  document.getElementById('pathBanner').classList.remove('show');
}
