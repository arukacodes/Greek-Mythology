
const byId = Object.fromEntries(DATA.map(d=>[d.id,d]));

function childrenOf(id){
  return DATA.filter(d => d.parents && d.parents.includes(id));
}

// Extract one memorable keyword/signature phrase for a character (ADHD-friendly memory hook)
function getSignature(d){
  // Use epithet if it's short enough (5 chars or less)
  if(d.epithet && d.epithet.length <= 6) return d.epithet;
  // Otherwise extract first meaningful phrase from story (before the first comma or period)
  const firstClause = d.story.split(/[，。]/)[0];
  if(firstClause && firstClause.length <= 10) return firstClause.replace(/^(祂|他|她|它)是/, '');
  // Fallback: truncate epithet
  return d.epithet ? d.epithet.slice(0, 5) + (d.epithet.length > 5 ? '…' : '') : '';
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
  primordial:261.63, titan:293.66, olympian:329.63, hero:349.23,
  nature:392.00, zodiac:440.00, troy:493.88, mythconcepts:523.25,
  philosophy:587.33, modernphil:659.25, psychology:698.46, arts:783.99, crosscultural:880.00
};

function playSelectSound(gen){
  const base = GEN_NOTES[gen] || 392;
  playTone(base, 0.5, 'triangle', 0.11, 0);
  playTone(base*1.5, 0.4, 'sine', 0.04, 0.03);
}

/* ---------- Sound easter egg: click through every tier in ascending pitch order to play a hidden scale ---------- */
const SCALE_ORDER = Object.keys(GEN_NOTES); // already ascending pitch order: primordial → ... → crosscultural
let scaleProgress = -1;

function checkScaleEasterEgg(gen){
  const idx = SCALE_ORDER.indexOf(gen);
  if(idx === -1) return;
  if(idx === scaleProgress) return; // repeat click within the current tier — harmless, no change
  if(idx === scaleProgress + 1){
    scaleProgress = idx;
  } else if(idx === 0){
    scaleProgress = 0; // restart the sequence from the first tier
  } else {
    scaleProgress = -1; // wrong tier — broken sequence
    return;
  }
  if(scaleProgress === SCALE_ORDER.length - 1){
    setTimeout(playScaleCompleteFanfare, 350);
    scaleProgress = -1;
  }
}

function playScaleCompleteFanfare(){
  if(!soundOn) return;
  // A clean two-octave C-major-pentatonic run, purpose-built for pleasantness —
  // the raw per-tier click pitches (GEN_NOTES) include an F and Ab that break the pentatonic feel and sound "off"
  const fanfareNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
  fanfareNotes.forEach((freq, i)=>{
    playTone(freq, 0.22, 'triangle', 0.09, i * 0.075);
  });
  const chordDelay = fanfareNotes.length * 0.075 + 0.06;
  setTimeout(()=>{
    playTone(1046.50, 1.0, 'sine', 0.11, 0);   // C6
    playTone(1318.51, 1.0, 'sine', 0.08, 0);   // E6
    playTone(1568.00, 1.0, 'sine', 0.07, 0);   // G6
    showMilestoneToast({text:'你彈奏了一段完整的音階——從創世的低音，到跨文化連結的最高音。', author:'🎵 音效彩蛋'});
  }, chordDelay * 1000);
}

function playUnlockChime(){
  playTone(523.25, 0.35, 'triangle', 0.12, 0);
  playTone(659.25, 0.5, 'triangle', 0.12, 0.12);
}

function playEggChime(){
  playTone(659.25, 0.3, 'sine', 0.1, 0);
  playTone(830.61, 0.3, 'sine', 0.09, 0.09);
  playTone(1046.5, 0.45, 'triangle', 0.1, 0.18);
  playTone(1568.0, 0.35, 'sine', 0.06, 0.22);
  playTone(2093.0, 0.3, 'sine', 0.045, 0.27);
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
  if(btn){
    btn.textContent = soundOn ? '🔊' : '🔇';
    btn.classList.toggle('muted', !soundOn);
  }
  if(soundOn) getAudioCtx();
}

const STORAGE_KEY = 'greekMythTree_visited_v1';
let visited = new Set();
try{
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) visited = new Set(JSON.parse(raw));
}catch(e){ /* localStorage unavailable — progress just won't persist */ }

function markVisited(id){
  const isNew = !visited.has(id);
  visited.add(id);
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify([...visited])); }catch(e){}
  const el = document.getElementById('node-'+id);
  if(el) el.classList.add('visited');
  updateProgressCounter();
  if(isNew) checkMilestone(visited.size);
}

function updateProgressCounter(){
  const el = document.getElementById('progressCounter');
  if(!el) return;
  el.textContent = `已探索 ${visited.size} / ${DATA.length}`;
}

const CROSS_TYPE_META = {
  syncretism: {label:'融合', color:'var(--cross-syncretism)'},
  cognate: {label:'同源', color:'var(--cross-cognate)'},
  parallel: {label:'平行', color:'var(--cross-parallel)'},
};

function renderNodes(){
  ['primordial','titan','olympian','hero','nature','zodiac','troy','mythconcepts','philosophy','modernphil','psychology','arts','crosscultural'].forEach(gen=>{
    const row = document.querySelector('.gen-row[data-row="'+gen+'"]');
    DATA.filter(d=>d.gen===gen).forEach((d,i)=>{
      const el = document.createElement('div');
      el.className = 'node' + (visited.has(d.id) ? ' visited' : '');
      el.id = 'node-'+d.id;
      el.setAttribute('data-gen', gen);
      el.style.setProperty('--stagger', (i%10)*45+'ms');
      if(d.isRoman) el.setAttribute('data-roman', 'true');
      const typeMeta = d.crossType ? CROSS_TYPE_META[d.crossType] : null;
      el.innerHTML = `
        <div class="medallion" data-cid="${d.id}"></div>
        <div class="node-name">${d.zh}</div>
        <div class="node-sig">${getSignature(d)}</div>
        <div class="gr">${d.gr}</div>
        ${d.isRoman ? '<span class="roman-badge">羅馬 ROMAN</span>' : ''}
        ${typeMeta ? `<span class="type-badge" style="--badge-color:${typeMeta.color}">${typeMeta.label}</span>` : ''}
      `;
      el.addEventListener('click', ()=>selectNode(d.id));
      row.appendChild(el);
    });
  });
  updateProgressCounter();
}

/* ---------- Constellation medallion: replaces the plain circle with a unique dot-and-line glyph per node ---------- */
function generateConstellationSVG(id, size){
  size = size || 64;
  let seed = 0;
  for(let i=0;i<id.length;i++){ seed = (seed * 31 + id.charCodeAt(i)) % 999983; }
  if(seed <= 0) seed += 999983;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // The 12 zodiac signs get their own traditional/simplified constellation outlines instead of a
  // random humanoid template — these are the one tier that corresponds to real, named star patterns.
  const ZODIAC_SHAPES = {
    aries:       [[0.15,0.60],[0.35,0.45],[0.55,0.35],[0.75,0.40]],
    taurus:      [[0.20,0.25],[0.35,0.55],[0.50,0.42],[0.65,0.55],[0.82,0.22]],
    gemini:      [[0.30,0.15],[0.25,0.40],[0.32,0.65],[0.28,0.90],[0.55,0.85],[0.60,0.60],[0.68,0.35],[0.72,0.12]],
    cancer:      [[0.30,0.80],[0.45,0.55],[0.50,0.25],[0.62,0.50],[0.78,0.75]],
    leo:         [[0.25,0.20],[0.20,0.35],[0.28,0.50],[0.42,0.45],[0.65,0.55],[0.85,0.45],[0.70,0.28]],
    virgo:       [[0.20,0.30],[0.35,0.50],[0.50,0.35],[0.65,0.55],[0.55,0.75],[0.75,0.85]],
    libra:       [[0.25,0.65],[0.42,0.42],[0.50,0.20],[0.58,0.42],[0.75,0.65]],
    scorpio:     [[0.15,0.20],[0.22,0.35],[0.28,0.50],[0.35,0.62],[0.45,0.70],[0.55,0.74],[0.65,0.70],[0.70,0.58],[0.62,0.45]],
    sagittarius: [[0.20,0.70],[0.35,0.50],[0.50,0.30],[0.65,0.45],[0.55,0.60],[0.75,0.55],[0.85,0.35]],
    capricorn:   [[0.15,0.35],[0.45,0.25],[0.85,0.55],[0.50,0.70]],
    aquarius:    [[0.50,0.20],[0.42,0.40],[0.55,0.50],[0.35,0.60],[0.50,0.72],[0.30,0.85]],
    pisces:      [[0.15,0.25],[0.30,0.40],[0.45,0.55],[0.60,0.50],[0.75,0.60],[0.85,0.80]],
  };

  // Hand-designed constellation silhouettes (normalized 0–1, already in stroke order) —
  // evokes real constellation shapes (dipper, zigzag, ring, crown, hook, star) rather than a random scatter
  // Humanoid-figure silhouettes (normalized 0–1, already in stroke order) — head near the top, limbs
  // spreading below, evoking a person/god's pose (à la Orion or Hercules) rather than an abstract shape.
  // Point counts vary per template (6–11) so density differs node to node, not fixed at one number.
  const TEMPLATES = [
    [[0.5,0.12],[0.22,0.32],[0.5,0.50],[0.78,0.32],[0.30,0.90],[0.70,0.90]],                                                              // simple figure, arms out, legs apart (6 pts)
    [[0.5,0.15],[0.75,0.32],[0.62,0.55],[0.85,0.60],[0.50,0.68],[0.30,0.55],[0.18,0.75]],                                                 // seated / enthroned figure (7 pts)
    [[0.5,0.15],[0.32,0.28],[0.20,0.45],[0.42,0.42],[0.58,0.42],[0.80,0.45],[0.68,0.28],[0.5,0.75]],                                      // crouching / compact figure (8 pts)
    [[0.5,0.10],[0.30,0.24],[0.42,0.38],[0.18,0.15],[0.60,0.42],[0.82,0.28],[0.90,0.12],[0.55,0.62],[0.72,0.90],[0.35,0.88]],             // warrior, one arm raised (10 pts)
    [[0.5,0.10],[0.28,0.20],[0.08,0.32],[0.30,0.35],[0.5,0.45],[0.72,0.35],[0.92,0.32],[0.70,0.20],[0.58,0.55],[0.68,0.85],[0.35,0.82]],  // winged / outstretched figure (11 pts)
  ];

  const isZodiac = !!ZODIAC_SHAPES[id];
  const template = isZodiac ? ZODIAC_SHAPES[id] : TEMPLATES[Math.floor(rand() * TEMPLATES.length)];
  const jitterAmt = isZodiac ? 0.02 : 0.06;
  const rotation = isZodiac ? 0 : rand() * Math.PI * 2;
  const scale = isZodiac ? 1.0 : (0.88 + rand() * 0.16);
  const cos = Math.cos(rotation), sin = Math.sin(rotation);
  const margin = size * 0.18;
  const usable = size - margin*2;
  const cx = size/2, cy = size/2;

  const points = template.map(([tx,ty])=>{
    const jx = tx + (rand()-0.5) * jitterAmt;
    const jy = ty + (rand()-0.5) * jitterAmt;
    const px = (jx - 0.5) * usable * scale;
    const py = (jy - 0.5) * usable * scale;
    const rx = px*cos - py*sin;
    const ry = px*sin + py*cos;
    return { x: cx + rx, y: cy + ry, r: 1.3 + rand() * 1.3 };
  });

  let lines = '';
  for(let i=0;i<points.length-1;i++){
    const a = points[i], b = points[i+1];
    lines += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="var(--ring, var(--gold))" stroke-width="1" opacity="0.55"/>`;
  }
  let dots = '';
  points.forEach(p=>{
    dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.r*2.2).toFixed(1)}" fill="var(--ring, var(--gold))" opacity="0.20"/>`;
    dots += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(p.r*0.65).toFixed(1)}" fill="#FFFBEF"/>`;
  });

  return `<svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">${lines}${dots}</svg>`;
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

  // Cross-cultural: syncretism (strong, solid) and cognate (linguistic, dashed) — 'parallel' intentionally gets no edge
  ['syncretism','cognate'].forEach(field=>{
    const edgeClass = field === 'syncretism' ? 'edge-syncretism' : 'edge-cognate';
    DATA.forEach(node=>{
      if(!node[field] || node[field].length===0) return;
      node[field].forEach(targetId=>{
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
        path.setAttribute('class', 'edge ' + edgeClass);
        path.dataset.from = node.id;
        path.dataset.to = targetId;
        svg.appendChild(path);
      });
    });
  });
}

let currentId = null;

function animateEdgeDraw(path){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const len = path.getTotalLength();
  const isDashedType = path.classList.contains('edge-counterpart') || path.classList.contains('edge-zodiac') || path.classList.contains('edge-cognate');
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
  const selfEl = document.getElementById('node-'+id);
  if(selfEl) selfEl.classList.add('active');
  const pathBanner = document.getElementById('pathBanner');
  if(pathBanner){ pathBanner.classList.remove('show'); clearTimeout(pathBannerTimer); }

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
  checkScaleEasterEgg(byId[id].gen);
  renderDetail(id);
  maybeSurfaceQuote();

  const panel = document.getElementById('detailPanel');
  panel.classList.add('open');
}

function closePanel(){
  document.getElementById('detailPanel').classList.remove('open');
}

const CROSS_BANNER_META = {
  syncretism: {icon:'🔗', label:'歷史上真實融合', desc:'兩位神祇在歷史上被正式合併、視為同一位神明的不同面貌，不是後世學者的比附。'},
  cognate: {icon:'🗣️', label:'語言學同源', desc:'名字源自同一個史前詞根，是比較語言學考證出的親緣關係，而非文化互相借用。'},
  parallel: {icon:'⏳', label:'軸心時代平行', desc:'活躍於同一段歷史時期，但目前沒有證據顯示彼此有過直接接觸——純屬時代上的巧合並置。'},
};

// Reciprocal lookup: find all crosscultural nodes that point AT this id via syncretism/cognate/parallel
function crossLinksTo(id){
  const result = {syncretism:[], cognate:[], parallel:[]};
  DATA.forEach(d=>{
    ['syncretism','cognate','parallel'].forEach(field=>{
      if(d[field] && d[field].includes(id) && d.id !== id){
        result[field].push(d.id);
      }
    });
  });
  return result;
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

  // Cross-cultural: the big attention-grabbing banner for nodes that ARE one of these three types
  const crossBanner = d.crossType ? (()=>{
    const meta = CROSS_BANNER_META[d.crossType];
    const targets = (d[d.crossType]||[]).map(tid=>byId[tid]).filter(Boolean);
    const targetNames = targets.map(t=>t.zh).join('、');
    return `
      <div class="cross-banner cross-banner-${d.crossType}">
        <span class="cross-icon">${meta.icon}</span>
        <div>
          <div class="cross-label">${meta.label}${targetNames ? ' · 對應 ' + targetNames : ''}</div>
          <div class="cross-desc">${meta.desc}</div>
        </div>
      </div>
      <div class="cross-links-row">${targets.map(t=>`<button class="cross-chip" style="--chip-color:${CROSS_TYPE_META[d.crossType].color}" onclick="jumpToNode('${t.id}')">${t.zh} ${t.gr}</button>`).join('')}</div>
    `;
  })() : '';

  // Reciprocal: for Greek-side nodes (e.g. Zeus, Hermes, Socrates) that RECEIVE cross-cultural connections
  const incoming = crossLinksTo(id);
  const incomingRows = ['syncretism','cognate','parallel'].map(field=>{
    if(!incoming[field].length) return '';
    const meta = CROSS_BANNER_META[field];
    const chips = incoming[field].map(tid=>{
      const t = byId[tid];
      return `<button class="cross-chip" style="--chip-color:${CROSS_TYPE_META[field].color}" onclick="jumpToNode('${tid}')">${meta.icon} ${t.zh} ${t.gr}</button>`;
    }).join('');
    return `
      <div class="detail-section-title">${meta.label}</div>
      <div class="cross-links-row">${chips}</div>
    `;
  }).join('');

  const storyParts = d.story.split('。');
  const storyHook = storyParts[0] ? storyParts[0] + '。' : d.story;
  const storyRest = storyParts.slice(1).join('。');

  content.innerHTML = `
    <div class="detail-header">
      <div class="detail-medallion" style="--ring:var(--${d.gen})">${generateConstellationSVG(d.id, 48)}</div>
      <div class="detail-title">
        <h2>${d.zh}</h2>
        <div class="gr-name">${d.gr} · 羅馬名：${d.roman}</div>
      </div>
    </div>
    <div class="detail-epithet">「${d.epithet}」</div>
    ${crossBanner}
    <div class="detail-tags">
      <span class="tag">領域：${d.domain}</span>
      <span class="tag">象徵：${d.symbol}</span>
    </div>
    <div class="detail-story"><span class="story-hook">${storyHook}</span>${storyRest}</div>
    ${d.diagram ? `<div class="concept-diagram">${d.diagram}<div class="diagram-caption">💡 概念圖解</div></div>` : ''}
    <button class="read-story-btn" id="storyToggleBtn" onclick="toggleStory('${d.id}')">📜 閱讀完整神話故事</button>
    <div class="full-story-box" id="fullStoryBox"></div>
    <div class="astro-box">
      <span class="astro-icon">🔭</span>
      <div class="astro-text"><span class="astro-label">在夜空中</span>${d.astro || '目前尚無明確對應的天體命名。'}</div>
    </div>
    ${NODE_EGG_LOOKUP[id] ? `<div class="egg-seal-wrap"><button class="egg-seal" onclick="jumpToEggFromNode('${id}')" title="這裡藏著 ${NODE_EGG_LOOKUP[id].length} 條關於${d.zh}的塵封軼聞" aria-label="查看關於${d.zh}的塵封軼聞">🧩</button></div>` : ''}
    <div class="detail-section-title">父母</div>
    <div class="link-row">${parentsChips}</div>
    <div class="detail-section-title">子嗣 / 後代</div>
    <div class="link-row">${kidsChips}</div>
    ${counterpartRow}
    ${linksRow}
    ${incomingRows}
  `;
}

/* ---------- Philosophical Choices: interactive dilemmas linking back to real thinkers in the tree ---------- */
const PHILO_DILEMMAS = [
  {
    q:'一輛失控電車即將撞死五個人，你可以拉下拉桿讓電車轉向，但這樣會撞死另一名原本安全的路人。你會怎麼做？',
    options:[
      {label:'拉下拉桿，犧牲一人救五人', reveal:'singer', text:'這接近效益主義的計算邏輯——彼得・辛格主張，道德判斷應以「整體痛苦與幸福的總量」為依歸，救五人比救一人，帶來更大的整體福祉。'},
      {label:'不拉拉桿，讓電車照原路撞向五人', reveal:'laozi', text:'這呼應了老子「無為」的精神——不主動介入、不讓自己的手沾上原本不屬於自己的因果，順應事物本有的走向，而非強行插手改變命運。'}
    ]
  },
  {
    q:'如果可以無限次、一字不差地重複過完全相同的一生——包括所有的痛苦與遺憾——你會願意嗎？',
    options:[
      {label:'願意，我會對這一生說「是」', reveal:'nietzsche', text:'這正是尼采「永恆輪迴」的思想實驗——他認為，唯有真正熱愛自己生命的人，才敢於對這樣的重複坦然說「是」，這是他衡量一個人是否肯定生命的終極尺度。'},
      {label:'不願意，人生的痛苦不值得重複', reveal:'schopenhauer', text:'這呼應了叔本華的悲觀哲學——他認為人生本質是一場在痛苦與無聊之間擺盪的鐘擺，短暫的滿足只會迅速讓位給新的空虛，重複只會讓這場擺盪加倍。'}
    ]
  },
  {
    q:'假設你要為一個全新的社會設計規則，但你不知道自己出生後會是富人還是窮人、健康還是殘疾、屬於多數還是少數群體，你會怎麼設計？',
    options:[
      {label:'我會設計出對最弱勢者最有利的制度，因為我可能就是那個人', reveal:'rawls', text:'你剛剛親自完成了羅爾斯著名的「無知之幕」思想實驗——他主張，唯有在不知道自己會落在社會哪個位置的前提下所做出的選擇，才是真正公平的正義原則。'},
      {label:'我會建立一套重視倫理教化與角色責任的秩序，而非強求齊頭式的平等', reveal:'confucius', text:'這更接近孔子的社會秩序觀——他主張社會的和諧，來自每個人在自己的角色（君臣、父子、朋友）裡盡到應有的倫理責任，而不是先假定一套抽象、脫離具體關係的平等規則。'}
    ]
  },
  {
    q:'一艘船的木板被逐一替換，最終全船的木板都換過一輪——這還是原來的那艘船嗎？',
    options:[
      {label:'不是了，構成船的物質已經完全不同', reveal:'zhuangzi', text:'這呼應了莊子「萬物皆流、齊物」的世界觀——執著於「這個東西是不是原本那個東西」，某種程度上正是一種尚未看透萬物本無固定自性的執念。'},
      {label:'還是同一艘船，重要的是設計與功能的延續', reveal:'aristotle', text:'這接近亞里斯多德的「形式因」概念——他認為一件事物的本質，在於它的形式與目的，而非構成它的具體物質，物質可以替換，形式的延續才是同一性的關鍵。'}
    ]
  },
  {
    q:'有一台機器，只要接上它，就能讓你體驗到完美、真實無比的快樂人生，但那全部都是虛擬模擬出來的。你會願意接上去、從此不再拔下來嗎？',
    options:[
      {label:'願意，快樂本身就是人生最高的善', reveal:'epicureanism', text:'這接近伊比鳩魯學派的立場——他們主張，快樂（尤其是免於痛苦與恐懼的心靈寧靜）本身就是人生追求的終極目標，若機器真能提供這一切，又何必拒絕？'},
      {label:'不願意，就算痛苦，我也想要真實的人生', reveal:'sartre', text:'這呼應了沙特的存在主義立場——人的尊嚴在於自由地選擇、並為自己的選擇負責，一個被機器預先寫定的「假人生」，即使快樂，也剝奪了真正屬於你自己的自由。'}
    ]
  },
  {
    q:'如果能選擇，你想活在一個舒適、卻虛假的幻覺裡，還是走出去，面對可能令人不安的真相？',
    options:[
      {label:'我想知道真相，即使它令人不安', reveal:'republic', text:'這正是柏拉圖《理想國》裡著名的「洞穴寓言」——他認為，哲學家的責任正是掙脫束縛、走出洞穴，即便洞外的陽光起初刺眼難耐，也好過一輩子盯著牆上的影子。'},
      {label:'若真相只帶來不必要的痛苦，舒適的心靈平靜也未必是壞事', reveal:'epicureanism', text:'這接近伊比鳩魯學派的立場——他們認為，人生追求的終極目標是心靈的寧靜安穩（ataraxia），若揭露真相除了帶來焦慮與不安、並不能實質改善處境，執意追求未必真的比較明智。'}
    ]
  },
  {
    q:'突然收到一個你完全無法改變、也無法挽回的壞消息，你的第一反應通常是什麼？',
    options:[
      {label:'先花時間憤怒、抗拒，接受需要過程', reveal:'camus', text:'這接近卡繆式的態度——他主張真正誠實面對「荒謬」，不該是壓抑情緒、假裝雲淡風輕，而是先如實承認世界的不合理與自己的憤怒，才談得上後續「即便如此，仍要選擇繼續前行」。'},
      {label:'盡快接受，把心力放回自己還能控制的事情上', reveal:'stoicism', text:'這正是斯多葛學派的核心主張——區分「操之在我者」與「操之不在我者」，把注意力收回到自己真正能掌控的事物上，是斯多葛式心靈平靜的起點。'}
    ]
  },
  {
    q:'如果你此刻正在做一場極其真實的夢，夢裡的你完全感覺不出任何破綻——這件事，重要嗎？',
    options:[
      {label:'不重要，只要我此刻的感知是完整而真實的', reveal:'wangyangming', text:'這呼應了王陽明「心外無物」的立場——他主張「你未看此花時，此花與汝心同歸於寂」，事物的存在，本就與你的心念、感知緊密相繫，「是否為夢」的區分，也許本身就不是最核心的問題。'},
      {label:'重要，我仍然想知道自己所處的到底是不是真實世界', reveal:'skepticism', text:'這接近懷疑學派的態度——面對無法徹底證實或證偽的命題，最誠實的立場，是承認自己的不確定，並持續懸置判斷，而不是輕易接受一個無法驗證的答案。'}
    ]
  },
  {
    q:'如果堅持自己認為正確的信念，會為你招致社會嚴厲的懲罰甚至死刑，你會選擇妥協求生，還是堅持到底？',
    options:[
      {label:'我會堅持自己的信念，即使代價是生命', reveal:'socrates', text:'這正是蘇格拉底本人的真實選擇——被雅典法庭判處死刑後，朋友曾提議賄賂獄卒助他越獄，他卻拒絕了，堅持自己一貫教導的「遵守城邦法律」的原則，飲下毒酒，慷慨赴死。'},
      {label:'我會暫時妥協、保全自己，把信念留待更合適的時機再實踐', reveal:'sophism', text:'這接近智者學派的實踐智慧——他們強調因時因地制宜，不盲目堅持抽象原則，保全自身、留待來日，某種程度上也是一種理性的選擇，不必然遜於堅持到底的悲壯。'}
    ]
  },
  {
    q:'你會選擇當一頭什麼都不缺、終日滿足的豬，還是一個時常懷疑、時常不滿足、卻始終清醒思考的人？',
    options:[
      {label:'寧可做一個清醒卻不滿足的人', reveal:'aristotle', text:'這呼應了亞里斯多德的幸福觀——他認為真正的幸福（eudaimonia）必須來自理性能力的充分實踐，單純的感官滿足，稱不上是人類獨有、也最值得追求的美好生活。'},
      {label:'簡單而免於恐懼與痛苦的快樂，才是人生真正該追求的', reveal:'epicureanism', text:'這接近伊比鳩魯學派的立場——他們主張，人生最值得追求的，是免於身體痛苦、心靈不受紛擾的簡單快樂，過度複雜的慾望與焦慮，反而是幸福的敵人。'}
    ]
  },
  {
    q:'如果你發現自己的一生早已被命運寫定，你還會盡全力去努力嗎？',
    options:[
      {label:'會，盡好自己該做的責任，無論結果是否早已註定', reveal:'stoicism', text:'斯多葛學派有句名言：「命運領著願意的人走，拖著不願意的人走。」他們主張，無論命運如何，人依然該盡好自己份內的德行與責任，這正是人唯一能真正掌握的部分。'},
      {label:'不會，如果一切早已寫定，人真正的自由意志又在哪裡？', reveal:'sartre', text:'這呼應了沙特的存在主義立場——他主張人沒有任何預先寫定的本質，人「被判決要自由」，每一個選擇都真實地由自己承擔，若接受命運已定，某種程度上正是放棄了做人最根本的自由與責任。'}
    ]
  },
  {
    q:'一個人明明知道某件事是錯的，卻依然去做了——你會怎麼理解這種情況？',
    options:[
      {label:'他其實並沒有真正「知道」，若真正認清善，不可能明知故犯', reveal:'socrates', text:'這是蘇格拉底著名的「德性即知識」主張——他認為，人不會明知故犯地選擇對自己不利的惡，一個人做出惡行，只可能是因為他對「善」的認識，其實還不夠透徹。'},
      {label:'知道歸知道，能不能真正做到，是完全另一回事', reveal:'anscombe', text:'這接近安斯庫姆在《意圖》一書裡的分析——她主張，意圖必須透過它實際導致的具體行動來理解，一個從未化為行動的「知道」，某種意義上，可能根本稱不上是完整的知道。'}
    ]
  },
  {
    q:'美，是獨立於任何人感受、客觀存在的一種性質，還是純粹因人而異的主觀感受？',
    options:[
      {label:'美是客觀存在的，只是有些人尚未領悟到它', reveal:'plato', text:'這呼應了柏拉圖的理型論——他主張，世間一切美麗的事物，都只是分享了「美」這個永恆不變、獨立於任何個人感受而客觀存在的理型，我們對美的感受，只是對這個理型微弱的體會。'},
      {label:'美離不開觀看者當下的情感與處境，無法脫離主觀經驗單獨存在', reveal:'nussbaum', text:'這接近納思邦對情感哲學的主張——她認為，情感（包括對美的感受）並非理性的對立面，而是一種判斷的形式，深深嵌在觀看者具體的處境與生命經驗之中，無法被抽離成一套純粹客觀的規則。'}
    ]
  },
  {
    q:'面對陌生人與至親家人同樣程度的苦難，你認為自己該給予同等程度的關懷嗎？',
    options:[
      {label:'該的，每個人的痛苦都同樣值得被認真考量，不因親疏而打折扣', reveal:'singer', text:'這正是彼得・辛格效益主義式的立場——他主張，道德考量應以「痛苦與幸福的總量」為依歸，一個陌生人的痛苦，不該僅僅因為距離遙遠或彼此不熟識，就被賦予比較低的道德權重。'},
      {label:'不必，親疏遠近本就該有不同程度的責任與付出', reveal:'confucius', text:'這呼應了儒家「愛有差等」的倫理觀——孔子主張，人倫關係本有親疏遠近之別，對父母、對朋友、對陌生人付出不同程度的關懷與責任，並非道德上的缺陷，而是人倫秩序本該如此的樣貌。'}
    ]
  },
  {
    q:'面對任何一個看似理所當然的常識，你會傾向懸置判斷、保持懷疑，還是相信自己的日常經驗大致可靠？',
    options:[
      {label:'我會盡量懸置判斷，任何命題都可能找到力量相當的反駁', reveal:'skepticism', text:'這正是懷疑學派的核心方法——他們主張，針對任何一個命題，系統性地尋找出力量相當的反面論證，才能真正擺脫武斷信念帶來的焦慮，獲得心靈的寧靜。'},
      {label:'我還是相信自己的日常經驗與常識，大致值得信賴', reveal:'aristotle', text:'這接近亞里斯多德重視經驗觀察的精神——他不像老師柏拉圖那樣，把終極真理寄託在抽象的理型世界裡，而是主張，仔細觀察與歸納這個具體世界裡的現象，本身就是通往知識可靠的起點。'}
    ]
  },
  {
    q:'面對善惡交織、是非難辨的複雜處境，你會傾向向內尋求自己的覺悟，還是主動選擇站在你認定光明的一方、與黑暗對抗？',
    options:[
      {label:'向內尋求自己的覺悟，答案本就不假外求', reveal:'buddha', text:'這呼應了佛陀的教導——他主張，苦難的根源與解脫之道，都在於個人內在的覺悟與修行，而非向外尋求某個終極的善惡仲裁者，真正的清明，來自向內看見自己心念的實相。'},
      {label:'主動選擇立場，善惡的對抗需要每個人親自參與', reveal:'zoroaster', text:'這接近瑣羅亞斯德教的宇宙觀——他們主張，光明神阿胡拉・馬茲達與黑暗神安格拉・曼紐永恆對抗，每個人的每一個選擇，都是這場宇宙級善惡鬥爭裡，微小卻真實的一份參與。'}
    ]
  },
  {
    q:'如果能複製出一個記憶、感受、性格都與你一模一樣的副本，原本的你與這個複製人，誰才是「真正的你」？',
    options:[
      {label:'這個問題本身或許沒有意義，因為根本沒有一個永恆不變的「真正自我」可言', reveal:'buddha', text:'這呼應了佛教「無我」的教義——依照這套思想，我們終其一生執著追尋的那個固定不變的「自我」，本來就是一種錯覺，追問「哪一個才是真正的我」，某種程度上是從一個錯誤的預設出發。'},
      {label:'這個問題本身沒有答案，因為我們可能問錯了問題', reveal:'wittgenstein', text:'這接近維根斯坦後期哲學的態度——他認為，許多哲學上看似深刻的難題，其實源自我們誤用了日常語言的方式，「哪一個才是真正的你」這個提問本身的語言邏輯，或許才是真正該被檢視的地方。'}
    ]
  }
];
let philoIndex = 0;

function openPhilo(){
  philoIndex = Math.floor(Math.random() * PHILO_DILEMMAS.length);
  renderPhilo();
  document.getElementById('philoOverlay').classList.add('open');
}
function closePhilo(){
  document.getElementById('philoOverlay').classList.remove('open');
}
function renderPhilo(){
  const d = PHILO_DILEMMAS[philoIndex];
  document.getElementById('philoContent').innerHTML = `
    <p class="philo-question">${d.q}</p>
    <div class="philo-options">
      ${d.options.map((o,i)=>`<button class="philo-opt-btn" onclick="choosePhilo(${i})">${o.label}</button>`).join('')}
    </div>
  `;
}
function choosePhilo(i){
  const d = PHILO_DILEMMAS[philoIndex];
  const o = d.options[i];
  const person = byId[o.reveal];
  document.getElementById('philoContent').innerHTML = `
    <p class="philo-question philo-question-dim">${d.q}</p>
    <div class="philo-reveal">
      <p class="philo-reveal-label">你的選擇，呼應了——</p>
      <p class="philo-reveal-name">${person ? person.zh : ''}</p>
      <p class="philo-reveal-text">${o.text}</p>
      <div class="philo-reveal-actions">
        ${person ? `<button class="philo-jump-btn" onclick="closePhilo(); jumpToNode('${o.reveal}');">前往認識 ${person.zh} →</button>` : ''}
        <button class="philo-next-btn" onclick="nextPhilo()">下一題 →</button>
      </div>
    </div>
  `;
}
function nextPhilo(){
  philoIndex = (philoIndex + 1) % PHILO_DILEMMAS.length;
  renderPhilo();
}

function jumpToNode(id){
  const el = document.getElementById('node-'+id);
  if(el) el.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
  selectNode(id);
}

const LEGEND_COLLAPSE_KEY = 'greekMythTree_legendCollapsed_v1';
function toggleLegend(){
  const legend = document.getElementById('legend');
  const arrow = document.getElementById('legendToggleArrow');
  const label = document.getElementById('legendToggleLabel');
  const isCollapsed = legend.classList.toggle('collapsed');
  arrow.style.transform = isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)';
  label.textContent = isCollapsed ? '展開分支導覽 Expand' : '收起分支導覽 Collapse';
  try{ localStorage.setItem(LEGEND_COLLAPSE_KEY, isCollapsed ? '1' : '0'); }catch(e){}
}
(function initLegendState(){
  let collapsed = false;
  try{ collapsed = localStorage.getItem(LEGEND_COLLAPSE_KEY) === '1'; }catch(e){}
  if(collapsed){
    const legend = document.getElementById('legend');
    const arrow = document.getElementById('legendToggleArrow');
    const label = document.getElementById('legendToggleLabel');
    if(legend) legend.classList.add('collapsed');
    if(arrow) arrow.style.transform = 'rotate(-90deg)';
    if(label) label.textContent = '展開分支導覽 Expand';
  }
})();

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

function fillMedallion(node){
  const m = node.querySelector('.medallion[data-cid]');
  if(!m) return;
  const id = m.getAttribute('data-cid');
  m.innerHTML = generateConstellationSVG(id, 64);
  m.removeAttribute('data-cid');
}

function setupRevealObserver(){
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.querySelectorAll('.node').forEach(n=>{ n.classList.add('revealed'); fillMedallion(n); });
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('revealed');
        fillMedallion(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, {threshold:0.15, rootMargin:'200px 0px 200px 0px'});
  document.querySelectorAll('.node').forEach(n=>io.observe(n));
}

const GEN_META = [
  {id:'primordial', label:'創世 · 原初神', color:'#3B2E42'},
  {id:'titan', label:'泰坦神族', color:'#6B4A2F'},
  {id:'olympian', label:'奧林帕斯神族', color:'#1F4959'},
  {id:'hero', label:'凡人與命運', color:'#B5502E'},
  {id:'nature', label:'自然精靈與山林諸神', color:'#4B6B3A'},
  {id:'zodiac', label:'黃道十二宮', color:'#3D3A6B'},
  {id:'troy', label:'特洛伊戰爭與奧德賽', color:'#6B2E3A'},
  {id:'mythconcepts', label:'神話衍生的現代概念', color:'#8A6D1F'},
  {id:'philosophy', label:'古典哲學', color:'#5B5850'},
  {id:'modernphil', label:'現代哲學', color:'#43575C'},
  {id:'psychology', label:'現代心理學', color:'#6B3F6B'},
  {id:'arts', label:'藝術與文學的回聲', color:'#8A4A5C'},
  {id:'crosscultural', label:'跨文化連結', color:'#9C6B3E'},
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
function setupHeaderAnimPause(){
  const h1 = document.querySelector('header h1');
  if(!h1 || !('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      h1.classList.toggle('anim-paused', !entry.isIntersecting);
    });
  }, {threshold:0});
  io.observe(h1);
}

setupRevealObserver();
setupHeaderAnimPause();
setupProgressRail();
(function initSoundButton(){
  const btn = document.getElementById('soundToggle');
  if(btn){
    btn.textContent = soundOn ? '🔊' : '🔇';
    btn.classList.toggle('muted', !soundOn);
  }
})();
window.addEventListener('load', ()=>{
  drawConnections();
  setTimeout(drawConnections, 150);
});

// drawConnections rebuilds every edge (getBoundingClientRect × 2 per edge) — with 148 nodes
// that's expensive, and scroll/resize can fire dozens of times per second on touch devices.
// Throttle to at most once per animation frame so scrolling stays smooth.
let drawConnectionsRafPending = false;
function requestDrawConnections(){
  if(drawConnectionsRafPending) return;
  drawConnectionsRafPending = true;
  requestAnimationFrame(()=>{
    drawConnections();
    drawConnectionsRafPending = false;
  });
}
window.addEventListener('resize', requestDrawConnections);
document.getElementById('treeWrap').addEventListener('scroll', requestDrawConnections, {passive:true});
if(document.fonts && document.fonts.ready){
  document.fonts.ready.then(drawConnections);
}

function scrollToTop(){
  window.scrollTo({top:0, behavior:'smooth'});
}
window.addEventListener('scroll', ()=>{
  const fab = document.getElementById('backToTopFab');
  if(fab) fab.classList.toggle('visible', window.scrollY > 400);
}, {passive:true});

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
  {icon:'🧊', text:'佛洛伊德說意識只是冰山一角——這個比喻後來被畫進了無數教科書。'},
  {icon:'🎭', text:'尼采的「上帝已死」常被誤解成慶祝的宣言，其實他是在憂心忡忡地發出警告。'},
  {icon:'👁️', text:'傅柯說的「圓形監獄」，靈感來自十八世紀一種真實存在的監獄建築設計。'},
  {icon:'🎁', text:'羅爾斯設計了一個思想實驗：如果投胎前不知道自己會是誰，你會希望社會怎麼運作？'},
  {icon:'🌐', text:'宙斯、印度的提烏斯神、北歐的提爾，名字其實共享同一個史前語言詞根。'},
  {icon:'🏛️', text:'蘇格拉底和孔子幾乎活在同一個時代，卻完全不知道彼此的存在。'},
  {icon:'🏺', text:'塞拉皮斯這位神，是被一位國王親自下令「設計」出來的，不是自然演變的信仰。'},
  {icon:'🍎', text:'彼得·辛格用一個溺水兒童的假設問題，逼你直視自己捐款時的雙重標準。'},
  {icon:'♑', text:'地球的「南迴歸線」（Tropic of Capricorn）之所以叫這個名字，是因為古代冬至太陽曾一度運行到摩羯座的範圍內。'},
  {icon:'🌋', text:'金星表面最大的高地地形，就叫「阿芙蘿黛蒂高地」。'},
  {icon:'♅', text:'天王星是太陽系八大行星中，唯一保留希臘語名稱、而非羅馬名稱的行星。'},
  {icon:'🐴', text:'「半人馬」在天文學上真的是一整類小天體的名字，第一顆被發現的甚至直接叫「凱隆」。'},
  {icon:'🌊', text:'「在斯庫拉與卡律布狄斯之間」（進退兩難）這句成語，直接來自奧德修斯必須抉擇的那道海峽。'},
  {icon:'☿️', text:'水星是太陽系裡跑最快的行星——剛好呼應祂的名字荷米斯，本來就是神界的飛毛腿信使。'},
  {icon:'🏝️', text:'土星有一顆衛星叫「卡呂普索」，恰好呼應神話裡那位把奧德修斯困住七年的島嶼仙女。'},
  {icon:'🌌', text:'伊比鳩魯在兩千三百年前，就大膽提出宇宙中存在無數個世界——比人類發現系外行星早了兩千多年。'},
  {icon:'🪜', text:'維根斯坦說，讀完他的書之後，應該把整本書當成一把梯子，爬上去之後就該踢開。'},
  {icon:'⚗️', text:'牛頓晚年其實花了大量時間鑽研煉金術文獻，其中不少正是託名「赫米斯」所寫的祕傳文獻。'},
  {icon:'💍', text:'沙特和波伏娃維持了長達五十年、拒絕傳統婚姻形式的開放式伴侶關係。'},
  {icon:'🌙', text:'月球上有一座「希帕提亞坑」，紀念這位在亞歷山大城被暴民殺害的女哲學家。'},
  {icon:'📖', text:'維根斯坦晚年最重要的著作，是靠他的學生安斯庫姆親自翻譯成英文，才得以流傳於世。'},
  {icon:'✍️', text:'瑪麗・沃斯通克拉夫特的女兒，就是寫出《科學怪人》的瑪麗・雪萊。'},
  {icon:'⚖️', text:'納思邦提出的「能力取徑」，後來真的被聯合國拿去設計「人類發展指數」。'},
  {icon:'🐺', text:'北歐戰神提爾和宙斯一樣，都在自己的神系裡被更年輕的神奪走了風頭——一個被奧丁取代，一個被因陀羅取代。'},
  {icon:'🏛️', text:'羅馬皇帝馬可・奧理略，同時也是一位真正的斯多葛派哲學家，寫下了《沉思錄》。'},
  {icon:'🦋', text:'莊子「莊周夢蝶」探討的問題，跟兩千多年後貝克萊提出的「存在即是被感知」如出一轍。'},
  {icon:'🎭', text:'維根斯坦說，哲學不是一套理論，而是一種活動。'},
  {icon:'🕯️', text:'瑣羅亞斯德教「善思、善言、善行」的教義，據信間接影響了後來猶太教與基督教對善惡的想像。'},
  {icon:'🌊', text:'赫拉克利特斯說，人不能兩次踏入同一條河流——因為河水一直在流動，你也一直在改變。'},
  {icon:'🎋', text:'王陽明「格竹」格到生病，這場失敗的實驗，反而成了他日後「心即理」思想的起點。'},
  {icon:'🌳', text:'斯里蘭卡有一棵佛陀證悟時那株菩提樹的分枝後代，種於西元前288年，是全世界有明確種植紀錄、至今仍存活的最古老的一棵樹。'},
  {icon:'🐔', text:'柏拉圖把人定義成「沒有羽毛的兩條腿動物」，第歐根尼聽了直接拔光一隻雞的毛，扔進他的學院說：「這就是柏拉圖說的人！」'},
  {icon:'🪣', text:'第歐根尼原本擁有的財產，只剩一個木碗——直到他看見一個小孩直接用手捧水喝，當場就把碗也扔了。'},
  {icon:'☔', text:'蘇格拉底的妻子贊西佩以脾氣暴躁出名，據說有次朝他潑了一盆水，蘇格拉底只淡淡回了一句：「打雷之後，常常下雨。」'},
  {icon:'🥁', text:'莊子的妻子過世時，朋友惠施前去弔唁，卻發現莊子正一邊敲著瓦盆一邊唱歌——他說，生死不過是像四季更替一樣自然的變化。'},
  {icon:'🫘', text:'畢達哥拉斯學派有一條最出名、也最詭異的戒律：絕對不能吃豆子——兩千多年來，沒人真正搞清楚原因。'},
  {icon:'⚡', text:'斯多葛學派創始人芝諾曾抓到一個偷東西的奴隸，奴隸辯解說「命中注定我要偷」，芝諾回他：「那命中也注定你要挨打。」'},
  {icon:'🔥', text:'維根斯坦有一次跟哲學家波普爾激烈爭論，據說氣得揮舞壁爐撥火棍——這場「撥火棍事件」後來成了二十世紀哲學史上最出名的八卦之一。'},
  {icon:'⛓️', text:'蘇格拉底被判死刑當天，朋友克力同曾提議賄賂獄卒幫他越獄逃走，蘇格拉底拒絕了，堅持要遵守自己一直教導別人該遵守的法律。'},
  {icon:'🏺', text:'考古學家施里曼在特洛伊遺址挖出一批黃金文物，興奮宣稱是「普里阿摩斯的財富」——後來考證，這批寶藏的年代其實比特洛伊戰爭傳說早了近一千年。'},
  {icon:'🩺', text:'現代肝病學裡真的有個醫學名詞叫「美杜莎頭」，指肝硬化病人腹部靜脈曲張、呈放射狀擴散的樣子，因為長得像她的蛇髮。'},
  {icon:'🛰️', text:'愛神厄洛斯的名字被用在小行星433 Eros上——2001年，NASA的探測船真的降落在這顆「愛神星」表面，是人類史上第一次登陸小行星。'},
  {icon:'🪨', text:'NASA有一項真實任務叫「OSIRIS-REx」，專門飛去小行星貝努取樣，2023年成功把樣本送回地球——任務名稱直接借用了歐西里斯的名字。'},
  {icon:'♐', text:'人馬座常被誤以為就是凱隆——但在古希臘傳統裡，凱隆的形象其實對應的是另一個星座「半人馬座」，人馬座通常被認為是另一位比較粗野的半人馬克羅托斯。'},
  {icon:'🌌', text:'木星有一顆內環小衛星就叫「墨提斯」，是木星所有已知衛星裡公轉速度最快的之一——某種程度上，倒是很符合她「機敏迅捷」的智慧女神形象。'},
  {icon:'🔥', text:'古代奧林匹亞運動會期間，賀斯提亞的祭壇上確實整年供著一把不滅聖火——但現代奧運會那種「聖火傳遞跑者接力」的儀式，其實是1936年柏林奧運才發明的現代創舉，不是古代傳統本身。'},
  {icon:'🌗', text:'土星有兩顆衛星「厄庇墨透斯」與「亞努斯」，軌道近到誇張——它們每隔四年就會互換軌道位置，是太陽系裡唯一已知會這樣「輪流交換車道」的天體。'},
  {icon:'👑', text:'北冕座這個星座，據說正是酒神戴歐尼修斯將亞莉阿德妮的黃金冠冕擲上夜空所化成的。'},
  {icon:'🎫', text:'卡繆1960年車禍身亡時，口袋裡還放著一張沒有使用的火車票——他原本計畫搭火車，卻在最後一刻改搭朋友的車。'},
  {icon:'💰', text:'維根斯坦出身奧地利首富家族之一，卻在一戰後把自己繼承的龐大財產，全數分給了本來就已經很富有的兄姊，自己選擇過近乎清貧的生活。'},
  {icon:'🎖️', text:'安斯庫姆懷孕挺著大肚子，親自站上牛津街頭抗議校方要頒榮譽學位給下令投擲原子彈的杜魯門總統。'},
  {icon:'⚰️', text:'沙特與波伏娃這對維持了五十年開放式關係的伴侶，最終被安葬在巴黎蒙帕納斯墓園的同一座墓裡。'},
  {icon:'💣', text:'羅爾斯二戰時曾在太平洋戰場當步兵，戰後不久便隨部隊行經廣島——這段經歷，據信深刻影響了他後來對正義與道德責任的思考。'},
  {icon:'❓', text:'戴奧提瑪這位啟發蘇格拉底「愛之階梯」理論的女祭司，從未出現在任何其他古代文獻裡——她很可能，根本是柏拉圖虛構出來的角色。'},
  {icon:'🦶', text:'斯多葛學派創始人芝諾的死法很特別——傳說他在校園裡跌了一跤、傷到腳趾，當場認定這是諸神示意他該離開人世的信號，索性就地停止呼吸而死。'},
  {icon:'📛', text:'「柏拉圖」其實不是本名，而是「寬闊」的意思——據傳統說法，是因為他肩膀（或額頭）特別寬，這個綽號就這樣蓋過了他的本名亞里斯托克勒斯，流傳至今。'},
  {icon:'👃', text:'依照古代文獻的描述，蘇格拉底長相並不出眾——塌鼻子、眼睛外凸，出身是一位石匠，年輕時也做過同樣的行當，後來才轉向哲學。'},
  {icon:'🤕', text:'尼采一輩子飽受嚴重偏頭痛與視力問題所苦，寫作時常常只能忍痛工作幾分鐘、閉眼休息片刻，再繼續寫幾分鐘。'},
  {icon:'🐩', text:'叔本華養了一隻貴賓犬，取名叫「阿特瑪」——借用印度教與佛教裡「宇宙靈魂」的概念命名，據說他常常對著這隻狗自言自語。'},
  {icon:'👀', text:'沙特身材矮小、還有嚴重的鬥雞眼，終其一生對自己的外貌相當自卑。'},
  {icon:'📓', text:'馬可・奧理略的《沉思錄》，其實是他寫給自己看的私人筆記，本來根本沒打算發表——後世讀到的，是一位羅馬皇帝完全沒設防、寫給自己的內心獨白。'},
  {icon:'🚶', text:'孔子早年喪父、家境清貧，中年後帶著弟子周遊列國十四年，四處向各國君主推銷自己的治國理念，卻始終沒能獲得一個真正穩定的官職。'},
  {icon:'🐢', text:'莊子曾拒絕楚王請他出任高官的邀請，回絕的理由是：與其當一隻死後被供在廟堂裡的神龜殼，他寧可當一隻在泥巴裡拖著尾巴自由爬行的活烏龜。'},
  {icon:'🤒', text:'王陽明被貶謫到偏遠的龍場時，隨行的僕人接連病倒，他自己也身染瘴氣、生活極其艱苦，卻仍親自燒水煮飯、照料病重的僕人——「龍場悟道」正是在這樣的處境裡發生的。'},
  {icon:'👓', text:'喬伊斯一生飽受眼疾折磨，動過多達十幾次眼科手術，晚年寫《芬尼根守靈夜》時視力已經非常微弱；他同時也是出了名地不擅理財，一輩子向朋友與贊助人借錢度日。'},
  {icon:'💉', text:'佛洛伊德早年曾熱情地把古柯鹼當成萬靈丹大力推廣，甚至寫論文讚揚它的療效，多年後才意識到成癮的危險；他晚年罹患口腔癌，卻依然每天堅持抽二十支雪茄，直到病逝前都沒有戒掉。'},
  {icon:'⏱️', text:'拉岡執業晚期，常常把原本該有一小時的診療時間，隨心情縮短到只有幾分鐘，卻照樣收取全額費用——這個爭議做法，最終導致他被國際精神分析協會除名。'},
  {icon:'⚽', text:'卡繆年輕時是阿爾及爾一支球隊的守門員，直到肺結核發作才結束了他的足球生涯。'},
  {icon:'💍', text:'古代文獻記載，亞里斯多德說話帶點口齒不清，卻意外是個講究穿著的人，喜歡戴戒指、留意髮型，跟後世對「哲學家」不修邊幅的刻板印象完全相反。'},
  {icon:'📕', text:'榮格晚年私下記錄自己夢境與異象的手稿《紅書》，他生前始終不敢公開，甚至一度懷疑自己是不是要瘋了——這本書直到他過世近半世紀後的2009年才正式出版。'},
  {icon:'🏫', text:'維根斯坦放棄家族財產後，曾在奧地利偏遠鄉村當過好幾年小學老師，才又回到劍橋重拾哲學研究。'},
  {icon:'🔥', text:'畫出《維納斯的誕生》的波提切利，晚年成為激進修士薩佛納羅拉的虔誠信徒，據信曾親手將自己早年一些異教神話題材的畫作，投入「虛榮之火」焚毀懺悔。'},
  {icon:'🪞', text:'卡拉瓦喬畫的那幅《美杜莎》，據信用的正是他自己的臉——他把自己的容貌，畫成了那顆剛被斬下、驚駭萬分的蛇髮女妖頭顱。'},
  {icon:'⏳', text:'羅丹耗費三十七年打造的《地獄之門》，終其一生都未曾正式完工，也從未在他生前被真正鑄成青銅——我們今天在博物館看到的所有銅像，全部都是他過世後才澆鑄出來的。'},
  {icon:'⛓️', text:'伊本・西那有一段重要的醫學百科全書著作，是他因政治鬥爭身陷囹圄、被囚禁在法爾達詹城堡期間寫成的。'},
  {icon:'🌳', text:'孔子的後代族譜，是全世界持續記錄時間最長、最完整的家族世系之一，至今仍能追溯超過兩千五百年、傳承超過八十代。'},
  {icon:'🐴', text:'尼采精神徹底崩潰的那一刻，據傳是在都靈街頭，他衝上前抱住一匹正被車伕鞭打的馬，泣不成聲——此後他再也沒能真正恢復清醒，餘生都在母親與妹妹的照料下度過。'},
  {icon:'🏆', text:'卡繆四十四歲便獲頒諾貝爾文學獎，是史上最年輕的得主之一，得獎後僅僅三年，就因車禍猝逝。'},
  {icon:'📐', text:'維根斯坦曾親自為姐姐設計了一整棟極簡主義風格的住宅，據說他為了門把手的精確尺寸，反覆修改到近乎偏執的程度。'},
  {icon:'⚔️', text:'寫下《沉思錄》、被後世譽為「哲學家皇帝」的馬可・奧理略，在位期間卻也曾下令鎮壓、迫害當時剛剛興起的基督教信徒。'},
];

// Maps an EASTER_EGGS array index to a node id, only where the fact is unambiguously about ONE character —
// used to surface a "塵封軼聞" hint badge on that node's detail panel, linking back to the egg wall.
const EGG_NODE_MAP = {
  0:'pan', 1:'icarus', 3:'psyche', 4:'pan', 5:'tantalus', 6:'nemesis', 7:'echo', 8:'nyx',
  10:'aquarius', 12:'thales', 13:'pisces', 15:'perseus', 16:'freud', 17:'nietzsche', 18:'foucault',
  19:'rawls', 22:'serapis', 23:'singer', 24:'capricorn', 25:'aphrodite', 26:'uranus', 27:'chiron',
  29:'hermes', 30:'calypso', 31:'epicureanism', 32:'wittgenstein', 33:'hermes_trismegistus',
  35:'hypatia', 36:'anscombe', 37:'wollstonecraft', 38:'nussbaum', 39:'tyr', 41:'zhuangzi',
  42:'wittgenstein', 43:'zoroaster', 45:'wangyangming', 46:'buddha', 47:'cynicism', 48:'cynicism',
  49:'socrates', 50:'zhuangzi', 51:'pythagoras', 52:'stoicism', 53:'wittgenstein', 54:'socrates',
  55:'priam', 56:'medusa', 57:'eros', 58:'osiris', 59:'chiron', 60:'metis', 61:'hestia',
  62:'epimetheus', 63:'ariadne', 64:'camus', 65:'wittgenstein', 66:'anscombe', 68:'rawls',
  69:'diotima', 70:'stoicism', 71:'plato', 72:'socrates', 73:'nietzsche', 74:'schopenhauer',
  75:'sartre', 76:'stoicism', 77:'confucius', 78:'zhuangzi', 79:'wangyangming', 80:'joyce',
  81:'freud', 82:'lacan', 83:'camus', 84:'aristotle', 85:'jung', 86:'wittgenstein',
  87:'botticelli', 88:'caravaggio', 89:'rodin', 90:'ibnsina', 91:'confucius', 92:'nietzsche',
  93:'camus', 94:'wittgenstein', 95:'stoicism',
};
// Reverse index: node id -> array of egg indices, built once for fast lookup in renderDetail
const NODE_EGG_LOOKUP = {};
Object.entries(EGG_NODE_MAP).forEach(([eggIdx, nodeId])=>{
  (NODE_EGG_LOOKUP[nodeId] = NODE_EGG_LOOKUP[nodeId] || []).push(Number(eggIdx));
});

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
    card.className = 'egg-card shard-' + (i % 4) + (discoveredEggs.has(i) ? ' revealed' : '');
    card.dataset.index = i;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', discoveredEggs.has(i) ? egg.text : '塵封的軼聞，滑動或按 Enter 拂去塵埃');
    card.innerHTML = `
      <div class="egg-content">
        <span class="egg-emoji">${egg.icon}</span>
        <span class="egg-text">${egg.text}</span>
      </div>
      <div class="egg-dust"></div>
      <div class="egg-shimmer"></div>
    `;
    setupDustWipe(card, i);
    grid.appendChild(card);
  });
  updateEggProgress();
}

function setupDustWipe(card, i){
  const dust = card.querySelector('.egg-dust');
  if(!dust || discoveredEggs.has(i)) return; // already revealed, no gesture needed

  const THRESHOLD = 240;
  let wiping = false;
  let lastX = 0, lastY = 0;
  let accumulated = 0;

  function onPointerDown(ev){
    ev.preventDefault();
    card.focus();
    wiping = true;
    lastX = ev.clientX; lastY = ev.clientY;
    if(card.setPointerCapture){ try{ card.setPointerCapture(ev.pointerId); }catch(e){} }
  }
  function onPointerMove(ev){
    if(!wiping) return;
    const dx = ev.clientX - lastX, dy = ev.clientY - lastY;
    accumulated += Math.sqrt(dx*dx + dy*dy);
    lastX = ev.clientX; lastY = ev.clientY;
    dust.style.opacity = Math.max(0, 1 - accumulated / THRESHOLD);
    if(accumulated >= THRESHOLD) revealEgg(i, card);
  }
  function onPointerEnd(){ wiping = false; }

  card.addEventListener('pointerdown', onPointerDown);
  card.addEventListener('pointermove', onPointerMove);
  card.addEventListener('pointerup', onPointerEnd);
  card.addEventListener('pointercancel', onPointerEnd);
  card.addEventListener('keydown', (ev)=>{
    if(ev.key === 'Enter' || ev.key === ' '){
      ev.preventDefault();
      revealEgg(i, card);
    }
  });
}

function revealEgg(i, card){
  if(card.classList.contains('revealed')) return;
  card.classList.add('revealed');
  card.setAttribute('aria-label', EASTER_EGGS[i].text);
  if(!discoveredEggs.has(i)){
    discoveredEggs.add(i);
    try{ localStorage.setItem(EGG_KEY, JSON.stringify([...discoveredEggs])); }catch(e){}
    const rect = card.getBoundingClientRect();
    spawnSparkles(rect.left + rect.width/2, rect.top + rect.height/2);
    playEggChime();
    updateEggProgress();
    if(discoveredEggs.size === EASTER_EGGS.length){
      setTimeout(()=>{
        showMilestoneToast({
          text:'塵歸塵，土歸土——但你已經把每一粒都親手拂去過了。',
          author:'🧩 塵封軼聞・全數拂去'
        });
      }, 500);
    }
  }
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

function jumpToEggFromNode(nodeId){
  const eggIndices = NODE_EGG_LOOKUP[nodeId];
  if(!eggIndices || !eggIndices.length) return;
  const targetIndex = eggIndices[0];
  openEggWall();
  setTimeout(()=>{
    const card = document.querySelector('.egg-card[data-index="'+targetIndex+'"]');
    if(!card) return;
    card.scrollIntoView({behavior:'smooth', block:'center'});
    revealEgg(targetIndex, card);
    card.style.outline = '2px solid var(--gold)';
    card.style.outlineOffset = '3px';
    setTimeout(()=>{ card.style.outline = ''; card.style.outlineOffset = ''; }, 2200);
  }, 150);
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
  switchSearchTab('search');
  const input = document.getElementById('searchInput');
  input.value = '';
  renderSearchResults();
  setTimeout(()=> input.focus(), 50);
}

function closeSearch(){
  document.getElementById('searchOverlay').classList.remove('open');
}

function switchSearchTab(tab){
  document.querySelectorAll('.search-tab').forEach(t=>t.classList.remove('active'));
  event?.target?.classList?.add('active') || document.querySelector(`.search-tab[onclick*="${tab}"]`)?.classList.add('active');
  document.getElementById('searchTabContent').style.display = tab === 'search' ? 'block' : 'none';
  document.getElementById('pathTabContent').style.display = tab === 'path' ? 'block' : 'none';
  if(tab === 'path'){
    document.getElementById('pathFromInput').value = '';
    document.getElementById('pathToInput').value = '';
    document.getElementById('pathFromResults').innerHTML = '';
    document.getElementById('pathToResults').innerHTML = '';
    document.getElementById('pathResult').innerHTML = '';
    pathFromId = null;
    pathToId = null;
    setTimeout(()=> document.getElementById('pathFromInput').focus(), 50);
  }
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
  document.getElementById('searchOverlay').classList.add('open');
  setTimeout(()=> switchSearchTab('path'), 0);
}

function closePathfinder(){
  document.getElementById('searchOverlay').classList.remove('open');
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

let pathBannerTimer = null;
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
  clearTimeout(pathBannerTimer);
  pathBannerTimer = setTimeout(()=> banner.classList.remove('show'), 7000);

  const firstEl = document.getElementById('node-'+path[0]);
  if(firstEl) firstEl.scrollIntoView({behavior:'smooth', block:'center', inline:'center'});
}

function clearPathHighlight(){
  document.querySelectorAll('.node').forEach(n=>n.classList.remove('active'));
  document.querySelectorAll('.edge').forEach(e=>{
    e.classList.remove('edge-active','edge-dim');
  });
  document.getElementById('pathBanner').classList.remove('show');
  clearTimeout(pathBannerTimer);
}

/* ---------- Timeline: only real historical figures with a known year ---------- */
function formatYear(y){
  return y < 0 ? `西元前${Math.abs(y)}年` : `西元${y}年`;
}

function renderTimeline(){
  const container = document.getElementById('timelineContent');
  if(container.dataset.built) return;
  const dated = DATA.filter(d=>d.year !== undefined).sort((a,b)=>a.year-b.year);
  const ancient = dated.filter(d=>d.year < 1000);
  const modern = dated.filter(d=>d.year >= 1000);

  function buildEra(label, list){
    if(!list.length) return '';
    const minY = list[0].year;
    const maxY = list[list.length-1].year;
    const n = list.length;
    const trackWidth = Math.max(n * 130, 600);
    const markers = list.map((d,i)=>{
      // rank-based even spacing (not year-proportional) so dense clusters never overlap
      const pct = n === 1 ? 50 : (i / (n - 1)) * 100;
      const lane = i % 3;
      const color = genColor(d.gen);
      return `
        <div class="timeline-marker lane${lane}" style="left:${pct}%; --dot-color:${color}" onclick="jumpFromTimeline('${d.id}')" title="${d.zh} · ${d.yearLabel}">
          <div class="timeline-marker-label">
            <span class="tl-name">${d.zh}</span>
            ${d.yearLabel}
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="timeline-era">
        <div class="timeline-era-label">${label}</div>
        <div class="timeline-era-range">${formatYear(minY)} — ${formatYear(maxY)}（依先後順序等距排列，非精確年份比例）</div>
        <div class="timeline-scroll">
          <div class="timeline-track" style="width:${trackWidth}px">${markers}</div>
        </div>
      </div>
    `;
  }

  const gapNote = (ancient.length && modern.length)
    ? `<div class="timeline-gap-note">⋯ 中間跳過約 ${modern[0].year - ancient[ancient.length-1].year} 年，沒有收錄的人物 ⋯</div>`
    : '';

  container.innerHTML = buildEra('古典時代 Ancient', ancient) + gapNote + buildEra('近現代 Modern', modern);
  container.dataset.built = '1';
}

function jumpFromTimeline(id){
  closeTimeline();
  jumpToNode(id);
}

function openTimeline(){
  renderTimeline();
  document.getElementById('timelineOverlay').classList.add('open');
}

function closeTimeline(){
  document.getElementById('timelineOverlay').classList.remove('open');
}

/* ---------- Milestone quotes ---------- */
const QUOTE_POOL = [
  {text:'存在即是被感知。', author:'喬治・貝克萊'},
  {text:'我們每個人的意識深處，都共享著同一套原型。', author:'榮格（意譯）'},
  {text:'道可道，非常道。', author:'老子'},
  {text:'認識你自己。', author:'德爾菲神諭'},
  {text:'我唯一知道的，就是我一無所知。', author:'蘇格拉底'},
  {text:'你未看此花時，此花與汝心同歸於寂；你來看此花時，則此花顏色一時明白起來。', author:'王陽明《傳習錄》'},
  {text:'一切唯心造。', author:'《華嚴經》'},
  {text:'如其在上，如其在下。', author:'赫米斯主義箴言'},
  {text:'你不知道自己此刻有沒有被看著。', author:'傅柯'},
  {text:'凝視深淵過久，深淵將回以凝視。', author:'尼采'},
  {text:'語言的界限，就是世界的界限。', author:'維根斯坦'},
  {text:'對於不可言說之事，必須保持沉默。', author:'維根斯坦'},
  {text:'哲學始於驚奇。', author:'亞里斯多德'},
  {text:'死亡與我們毫不相干。', author:'伊比鳩魯'},
  {text:'我們必須想像薛西弗斯是幸福的。', author:'卡繆'},
  {text:'平庸之惡，往往始於停止思考。', author:'漢娜・鄂蘭（意譯）'},
  {text:'正義是社會制度的首要美德。', author:'羅爾斯'},
  {text:'知識就是權力。', author:'傅柯（意譯）'},
  {text:'人注定自由。', author:'沙特'},
  {text:'並非生而為女人，而是變成女人。', author:'波伏娃'},
  {text:'距離，不該決定生命的價值。', author:'彼得・辛格（意譯）'},
  {text:'直到你讓潛意識變得有意識，它將指引你的人生，而你稱其為命運。', author:'榮格'},
  {text:'水是萬物的本源。', author:'泰勒斯'},
  {text:'萬物皆數。', author:'畢達哥拉斯'},
  {text:'成為你自己。', author:'尼采'},
  {text:'認識自己是最難的事。', author:'泰勒斯（希臘七賢）'},
  {text:'沉默勝於無意義的言語。', author:'畢達哥拉斯學派箴言'},
  {text:'未經檢視的人生，是不值得活的。', author:'蘇格拉底'},
  {text:'智慧的開端，是承認自己的無知。', author:'蘇格拉底（意譯）'},
  {text:'我不能教任何人任何事，我只能使他們思考。', author:'蘇格拉底（意譯）'},
  {text:'凡人所行之惡，皆因無知，而非本意。', author:'蘇格拉底（意譯，主智論）'},
  {text:'哲學是對死亡的練習。', author:'柏拉圖《斐多篇》'},
  {text:'洞穴之外，才是真實的世界。', author:'柏拉圖（意譯）'},
  {text:'無知不是罪惡的根源，而是缺乏教育的結果。', author:'柏拉圖（意譯）'},
  {text:'正義是每個人做好自己份內的事。', author:'柏拉圖《理想國》'},
  {text:'人是天生的政治動物。', author:'亞里斯多德《政治學》'},
  {text:'我們的德性，來自我們反覆做的事。', author:'亞里斯多德（意譯）'},
  {text:'友誼，是兩個身體共享同一個靈魂。', author:'亞里斯多德（傳為）'},
  {text:'教育的根是苦澀的，但果實是甜美的。', author:'亞里斯多德（傳為）'},
  {text:'幸福是靈魂合乎德性的實現活動。', author:'亞里斯多德《尼各馬可倫理學》'},
  {text:'人是萬物的尺度。', author:'普羅塔哥拉斯'},
  {text:'請你閃到一邊去，別擋住我的陽光。', author:'第歐根尼'},
  {text:'操之在我者，操之不在我者，人當清楚區分。', author:'愛比克泰德'},
  {text:'困擾我們的不是事情本身，而是我們對事情的看法。', author:'愛比克泰德'},
  {text:'你的心靈，會染上你經常反覆思考之事的顏色。', author:'馬可・奧理略《沉思錄》'},
  {text:'我們的人生，是由我們的思想所塑造的。', author:'馬可・奧理略《沉思錄》'},
  {text:'不因無法擁有一切而不快樂，而要因擁有的一切而快樂。', author:'伊比鳩魯'},
  {text:'若你想使人快樂，不要增加他的財富，而要減少他的慾望。', author:'伊比鳩魯'},
  {text:'對一切懸置判斷，方能獲得心靈的寧靜。', author:'皮浪'},
  {text:'對於每一個論證，都存在一個力量相當的反論證。', author:'塞克斯圖斯・恩丕里柯'},
  {text:'保留思考的權利，勝於盲從錯誤的信念。', author:'傳為希帕提亞所說'},
  {text:'凡事勿過度。', author:'德爾菲神諭'},
  {text:'控制怒氣。', author:'德爾菲神諭'},
  {text:'有節制。', author:'德爾菲神諭'},
  {text:'追求智慧。', author:'德爾菲神諭'},
  {text:'沒有事實，只有詮釋。', author:'尼采'},
  {text:'存在先於本質。', author:'沙特'},
  {text:'自由是我們對自己選擇的絕對責任。', author:'沙特'},
  {text:'改變人生的，不是自由本身，而是如何運用自由。', author:'波伏娃（意譯）'},
  {text:'若沒有自由，就不會有真正的美德。', author:'波伏娃（意譯）'},
  {text:'壓迫若不曾在受壓迫者身上尋求同謀，便無法真正遂行。', author:'波伏娃（意譯）'},
  {text:'一隻甲蟲，只有你自己看得見盒子裡的甲蟲。', author:'維根斯坦（意譯）'},
  {text:'世界是事實的總和，而非事物的總和。', author:'維根斯坦《邏輯哲學論》'},
  {text:'哲學問題具有這樣的形式：我找不到出路。', author:'維根斯坦《哲學研究》'},
  {text:'凡是能被顯示的，就不能被說出。', author:'維根斯坦《邏輯哲學論》'},
  {text:'思考的無能，往往導致行動上的邪惡。', author:'漢娜・鄂蘭（意譯）'},
  {text:'邪惡最大的危害，在於使人遺忘了自己是誰。', author:'漢娜・鄂蘭（意譯）'},
  {text:'極權主義最理想的臣民，不是堅信的信徒，而是分不清事實與虛構界線的人。', author:'漢娜・鄂蘭（意譯）'},
  {text:'我不是在寫歷史，我是在寫現在。', author:'傅柯（意譯）'},
  {text:'瘋狂與理性的界線，是由社會所畫下的。', author:'傅柯（意譯）'},
  {text:'在每個社會，話語的生產，都受到一定程序所控制、篩選與再分配。', author:'傅柯（意譯）'},
  {text:'每個人都擁有基於正義而不可侵犯的權利。', author:'羅爾斯《正義論》'},
  {text:'社會合作的公平條件，應由自由平等的人們共同合理接受。', author:'羅爾斯（意譯）'},
  {text:'痛苦的能力，才是道德關懷的門檻。', author:'彼得・辛格（意譯）'},
  {text:'我們的道德視野，理應隨知識而擴大，而非受限於熟悉的臉孔。', author:'彼得・辛格（意譯）'},
  {text:'我不希望女人擁有支配男人的權力，而是希望她們擁有支配自己的權力。', author:'瑪麗・沃斯通克拉夫特'},
  {text:'意圖，是理解人類行動的關鍵。', author:'伊莉莎白・安斯庫姆（意譯）'},
  {text:'若沒有道德律的立法者，「應該」這個詞便失去了根基。', author:'伊莉莎白・安斯庫姆（意譯）'},
  {text:'情感不是理性的對立面，而是判斷的一種形式。', author:'瑪莎・納思邦（意譯）'},
  {text:'脆弱，是人類繁盛不可或缺的一部分，而非需要消除的弱點。', author:'瑪莎・納思邦（意譯）'},
  {text:'知之為知之，不知為不知，是知也。', author:'孔子《論語》'},
  {text:'過猶不及。', author:'孔子《論語》'},
  {text:'溫故而知新，可以為師矣。', author:'孔子《論語》'},
  {text:'不患人之不己知，患不知人也。', author:'孔子《論語》'},
  {text:'君子和而不同，小人同而不和。', author:'孔子《論語》'},
  {text:'知人者智，自知者明。', author:'老子《道德經》'},
  {text:'天下難事，必作於易；天下大事，必作於細。', author:'老子《道德經》'},
  {text:'為學日益，為道日損。', author:'老子《道德經》'},
  {text:'知足者富。', author:'老子《道德經》'},
  {text:'大道至簡。', author:'老子《道德經》（意譯）'},
  {text:'信言不美，美言不信。', author:'老子《道德經》'},
  {text:'多言數窮，不如守中。', author:'老子《道德經》'},
  {text:'一切法從心生。', author:'《法句經》'},
  {text:'以恨止恨，恨不能止；唯有愛，能止息恨。', author:'《法句經》'},
  {text:'憤怒如同抓住熱炭想丟向他人，先燙傷的是自己。', author:'佛教教義（意譯）'},
  {text:'過去心不可得，現在心不可得，未來心不可得。', author:'《金剛經》'},
  {text:'善思、善言、善行。', author:'瑣羅亞斯德教箴言'},
  {text:'知是行之始，行是知之成。', author:'王陽明《傳習錄》'},
  {text:'天地與我並生，萬物與我為一。', author:'莊子《齊物論》'},
  {text:'吾生也有涯，而知也無涯。', author:'莊子《養生主》'},
  {text:'汝身非汝有也，是天地之委形也。', author:'莊子《知北遊》'},
  {text:'至人無己，神人無功，聖人無名。', author:'莊子《逍遙遊》'},
  {text:'井蛙不可以語於海者，拘於虛也。', author:'莊子《秋水》'},
  {text:'大學之道，在明明德，在親民，在止於至善。', author:'《大學》'},
  {text:'天命之謂性，率性之謂道，修道之謂教。', author:'《中庸》'},
  {text:'惻隱之心，人皆有之。', author:'《孟子》'},
  {text:'生於憂患，死於安樂。', author:'《孟子》'},
  {text:'天行健，君子以自強不息。', author:'《易經》'},
  {text:'地勢坤，君子以厚德載物。', author:'《易經》'},
  {text:'不義而富且貴，於我如浮雲。', author:'孔子《論語》'},
  {text:'吾日三省吾身。', author:'《論語》（曾子）'},
  {text:'反者道之動，弱者道之用。', author:'老子《道德經》'},
  {text:'合抱之木，生於毫末；九層之台，起於累土。', author:'老子《道德經》'},
  {text:'征服自己，勝於征服千軍萬馬。', author:'《法句經》'},
  {text:'凡所有相，皆是虛妄。', author:'《金剛經》'},
  {text:'色不異空，空不異色；色即是空，空即是色。', author:'《心經》'},
  {text:'本來無一物，何處惹塵埃。', author:'《六祖壇經》'},
  {text:'你只管行動，不問結果。', author:'《薄伽梵歌》'},
  {text:'你就是那個。', author:'《奧義書》'},
  {text:'人不能兩次踏入同一條河流。', author:'赫拉克利特斯（殘篇）'},
  {text:'萬物皆流。', author:'赫拉克利特斯（殘篇）'},
  {text:'我正在尋找一個誠實的人。', author:'第歐根尼'},
  {text:'我是世界的公民。', author:'第歐根尼'},
  {text:'沒有音樂，生命將是一場錯誤。', author:'尼采《偶像的黃昏》'},
  {text:'信念是比謊言更危險的真理之敵。', author:'尼采'},
  {text:'打雷之後，常常下雨。', author:'蘇格拉底（據說是對妻子潑水的回應）'},
  {text:'那麼命中也注定要打你了。', author:'芝諾（對偷竊奴隸辯稱「命中注定」的回應）'},
  {text:'空腹的胃，聽不進哲學。', author:'伊比鳩魯（意譯）'},
  {text:'不要吃豆子。', author:'畢達哥拉斯學派戒律（原因至今成謎）'},
  {text:'未知生，焉知死。', author:'孔子《論語》'},
  {text:'以天地為棺槨，吾葬具豈不備邪？', author:'莊子《列禦寇》'},
  {text:'只有原子與虛空真實存在，其餘一切都只是人的意見。', author:'德謨克利特（殘篇，唯物論）'},
  {text:'感官告訴我們的，並非事物本身，而是原子撞擊後留下的印象。', author:'德謨克利特（意譯，唯物論）'},
  {text:'靈魂由精細的原子構成，隨肉體死亡而消散，無需畏懼死後的懲罰。', author:'伊比鳩魯（意譯，唯物論立場）'},
  {text:'萬物皆非無中生有。', author:'盧克萊修《物性論》'},
  {text:'不是意識決定生活，而是生活決定意識。', author:'馬克思《德意志意識形態》'},
  {text:'我們是宇宙認識自己的方式。', author:'卡爾・薩根'},
  {text:'我們都是星塵——你我體內的每一個原子，都曾誕生於某顆星球的核心。', author:'卡爾・薩根（意譯）'},
  {text:'冬天到了，我才知道，我心裡有個不可戰勝的夏天。', author:'卡繆'},
  {text:'荒謬，產生於人類的呼喚與世界不合理的沉默之間的對峙。', author:'卡繆（意譯）'},
  {text:'一個人的一生，或許可以歸結為他從未忘記的三、四個意象。', author:'卡繆（意譯）'},
  {text:'誰向外看，是在做夢；誰向內看，是清醒的。', author:'榮格'},
  {text:'在每個成年人心中，都藏著一個仍在成長、永遠不會完成的孩子。', author:'榮格（意譯）'},
  {text:'我們往往在想像中受的苦，比現實中更多。', author:'塞內卡'},
  {text:'生命如同一個故事，重要的不是長短，而是內容是否精彩。', author:'塞內卡'},
  {text:'別在死前，稱任何人是幸福的。', author:'梭倫（希臘七賢）'},
  {text:'認識時機。', author:'契羅（希臘七賢）'},
  {text:'心智即宇宙，宇宙即心智。', author:'赫米斯主義箴言（意譯）'},
  {text:'自然賦予我們兩隻耳朵、一張嘴，是要我們多聽少說。', author:'芝諾（斯多葛學派創始人）'},
  {text:'娶到好妻子，你會幸福；娶到壞妻子，你會成為哲學家。', author:'蘇格拉底（傳為自嘲之語）'},
  {text:'最好的報復方式，就是不要和對方一樣。', author:'馬可・奧理略《沉思錄》'},
  {text:'我反抗，故我們存在。', author:'卡繆《反抗者》'},
  {text:'誰終將聲震人間，必長久深自緘默。', author:'尼采（意譯）'},
  {text:'勝人者有力，自勝者強。', author:'老子《道德經》'},
  {text:'破山中賊易，破心中賊難。', author:'王陽明（書信）'},
  {text:'巧者勞而智者憂，無能者無所求。', author:'莊子《列禦寇》'},
  {text:'君子坦蕩蕩，小人長戚戚。', author:'孔子《論語》'},
  {text:'金錢不能帶來美德，但美德能帶來金錢，以及人生一切美好的事物。', author:'蘇格拉底《申辯篇》'},
  {text:'自然不做徒勞之事。', author:'亞里斯多德'},
  {text:'身體是靈魂的監獄。', author:'柏拉圖（意譯）'},
  {text:'宇宙即變化，人生即觀感。', author:'馬可・奧理略《沉思錄》'},
  {text:'並非我們擁有的時間太少，而是我們浪費的太多。', author:'塞內卡《論人生短暫》'},
  {text:'神秘的不是世界如何存在，而是世界竟然存在。', author:'維根斯坦《邏輯哲學論》'},
  {text:'德不孤，必有鄰。', author:'孔子《論語》'},
  {text:'天下莫柔弱於水，而攻堅強者莫之能勝。', author:'老子《道德經》'},
  {text:'泉涸，魚相與處於陸，不如相忘於江湖。', author:'莊子《大宗師》'},
  {text:'萬物皆變，無一消逝。', author:'奧維德《變形記》'},
  {text:'全世界是一個舞台。', author:'莎士比亞《皆大歡喜》'},
  {text:'走自己的路，讓別人去說吧。', author:'傳為但丁所說'},
  {text:'錯誤是通往發現的大門。', author:'喬伊斯《尤利西斯》（意譯）'},
  {text:'有時候，一支雪茄就只是一支雪茄。', author:'傳為佛洛伊德所說'},
  {text:'文學所培養的道德想像力，是政治哲學經常欠缺的。', author:'瑪莎・納思邦（意譯）'},
  {text:'凡是無害於城邦的，也無害於城邦的公民。', author:'馬可・奧理略《沉思錄》'},
  {text:'三軍可奪帥也，匹夫不可奪志也。', author:'孔子《論語》'},
  {text:'知者不言，言者不知。', author:'老子《道德經》'},
  {text:'至樂無樂，至譽無譽。', author:'莊子《至樂》'},
  {text:'心外無物。', author:'王陽明'},
  {text:'人生就像鐘擺，在痛苦與無聊之間搖擺。', author:'叔本華'},
  {text:'跳舞的星星，誕生於內心的混沌。', author:'尼采《查拉圖斯特拉如是說》（意譯）'},
  {text:'這裡必須根絕一切怯懦。', author:'但丁《神曲・地獄篇》（意譯）'},
  {text:'簡潔是智慧的靈魂。', author:'莎士比亞《哈姆雷特》'},
  {text:'無意識像語言一樣被結構。', author:'拉岡'},
  {text:'潛意識沒有時間性。', author:'佛洛伊德（意譯）'},
  {text:'洞穴深處，藏著你所尋找的寶藏。', author:'坎伯（意譯）'},
  {text:'意圖，不能脫離其結果的描述而被理解。', author:'伊莉莎白・安斯庫姆（意譯）'},
  {text:'所有人在本性上都渴望求知。', author:'亞里斯多德《形而上學》'},
  {text:'無知的人所犯的最大罪過，就是自以為知道自己不知道的事。', author:'蘇格拉底（意譯）'},
  {text:'友誼，是智慧為了追求幸福人生所提供的方法中，最重要的一項。', author:'伊比鳩魯'},
  {text:'清晨醒來時提醒自己：今天我會遇上愛管閒事的人、忘恩負義的人。', author:'馬可・奧理略《沉思錄》（意譯）'},
  {text:'見賢思齊焉，見不賢而內自省也。', author:'孔子《論語》'},
  {text:'上士聞道，勤而行之。', author:'老子《道德經》'},
  {text:'天地有大美而不言。', author:'莊子《知北遊》'},
  {text:'無善無惡心之體，有善有惡意之動。', author:'王陽明（四句教）'},
  {text:'不被慾望所奴役的人，才是真正自由的人。', author:'蘇格拉底（意譯）'},
  {text:'天才不過就是不斷的努力。', author:'羅丹（傳為）'},
  {text:'四十而不惑，五十而知天命。', author:'孔子《論語》'},
  {text:'雕塑，不過是從一個姿態緩緩流向另一個姿態的過程。', author:'羅丹（意譯）'},
];

const MILESTONE_COUNTS = [25, 50, 75, 100];
let lastQuoteAt = 0;

function pickRandomQuote(){
  return QUOTE_POOL[Math.floor(Math.random() * QUOTE_POOL.length)];
}

let milestoneTimer = null;
/* ---------- Scramble-reveal: text materializes character by character out of ancient-glyph static ---------- */
const SCRAMBLE_GLYPHS = 'αβγδεζηθικλμνξοπρστυφχψω✦✧⋆※〜';

function scrambleReveal(el, finalText, totalDuration){
  if(!el) return;
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    el.textContent = finalText;
    return;
  }
  const chars = finalText.split('');
  const n = chars.length;
  let lockedCount = 0;
  let frame = 0;
  const framesPerLock = Math.max(1, Math.floor((totalDuration / 35) / n));
  clearInterval(el._scrambleInterval);
  el._scrambleInterval = setInterval(()=>{
    frame++;
    let display = '';
    for(let i=0; i<n; i++){
      if(chars[i] === ' ' || i < lockedCount){
        display += chars[i];
      } else {
        display += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      }
    }
    el.textContent = display;
    if(frame % framesPerLock === 0) lockedCount++;
    if(lockedCount >= n){
      el.textContent = finalText;
      clearInterval(el._scrambleInterval);
    }
  }, 35);
}

function showMilestoneToast(quote){
  const toast = document.getElementById('milestoneToast');
  if(!toast) return;
  const textEl = document.getElementById('milestoneText');
  const authorEl = document.getElementById('milestoneAuthor');
  authorEl.style.opacity = '0';
  toast.classList.add('show');
  playEggChime();
  scrambleReveal(textEl, `「${quote.text}」`, 750);
  setTimeout(()=>{
    authorEl.textContent = `— ${quote.author}`;
    authorEl.style.opacity = '1';
  }, 800);
  clearTimeout(milestoneTimer);
  milestoneTimer = setTimeout(()=> toast.classList.remove('show'), 6200);
}

function checkMilestone(count){
  if(MILESTONE_COUNTS.includes(count)){
    showMilestoneToast(pickRandomQuote());
    lastQuoteAt = count;
  }
  if(count === DATA.length) showCompletionMoment();
}

let selectionCount = 0;
let lastRandomQuoteAt = 0;
function maybeSurfaceQuote(){
  selectionCount++;
  if(selectionCount - lastRandomQuoteAt >= 2 && Math.random() < 0.35){
    showMilestoneToast(pickRandomQuote());
    lastRandomQuoteAt = selectionCount;
  }
}

function showCompletionMoment(){
  const body = document.getElementById('completionBody');
  if(body){
    body.innerHTML = `
      <div class="completion-quote" id="completionQuoteText" style="min-height:5.5em;"></div>
      <div class="completion-cite" id="completionCite" style="opacity:0; transition:opacity .5s ease;">— 王陽明《傳習錄》</div>
      <div class="completion-closing" id="completionClosing" style="opacity:0; transition:opacity .6s ease;">${DATA.length} 個節點，${DATA.length} 次「顏色一時明白起來」的瞬間——這座地圖，原本安靜地存在著，而現在，它因為被你看過，才真正完整。</div>
    `;
    scrambleReveal(document.getElementById('completionQuoteText'), '「你未看此花時，此花與汝心同歸於寂；你來看此花時，則此花顏色一時明白起來，便知此花不在你的心外。」', 1600);
    setTimeout(()=>{
      document.getElementById('completionCite').style.opacity = '1';
      document.getElementById('completionClosing').style.opacity = '1';
    }, 1700);
  }
  document.getElementById('completionOverlay').classList.add('open');
  playUnlockChime();
}

function closeCompletion(){
  document.getElementById('completionOverlay').classList.remove('open');
}

/* ---------- Consciousness Map: a personal constellation built from visit order ---------- */
function openMindMap(){
  renderMindMap();
  document.getElementById('mindMapOverlay').classList.add('open');
}

function closeMindMap(){
  document.getElementById('mindMapOverlay').classList.remove('open');
}

function jumpFromMindMap(id){
  closeMindMap();
  jumpToNode(id);
}

function renderMindMap(){
  const content = document.getElementById('mindMapContent');
  const progressEl = document.getElementById('mindMapProgress');
  const order = [...visited]; // Set preserves insertion order = order first visited
  progressEl.textContent = `已建構 ${order.length} / ${DATA.length} 個意識座標`;

  if(order.length === 0){
    content.innerHTML = `<div class="mind-map-empty">你尚未點亮任何一顆星<br>回到樹上，點開任何一位角色，這裡就會開始有東西</div>`;
    return;
  }

  const size = 700;
  const cx = size/2, cy = size/2;
  const n = order.length;

  // Deterministic pseudo-random, seeded from the actual exploration path —
  // same visited set always renders the same galaxy, but different explorers get different galaxies
  let seed = 42;
  order.forEach(id=>{ for(let k=0;k<id.length;k++){ seed = (seed + id.charCodeAt(k) * (k+7)) % 999983; } });
  if(seed <= 0) seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // Multi-arm spiral galaxy: fewer stars = fewer arms, so small collections don't look sparse/broken
  const numArms = n < 6 ? 1 : (n < 18 ? 2 : 3);
  const maxRadius = 300;

  const points = order.map((id, i)=>{
    const arm = i % numArms;
    const posInArm = Math.floor(i / numArms);
    const countInArm = Math.ceil(n / numArms);
    const t = countInArm <= 1 ? 0.5 : posInArm / (countInArm - 1);
    const winding = 2.6 * Math.PI; // how many radians each arm sweeps outward
    const baseAngle = (arm * (2 * Math.PI / numArms)) + t * winding;
    const radius = 28 + t * maxRadius;
    // organic scatter so it doesn't look like a rigid mathematical curve
    const jitterAngle = (rand() - 0.5) * 0.5;
    const jitterRadius = (rand() - 0.5) * (24 + t * 30);
    const angle = baseAngle + jitterAngle;
    const r = Math.max(10, radius + jitterRadius);
    return { id, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  // Sort points by angle from center for spiral arm effect
  const spiralPoints = [...points].sort((a, b)=>{
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });

  let svg = `<svg class="mind-map-svg" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="neb1" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#6B4A8A" stop-opacity="0.28"/>
        <stop offset="35%" stop-color="#6B4A8A" stop-opacity="0.14"/>
        <stop offset="65%" stop-color="#6B4A8A" stop-opacity="0.05"/>
        <stop offset="100%" stop-color="#6B4A8A" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb2" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#2E8A6B" stop-opacity="0.22"/>
        <stop offset="35%" stop-color="#2E8A6B" stop-opacity="0.10"/>
        <stop offset="65%" stop-color="#2E8A6B" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#2E8A6B" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb3" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#8A2E5C" stop-opacity="0.22"/>
        <stop offset="35%" stop-color="#8A2E5C" stop-opacity="0.10"/>
        <stop offset="65%" stop-color="#8A2E5C" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#8A2E5C" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb4" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#C9A75C" stop-opacity="0.20"/>
        <stop offset="35%" stop-color="#C9A75C" stop-opacity="0.09"/>
        <stop offset="65%" stop-color="#C9A75C" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#C9A75C" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb5" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3D5A8A" stop-opacity="0.22"/>
        <stop offset="35%" stop-color="#3D5A8A" stop-opacity="0.10"/>
        <stop offset="65%" stop-color="#3D5A8A" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#3D5A8A" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="neb6" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#8A5A2E" stop-opacity="0.20"/>
        <stop offset="35%" stop-color="#8A5A2E" stop-opacity="0.09"/>
        <stop offset="65%" stop-color="#8A5A2E" stop-opacity="0.03"/>
        <stop offset="100%" stop-color="#8A5A2E" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="nebCore" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#F3E9C9" stop-opacity="0.26"/>
        <stop offset="40%" stop-color="#F3E9C9" stop-opacity="0.12"/>
        <stop offset="70%" stop-color="#F3E9C9" stop-opacity="0.04"/>
        <stop offset="100%" stop-color="#F3E9C9" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="sg0" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/><stop offset="22%" stop-color="#FFFFFF" stop-opacity="0.45"/><stop offset="60%" stop-color="#FFFFFF" stop-opacity="0.12"/><stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
      <radialGradient id="sg1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFF4E0" stop-opacity="0.9"/><stop offset="22%" stop-color="#FFF4E0" stop-opacity="0.45"/><stop offset="60%" stop-color="#FFF4E0" stop-opacity="0.12"/><stop offset="100%" stop-color="#FFF4E0" stop-opacity="0"/></radialGradient>
      <radialGradient id="sg2" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#EAF1FF" stop-opacity="0.9"/><stop offset="22%" stop-color="#EAF1FF" stop-opacity="0.45"/><stop offset="60%" stop-color="#EAF1FF" stop-opacity="0.12"/><stop offset="100%" stop-color="#EAF1FF" stop-opacity="0"/></radialGradient>
      <radialGradient id="sg3" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#FFF9EC" stop-opacity="0.9"/><stop offset="22%" stop-color="#FFF9EC" stop-opacity="0.45"/><stop offset="60%" stop-color="#FFF9EC" stop-opacity="0.12"/><stop offset="100%" stop-color="#FFF9EC" stop-opacity="0"/></radialGradient>
      <radialGradient id="sg4" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#F3E9C9" stop-opacity="0.9"/><stop offset="22%" stop-color="#F3E9C9" stop-opacity="0.45"/><stop offset="60%" stop-color="#F3E9C9" stop-opacity="0.12"/><stop offset="100%" stop-color="#F3E9C9" stop-opacity="0"/></radialGradient>
    </defs>
  `;

  // Nebula clouds: pick a random subset of hues, place/size them randomly — seeded by exploration path,
  // so the backdrop itself is unique per explorer, not just the star positions
  const nebulaIds = ['neb1','neb2','neb3','neb4','neb5','neb6'];
  for(let i=nebulaIds.length-1; i>0; i--){
    const j = Math.floor(rand() * (i+1));
    [nebulaIds[i], nebulaIds[j]] = [nebulaIds[j], nebulaIds[i]];
  }
  const numNebulae = 4 + Math.floor(rand() * 2); // 4 or 5 clouds
  for(let i=0; i<numNebulae; i++){
    const nx = 90 + rand() * (size - 180);
    const ny = 90 + rand() * (size - 180);
    const nrx = 170 + rand() * 100;
    const nry = 170 + rand() * 100;
    svg += `<ellipse cx="${nx.toFixed(0)}" cy="${ny.toFixed(0)}" rx="${nrx.toFixed(0)}" ry="${nry.toFixed(0)}" fill="url(#${nebulaIds[i]})"/>`;
  }
  svg += `<ellipse cx="${cx}" cy="${cy}" rx="140" ry="140" fill="url(#nebCore)"/>`;

  // Decorative background starfield — small dim static stars, non-interactive, seeded deterministically
  for(let i=0; i<90; i++){
    const bx = rand() * size, by = rand() * size;
    const br = 0.5 + rand() * 1.2;
    const bo = 0.12 + rand() * 0.28;
    const delay = Math.floor(rand() * 5000);
    svg += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${br.toFixed(1)}" fill="#EFE6CE" opacity="${bo.toFixed(2)}" class="mm-bg-star" style="--twinkle-delay:${delay}ms"/>`;
  }

  for(let i=0; i<spiralPoints.length-1; i++){
    const a = spiralPoints[i], b = spiralPoints[i+1];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dx = cx - midX, dy = cy - midY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = dy / dist;
    const perpY = -dx / dist;
    const spiralFactor = 25 + dist * 0.2 + i * 5;
    const cpX = midX + perpX * spiralFactor;
    const cpY = midY + perpY * spiralFactor;
    // Star trail: a row of tiny stars along the spiral curve
    const starCount = 8;
    for(let s=0; s<starCount; s++){
      const t = s / starCount;
      // Quadratic bezier interpolation
      const bx = (1-t)*(1-t)*a.x + 2*(1-t)*t*cpX + t*t*b.x;
      const by = (1-t)*(1-t)*a.y + 2*(1-t)*t*cpY + t*t*b.y;
      const r = 0.6 + (1 - Math.abs(t - 0.5) * 2) * 0.4;  // slightly bigger in middle
      const op = 0.4 + rand() * 0.4;
      const delay = Math.floor(rand() * 3000);
      svg += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(1)}" fill="#FFF4D0" opacity="${op.toFixed(2)}" class="mm-trail-star" style="--twinkle-delay:${delay}ms"/>`;
    }
  }
  if(spiralPoints.length > 2){
    const a = spiralPoints[spiralPoints.length - 1];
    const b = spiralPoints[0];
    const midX = (a.x + b.x) / 2;
    const midY = (a.y + b.y) / 2;
    const dx = cx - midX, dy = cy - midY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const perpX = dy / dist;
    const perpY = -dx / dist;
    const spiralFactor = 40;
    const cpX = midX + perpX * spiralFactor;
    const cpY = midY + perpY * spiralFactor;
    const starCount = 6;
    for(let s=0; s<starCount; s++){
      const t = s / starCount;
      const bx = (1-t)*(1-t)*a.x + 2*(1-t)*t*cpX + t*t*b.x;
      const by = (1-t)*(1-t)*a.y + 2*(1-t)*t*cpY + t*t*b.y;
      const r = 0.5 + rand() * 0.3;
      const op = 0.3 + rand() * 0.35;
      const delay = Math.floor(rand() * 3000);
      svg += `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${r.toFixed(1)}" fill="#FFF4D0" opacity="${op.toFixed(2)}" class="mm-trail-star" style="--twinkle-delay:${delay}ms"/>`;
    }
  }

  // Real star colors are near-white with subtle temperature variance (warm/cool), never category-coded
  const starPalette = ['#FFFFFF', '#FFF4E0', '#EAF1FF', '#FFF9EC', '#F3E9C9'];
  points.forEach((p,i)=>{
    const d = byId[p.id];
    const paletteIdx = Math.floor(rand() * starPalette.length);
    const starColor = starPalette[paletteIdx];
    const brightness = rand(); // magnitude — most stars are dim, a few are bright
    const isBright = brightness > 0.82;
    const coreR = isBright ? 2.6 : 1.1 + brightness * 1;
    const glowR = isBright ? 34 : 14 + brightness * 12;
    const delay = (i * 271) % 4200;
    svg += `
      <g class="mm-star" style="--twinkle-delay:${delay}ms" onclick="jumpFromMindMap('${p.id}')">
        <circle cx="${p.x}" cy="${p.y}" r="${glowR.toFixed(1)}" fill="url(#sg${paletteIdx})" class="mm-glow-inner"/>
        <circle cx="${p.x}" cy="${p.y}" r="${coreR.toFixed(1)}" fill="${starColor}" class="mm-core"/>
        <text x="${p.x}" y="${p.y - 15}" text-anchor="middle">${d.zh}</text>
      </g>
    `;
  });

  svg += `</svg>`;
  content.innerHTML = svg;
}

/* ---------- Reset exploration progress ---------- */
function resetExploration(){
  const confirmed = confirm('確定要重置探索軌跡嗎？這會清空「已探索」進度與意識地圖上的星星，且無法復原。（塵封軼聞的翻牌記錄不受影響）');
  if(!confirmed) return;

  visited.clear();
  try{ localStorage.removeItem(STORAGE_KEY); }catch(e){}

  document.querySelectorAll('.node.visited').forEach(el=>el.classList.remove('visited'));
  document.querySelectorAll('.node.active').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll('.edge').forEach(e=>{
    e.classList.remove('edge-active','edge-dim');
  });

  updateProgressCounter();
  selectionCount = 0;
  lastQuoteAt = 0;
  lastRandomQuoteAt = 0;

  const toast = document.getElementById('milestoneToast');
  if(toast) toast.classList.remove('show');
  const completion = document.getElementById('completionOverlay');
  if(completion) completion.classList.remove('open');
  closePanel();

  // Force the mind map to rebuild from scratch next time it's opened
  const mmContent = document.getElementById('mindMapContent');
  if(mmContent){ mmContent.dataset.built = ''; }
  renderMindMap();
}

/* ---------- Hidden treasures: things left for the curious to find ---------- */

// 1. Tab title changes when you look away, and waits for you to come back
(function setupTabTitleEasterEgg(){
  const originalTitle = document.title;
  const awayTitle = '眾神仍在等你 👁️';
  document.addEventListener('visibilitychange', ()=>{
    document.title = document.hidden ? awayTitle : originalTitle;
  });
})();

// 2. A note for whoever opens the console
console.log('%c眾神之外', 'font-size:26px; font-weight:900; color:#A6812E; font-family:serif; letter-spacing:0.1em;');
console.log('%c你發現了一個不屬於凡人視野的角落。', 'font-size:12px; color:#6B4A2F;');
console.log('%c這棵樹裡藏著比看起來更多的東西——蛇夫座從未出現在畫面上，卻始終在資料裡等人搜尋到它。', 'font-size:11px; color:#8a8578;');
console.log('%c在這裡輸入 easterEgg() 試試看。', 'font-size:11px; color:#8a8578;');
window.easterEgg = function(){
  const q = QUOTE_POOL[Math.floor(Math.random() * QUOTE_POOL.length)];
  console.log('%c'+q.text, 'font-size:14px; color:#A6812E; font-style:italic;');
  console.log('%c—— '+q.author, 'font-size:11px; color:#8a8578;');
  try{ playEggChime(); }catch(e){}
  try{ spawnSparkles(window.innerWidth/2, window.innerHeight/2); }catch(e){}
  return '✦ 願你在探索裡，也找到自己的答案。';
};
