function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(page).classList.add('active');
  if (page === 'maps') setTimeout(drawMapsCanvas, 100);
  if (page === 'sos') { startSosTimer(); setTimeout(drawSosMap, 100); }
  if (page === 'home') setTimeout(drawHomeMap, 100);
}

// ======= MODAL =======
function showModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(e, el) {
  if (!e || e.target === el) el.classList.remove('open');
}

// ======= SOS TIMER =======
let sosInterval = null;
function startSosTimer() {
  let t = 5;
  const el = document.getElementById('sosTimer');
  if (el) el.textContent = t;
  clearInterval(sosInterval);
  sosInterval = setInterval(() => {
    t--;
    if (el) el.textContent = Math.max(t, 0);
    if (t <= 0) clearInterval(sosInterval);
  }, 1000);
}
function cancelSOS() {
  clearInterval(sosInterval);
  navigate('home');
}

// ======= MAP DRAWING HELPERS =======
function drawMap(canvas, w, h, markers, routePoints, showGrid) {
  if (!canvas) return;
  canvas.width = w || canvas.offsetWidth || 600;
  canvas.height = h || canvas.offsetHeight || 350;
  const ctx = canvas.getContext('2d');
  const cw = canvas.width, ch = canvas.height;

  // Background terrain
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, '#2d4a1e');
  grad.addColorStop(0.4, '#3a5a28');
  grad.addColorStop(0.7, '#2a4535');
  grad.addColorStop(1, '#1e3a2a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);

  // Roads grid
  ctx.strokeStyle = 'rgba(255,240,200,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < cw; x += 60) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,ch); ctx.stroke(); }
  for (let y = 0; y < ch; y += 60) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cw,y); ctx.stroke(); }

  // River
  ctx.beginPath();
  ctx.moveTo(cw * 0.28, 0);
  ctx.bezierCurveTo(cw * 0.32, ch * 0.3, cw * 0.22, ch * 0.6, cw * 0.3, ch);
  ctx.strokeStyle = 'rgba(50,120,220,0.7)';
  ctx.lineWidth = 18;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(80,160,255,0.4)';
  ctx.lineWidth = 12;
  ctx.stroke();

  // Main roads
  ctx.strokeStyle = 'rgba(255,240,160,0.5)';
  ctx.lineWidth = 3;
  [[0, ch*0.4, cw, ch*0.4],[cw*0.5,0,cw*0.5,ch],[cw*0.15,0,cw*0.65,ch],[0,ch*0.7,cw,ch*0.55]].forEach(([x1,y1,x2,y2]) => {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  });

  // Buildings
  ctx.fillStyle = 'rgba(180,160,120,0.3)';
  [[20,20,50,40],[70,25,40,35],[cw-80,30,55,40],[cw-60,ch-70,50,45],[30,ch-60,55,40]].forEach(([x,y,w2,h2]) => {
    ctx.fillRect(x,y,w2,h2);
  });

  // Route
  if (routePoints && routePoints.length > 1) {
    ctx.setLineDash([6,5]);
    ctx.strokeStyle = 'rgba(0,180,255,0.85)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(routePoints[0][0]*cw, routePoints[0][1]*ch);
    for (let i=1;i<routePoints.length;i++) ctx.lineTo(routePoints[i][0]*cw, routePoints[i][1]*ch);
    ctx.stroke();
    ctx.setLineDash([]);
    // Route dots
    routePoints.forEach(([rx,ry]) => {
      ctx.beginPath(); ctx.arc(rx*cw, ry*ch, 4, 0, Math.PI*2);
      ctx.fillStyle = '#00e5ff'; ctx.fill();
    });
  }

  // Markers
  markers.forEach(([mx,my,type,label]) => {
    const px = mx*cw, py = my*ch;
    // Shadow
    ctx.beginPath(); ctx.arc(px,py+28,10,0,Math.PI*2);
    ctx.fillStyle='rgba(0,0,0,0.3)'; ctx.fill();

    if (type==='hospital') {
      drawPin(ctx,px,py,'#e53935','#fff','🏥');
    } else if (type==='danger') {
      drawPin(ctx,px,py,'#f57c00','#fff','⚠');
    } else if (type==='safe') {
      drawPin(ctx,px,py,'#2dc653','#fff','🛡');
    } else if (type==='blue') {
      ctx.beginPath(); ctx.arc(px,py,8,0,Math.PI*2);
      ctx.fillStyle='#1565c0'; ctx.fill();
      ctx.beginPath(); ctx.arc(px,py,5,0,Math.PI*2);
      ctx.fillStyle='#4fc3f7'; ctx.fill();
    }
  });
}

function drawPin(ctx,x,y,color,fg,icon) {
  ctx.beginPath();
  ctx.moveTo(x,y+24); ctx.lineTo(x-14,y); ctx.arc(x,y-10,16,Math.PI*0.85,-Math.PI*0.15,false); ctx.lineTo(x,y+24);
  ctx.fillStyle=color; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=1.5; ctx.stroke();
  ctx.font='14px serif'; ctx.fillStyle=fg; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(icon, x, y-10);
}

function drawHomeMap() {
  const c = document.getElementById('homeMapCanvas');
  if (!c) return;
  c.width = c.offsetWidth; c.height = c.offsetHeight || 280;
  drawMap(c, c.width, c.height,
    [[0.65,0.25,'hospital','City Hospital'],[0.35,0.45,'danger','Gas Leak'],[0.45,0.6,'hospital','Shelter'],[0.7,0.7,'safe','School'],[0.25,0.75,'danger','Market']],
    [[0.75,0.18],[0.62,0.35],[0.52,0.5],[0.42,0.65],[0.3,0.78]]
  );
}

function drawSosMap() {
  const c = document.getElementById('sosMapCanvas');
  if (!c) return;
  c.width = c.offsetWidth; c.height = 240;
  drawMap(c, c.width, 240,
    [[0.65,0.25,'hospital'],[0.35,0.45,'danger'],[0.5,0.55,'hospital'],[0.7,0.75,'danger']],
    [[0.75,0.2],[0.6,0.38],[0.5,0.55],[0.35,0.7]]
  );
}

function drawMapsCanvas() {
  const c = document.getElementById('mapsCanvas');
  if (!c) return;
  c.width = c.offsetWidth || 600;
  c.height = c.offsetHeight || 500;
  drawMap(c, c.width, c.height,
    [[0.65,0.22,'hospital','City Hospital'],[0.38,0.42,'danger','Gas Leak'],[0.48,0.58,'hospital','Shelter'],[0.72,0.72,'safe','School'],[0.28,0.72,'danger','Market'],[0.55,0.42,'blue','You']],
    [[0.72,0.18],[0.62,0.32],[0.55,0.42],[0.48,0.58],[0.32,0.7]]
  );
}

// ======= AI CHAT =======
const aiResponses = {
  default: [
    { q: "How do I perform CPR?", a: "1. Check responsiveness. 2. Call for help. 3. Begin chest compressions — 30 compressions, 2 breaths. 4. Continue until help arrives." },
    { q: "What is the fuel estimate for 50km?", a: "For a standard vehicle (15 km/L), you'll need approximately 3.3 litres for 50 km. For a truck (6 km/L), approximately 8.3 litres." },
    { q: "How to treat a burn?", a: "1. Cool the burn with running water for 20 minutes. 2. Cover loosely with cling film or a clean dressing. 3. Do not use ice or butter. 4. Seek medical help for severe burns." },
    { q: "How to distribute food for 100 people?", a: "Estimate 2500 kcal per adult per day. Prioritize children, elderly, and injured. Use equal portions by weight. Track distribution with a checklist." }
  ]
};
let msgCount = 0;

function sendAiQuestion() {
  const input = document.getElementById('aiPageInput');
  if (!input.value.trim()) return;
  addChatMsg(input.value, 'question');
  const resp = aiResponses.default[msgCount % aiResponses.default.length];
  setTimeout(() => addChatMsg(resp.a, 'answer'), 600);
  msgCount++;
  input.value = '';
}

function sendChatMsg() {
  const input = document.getElementById('aiChatInput');
  if (!input.value.trim()) return;
  addChatMsg(input.value, 'question');
  const resp = aiResponses.default[msgCount % aiResponses.default.length];
  setTimeout(() => addChatMsg(resp.a, 'answer'), 600);
  msgCount++;
  input.value = '';
}

function addChatMsg(text, type) {
  const chat = document.getElementById('aiChat');
  const div = document.createElement('div');
  if (type === 'question') {
    div.className = 'chat-response';
    div.style.alignSelf='flex-start';
    div.style.borderRadius='9px 9px 9px 0';
    div.innerHTML = `<div class="chat-prompt-q">👤 ${text}</div>`;
  } else {
    div.className = 'chat-prompt';
    div.innerHTML = `<div class="chat-prompt-q">🤖 AI Response</div><div style="font-size:12.5px;color:var(--text2);">${text}</div>`;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function askQuestion(topic) {
  document.getElementById('aiPageInput').value = topic;
  navigate('ai');
  setTimeout(sendAiQuestion, 200);
}

function setAiTab(el, tab) {
  document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ======= INIT =======
window.addEventListener('load', () => {
  drawHomeMap();
  // Resize listener for maps
  window.addEventListener('resize', () => {
    const active = document.querySelector('.page.active');
    if (!active) return;
    if (active.id === 'home') drawHomeMap();
    if (active.id === 'maps') drawMapsCanvas();
    if (active.id === 'sos') drawSosMap();
  });
});