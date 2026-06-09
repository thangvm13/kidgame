/* ═══════════════════════════════════════
   KID LEARNING HUB — Shared Game Engine
   Expects window.SUBJECT to be defined
   ═══════════════════════════════════════ */
(function(){
  const S = window.SUBJECT;
  const QS = 10;
  let level=null, questions=[], qi=0, score=0, correct=0, wrong=0, answered=false, calcInput='';

  // Stars store per subject+level
  function starKey(lv){ return 'stars_'+S.id+'_'+lv; }
  function getStars(lv){ return parseInt(localStorage.getItem(starKey(lv))||'0'); }
  function setStars(lv,n){ localStorage.setItem(starKey(lv), Math.max(getStars(lv),n)); }
  function totalStars(){ return S.levels.reduce((s,l)=>s+getStars(l.id),0); }

  // ── SCREENS ──
  function show(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0,0);
  }

  // ── INIT ──
  function init(){
    document.body.classList.add(S.theme);
    document.getElementById('lv-emoji').textContent = S.emoji;
    document.getElementById('lv-title').textContent = S.name;
    document.getElementById('lv-sub').textContent   = S.tagline;
    renderLevels();
    show('screen-level');
  }

  function renderLevels(){
    const wrap = document.getElementById('level-cards');
    wrap.innerHTML = S.levels.map(lv=>{
      const stars = getStars(lv.id);
      const starStr = stars ? '⭐'.repeat(stars)+'☆'.repeat(3-stars) : '☆☆☆';
      return `<button class="level-card" onclick="G.pickLevel('${lv.id}')">
        <span class="lv-icon">${lv.icon}</span>
        <div><div class="lv-name">${lv.name}</div><div class="lv-desc">${lv.desc}</div></div>
        <span class="lv-stars">${starStr}</span>
      </button>`;
    }).join('');
  }

  function pickLevel(id){
    level = S.levels.find(l=>l.id===id);
    qi=0; score=0; correct=0; wrong=0; answered=false;
    questions = shuffle([...level.questions]).slice(0,QS);
    show('screen-game');
    renderQ();
  }

  // ── QUESTION LOOP ──
  function renderQ(){
    if(qi>=QS){ showResults(); return; }
    answered=false; calcInput='';
    const pct = (qi/QS)*100;
    document.getElementById('prog-fill').style.width=pct+'%';
    document.getElementById('g-score').textContent = score;
    const q = questions[qi];
    if(q.type==='mc' || q.type==='fill') renderMC(q);
    else if(q.type==='calc') renderCalc(q);
  }

  function renderMC(q){
    const isFill = q.type==='fill';
    const sentence = isFill ? q.q.replace('___','<span class="blank" id="blank">___</span>') : '';
    document.getElementById('q-card').innerHTML = `
      <div class="q-num">Câu ${qi+1} / ${QS}</div>
      ${q.emoji?`<span class="q-emoji">${q.emoji}</span>`:''}
      ${isFill
        ? `<p class="fill-sentence">${sentence}</p>`
        : `<p class="q-text">${q.q}</p>`}
      ${q.hint?`<p class="q-hint">💡 ${q.hint}</p>`:''}
    `;
    const opts = shuffle([...q.opts]);
    document.getElementById('ans-area').innerHTML = `
      <div class="${opts.length<=2?'opts-2':'opts-4'}">
        ${opts.map(o=>`<button class="opt" onclick="G.checkMC('${esc(o)}','${esc(q.ans)}',this)">${o}</button>`).join('')}
      </div>`;
  }

  function renderCalc(q){
    document.getElementById('q-card').innerHTML = `
      <div class="q-num">Câu ${qi+1} / ${QS}</div>
      ${q.emoji?`<span class="q-emoji">${q.emoji}</span>`:''}
      <p class="q-text">${q.q}</p>
      <div class="calc-display" id="calc-display">?</div>
    `;
    document.getElementById('ans-area').innerHTML = `
      <div class="numpad">
        ${[7,8,9,4,5,6,1,2,3].map(n=>`<button class="num-btn" onclick="G.numPress('${n}')">${n}</button>`).join('')}
        <button class="num-btn num-del" onclick="G.numDel()">⌫</button>
        <button class="num-btn" onclick="G.numPress('0')">0</button>
        <button class="num-btn num-ok" onclick="G.numOK('${esc(q.ans)}')">✅ OK</button>
      </div>`;
  }

  // ── ANSWER HANDLERS ──
  function checkMC(sel,ans,btn){
    if(answered) return;
    answered=true;
    const ok = sel===ans;
    document.querySelectorAll('.opt').forEach(b=>{
      if(b.textContent.trim()===ans) b.classList.add('correct');
      else if(b.textContent.trim()===sel) b.classList.add('wrong');
    });
    const blank=document.getElementById('blank');
    if(blank){ blank.textContent=ans; blank.style.color=ok?'#4CAF50':'#FF5252'; }
    tally(ok,ans);
  }

  function numPress(n){
    if(answered) return;
    if(calcInput.length>=8) return;
    calcInput+=n;
    document.getElementById('calc-display').textContent=calcInput;
  }
  function numDel(){
    if(answered) return;
    calcInput=calcInput.slice(0,-1);
    document.getElementById('calc-display').textContent=calcInput||'?';
  }
  function numOK(ans){
    if(answered||!calcInput) return;
    answered=true;
    const ok=calcInput===ans;
    document.getElementById('calc-display').textContent=ans;
    document.getElementById('calc-display').style.color=ok?'#4CAF50':'#FF5252';
    tally(ok,ans);
  }

  function tally(ok,ans){
    if(ok){ score++; correct++; confetti(); }
    else{ wrong++; }
    toast(ok, ok?null:`Đáp án: ${ans}`);
    setTimeout(()=>{ qi++; renderQ(); }, 1700);
  }

  // ── TOAST ──
  const GOOD=['Xuất sắc! 🌟','Tuyệt vời! 🎉','Đúng rồi! 🥳','Giỏi lắm! 💪','Chuẩn rồi! 🎯','Ôi ngầu quá! 🔥'];
  const BAD =['Chưa đúng rồi 😅','Cố lên nhé! 💪','Học thêm nào! 📚'];
  function toast(ok,sub){
    document.getElementById('toast-ico').textContent  = ok?'✅':'❌';
    document.getElementById('toast-main').textContent = ok?GOOD[Math.floor(Math.random()*GOOD.length)]:BAD[Math.floor(Math.random()*BAD.length)];
    document.getElementById('toast-sub').textContent  = sub||'';
    const el=document.getElementById('toast');
    el.classList.add('show');
    setTimeout(()=>el.classList.remove('show'),1400);
  }

  // ── RESULTS ──
  function showResults(){
    const pct=score/QS;
    const stars = pct>=.9?3:pct>=.6?2:1;
    setStars(level.id,stars);
    renderLevels();
    let emoji,title,msg;
    if(pct>=.9){ emoji='🏆'; title='Xuất sắc!'; msg='Bé học giỏi lắm! Tiếp tục nhé!'; confetti(); setTimeout(confetti,500); }
    else if(pct>=.6){ emoji='🌟'; title='Tốt lắm!'; msg='Cố gắng thêm để đạt 3 sao nhé!'; }
    else{ emoji='💪'; title='Cố lên nào!'; msg='Ôn lại và thử lại nhé bé!'; }
    document.getElementById('r-ico').textContent   = emoji;
    document.getElementById('r-title').textContent = title;
    document.getElementById('r-score').textContent = `${score}/${QS}`;
    document.getElementById('r-stars').textContent = '⭐'.repeat(stars)+'☆'.repeat(3-stars);
    document.getElementById('r-correct').textContent=correct;
    document.getElementById('r-wrong').textContent  =wrong;
    document.getElementById('r-msg').textContent    =msg;
    show('screen-results');
  }

  // ── CONFETTI ──
  function confetti(){
    const wrap=document.getElementById('cf-wrap');
    const cols=['#FFD93D','#FF6B6B','#4ECDC4','#A8E6CF','#C3B1E1','#FF8B94'];
    for(let i=0;i<16;i++){
      setTimeout(()=>{
        const d=document.createElement('div');
        d.className='cf';
        d.style.left=Math.random()*100+'vw';
        d.style.background=cols[Math.floor(Math.random()*cols.length)];
        d.style.animationDuration=(.5+Math.random()*.9)+'s';
        wrap.appendChild(d); setTimeout(()=>d.remove(),1200);
      },i*40);
    }
  }

  // ── UTILS ──
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
  function esc(s){ return s.replace(/'/g,"\\'"); }

  // ── PUBLIC API ──
  window.G = { pickLevel, checkMC, numPress, numDel, numOK,
    replay:()=>pickLevel(level.id),
    home:()=>show('screen-level') };

  document.addEventListener('DOMContentLoaded', init);
})();
