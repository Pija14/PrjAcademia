const TRAININGS = {
  A: {
    name: "Treino A",
    muscles: ["Costas", "Bíceps", "Abdominais"],
    sections: [
      {name:"Costas", exercises:[
        ["Puxador frente","4","12/12/8/8"],
        ["Crucifixo inverso","",""],
        ["Extensão lombar","",""],
        ["Máquina remo ART","4","8"],
        ["Pull down","",""],
        ["Pull-over","",""],
        ["Puxador triangular ART","4","12/12/8/8"],
        ["Máquina remo ART aberta","4","8"]
      ]},
      {name:"Bíceps", exercises:[
        ["Banco Scott","4","8 (P.C.)"],
        ["Rosca Cross Over","4","8"],
        ["Rosca","",""],
        ["Rosca","",""]
      ]},
      {name:"Abdominais", exercises:[
        ["Crunch","",""],
        ["Crunch + remador","4","15 + 10"],
        ["Flexão lateral","",""],
        ["Inferior","",""],
        ["Oblíquo","",""],
        ["Tesoura","",""],
        ["Prancha 30m.","4","45 segundos"]
      ]}
    ]
  },
  B: {
    name: "Treino B",
    muscles: ["Peitorais", "Tríceps", "Ombros"],
    sections: [
      {name:"Peitorais", exercises:[
        ["Cross Over","",""],
        ["Crucifixo aberto inclinado","4","8"],
        ["Fly máquina","4","8"],
        ["Paralelas aberta","",""],
        ["Supino ART","4","12/12/8/8"],
        ["Voador / Peck Deck","",""],
        ["Supino reto (H)","4","12/12/8/8"]
      ]},
      {name:"Tríceps", exercises:[
        ["Tríceps puxador W","4","8 (P.C.)"],
        ["Tríceps francês polia","4","8"],
        ["Tríceps graviton","",""],
        ["Supino tríceps","",""],
        ["Tríceps coice","",""]
      ]},
      {name:"Ombros", exercises:[
        ["Crucifixo inverso polia","",""],
        ["Desenvolvimento F/C","",""],
        ["Elevação frontal","4","16"],
        ["Remada alta","",""],
        ["Elevação lateral","4","8"]
      ]}
    ]
  },
  C: {
    name: "Treino C",
    muscles: ["Membros inferiores"],
    sections: [
      {name:"Membros inferiores", exercises:[
        ["Agachamento barra","",""],
        ["Agachamento Hack","3–4","12/12/8/8"],
        ["Cadeira extensora","4","8"],
        ["Cadeira flexora","4","8"],
        ["Leg Press A/B","",""],
        ["Leg Press 45°","3–4","12/12/8/8"],
        ["Stiff","",""],
        ["Cadeira abdutora","",""],
        ["Cadeira adutora","",""],
        ["Banco sóleo","4","12"],
        ["Gêmeos máquina","4","12"],
        ["Glúteos","",""],
        ["Agachamento sumô (H)","3–4","8"],
        ["Mesa flexora","4","8"]
      ]}
    ]
  }
};

const ALL_EXERCISES = Object.fromEntries(
  Object.entries(TRAININGS).flatMap(([t, d]) =>
    d.sections.flatMap(s => s.exercises.map((e, i) => [
      `${t}-${s.name}-${i}`, {id:`${t}-${s.name}-${i}`, training:t, section:s.name, name:e[0], sets:e[1], reps:e[2]}
    ]))
  )
);

const KEY = "meuTreinoDataV1";
const DEFAULTS = {
  workouts: [],
  settings: {rest:60, sound:true, vibration:true, theme:"light"},
  excludedExercises: {A:[],B:[],C:[]},
  customExercises: {A:[],B:[],C:[]},
  workoutPlans: {A:null,B:null,C:null},
  workoutNames: {A:"Treino A",B:"Treino B",C:"Treino C"}
};
let db = JSON.parse(localStorage.getItem(KEY) || "null") || DEFAULTS;
if(!db.excludedExercises) db.excludedExercises = {A:[],B:[],C:[]};
if(!db.customExercises) db.customExercises = {A:[],B:[],C:[]};
if(!db.workoutPlans) db.workoutPlans = {A:null,B:null,C:null};
if(!db.workoutNames) db.workoutNames = {A:"Treino A",B:"Treino B",C:"Treino C"};
["A","B","C"].forEach(k=>{
  if(!Array.isArray(db.excludedExercises[k])) db.excludedExercises[k]=[];
  if(!Array.isArray(db.customExercises[k])) db.customExercises[k]=[];
});
let state = { page:"home", training:null, exerciseIndex:0, workout:null, exerciseTimer:0, exerciseRunning:false, exerciseStartedAt:null, restTimer:0, restRunning:false, timerInterval:null, restInterval:null };

function save(){ localStorage.setItem(KEY, JSON.stringify(db)); }
function pad(n){ return String(n).padStart(2,"0"); }
function fmt(sec){ sec=Math.max(0,Math.floor(sec)); return `${pad(Math.floor(sec/3600))}:${pad(Math.floor(sec%3600/60))}:${pad(sec%60)}`; }
function fmtShort(sec){ sec=Math.max(0,Math.floor(sec)); return `${pad(Math.floor(sec/60))}:${pad(sec%60)}`; }
function esc(s){ return String(s).replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }
function flatTraining(code){
  // Quando o treino foi personalizado, sua lista passa a ser a fonte oficial.
  const plan = db.workoutPlans?.[code];
  if(Array.isArray(plan)){
    return plan.filter(e=>e.enabled!==false).map(e=>({
      id:e.id, section:e.section||"Outros", name:e.name, sets:e.sets||"", reps:e.reps||"", custom:!!e.custom
    }));
  }
  const excluded = new Set(db.excludedExercises?.[code] || []);
  const base = TRAININGS[code].sections.flatMap(s=>s.exercises.map((e,i)=>({
    id:`${code}-${s.name}-${i}`, section:s.name, name:e[0], sets:e[1], reps:e[2]
  })));
  const custom = (db.customExercises?.[code] || []).map(e=>({
    id:e.id, section:e.section || "Outros", name:e.name, sets:e.sets || "", reps:e.reps || "", custom:true
  }));
  return [...base, ...custom].filter(e=>!excluded.has(e.id));
}
function trainingName(code){ return db.workoutNames?.[code] || TRAININGS[code].name; }
function allExerciseLibrary(){
  const base=[];
  Object.entries(TRAININGS).forEach(([code,t])=>t.sections.forEach(s=>s.exercises.forEach((e,i)=>base.push({
    id:`${code}-${s.name}-${i}`, name:e[0], section:s.name, sets:e[1]||"", reps:e[2]||"", source:`Treino ${code}`
  }))));
  Object.entries(db.customExercises||{}).forEach(([code,list])=>list.forEach(e=>base.push({
    id:e.id, name:e.name, section:e.section||"Outros", sets:e.sets||"", reps:e.reps||"", source:`Meus exercícios • ${code}` , custom:true
  })));
  return base;
}
function ensureWorkoutPlan(code){
  if(Array.isArray(db.workoutPlans?.[code])) return db.workoutPlans[code];
  const excluded=new Set(db.excludedExercises?.[code]||[]);
  const plan=allExerciseLibrary().filter(e=>e.source===`Treino ${code}` || e.source===`Meus exercícios • ${code}`).map(e=>({...e,enabled:!excluded.has(e.id)}));
  db.workoutPlans[code]=plan; save(); return plan;
}
function customizeTraining(code){ ensureWorkoutPlan(code); editTraining(code); }
function editTraining(code){
  const plan=ensureWorkoutPlan(code);
  const used=new Set(plan.map(e=>e.id));
  const available=allExerciseLibrary().filter(e=>!used.has(e.id));
  const sections=[...new Set(plan.map(e=>e.section||"Outros"))];
  const grouped=sections.map(sec=>({sec,items:plan.filter(e=>(e.section||"Outros")===sec)}));
  layout(`<button class="back" onclick="viewTraining('${code}')">‹ Voltar</button>
    <div class="detail-head"><span class="badge">${code}</span><div><h2>Personalizar ${esc(trainingName(code))}</h2><p>Monte seu treino com exercícios existentes ou crie novos.</p></div></div>
    <section class="settings-card"><label>Nome do treino<input id="workoutNameEdit" value="${esc(trainingName(code))}" maxlength="50" placeholder="Ex.: Treino A — Força"></label></section>
    <div class="training-tools"><span>${plan.filter(e=>e.enabled!==false).length} ativos • ${plan.length} no treino</span><button class="secondary compact" onclick="activatePlanAll('${code}')">Ativar todos</button></div>
    ${grouped.map(g=>`<section class="section"><div class="section-title">${esc(g.sec)}</div>${g.items.map((e,i)=>`<div class="exercise-row ${e.enabled===false?'exercise-disabled':''}">
      <div><b>${esc(e.name)}</b><small>${esc(e.source||'Exercício')}${e.sets?` • ${esc(e.sets)} séries`:''}${e.reps?` • ${esc(e.reps)}`:''}${e.enabled===false?' • desativado':''}</small></div>
      <label class="exercise-switch"><input type="checkbox" ${e.enabled!==false?'checked':''} onchange="setPlanEnabled('${code}',${JSON.stringify(e.id)},this.checked)"><span class="switch-slider"></span></label>
      <button class="delete-exercise" title="Remover do treino" onclick="removeFromPlan('${code}',${JSON.stringify(e.id)})">×</button>
    </div>`).join('')}</section>`).join('')}
    <section class="settings-card"><h3>Adicionar exercício existente</h3><p class="muted">Escolha qualquer exercício que já esteja cadastrado no aplicativo.</p>
      <select id="libraryExerciseSelect"><option value="">Selecione um exercício...</option>${available.map(e=>`<option value="${esc(e.id)}">${esc(e.name)} — ${esc(e.source||e.section)}</option>`).join('')}</select>
      <button class="secondary full" onclick="addExistingToPlan('${code}')">＋ Adicionar selecionado</button>
    </section>
    <button class="add-exercise" onclick="openAddExercise('${code}',true)">＋ Criar exercício manualmente neste treino</button>
    <button class="primary full" onclick="saveTrainingCustomization('${code}')">✓ Salvar meu ${esc(trainingName(code))}</button>`,'trainings');
}
function setPlanEnabled(code,id,enabled){ const p=ensureWorkoutPlan(code), e=p.find(x=>x.id===id); if(e)e.enabled=enabled; save(); editTraining(code); }
function removeFromPlan(code,id){ if(!confirm('Remover este exercício deste treino? Ele não será apagado da biblioteca.'))return; db.workoutPlans[code]=ensureWorkoutPlan(code).filter(e=>e.id!==id); save(); editTraining(code); }
function addExistingToPlan(code){ const id=document.getElementById('libraryExerciseSelect')?.value; if(!id)return; const item=allExerciseLibrary().find(e=>e.id===id); if(!item)return; ensureWorkoutPlan(code).push({...item,enabled:true}); save(); editTraining(code); }
function activatePlanAll(code){ ensureWorkoutPlan(code).forEach(e=>e.enabled=true); save(); editTraining(code); }
function saveTrainingCustomization(code){
  const name=document.getElementById('workoutNameEdit')?.value.trim() || `Treino ${code}`;
  db.workoutNames[code]=name; save(); viewTraining(code);
}

function todayISO(){ return new Date().toISOString().slice(0,10); }
function dateBR(iso){ if(!iso)return ""; const [y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }
function totalExercises(code){ return flatTraining(code).length; }
function monthLabel(y,m){ return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date(y,m,1)); }

function layout(content, active="home"){
  document.getElementById("app").innerHTML = `
  <div class="shell">
    <header class="topbar"><div><div class="eyebrow">CONTROLE DE TREINO</div><h1>Meu Treino</h1></div>
      <button class="iconbtn" onclick="openSettings()" aria-label="Configurações">⚙</button>
    </header>
    <main>${content}</main>
    <nav class="bottomnav">
      <button class="${active==='home'?'active':''}" onclick="go('home')"><span>⌂</span>Início</button>
      <button class="${active==='calendar'?'active':''}" onclick="go('calendar')"><span>▦</span>Calendário</button>
      <button class="${active==='trainings'?'active':''}" onclick="go('trainings')"><span>💪</span>Treinos</button>
      <button class="${active==='history'?'active':''}" onclick="go('history')"><span>◷</span>Histórico</button>
    </nav>
  </div>`;
}

function go(page){ stopIntervals(); state.page=page; state.training=null; state.workout=null; if(page==="home")renderHome(); if(page==="calendar")renderCalendar(); if(page==="trainings")renderTrainings(); if(page==="history")renderHistory(); }
function renderHome(){
  const recent=db.workouts[db.workouts.length-1];
  const month=todayISO().slice(0,7);
  const count=db.workouts.filter(w=>w.date.startsWith(month)).length;
  const total=db.workouts.reduce((a,w)=>a+(w.totalTime||0),0);
  layout(`
    <section class="hero"><div><span class="pill">4–5x por semana</span><h2>Pronto para treinar?</h2><p>Escolha a divisão e acompanhe cada exercício, série e tempo.</p></div><div class="hero-icon">⚡</div></section>
    <div class="stats"><div><b>${count}</b><span>treinos no mês</span></div><div><b>${fmtShort(total)}</b><span>tempo total</span></div><div><b>${recent?recent.type:"—"}</b><span>último treino</span></div></div>
    <h3>Divisão</h3>
    <div class="training-grid">${["A","B","C"].map(code=>{
      const t=TRAININGS[code];
      return `<article class="training-card ${code.toLowerCase()}"><div class="card-top"><span class="badge">${code}</span><span class="exercise-count">${totalExercises(code)} exercícios</span></div><h3>${esc(trainingName(code))}</h3><p>${t.muscles.join(" • ")}</p><button class="primary" onclick="startWorkout('${code}')">▶ Iniciar treino</button></article>`
    }).join("")}</div>
    ${recent?`<section class="recent"><div><span class="eyebrow">ÚLTIMO TREINO</span><h3>${recent.type} • ${dateBR(recent.date)}</h3><p>${fmt(recent.totalTime||0)} • ${recent.completedExercises||0} exercícios</p></div><button class="secondary" onclick="showWorkoutDetails('${recent.id}')">Detalhes</button></section>`:""}
  `,"home");
}

function renderTrainings(){
  layout(`<h2>Treinos A, B e C</h2><p class="muted">Toque em um treino para ver todos os exercícios.</p>
    <div class="list">${["A","B","C"].map(c=>`<button class="list-card" onclick="viewTraining('${c}')"><span class="badge">${c}</span><div><b>${esc(trainingName(c))}</b><small>${TRAININGS[c].muscles.join(" • ")}</small></div><span>›</span></button>`).join("")}</div>`,"trainings");
}

function exerciseId(code, section, index){ return `${code}-${section}-${index}`; }

function isExerciseEnabled(code, id){
  return !(db.excludedExercises?.[code] || []).includes(id);
}

function toggleExercise(code, id, enabled){
  if(Array.isArray(db.workoutPlans?.[code])){
    const e=db.workoutPlans[code].find(x=>x.id===id); if(e)e.enabled=enabled;
  }else{
    if(!db.excludedExercises[code])db.excludedExercises[code]=[];
    const list=db.excludedExercises[code];
    if(enabled) db.excludedExercises[code]=list.filter(x=>x!==id);
    else if(!list.includes(id)) list.push(id);
  }
  save(); viewTraining(code);
}

function restoreExercises(code){
  if(Array.isArray(db.workoutPlans?.[code])){db.workoutPlans[code].forEach(e=>e.enabled=true);save();viewTraining(code);return;}
  if(!db.excludedExercises?.[code]?.length){alert('Todos os exercícios já estão ativos.');return;}
  db.excludedExercises[code]=[]; save(); viewTraining(code);
}

function openAddExercise(code, intoPlan=false){
  const groups = TRAININGS[code].sections.map(s=>s.name);
  layout(`<button class="back" onclick="${intoPlan?`editTraining('${code}')`:`viewTraining('${code}')`}">‹ Voltar</button>
    <div class="detail-head"><span class="badge">${code}</span><div><h2>Adicionar exercício</h2><p>${intoPlan?'Crie um exercício diretamente neste treino.':`Personalize seu ${esc(trainingName(code))}`}</p></div></div>
    <form class="exercise-form" onsubmit="event.preventDefault(); saveCustomExercise('${code}',${intoPlan})">
      <label>Nome do exercício
        <input id="newExerciseName" required maxlength="80" placeholder="Ex.: Rosca direta">
      </label>
      <label>Grupo muscular
        <select id="newExerciseSection">
          ${groups.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join("")}
          <option value="Outros">Outros</option>
        </select>
      </label>
      <div class="form-grid">
        <label>Séries
          <input id="newExerciseSets" inputmode="numeric" maxlength="10" placeholder="Ex.: 4">
        </label>
        <label>Repetições / tempo
          <input id="newExerciseReps" maxlength="30" placeholder="Ex.: 10 ou 45s">
        </label>
      </div>
      <p class="form-hint">Você pode deixar séries e repetições em branco e preencher durante o treino.</p>
      <button class="primary full" type="submit">✓ Salvar exercício</button>
      <button class="secondary full" type="button" onclick="viewTraining('${code}')">Cancelar</button>
    </form>`);
  setTimeout(()=>document.getElementById("newExerciseName")?.focus(),50);
}

function saveCustomExercise(code, intoPlan=false){
  const name=document.getElementById("newExerciseName")?.value.trim();
  const section=document.getElementById("newExerciseSection")?.value.trim() || "Outros";
  const sets=document.getElementById("newExerciseSets")?.value.trim() || "";
  const reps=document.getElementById("newExerciseReps")?.value.trim() || "";
  if(!name){ alert("Informe o nome do exercício."); return; }
  const id=`custom-${code}-${Date.now()}`;
  db.customExercises[code].push({id,name,section,sets,reps});
  if(intoPlan){ ensureWorkoutPlan(code).push({id,name,section,sets,reps,custom:true,source:'Criado neste treino',enabled:true}); }
  save();
  intoPlan ? editTraining(code) : viewTraining(code);
}

function viewTraining(code){
  const t=TRAININGS[code];
  const customized=Array.isArray(db.workoutPlans?.[code]);
  const plan=customized ? db.workoutPlans[code] : null;
  const excluded=new Set(db.excludedExercises?.[code] || []);
  const custom=db.customExercises?.[code] || [];
  const visibleCount=flatTraining(code).length;
  const totalCount=customized ? plan.length : t.sections.reduce((n,s)=>n+s.exercises.length,0)+custom.length;
  const switchHtml=(id, enabled, name)=>`<label class="exercise-switch" title="${enabled?'Desativar':'Ativar'} ${esc(name)}"><input type="checkbox" ${enabled?'checked':''} onchange="toggleExercise(${JSON.stringify(code)},${JSON.stringify(id)},this.checked)" aria-label="${enabled?'Desativar':'Ativar'} ${esc(name)}"><span class="switch-slider"></span><span class="switch-text">${enabled?'ON':'OFF'}</span></label>`;
  let sectionsHtml='';
  if(customized){
    const sections=[...new Set(plan.map(e=>e.section||'Outros'))];
    sectionsHtml=sections.map(sec=>`<section class="section"><div class="section-title">${esc(sec)}</div>${plan.filter(e=>(e.section||'Outros')===sec).map((e,i)=>{const en=e.enabled!==false;return `<div class="exercise-row ${en?'':'exercise-disabled'}"><div><b>${i+1}. ${esc(e.name)}</b><small>${e.sets?esc(e.sets)+' séries':''}${e.reps?' • '+esc(e.reps):''}${e.custom?' • meu exercício':''}${en?'':' • desativado'}</small></div>${switchHtml(e.id,en,e.name)}</div>`}).join('')}</section>`).join('');
  }else{
    sectionsHtml=t.sections.map(s=>{let number=0;const rows=s.exercises.map((e,i)=>{const id=exerciseId(code,s.name,i),enabled=!excluded.has(id);number++;return `<div class="exercise-row ${enabled?'':'exercise-disabled'}"><div><b>${number}. ${esc(e[0])}</b><small>${e[1]?e[1]+' séries':'Séries não informadas'}${e[2]?' • '+e[2]:''}${enabled?'':' • desativado'}</small></div>${switchHtml(id,enabled,e[0])}</div>`}).join('');return `<section class="section"><div class="section-title">${s.name}</div>${rows}</section>`}).join('');
    const customRows=custom.map(e=>{const enabled=isExerciseEnabled(code,e.id);return `<div class="exercise-row ${enabled?'':'exercise-disabled'}"><div><b>+ ${esc(e.name)}</b><small>${esc(e.section)}${e.sets?' • '+esc(e.sets)+' séries':''}${e.reps?' • '+esc(e.reps):''}${enabled?'':' • desativado'}</small></div>${switchHtml(e.id,enabled,e.name)}</div>`}).join('');
    if(customRows) sectionsHtml+=`<section class="section"><div class="section-title">Meus exercícios</div>${customRows}</section>`;
  }
  layout(`<button class="back" onclick="go('trainings')">‹ Voltar</button>
    <div class="detail-head"><span class="badge">${code}</span><div><h2>${esc(trainingName(code))}</h2><p>${customized?'Treino personalizado':'Treino padrão'} • ${t.muscles.join(' • ')}</p></div></div>
    <div class="training-tools"><span>${visibleCount} ativo(s) de ${totalCount}</span>${customized?`<button class="secondary compact" onclick="editTraining('${code}')">✎ Editar treino</button>`:(excluded.size?`<button class="secondary compact" onclick="restoreExercises('${code}')">✓ Ativar todos</button>`:'')}</div>
    ${sectionsHtml}
    ${customized?`<button class="add-exercise" onclick="editTraining('${code}')">＋ Adicionar ou organizar exercícios</button>`:`<button class="add-exercise" onclick="openAddExercise('${code}')">＋ Adicionar exercício manualmente</button><button class="secondary full" onclick="customizeTraining('${code}')">✎ Personalizar ${esc(trainingName(code))}</button>`}
    ${visibleCount?`<button class="primary full" onclick="startWorkout('${code}')">▶ Iniciar ${esc(trainingName(code))}</button>`:`<div class="empty big">Este treino está sem exercícios ativos. Ative pelo menos um exercício para iniciar.</div>`}`,'trainings');
}

function startWorkout(code){
  stopIntervals();
  const ex=flatTraining(code);
  state.training=code; state.exerciseIndex=0; state.exerciseTimer=0; state.exerciseRunning=false; state.exerciseStartedAt=null; state.restTimer=0; state.restRunning=false;
  state.workout={id:Date.now().toString(), type:code, date:todayISO(), startedAt:new Date().toISOString(), totalTime:0, exercises:ex.map(e=>({id:e.id,name:e.name,section:e.section,prescribedSets:e.sets,prescribedReps:e.reps,duration:0,sets:[],completed:false}))};
  state.workoutTimerStart=Date.now();
  renderWorkout();
}

function currentExercise(){ return state.workout.exercises[state.exerciseIndex]; }
function startExerciseTimer(){
  if(state.exerciseRunning) return;
  state.exerciseRunning=true;
  state.exerciseStartedAt=Date.now()-(state.exerciseTimer*1000);
  startMainTick();
  renderWorkout();
}
function pauseExerciseTimer(){
  if(!state.exerciseRunning) return;
  state.exerciseTimer=(Date.now()-state.exerciseStartedAt)/1000;
  state.exerciseRunning=false;
  state.exerciseStartedAt=null;
  if(state.timerInterval){clearInterval(state.timerInterval);state.timerInterval=null;}
  updateTimers();
  renderWorkoutButtons();
}
function startMainTick(){
  if(state.timerInterval) clearInterval(state.timerInterval);
  state.timerInterval=setInterval(()=>{
    if(state.exerciseRunning && state.exerciseStartedAt) state.exerciseTimer=(Date.now()-state.exerciseStartedAt)/1000;
    updateTimers();
  },250);
}
function startRest(){
  if(state.restRunning) return;
  state.restRunning=true; state.restTimer=Number(db.settings.rest)||60;
  if(state.restInterval) clearInterval(state.restInterval);
  state.restInterval=setInterval(()=>{
    state.restTimer-=1; updateTimers();
    if(state.restTimer<=0){
      clearInterval(state.restInterval); state.restInterval=null; state.restRunning=false;
      if(navigator.vibrate && db.settings.vibration) navigator.vibrate([250,120,250]);
      beep(); renderWorkout();
    }
  },1000);
  renderWorkout();
}
function stopRest(){state.restRunning=false;if(state.restInterval){clearInterval(state.restInterval);state.restInterval=null;}}
function stopIntervals(){if(state.timerInterval)clearInterval(state.timerInterval);if(state.restInterval)clearInterval(state.restInterval);state.timerInterval=null;state.restInterval=null;}
function beep(){if(!db.settings.sound)return;try{const c=new(window.AudioContext||window.webkitAudioContext)();const o=c.createOscillator();const g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.value=.05;o.start();o.stop(c.currentTime+.18);}catch(e){}}
function updateTimers(){
  const a=document.getElementById('exerciseTimer'); if(a)a.textContent=fmt(state.exerciseTimer);
  const b=document.getElementById('restTimer'); if(b)b.textContent=fmtShort(state.restRunning?state.restTimer:(Number(db.settings.rest)||60));
  const c=document.getElementById('workoutTimer'); if(c&&state.workoutTimerStart)c.textContent=fmt((Date.now()-state.workoutTimerStart)/1000);
}

function renderWorkout(){
  const e=currentExercise(), all=state.workout.exercises, progress=Math.round(((state.exerciseIndex+1)/all.length)*100);
  const last=db.workouts.flatMap(w=>w.exercises||[]).findLast?.(x=>x.name===e.name) || null;
  layout(`
    <div class="workout-header"><button class="back" onclick="confirmExitWorkout()">‹ Sair</button><span class="pill">TREINO ${state.training}</span></div>
    <div class="workout-progress"><div style="width:${progress}%"></div></div>
    <div class="workout-meta"><span>Exercício ${state.exerciseIndex+1} de ${all.length}</span><b id="workoutTimer">${fmt((Date.now()-state.workoutTimerStart)/1000)}</b></div>
    <section class="focus-card"><span class="eyebrow">${esc(e.section)}</span><h2>${esc(e.name)}</h2><div class="prescription">${e.prescribedSets||"Séries não informadas"} ${e.prescribedSets ? '<span>×</span> ' : ''}${e.prescribedReps||""}</div>
      <div class="big-timer" id="exerciseTimer">${fmt(state.exerciseTimer)}</div>
      <div class="timer-actions"><button class="timer-start" onclick="${state.exerciseRunning?'pauseExerciseTimer()':'startExerciseTimer()'}">${state.exerciseRunning?'⏸ Pausar':'▶ Iniciar'}</button><button class="secondary" onclick="resetExerciseTimer()">↺ Zerar</button></div>
    </section>
    <section class="rest-card"><div><span class="eyebrow">DESCANSO</span><b id="restTimer">${fmtShort(state.restRunning?state.restTimer:db.settings.rest)}</b></div><button class="secondary" onclick="${state.restRunning?'stopRest();renderWorkout()':'startRest()'}">${state.restRunning?'Parar':'Iniciar descanso'}</button></section>
    ${last&&last.sets?.length?`<div class="last-load">Último registro: ${last.sets.map(s=>(s.weight?s.weight+" kg":"sem carga")).join(" • ")}</div>`:""}
    <section class="sets-card"><div class="section-title">Séries e carga</div>${renderSets(e)}</section>
    <div class="nav-ex"><button class="secondary" ${state.exerciseIndex===0?"disabled":""} onclick="prevExercise()">← Anterior</button><button class="primary" ${e.completed?"":"disabled"} onclick="finishExercise()">${state.exerciseIndex===all.length-1?"Finalizar treino":"Próximo →"}</button></div>
  `);
  if(state.exerciseRunning) startMainTick();
  updateTimers();
}
function renderWorkoutButtons(){ const b=document.querySelector('.timer-start'); if(b)b.textContent=state.exerciseRunning?'⏸ Pausar':'▶ Iniciar'; }
function resetExerciseTimer(){ pauseExerciseTimer(); state.exerciseTimer=0; state.exerciseStartedAt=null; updateTimers(); }
function renderSets(e){
  const count=parseInt(e.prescribedSets)||0;
  if(!count)return `<div class="empty">A ficha original não informa a quantidade de séries deste exercício. Registre livremente:</div><div class="manual-set"><input type="number" min="0" placeholder="Reps"><input type="number" min="0" step=".5" placeholder="kg"><button onclick="addSet()">+</button></div>`;
  const ex=state.workout.exercises[state.exerciseIndex];
  while(ex.sets.length<count) ex.sets.push({reps:"",weight:"",done:false});
  return ex.sets.map((s,i)=>`<div class="set-row"><span class="setnum">${i+1}</span><input value="${esc(s.reps)}" placeholder="${e.prescribedReps?.split("/")[i]||"reps"}" onchange="setValue(${i},'reps',this.value)"><input value="${esc(s.weight)}" placeholder="kg" inputmode="decimal" onchange="setValue(${i},'weight',this.value)"><button class="check ${s.done?'done':''}" onclick="toggleSet(${i})">${s.done?'✓':'○'}</button></div>`).join("");
}
function setValue(i,k,v){state.workout.exercises[state.exerciseIndex].sets[i][k]=v;}
function toggleSet(i){state.workout.exercises[state.exerciseIndex].sets[i].done=!state.workout.exercises[state.exerciseIndex].sets[i].done; renderWorkout();}
function addSet(){state.workout.exercises[state.exerciseIndex].sets.push({reps:"",weight:"",done:false});renderWorkout();}
function allSetsCompleted(e){
  const count=parseInt(e.prescribedSets)||0;
  if(!count) return true;
  while(e.sets.length<count) e.sets.push({reps:"",weight:"",done:false});
  return e.sets.slice(0,count).every(s=>s.done);
}
function completeCurrentExercise(){
  const e=currentExercise();
  if(!allSetsCompleted(e)){
    alert("Conclua todas as séries do exercício antes de continuar.");
    return;
  }
  pauseExerciseTimer();
  stopRest();
  e.duration=Math.round(state.exerciseTimer);
  e.completed=true;
  state.exerciseTimer=0;
  state.exerciseRunning=false;
  state.exerciseStartedAt=null;
  renderWorkout();
}
function finishExercise(){
  const e=currentExercise();
  if(!e.completed){
    alert("Conclua o exercício e todas as séries antes de continuar.");
    return;
  }
  pauseExerciseTimer(); stopRest();
  if(state.exerciseIndex<state.workout.exercises.length-1){
    state.exerciseIndex++;
    state.exerciseTimer=0;
    state.exerciseRunning=false;
    state.exerciseStartedAt=null;
    renderWorkout();
  } else finishWorkout();
}
function prevExercise(){pauseExerciseTimer();stopRest();if(state.exerciseIndex>0)state.exerciseIndex--;state.exerciseTimer=state.workout.exercises[state.exerciseIndex].duration||0;state.exerciseRunning=false;state.exerciseStartedAt=null;renderWorkout();}
function finishWorkout(){
  pauseExerciseTimer();stopRest();
  state.workout.totalTime=Math.round((Date.now()-state.workoutTimerStart)/1000);
  state.workout.endTime=new Date().toISOString();
  state.workout.completedExercises=state.workout.exercises.filter(e=>e.completed).length;
  db.workouts.push(state.workout); save();
  const done=state.workout; state.workout=null;
  layout(`<section class="complete"><div class="complete-icon">✓</div><span class="eyebrow">TREINO FINALIZADO</span><h2>Excelente trabalho!</h2><p>Treino ${done.type} concluído em ${dateBR(done.date)}.</p>
    <div class="summary-grid"><div><b>${fmt(done.totalTime)}</b><span>tempo total</span></div><div><b>${done.completedExercises}</b><span>exercícios</span></div><div><b>${done.exercises.reduce((a,e)=>a+e.sets.filter(s=>s.done).length,0)}</b><span>séries marcadas</span></div></div>
    <button class="primary full" onclick="go('home')">Voltar ao início</button><button class="secondary full" onclick="showWorkoutDetails('${done.id}')">Ver detalhes</button></section>`);
}
function confirmExitWorkout(){ if(confirm("Sair do treino? O treino em andamento não será salvo.")){stopIntervals();go("home");}}
function showWorkoutDetails(id){
  const w=db.workouts.find(x=>x.id===id); if(!w)return;
  layout(`<button class="back" onclick="go('history')">‹ Histórico</button><span class="pill">TREINO ${w.type}</span><h2>${dateBR(w.date)}</h2><div class="stats"><div><b>${fmt(w.totalTime)}</b><span>tempo</span></div><div><b>${w.completedExercises||0}</b><span>exercícios</span></div></div>
  <div class="section">${w.exercises.map((e,i)=>`<div class="exercise-row"><div><b>${i+1}. ${esc(e.name)}</b><small>${fmt(e.duration||0)} • ${(e.sets||[]).filter(s=>s.done).length} séries concluídas</small></div></div>`).join("")}</div>`,"history");
}

let calDate=new Date();
function renderCalendar(){
  const y=calDate.getFullYear(), m=calDate.getMonth(), first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const offset=(first+6)%7, cells=[];
  for(let i=0;i<offset;i++)cells.push(`<div class="cal-day empty"></div>`);
  for(let d=1;d<=days;d++){
    const iso=`${y}-${pad(m+1)}-${pad(d)}`, ws=db.workouts.filter(w=>w.date===iso);
    cells.push(`<button class="cal-day ${ws.length?'has':''}" onclick="calendarDay('${iso}')"><span>${d}</span>${ws.map(w=>`<i>${w.type}</i><em>${fmtShort(w.totalTime||0)}</em>`).join("")}</button>`);
  }
  layout(`<div class="calendar-head"><button class="iconbtn" onclick="changeMonth(-1)">‹</button><h2>${monthLabel(y,m)}</h2><button class="iconbtn" onclick="changeMonth(1)">›</button></div>
  <div class="week"><b>SEG</b><b>TER</b><b>QUA</b><b>QUI</b><b>SEX</b><b>SÁB</b><b>DOM</b></div><div class="calendar">${cells.join("")}</div>
  <button class="primary full" onclick="calendarDay('${todayISO()}')">+ Registrar treino</button>`,"calendar");
}
function changeMonth(delta){calDate=new Date(calDate.getFullYear(),calDate.getMonth()+delta,1);renderCalendar();}
function calendarDay(iso){
  const ws=db.workouts.filter(w=>w.date===iso);
  layout(`<button class="back" onclick="renderCalendar()">‹ Calendário</button><span class="pill">${dateBR(iso)}</span><h2>${ws.length?"Treinos realizados":"Nenhum treino registrado"}</h2>
  ${ws.map(w=>`<button class="list-card" onclick="showWorkoutDetails('${w.id}')"><span class="badge">${w.type}</span><div><b>Treino ${w.type}</b><small>${fmt(w.totalTime)} • ${w.completedExercises||0} exercícios</small></div><span>›</span></button>`).join("")}
  <div class="register-box"><h3>Registrar manualmente</h3><p>Use esta opção para marcar um treino que você fez fora do aplicativo.</p><div class="seg">${["A","B","C"].map(c=>`<button onclick="manualRegister('${iso}','${c}')">Treino ${c}</button>`).join("")}</div></div>`,"calendar");
}
function manualRegister(date,type){db.workouts.push({id:Date.now().toString(),type,date,startedAt:null,endTime:null,totalTime:0,completedExercises:0,exercises:flatTraining(type).map(e=>({id:e.id,name:e.name,section:e.section,duration:0,sets:[]})),manual:true});save();calendarDay(date);}

function renderHistory(){
  const list=[...db.workouts].reverse();
  layout(`<h2>Histórico</h2><p class="muted">${list.length} treino(s) registrado(s).</p>${list.length?`<div class="list">${list.map(w=>`<button class="list-card" onclick="showWorkoutDetails('${w.id}')"><span class="badge">${w.type}</span><div><b>${dateBR(w.date)}</b><small>${fmt(w.totalTime)} • ${w.completedExercises||0} exercícios</small></div><span>›</span></button>`).join("")}</div>`:`<div class="empty big">Ainda não há treinos salvos.</div>`}`,"history");
}

function openSettings(){
  layout(`<button class="back" onclick="go('home')">‹ Voltar</button><h2>Configurações</h2>
    <section class="settings-card"><label>Descanso padrão <select onchange="db.settings.rest=+this.value;save()">${[30,45,60,90,120].map(x=>`<option value="${x}" ${db.settings.rest===x?'selected':''}>${x} segundos</option>`).join("")}</select></label>
    <label class="switch">Vibração <input type="checkbox" ${db.settings.vibration?'checked':''} onchange="db.settings.vibration=this.checked;save()"></label>
    <label class="switch">Som <input type="checkbox" ${db.settings.sound?'checked':''} onchange="db.settings.sound=this.checked;save()"></label>
    </section>
    <section class="settings-card"><h3>Treinos</h3>
    <p class="muted">Personalize os treinos, altere o nome e monte sua própria sequência de exercícios.</p>
    <div class="seg">${['A','B','C'].map(c=>`<button onclick="editTraining('${c}')">Editar ${c}</button>`).join('')}</div>
    </section>
    <section class="settings-card"><h3>Dados</h3><button class="secondary full" onclick="exportData()">Exportar dados</button><label class="filebtn">Importar dados<input type="file" accept=".json" onchange="importData(this.files[0])"></label><button class="danger full" onclick="clearData()">Apagar histórico</button></section>`,"home");
}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="meu-treino-backup.json";a.click();URL.revokeObjectURL(a.href);}
function importData(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const x=JSON.parse(r.result);if(!x.workouts)throw 0;db=x;save();openSettings();alert("Dados importados com sucesso.");}catch(e){alert("Arquivo inválido.");}};r.readAsText(file);}
function clearData(){if(confirm("Apagar todo o histórico? Esta ação não pode ser desfeita.")){db=DEFAULTS;save();openSettings();}}

if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
renderHome();
