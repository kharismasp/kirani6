(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const $$=(sel,root=document)=>[...root.querySelectorAll(sel)];
  const KEY='kirani_ops_bodmas_tka_teacher_v1_1';
  const defaultState={
    scene:'cover',warmIndex:0,lessonIndex:0,practiceIndex:0,
    completed:{warm:[],lesson:[],practice:[]},
    passed:{warm:[],lesson:[],practice:[]},
    wrong:{},parallel:{},updatedAt:Date.now()
  };
  function load(){
    try{
      const raw=JSON.parse(localStorage.getItem(KEY)||'null');
      if(!raw)return structuredClone(defaultState);
      return {
        ...structuredClone(defaultState),...raw,
        completed:{...structuredClone(defaultState.completed),...(raw.completed||{})},
        passed:{...structuredClone(defaultState.passed),...(raw.passed||{})},
        wrong:{...(raw.wrong||{})},parallel:{...(raw.parallel||{})}
      };
    }catch(e){return structuredClone(defaultState);}
  }
  let state=load();
  let navHistory=[];
  let activePass=null;
  const warmCount=5, lessonCount=8, practiceCount=9;
  const lessonNames=['Operation Detective','BODMAS Route','Bracket Switch','Story → Expression','Boundary vs Surface','Missing Side','Unit Switch','Mixed TKA Context'];
  const practiceNames=['Direct BODMAS','Operation + Answer','Order the Steps','Bracket Switch','Expression Builder','Error Lab','Multistep Story','TKA Blueprint','TKA Measurement'];

  function save(){state.updatedAt=Date.now();try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}updateProgress();}
  function arrHas(section,type,index){return (state[type]?.[section]||[]).includes(index);}
  function markComplete(section,index){
    const a=state.completed[section];if(!a.includes(index))a.push(index);
    state.passed[section]=state.passed[section].filter(x=>x!==index);save();
  }
  function markPassed(section,index){
    if(!arrHas(section,'completed',index) && !state.passed[section].includes(index))state.passed[section].push(index);
    save();
  }
  function keyFor(section,index){return `${section}-${index}`;}
  function wrong(section,index){const k=keyFor(section,index);state.wrong[k]=(state.wrong[k]||0)+1;save();return state.wrong[k];}
  function exact(value,answer){
    if(value===undefined||value===null||String(value).trim()==='')return false;
    const n=Number(String(value).replace(/,/g,'').trim());return Number.isFinite(n)&&Math.abs(n-answer)<1e-9;
  }
  function normExpr(value){return String(value||'').toLowerCase().replace(/[×x·]/g,'*').replace(/÷/g,'/').replace(/[−–—]/g,'-').replace(/\s+/g,'');}
  function exprMatches(value,variants){const n=normExpr(value);return variants.map(normExpr).includes(n);}
  function setFeedback(id,msg='',kind=''){const el=$(id);if(!el)return;el.textContent=msg;el.className=`feedback${kind?` ${kind}`:''}`;}
  function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800);}
  function choice(label,value,extra=''){return `<button class="choice-btn ${extra}" type="button" data-value="${value}">${label}</button>`;}
  function numericField(id,label,suffix='',mode='numeric'){
    return `<label class="field-label"><span>${label}</span><div class="answer-line"><input id="${id}" class="field-input" inputmode="${mode}" autocomplete="off"><b class="answer-suffix">${suffix}</b></div></label>`;
  }
  function geometrySVG(length,width,opts={}){
    const l=String(length),w=String(width),title=opts.title||'Rectangle';
    return `<div class="geo-card"><svg class="geo-svg" viewBox="0 0 440 285" role="img" aria-label="${title}: length ${l}, width ${w}">
      <rect class="surface" x="80" y="65" width="280" height="150" rx="5"></rect>
      <rect class="boundary" x="80" y="65" width="280" height="150" rx="5"></rect>
      <line class="dim-line" x1="80" y1="45" x2="360" y2="45"></line><line class="dim-line" x1="80" y1="39" x2="80" y2="51"></line><line class="dim-line" x1="360" y1="39" x2="360" y2="51"></line>
      <text x="220" y="34" text-anchor="middle">${l}</text>
      <line class="dim-line" x1="386" y1="65" x2="386" y2="215"></line><line class="dim-line" x1="380" y1="65" x2="392" y2="65"></line><line class="dim-line" x1="380" y1="215" x2="392" y2="215"></line>
      <text x="402" y="145" text-anchor="middle" transform="rotate(90 402 145)">${w}</text>
      <text x="220" y="255" text-anchor="middle" font-size="15">purple edge = boundary · green inside = surface</text>
    </svg><div class="geo-legend"><span class="geo-pill boundary-pill">Boundary → perimeter</span><span class="geo-pill surface-pill">Surface → area</span></div></div>`;
  }
  function updateProgress(){
    let p=0,scene=state.scene;
    if(scene==='cover')p=0;
    if(scene==='warmup')p=5+15*(state.warmIndex/Math.max(1,warmCount-1));
    if(scene==='zoomBreak')p=22;
    if(scene==='lesson')p=25+35*(state.lessonIndex/Math.max(1,lessonCount-1));
    if(scene==='practice')p=63+34*(state.practiceIndex/Math.max(1,practiceCount-1));
    if(scene==='finish')p=100;
    $('progressFill').style.width=`${Math.min(100,p)}%`;
    const stage={cover:0,warmup:1,zoomBreak:1,lesson:2,practice:3,finish:4}[scene]??0;
    $('progressDots').innerHTML=[0,1,2,3,4].map(i=>`<i class="${i<=stage?'done':''}"></i>`).join('');
  }
  function snapshot(){return {scene:state.scene,warmIndex:state.warmIndex,lessonIndex:state.lessonIndex,practiceIndex:state.practiceIndex};}
  function pushHistory(){const s=snapshot();const last=navHistory[navHistory.length-1];if(!last||JSON.stringify(last)!==JSON.stringify(s))navHistory.push(s);}
  function restoreLocation(loc){state.scene=loc.scene;state.warmIndex=loc.warmIndex;state.lessonIndex=loc.lessonIndex;state.practiceIndex=loc.practiceIndex;save();showScene(loc.scene,false);}
  function showScene(name,push=false){
    if(push)pushHistory();
    state.scene=name;save();
    $$('.scene').forEach(s=>s.classList.toggle('active',s.id===name));
    activePass=null;$('teacherPass').disabled=!['warmup','lesson','practice'].includes(name);
    if(name==='warmup')renderWarm();
    else if(name==='lesson')renderLesson();
    else if(name==='practice')renderPractice();
    else if(name==='finish')renderFinish();
    window.scrollTo({top:0,behavior:'auto'});
  }
  function fallbackBack(){
    if(state.scene==='warmup'){if(state.warmIndex>0){state.warmIndex--;save();renderWarm();}else showScene('cover');return;}
    if(state.scene==='zoomBreak'){state.warmIndex=warmCount-1;save();showScene('warmup');return;}
    if(state.scene==='lesson'){if(state.lessonIndex>0){state.lessonIndex--;save();renderLesson();}else showScene('zoomBreak');return;}
    if(state.scene==='practice'){if(state.practiceIndex>0){state.practiceIndex--;save();renderPractice();}else{state.lessonIndex=lessonCount-1;save();showScene('lesson');}return;}
    if(state.scene==='finish'){state.practiceIndex=practiceCount-1;save();showScene('practice');return;}
    showScene('cover');
  }
  function back(){if(navHistory.length){restoreLocation(navHistory.pop());}else fallbackBack();}

  function existingStatus(section,index,nextId,feedbackId){
    const done=arrHas(section,'completed',index),passed=arrHas(section,'passed',index);
    if(done){$(nextId).disabled=false;setFeedback(feedbackId,'Previously completed. You can review it or continue.','good');}
    else if(passed){$(nextId).disabled=false;setFeedback(feedbackId,'Passed by teacher. The answer stays hidden and this does not count as independent mastery.','info');}
  }
  function advance(section){
    pushHistory();
    if(section==='warm'){
      if(state.warmIndex<warmCount-1){state.warmIndex++;save();renderWarm();}else showScene('zoomBreak');
    }else if(section==='lesson'){
      if(state.lessonIndex<lessonCount-1){state.lessonIndex++;save();renderLesson();}else{state.practiceIndex=Math.max(0,state.practiceIndex);save();showScene('practice');}
    }else if(section==='practice'){
      if(state.practiceIndex<practiceCount-1){state.practiceIndex++;save();renderPractice();}else showScene('finish');
    }
  }
  function teacherPass(section){
    const idx=section==='warm'?state.warmIndex:section==='lesson'?state.lessonIndex:state.practiceIndex;
    markPassed(section,idx);advance(section);
  }

  // ---------- WARMING UP ----------
  const warmMeta=[
    ['PERCENTAGE SPIRAL','Carry-over review: one percentage only.'],
    ['FDP STORY','Use decimal addition inside a short context.'],
    ['FDP SHARING','Connect a mixed fraction, decimal, and division.'],
    ['OPERATION DECISION','Choose the structure, then calculate.'],
    ['FIRST MOVE','Which operation is allowed first?']
  ];
  function renderWarm(){
    const i=state.warmIndex;$('warmTag').textContent=warmMeta[i][0];$('warmCounter').textContent=`${i+1} / ${warmCount}`;$('warmNext').disabled=true;setFeedback('warmFeedback');
    const root=$('warmContent');
    if(i===0){
      root.innerHTML=`<div class="question-focus"><p>${warmMeta[i][1]}</p><div class="big-math">25% of 160</div><div class="answer-line"><input id="w0" class="answer-input" inputmode="numeric" aria-label="answer"></div><button id="wCheck" class="primary-btn inline-check" type="button">Check</button></div>`;
      $('wCheck').onclick=()=>{if(exact($('w0').value,40)){markComplete('warm',i);$('warmNext').disabled=false;setFeedback('warmFeedback','Good. Percentage stays as a short spiral review today.','good');}else{const n=wrong('warm',i);setFeedback('warmFeedback',n>=2?'25% is one quarter. Find one quarter of 160.':'Not yet — check the percentage of the whole.','bad');}};
    }else if(i===1){
      root.innerHTML=`<div class="story-card">A hiking route is <strong>2.75 km</strong> in the morning and <strong>1.85 km</strong> after lunch. How far is the route altogether?</div><div class="question-focus compact-focus"><p>${warmMeta[i][1]}</p><div class="answer-line"><input id="w1" class="answer-input" inputmode="decimal" aria-label="total distance in kilometres"><b class="answer-suffix">km</b></div><button id="wCheck" class="primary-btn inline-check" type="button">Check</button></div>`;
      $('wCheck').onclick=()=>{if(exact($('w1').value,4.6)){markComplete('warm',i);$('warmNext').disabled=false;setFeedback('warmFeedback','Path found. The decimal parts and whole-number parts are combined correctly.','good');}else{const n=wrong('warm',i);setFeedback('warmFeedback',n>=2?'Line up the decimal points before adding 2.75 and 1.85.':'Not yet — the question asks for the total distance.','bad');}};
    }else if(i===2){
      root.innerHTML=`<div class="story-card">A ribbon is <strong>3¾ m</strong> long. It is cut into <strong>5 equal pieces</strong>. How long is each piece, in metres?</div><div class="question-focus compact-focus"><p>${warmMeta[i][1]}</p><div class="answer-line"><input id="w2" class="answer-input" inputmode="decimal" aria-label="length of each piece in metres"><b class="answer-suffix">m</b></div><button id="wCheck" class="primary-btn inline-check" type="button">Check</button></div>`;
      $('wCheck').onclick=()=>{if(exact($('w2').value,0.75)){markComplete('warm',i);$('warmNext').disabled=false;setFeedback('warmFeedback','Good structure: convert the mixed number, then share equally.','good');}else{const n=wrong('warm',i);setFeedback('warmFeedback',n>=2?'3¾ m is 3.75 m. Now divide that length into 5 equal pieces.':'Not yet — equal pieces means the total length must be shared.','bad');}};
    }else if(i===3){
      root.innerHTML=`<div class="story-card">A box has <strong>84 cards</strong>. <strong>29 cards are given away</strong>. How many remain?</div><div class="stage-grid interaction"><div class="stage-box"><h4>1 · What operation represents what happened?</h4><div id="wOp" class="choice-grid">${choice('<span class="operation-symbol">+</span> combine','add')}${choice('<span class="operation-symbol">−</span> remove / difference','sub')}${choice('<span class="operation-symbol">×</span> equal groups','mul')}${choice('<span class="operation-symbol">÷</span> share','div')}</div><div id="wGuide"></div></div><div id="wCalcBox" class="stage-box locked"><h4>2 · Now calculate</h4><div class="answer-line"><input id="w3" class="answer-input" inputmode="numeric" aria-label="cards remaining"><b class="answer-suffix">cards</b></div><button id="wCheck" class="primary-btn inline-check" type="button">Check answer</button></div></div>`;
      let routeOK=false;
      $$('.choice-btn',$('wOp')).forEach(btn=>btn.onclick=()=>{
        if(btn.dataset.value==='sub'){
          routeOK=true;$$('.choice-btn',$('wOp')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});$('wCalcBox').classList.remove('locked');setFeedback('warmFeedback','The route works. Finish the calculation.','good');
        }else{
          const n=wrong('warm',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('warmFeedback','Which operation actually answers “how many remain”?','bad');
          if(n>=2)$('wGuide').innerHTML='<div class="guided-note"><strong>First-step view:</strong> Start with 84. The amount becomes smaller because 29 leave the box.</div>';
        }
      });
      $('wCheck').onclick=()=>{if(!routeOK){setFeedback('warmFeedback','Choose the operation before calculating.','info');return;}if(exact($('w3').value,55)){markComplete('warm',i);$('warmNext').disabled=false;setFeedback('warmFeedback','Good structure. Choice + calculation both match.','good');}else{wrong('warm',i);setFeedback('warmFeedback','Your route works. Check the calculation.','bad');}};
    }else if(i===4){
      root.innerHTML=`<div class="question-focus"><p>Do not solve everything at once. Tap the operation that must happen first.</p><div class="big-math">18 + 4 × 5</div></div><div id="wFirst" class="choice-grid">${choice('18 + 4','plus')}${choice('4 × 5','times')}</div><div id="wFinal" class="stage-box locked" style="margin-top:14px"><h4>Then finish the expression</h4><div class="answer-line"><input id="w4" class="answer-input" inputmode="numeric" aria-label="final answer"></div><button id="wCheck" class="primary-btn inline-check" type="button">Check answer</button></div>`;
      let routeOK=false;
      $$('.choice-btn',$('wFirst')).forEach(btn=>btn.onclick=()=>{
        if(btn.dataset.value==='times'){routeOK=true;$$('.choice-btn',$('wFirst')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});$('wFinal').classList.remove('locked');setFeedback('warmFeedback','Yes. Multiplication happens before addition here. Now finish it.','good');}
        else{const n=wrong('warm',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('warmFeedback',n>=2?'BODMAS clue: multiplication and division come before addition/subtraction.':'Not yet — check the order.','bad');}
      });
      $('wCheck').onclick=()=>{if(!routeOK){setFeedback('warmFeedback','Tap the first operation before entering the final answer.','info');return;}if(exact($('w4').value,38)){markComplete('warm',i);$('warmNext').disabled=false;setFeedback('warmFeedback','Path found.','good');}else{wrong('warm',i);setFeedback('warmFeedback','Your route works. Check the calculation.','bad');}};
    }
    existingStatus('warm',i,'warmNext','warmFeedback');
    activePass=()=>teacherPass('warm');
  }
  const warmHints=['25% = 1/4.','For decimal addition, line up the decimal points first.','Convert 3¾ to 3.75, then share the length equally among 5 pieces.','Cards are leaving, not joining.','Multiplication comes before addition here.'];
  $('warmHint').onclick=()=>setFeedback('warmFeedback',warmHints[state.warmIndex],'info');
  $('warmNext').onclick=()=>advance('warm');

  // ---------- LESSON WITH MISS ----------
  function renderLessonTabs(){
    $('lessonTabs').innerHTML=lessonNames.map((name,j)=>{
      const status=arrHas('lesson','completed',j)?'done':arrHas('lesson','passed',j)?'passed':'';
      const enabled=j===state.lessonIndex||arrHas('lesson','completed',j)||arrHas('lesson','passed',j);
      return `<button class="lesson-tab ${status} ${j===state.lessonIndex?'active':''}" type="button" data-j="${j}" ${enabled?'':'disabled'}>${j+1}. ${name}</button>`;
    }).join('');
    $$('.lesson-tab',$('lessonTabs')).forEach(btn=>btn.onclick=()=>{const j=Number(btn.dataset.j);if(j===state.lessonIndex)return;pushHistory();state.lessonIndex=j;save();renderLesson();});
  }
  function lessonHeader(i){$('lessonCounter').textContent=`${i+1} / ${lessonCount}`;$('lessonTag').textContent=['OPERATION DETECTIVE','BODMAS ROUTE','BRACKET SWITCH','STORY → EXPRESSION','TKA · BLUEPRINT','TKA · MISSING SIDE','TKA · UNIT SWITCH','TKA · MIXED CONTEXT'][i];$('lessonNext').disabled=true;setFeedback('lessonFeedback');renderLessonTabs();}
  function renderLesson(){
    const i=state.lessonIndex;lessonHeader(i);const root=$('lessonContent');
    if(i===0){
      root.innerHTML=`<div class="concept-key"><article><b>+</b><strong>Combine / total</strong><small>Things join or the total increases.</small></article><article><b>−</b><strong>Difference / left</strong><small>Something leaves or we compare amounts.</small></article><article><b>×</b><strong>Equal groups</strong><small>The same quantity repeats in groups.</small></article><article><b>÷</b><strong>Sharing / groups</strong><small>Split equally or count how many groups.</small></article></div><div class="story-card">There are <strong>6 trays</strong> with <strong>8 muffins on each tray</strong>. Then <strong>5 extra muffins</strong> are added.</div><div class="stage-grid" style="margin-top:14px"><div class="stage-box"><h4>1 · Build the expression</h4><input id="l0expr" class="expression-input" autocomplete="off" aria-label="build the expression"><button id="l0exprCheck" class="ghost-btn inline-check" type="button">Check expression</button></div><div id="l0calcBox" class="stage-box locked"><h4>2 · Calculate</h4><div class="answer-line"><input id="l0ans" class="answer-input" inputmode="numeric"><b class="answer-suffix">muffins</b></div><button id="l0ansCheck" class="primary-btn inline-check" type="button">Check answer</button></div></div>`;
      let expressionOK=false;
      $('l0exprCheck').onclick=()=>{if(exprMatches($('l0expr').value,['6*8+5','8*6+5'])){expressionOK=true;$('l0calcBox').classList.remove('locked');setFeedback('lessonFeedback','Good structure: equal groups first, then the extra muffins.','good');}else{const n=wrong('lesson',i);setFeedback('lessonFeedback',n>=2?'First form 6 equal groups of 8. Then add the 5 extras.':'Show the equal groups and the added extras in one expression.','bad');}};
      $('l0ansCheck').onclick=()=>{if(!expressionOK){setFeedback('lessonFeedback','Build the expression before calculating.','info');return;}if(exact($('l0ans').value,53)){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Story → structure → expression → calculation.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','Your structure works. Check the arithmetic only.','bad');}};
    }else if(i===1){
      root.innerHTML=`<div class="guided-note"><strong>Critical rule:</strong> Brackets → Orders → Division / Multiplication <strong>left-to-right</strong> → Addition / Subtraction <strong>left-to-right</strong>. Multiplication does not automatically beat division.</div><div class="question-focus"><div class="big-math">24 − 12 ÷ 3 × 2</div><p>Tap the route cards in the order they are allowed to happen.</p></div><div id="l1route" class="route-board"><button class="route-card" data-step="b" type="button">Use the result of 12 ÷ 3, then × 2</button><button class="route-card" data-step="c" type="button">Subtract that result from 24</button><button class="route-card" data-step="a" type="button">12 ÷ 3</button></div><div id="l1chips" class="route-sequence"></div><div id="l1final" class="stage-box locked"><h4>Final value</h4><div class="answer-line"><input id="l1ans" class="answer-input" inputmode="numeric"></div><button id="l1check" class="primary-btn inline-check" type="button">Check answer</button></div>`;
      const expected=['a','b','c'];let pos=0,labels={a:'12 ÷ 3',b:'then × 2',c:'then 24 − result'};
      $$('.route-card',$('l1route')).forEach(btn=>btn.onclick=()=>{
        if(btn.dataset.step===expected[pos]){btn.disabled=true;btn.classList.add('done');$('l1chips').insertAdjacentHTML('beforeend',`<span class="route-chip">${labels[expected[pos]]}</span>`);pos++;if(pos===expected.length){$('l1final').classList.remove('locked');setFeedback('lessonFeedback','Route built. D and M were handled left-to-right.','good');}}
        else{const n=wrong('lesson',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('lessonFeedback',n>=2?'Look only at division and multiplication first. Which one is farther left?':'Not yet — check the left-to-right rule.','bad');}
      });
      $('l1check').onclick=()=>{if(pos<expected.length){setFeedback('lessonFeedback','Build the full route first.','info');return;}if(exact($('l1ans').value,16)){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Correct. 12÷3=4, 4×2=8, then 24−8=16.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','The route works. Check the calculation.','bad');}};
    }else if(i===2){
      root.innerHTML=`<div class="question-focus"><p>Same numbers. Different structure.</p><h3>Brackets change the route.</h3></div><div class="compare-grid"><div class="compare-card"><div class="big-math">8 + 4 × 3</div><label><span>Answer</span><input id="l2a" class="answer-input" inputmode="numeric"></label></div><div class="compare-card"><div class="big-math">(8 + 4) × 3</div><label><span>Answer</span><input id="l2b" class="answer-input" inputmode="numeric"></label></div></div><button id="l2check" class="primary-btn inline-check" type="button">Compare answers</button>`;
      $('l2check').onclick=()=>{const a=exact($('l2a').value,20),b=exact($('l2b').value,36);if(a&&b){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Exactly: same numbers, different route — 20 versus 36.','good');}else if(a||b){wrong('lesson',i);setFeedback('lessonFeedback',a?'The first expression works. In the second, do the brackets first.':'The bracketed expression works. In the first, multiplication happens first.','bad');}else{wrong('lesson',i);setFeedback('lessonFeedback','Check which operation is allowed first in each expression.','bad');}};
    }else if(i===3){
      root.innerHTML=`<div class="worked-example"><p class="eyebrow">WITH MISS</p><b>3 boxes hold 12 pens each, then 7 loose pens are added.</b><p>Expression: <strong>3 × 12 + 7</strong> → Answer: <strong>43</strong></p></div><div class="story-card" style="margin-top:14px">Your turn: <strong>4 trays</strong> hold <strong>9 cupcakes each</strong>. Then <strong>7 extra cupcakes</strong> are added.</div><div class="expression-row"><label><span>Expression first</span><input id="l3expr" class="expression-input" aria-label="write the expression"></label><label><span>Final answer</span><input id="l3ans" class="answer-input" inputmode="numeric"></label></div><button id="l3check" class="primary-btn inline-check" type="button">Check structure + answer</button>`;
      $('l3check').onclick=()=>{const e=exprMatches($('l3expr').value,['4*9+7','9*4+7']);const a=exact($('l3ans').value,43);if(e&&a){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Good transfer: the structure stayed the same with new numbers.','good');}else if(e){wrong('lesson',i);setFeedback('lessonFeedback','Your expression works. Check only the arithmetic.','bad');}else{const n=wrong('lesson',i);setFeedback('lessonFeedback',n>=2?'Four equal groups of 9 come first, then 7 are added.':'Do not chase the final answer yet. Build the story as an expression first.','bad');}};
    }else if(i===4){
      root.innerHTML=`<div class="guided-note"><strong>Boundary</strong> measures the outside edge → perimeter → units such as m. <strong>Surface</strong> measures the inside covering → area → units such as m².</div><div class="geo-wrap">${geometrySVG('8 m','5 m',{title:'8 metre by 5 metre garden'})}<div><div class="story-card compact">A garden is <strong>8 m × 5 m</strong>. A <strong>fence</strong> goes around it. <strong>Grass</strong> covers the inside.</div><div class="stage-box" style="margin-top:12px"><h4>1 · Classify</h4><div id="l4fence" class="choice-grid"><button class="choice-btn" data-value="perimeter" type="button">Fence → perimeter</button><button class="choice-btn" data-value="area" type="button">Fence → area</button></div><div id="l4grass" class="choice-grid" style="margin-top:8px"><button class="choice-btn" data-value="area" type="button">Grass → area</button><button class="choice-btn" data-value="perimeter" type="button">Grass → perimeter</button></div></div><div id="l4calc" class="stage-box locked" style="margin-top:12px"><h4>2 · Calculate both</h4><div class="field-grid">${numericField('l4p','Fence length','m')}${numericField('l4a','Grass area','m²')}</div><button id="l4check" class="primary-btn inline-check" type="button">Check measurements</button></div></div></div>`;
      let fence=false,grass=false;
      function maybeUnlock(){if(fence&&grass){$('l4calc').classList.remove('locked');setFeedback('lessonFeedback','Classification is correct. Now calculate both measures.','good');}}
      $$('.choice-btn',$('l4fence')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.value==='perimeter'){fence=true;$$('.choice-btn',$('l4fence')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});maybeUnlock();}else{wrong('lesson',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('lessonFeedback','Fence follows the outside boundary.','bad');}});
      $$('.choice-btn',$('l4grass')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.value==='area'){grass=true;$$('.choice-btn',$('l4grass')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});maybeUnlock();}else{wrong('lesson',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('lessonFeedback','Grass covers the inside surface.','bad');}});
      $('l4check').onclick=()=>{if(!(fence&&grass)){setFeedback('lessonFeedback','Classify boundary and surface before calculating.','info');return;}const p=exact($('l4p').value,26),a=exact($('l4a').value,40);if(p&&a){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Correct: perimeter 26 m, area 40 m². Notice the units are different.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback',p||a?'One measurement is correct. Check the other formula and its unit.':'Boundary adds side lengths; surface counts square units inside.','bad');}};
    }else if(i===5){
      root.innerHTML=`<div class="geo-wrap">${geometrySVG('10 cm','? cm',{title:'Rectangle with length 10 centimetres and unknown width'})}<div><div class="story-card compact">A rectangle has perimeter <strong>34 cm</strong> and length <strong>10 cm</strong>. Find the width.</div><div class="stage-grid" style="margin-top:12px"><div class="stage-box"><h4>Step 1 · Remove the two known lengths</h4><div class="equation-display">34 − 10 − 10 = ?</div><div class="answer-line"><input id="l5rem" class="answer-input" inputmode="numeric"><b class="answer-suffix">cm</b></div><button id="l5first" class="ghost-btn inline-check" type="button">Check step 1</button></div><div id="l5widthBox" class="stage-box locked"><h4>Step 2 · The remainder is two equal widths</h4><div class="answer-line"><input id="l5width" class="answer-input" inputmode="numeric"><b class="answer-suffix">cm</b></div><button id="l5check" class="primary-btn inline-check" type="button">Check width</button></div></div></div></div>`;
      let firstOK=false;
      $('l5first').onclick=()=>{if(exact($('l5rem').value,14)){firstOK=true;$('l5widthBox').classList.remove('locked');setFeedback('lessonFeedback','Yes. 14 cm is left for two equal widths.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','There are two 10 cm sides in the perimeter. Remove both first.','bad');}};
      $('l5check').onclick=()=>{if(!firstOK){setFeedback('lessonFeedback','Complete Step 1 first.','info');return;}if(exact($('l5width').value,7)){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Correct: 14 ÷ 2 = 7 cm.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','14 cm represents two equal widths. Share it equally.','bad');}};
    }else if(i===6){
      root.innerHTML=`<div class="question-focus"><p>Make the units the same <strong>before</strong> adding.</p><div class="big-math">2.5 m + 75 cm</div><span class="unit-badge">Answer in centimetres</span></div><div class="stage-grid"><div class="stage-box"><h4>1 · Convert 2.5 m</h4><div class="answer-line"><input id="l6conv" class="answer-input" inputmode="decimal"><b class="answer-suffix">cm</b></div><button id="l6first" class="ghost-btn inline-check" type="button">Check conversion</button></div><div id="l6sumBox" class="stage-box locked"><h4>2 · Add after the units match</h4><div class="answer-line"><input id="l6sum" class="answer-input" inputmode="numeric"><b class="answer-suffix">cm</b></div><button id="l6check" class="primary-btn inline-check" type="button">Check total</button></div></div>`;
      let conv=false;
      $('l6first').onclick=()=>{if(exact($('l6conv').value,250)){conv=true;$('l6sumBox').classList.remove('locked');setFeedback('lessonFeedback','Units now match: 250 cm and 75 cm.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','1 m = 100 cm. Convert 2.5 m first.','bad');}};
      $('l6check').onclick=()=>{if(!conv){setFeedback('lessonFeedback','Convert to centimetres before adding.','info');return;}if(exact($('l6sum').value,325)){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','Correct: 250 cm + 75 cm = 325 cm.','good');}else{wrong('lesson',i);setFeedback('lessonFeedback','The conversion is right. Check only the addition.','bad');}};
    }else if(i===7){
      root.innerHTML=`<div class="geo-wrap">${geometrySVG('9 m','6 m',{title:'9 metre by 6 metre garden'})}<div><div class="story-card compact"><strong>Sebuah taman</strong> berbentuk persegi panjang berukuran <strong>9 m × 6 m</strong>. Pagar dipasang mengelilingi taman dan rumput menutupi seluruh permukaannya.</div><div class="field-grid" style="margin-top:12px">${numericField('l7p','Panjang pagar','m')}${numericField('l7a','Luas rumput','m²')}</div><button id="l7check" class="primary-btn inline-check" type="button">Check both</button></div></div>`;
      $('l7check').onclick=()=>{const p=exact($('l7p').value,30),a=exact($('l7a').value,54);if(p&&a){markComplete('lesson',i);$('lessonNext').disabled=false;setFeedback('lessonFeedback','TKA bridge complete: pagar = 30 m, rumput = 54 m².','good');}else if(p||a){wrong('lesson',i);setFeedback('lessonFeedback','One measure is correct. Boundary and surface use different calculations.','bad');}else{wrong('lesson',i);setFeedback('lessonFeedback','Pagar follows the boundary; rumput covers the surface.','bad');}};
    }
    existingStatus('lesson',i,'lessonNext','lessonFeedback');
    activePass=()=>teacherPass('lesson');
  }
  const lessonHints=[
    'Equal groups suggest multiplication; “extra” suggests addition.',
    'For D and M, choose the leftmost one first.',
    'Brackets are handled before multiplication.',
    'Write the expression before touching the final answer.',
    'Fence traces the outside edge; grass covers the inside.',
    'Perimeter 34 contains two lengths and two widths.',
    '1 m = 100 cm.',
    'Pagar = perimeter. Rumput = area.'
  ];
  $('lessonHint').onclick=()=>setFeedback('lessonFeedback',lessonHints[state.lessonIndex],'info');
  $('lessonNext').onclick=()=>advance('lesson');

  // ---------- LATIHAN MANDIRI ----------
  function renderPracticeNav(){
    $('practiceNavigator').innerHTML=practiceNames.map((name,j)=>{
      const done=arrHas('practice','completed',j),passed=arrHas('practice','passed',j),active=j===state.practiceIndex;
      return `<button class="challenge-dot ${done?'done':passed?'passed':''} ${active?'active':''}" type="button" title="${j+1}. ${name}" ${active||done||passed?'':'disabled'} data-j="${j}">${j+1}</button>`;
    }).join('');
    $$('.challenge-dot',$('practiceNavigator')).forEach(btn=>btn.onclick=()=>{const j=Number(btn.dataset.j);if(j===state.practiceIndex)return;pushHistory();state.practiceIndex=j;save();renderPractice();});
  }
  function practiceHeader(i){$('practiceTag').textContent=`CHALLENGE ${i+1} · ${practiceNames[i].toUpperCase()}`;$('practiceCounter').textContent=`${i+1} / ${practiceCount}`;$('practiceNext').textContent=i===practiceCount-1?'Finish':'Next challenge';$('practiceNext').disabled=true;setFeedback('practiceFeedback');$('parallelZone').hidden=true;$('parallelZone').innerHTML='';renderPracticeNav();}

  function setupOpAndCalc(cfg){
    let routeOK=false;
    $$('.choice-btn',$(cfg.choiceRoot)).forEach(btn=>btn.onclick=()=>{
      if(btn.dataset.value===cfg.correct){routeOK=true;$$('.choice-btn',$(cfg.choiceRoot)).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});$(cfg.calcBox).classList.remove('locked');setFeedback('practiceFeedback',cfg.routeGood||'Your route works. Finish the calculation.','good');}
      else{const n=wrong('practice',state.practiceIndex);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('practiceFeedback',cfg.wrongMsg||'Which operation actually answers the question?','bad');if(n>=2&&cfg.guideId)$(cfg.guideId).innerHTML=`<div class="guided-note">${cfg.guide}</div>`;}
    });
    $(cfg.checkBtn).onclick=()=>{
      if(!routeOK){setFeedback('practiceFeedback','Show the first move before the final value.','info');return;}
      if(exact($(cfg.inputId).value,cfg.answer)){markComplete('practice',state.practiceIndex);$('practiceNext').disabled=false;setFeedback('practiceFeedback',cfg.doneMsg||'Good structure.','good');renderParallelArea(state.practiceIndex);}
      else{wrong('practice',state.practiceIndex);setFeedback('practiceFeedback','Your route works. Check the calculation.','bad');}
    };
  }
  function renderPractice(){
    const i=state.practiceIndex;practiceHeader(i);const root=$('practiceContent');
    if(i===0){
      root.innerHTML=`<div class="question-focus"><p>Direct calculation — no numeric multiple choice.</p><div class="big-math">18 + 6 × 4</div><div class="answer-line"><input id="p0" class="answer-input" inputmode="numeric"></div><button id="p0check" class="primary-btn inline-check" type="button">Check</button></div>`;
      $('p0check').onclick=()=>{if(exact($('p0').value,42)){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Path found.','good');renderParallelArea(i);}else{const n=wrong('practice',i);setFeedback('practiceFeedback',n>=2?'Multiplication first: 6 × 4. Then add 18.':'Not yet — check the order.','bad');}};
    }else if(i===1){
      root.innerHTML=`<div class="story-card">A box has <strong>84 cards</strong>. <strong>29 cards are given away</strong>. How many remain?</div><div class="stage-grid" style="margin-top:14px"><div class="stage-box"><h4>1 · Choose the operation</h4><div id="p1op" class="choice-grid">${choice('Add','add','center')}${choice('Subtract','sub','center')}${choice('Multiply','mul','center')}${choice('Divide','div','center')}</div><div id="p1guide"></div></div><div id="p1calc" class="stage-box locked"><h4>2 · Calculate</h4><div class="answer-line"><input id="p1" class="answer-input" inputmode="numeric"></div><button id="p1check" class="primary-btn inline-check" type="button">Check answer</button></div></div>`;
      setupOpAndCalc({choiceRoot:'p1op',correct:'sub',calcBox:'p1calc',checkBtn:'p1check',inputId:'p1',answer:55,guideId:'p1guide',guide:'Start with 84. The 29 cards leave the box, so the amount decreases.',wrongMsg:'Which operation actually answers “how many remain”?' });
    }else if(i===2){
      root.innerHTML=`<div class="question-focus"><p>Tap the cards in the order the expression must be processed.</p><div class="big-math">(15 + 5) × 3 − 8</div></div><div id="p2route" class="route-board"><button class="route-card" data-step="c" type="button">result − 8</button><button class="route-card" data-step="a" type="button">15 + 5</button><button class="route-card" data-step="b" type="button">result × 3</button></div><div id="p2chips" class="route-sequence"></div><div id="p2final" class="stage-box locked"><h4>Final answer</h4><div class="answer-line"><input id="p2" class="answer-input" inputmode="numeric"></div><button id="p2check" class="primary-btn inline-check" type="button">Check final</button></div>`;
      const exp=['a','b','c'],label={a:'(15+5)',b:'× 3',c:'− 8'};let pos=0;
      $$('.route-card',$('p2route')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.step===exp[pos]){btn.disabled=true;btn.classList.add('done');$('p2chips').insertAdjacentHTML('beforeend',`<span class="route-chip">${label[exp[pos]]}</span>`);pos++;if(pos===3){$('p2final').classList.remove('locked');setFeedback('practiceFeedback','Route built. Now calculate.','good');}}else{const n=wrong('practice',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('practiceFeedback',n>=2?'Brackets must happen first. After that, follow the expression left-to-right.':'Not yet — check the brackets first.','bad');}});
      $('p2check').onclick=()=>{if(pos<3){setFeedback('practiceFeedback','Build the route first.','info');return;}if(exact($('p2').value,52)){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Good structure.','good');}else{wrong('practice',i);setFeedback('practiceFeedback','The route works. Check the arithmetic.','bad');}};
    }else if(i===3){
      root.innerHTML=`<div class="question-focus"><p>Same numbers, different brackets.</p></div><div class="compare-grid"><div class="compare-card"><div class="big-math">10 + 2 × 6</div><label><span>Answer A</span><input id="p3a" class="answer-input" inputmode="numeric"></label></div><div class="compare-card"><div class="big-math">(10 + 2) × 6</div><label><span>Answer B</span><input id="p3b" class="answer-input" inputmode="numeric"></label></div></div><button id="p3check" class="primary-btn inline-check" type="button">Check both</button>`;
      $('p3check').onclick=()=>{const a=exact($('p3a').value,22),b=exact($('p3b').value,72);if(a&&b){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Bracket switch understood.','good');}else if(a||b){wrong('practice',i);setFeedback('practiceFeedback',a?'A is correct. For B, calculate inside the brackets first.':'B is correct. For A, multiplication comes before addition.','bad');}else{wrong('practice',i);setFeedback('practiceFeedback','Check the first allowed operation in each expression.','bad');}};
    }else if(i===4){
      root.innerHTML=`<div class="story-card">Five boxes hold <strong>12 items each</strong>. There are <strong>8 loose items</strong> too.</div><div class="expression-row"><label><span>Build the expression first</span><input id="p4expr" class="expression-input" aria-label="build the expression"></label><label><span>Final answer</span><input id="p4ans" class="answer-input" inputmode="numeric"></label></div><button id="p4check" class="primary-btn inline-check" type="button">Check expression + answer</button>`;
      $('p4check').onclick=()=>{const e=exprMatches($('p4expr').value,['5*12+8','12*5+8']),a=exact($('p4ans').value,68);if(e&&a){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Good structure.','good');renderParallelArea(i);}else if(e){wrong('practice',i);setFeedback('practiceFeedback','Your expression works. Check the arithmetic only.','bad');}else{const n=wrong('practice',i);setFeedback('practiceFeedback',n>=2?'Five equal groups of 12 come first, then add 8 loose items.':'Show the story as an expression before the final value.','bad');}};
    }else if(i===5){
      root.innerHTML=`<div class="question-focus"><p>Find the <strong>first logic break</strong>.</p><div class="big-math">36 ÷ 6 × 2</div></div><div id="p5steps" class="error-steps"><button class="error-step" data-step="1" type="button"><span><strong>Step 1</strong><small>6 × 2 = 12</small></span></button><button class="error-step" data-step="2" type="button"><span><strong>Step 2</strong><small>36 ÷ 12 = 3</small></span></button></div><div id="p5guide"></div><div id="p5calc" class="stage-box locked"><h4>Repair the result</h4><div class="answer-line"><input id="p5ans" class="answer-input" inputmode="numeric"></div><button id="p5check" class="primary-btn inline-check" type="button">Check repair</button></div>`;
      let found=false;
      $$('.error-step',$('p5steps')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.step==='1'){found=true;$$('.error-step',$('p5steps')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});$('p5calc').classList.remove('locked');setFeedback('practiceFeedback','Logic break found. Division and multiplication have equal priority, so start from the left.','good');}else{const n=wrong('practice',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('practiceFeedback','That line depends on an earlier mistake. Find the first break.','bad');if(n>=2)$('p5guide').innerHTML='<div class="guided-note">D and M have the same priority. In 36 ÷ 6 × 2, the leftmost one is division.</div>';}});
      $('p5check').onclick=()=>{if(!found){setFeedback('practiceFeedback','Identify the first incorrect step before repairing the answer.','info');return;}if(exact($('p5ans').value,12)){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Repair complete: 36 ÷ 6 = 6, then 6 × 2 = 12.','good');}else{wrong('practice',i);setFeedback('practiceFeedback','The logic break is fixed. Check the new calculation.','bad');}};
    }else if(i===6){
      root.innerHTML=`<div class="story-card">Four bags contain <strong>18 marbles each</strong>. Then <strong>15 marbles are lost</strong>. The remaining marbles are <strong>shared equally among 3 children</strong>.</div><div class="stage-grid" style="margin-top:14px"><div class="stage-box"><h4>1 · First move only</h4><div id="p6first" class="choice-grid three">${choice('4 × 18','mul','center')}${choice('18 − 15','sub','center')}${choice('15 ÷ 3','div','center')}</div><div id="p6guide"></div></div><div id="p6calc" class="stage-box locked"><h4>2 · Work through the whole story</h4><div class="answer-line"><input id="p6ans" class="answer-input" inputmode="numeric"><b class="answer-suffix">marbles each</b></div><button id="p6check" class="primary-btn inline-check" type="button">Check final</button></div></div>`;
      setupOpAndCalc({choiceRoot:'p6first',correct:'mul',calcBox:'p6calc',checkBtn:'p6check',inputId:'p6ans',answer:19,guideId:'p6guide',guide:'First find how many marbles are in all four equal bags. Then the story can continue.',wrongMsg:'The story starts with four equal groups of 18.'});
      const original=$('p6check').onclick;$('p6check').onclick=()=>{original();if(arrHas('practice','completed',i))renderParallelArea(i);};
    }else if(i===7){
      root.innerHTML=`<div class="geo-wrap">${geometrySVG('9 m','6 m',{title:'9 metre by 6 metre garden'})}<div><div class="story-card compact">A 9 m × 6 m garden needs a fence around the outside and grass across the inside.</div><div class="stage-box" style="margin-top:10px"><h4>1 · Classify</h4><div id="p7f" class="choice-grid"><button class="choice-btn" data-value="perimeter" type="button">Fence → perimeter</button><button class="choice-btn" data-value="area" type="button">Fence → area</button></div><div id="p7g" class="choice-grid" style="margin-top:8px"><button class="choice-btn" data-value="area" type="button">Grass → area</button><button class="choice-btn" data-value="perimeter" type="button">Grass → perimeter</button></div></div><div id="p7calc" class="stage-box locked" style="margin-top:10px"><h4>2 · Calculate</h4><div class="field-grid">${numericField('p7p','Fence','m')}${numericField('p7a','Grass','m²')}</div><button id="p7check" class="primary-btn inline-check" type="button">Check blueprint</button></div></div></div>`;
      let f=false,g=false;const unlock=()=>{if(f&&g){$('p7calc').classList.remove('locked');setFeedback('practiceFeedback','Classification works. Now calculate.','good');}};
      $$('.choice-btn',$('p7f')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.value==='perimeter'){f=true;$$('.choice-btn',$('p7f')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});unlock();}else{wrong('practice',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('practiceFeedback','Boundary or surface? A fence goes around.','bad');}});
      $$('.choice-btn',$('p7g')).forEach(btn=>btn.onclick=()=>{if(btn.dataset.value==='area'){g=true;$$('.choice-btn',$('p7g')).forEach(b=>{b.disabled=true;b.classList.toggle('correct',b===btn);});unlock();}else{wrong('practice',i);btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),450);setFeedback('practiceFeedback','Grass covers the inside surface.','bad');}});
      $('p7check').onclick=()=>{if(!(f&&g)){setFeedback('practiceFeedback','Classify both measures first.','info');return;}const p=exact($('p7p').value,30),a=exact($('p7a').value,54);if(p&&a){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Blueprint complete: 30 m and 54 m².','good');}else if(p||a){wrong('practice',i);setFeedback('practiceFeedback','One measure works. Check the other calculation and unit.','bad');}else{wrong('practice',i);setFeedback('practiceFeedback','Use perimeter for the boundary and area for the surface.','bad');}};
    }else if(i===8){
      root.innerHTML=`<div class="story-card">A ribbon is <strong>3 m 40 cm</strong> long. <strong>85 cm</strong> is cut off. How many centimetres remain?</div><div class="stage-grid" style="margin-top:14px"><div class="stage-box"><h4>1 · Convert the full length</h4><div class="answer-line"><input id="p8conv" class="answer-input" inputmode="numeric"><b class="answer-suffix">cm</b></div><button id="p8first" class="ghost-btn inline-check" type="button">Check conversion</button></div><div id="p8calc" class="stage-box locked"><h4>2 · Cut 85 cm off</h4><div class="answer-line"><input id="p8ans" class="answer-input" inputmode="numeric"><b class="answer-suffix">cm</b></div><button id="p8check" class="primary-btn inline-check" type="button">Check remaining length</button></div></div>`;
      let conv=false;$('p8first').onclick=()=>{if(exact($('p8conv').value,340)){conv=true;$('p8calc').classList.remove('locked');setFeedback('practiceFeedback','Units match now: 340 cm.','good');}else{wrong('practice',i);setFeedback('practiceFeedback','3 m = 300 cm, then add the extra 40 cm.','bad');}};
      $('p8check').onclick=()=>{if(!conv){setFeedback('practiceFeedback','Convert the full ribbon first.','info');return;}if(exact($('p8ans').value,255)){markComplete('practice',i);$('practiceNext').disabled=false;setFeedback('practiceFeedback','Measurement complete.','good');}else{wrong('practice',i);setFeedback('practiceFeedback','The conversion works. Now subtract 85 cm.','bad');}};
    }
    existingStatus('practice',i,'practiceNext','practiceFeedback');
    renderParallelArea(i);
    activePass=()=>teacherPass('practice');
  }

  const practiceHints=[
    'Multiplication before addition.',
    '“Given away” makes the amount smaller.',
    'Brackets first, then multiply, then subtract.',
    'Calculate the bracketed expression differently from the unbracketed one.',
    'Five equal groups of 12, then 8 extra.',
    'D and M are equal priority: move left-to-right.',
    'First find the total in four bags.',
    'Fence = boundary; grass = surface.',
    'Convert 3 m 40 cm into centimetres first.'
  ];
  $('practiceHint').onclick=()=>setFeedback('practiceFeedback',practiceHints[state.practiceIndex],'info');
  $('practiceNext').onclick=()=>advance('practice');

  const parallelPools={
    0:[
      {prompt:'14 + 7 × 5',answer:49},
      {prompt:'50 − 6 × 4',answer:26},
      {prompt:'9 × 6 + 8',answer:62}
    ],
    4:[
      {story:'Seven baskets hold 9 apples each. Then 4 loose apples are added.',expr:['7*9+4','9*7+4'],answer:67},
      {story:'Six trays hold 11 cups each. Then 5 extra cups are added.',expr:['6*11+5','11*6+5'],answer:71},
      {story:'Eight packs hold 7 cards each. Then 6 loose cards are added.',expr:['8*7+6','7*8+6'],answer:62}
    ],
    6:[
      {story:'Five boxes contain 16 counters each. 8 are lost. The rest are shared among 4 children.',first:'5 × 16',answer:18},
      {story:'Six bags contain 14 beads each. 12 are lost. The rest are shared among 6 children.',first:'6 × 14',answer:12},
      {story:'Four trays contain 21 tokens each. 12 are removed. The rest are shared among 4 teams.',first:'4 × 21',answer:18}
    ]
  };
  function ensureParallel(i){
    if(!state.parallel[i]){const pool=parallelPools[i];state.parallel[i]={variant:Math.floor(Math.random()*pool.length),active:true,solved:false};save();}
    else{state.parallel[i].active=true;save();}
  }
  function renderParallelArea(i){
    const zone=$('parallelZone');if(![0,4,6].includes(i)||!arrHas('practice','completed',i)){zone.hidden=true;zone.innerHTML='';return;}
    zone.hidden=false;const p=state.parallel[i];
    if(!p||!p.active){zone.innerHTML=`<div class="parallel-launch"><p><strong>Transfer check:</strong> same mathematical structure, new numbers/context. Optional; it does not add extra mastery by itself.</p><button id="parallelLaunch" class="ghost-btn" type="button">Try a Parallel One</button></div>`;$('parallelLaunch').onclick=()=>{ensureParallel(i);renderParallelArea(i);};return;}
    const data=parallelPools[i][p.variant];
    if(p.solved){zone.innerHTML='<div class="success-strip"><span class="optional-badge">Parallel challenge</span><br>Parallel problem completed. The original challenge remains the mastery evidence.</div>';return;}
    if(i===0){
      zone.innerHTML=`<div class="parallel-panel"><span class="optional-badge">Parallel challenge</span><h4>Same BODMAS structure, new values</h4><div class="question-focus"><div class="big-math">${data.prompt}</div><div class="answer-line"><input id="parallelAnswer" class="answer-input" inputmode="numeric"></div><button id="parallelCheck" class="ghost-btn inline-check" type="button">Check parallel</button></div><div id="parallelFeedback" class="feedback"></div></div>`;
      $('parallelCheck').onclick=()=>{if(exact($('parallelAnswer').value,data.answer)){state.parallel[i].solved=true;save();renderParallelArea(i);}else{setFeedback('parallelFeedback','Not yet — use the same order-of-operations route.','bad');}};
    }else if(i===4){
      zone.innerHTML=`<div class="parallel-panel"><span class="optional-badge">Parallel challenge</span><h4>New surface context, same expression structure</h4><div class="story-card">${data.story}</div><div class="expression-row"><label><span>Expression</span><input id="parallelExpr" class="expression-input"></label><label><span>Answer</span><input id="parallelAnswer" class="answer-input" inputmode="numeric"></label></div><button id="parallelCheck" class="ghost-btn inline-check" type="button">Check parallel</button><div id="parallelFeedback" class="feedback"></div></div>`;
      $('parallelCheck').onclick=()=>{const e=exprMatches($('parallelExpr').value,data.expr),a=exact($('parallelAnswer').value,data.answer);if(e&&a){state.parallel[i].solved=true;save();renderParallelArea(i);}else if(e){setFeedback('parallelFeedback','The expression works. Check the arithmetic.','bad');}else{setFeedback('parallelFeedback','Build equal groups first, then add the extras.','bad');}};
    }else if(i===6){
      zone.innerHTML=`<div class="parallel-panel"><span class="optional-badge">Parallel challenge</span><h4>Same multistep route, less support</h4><div class="story-card">${data.story}</div><div class="field-grid" style="margin-top:12px"><label class="field-label"><span>First move</span><input id="parallelFirst" class="expression-input" aria-label="write the first operation"></label>${numericField('parallelAnswer','Final amount','')}</div><button id="parallelCheck" class="ghost-btn inline-check" type="button">Check parallel</button><div id="parallelFeedback" class="feedback"></div></div>`;
      $('parallelCheck').onclick=()=>{const first=exprMatches($('parallelFirst').value,[data.first.replace(/×/g,'*')]),a=exact($('parallelAnswer').value,data.answer);if(first&&a){state.parallel[i].solved=true;save();renderParallelArea(i);}else if(first){setFeedback('parallelFeedback','First move works. Check the remaining steps.','bad');}else{setFeedback('parallelFeedback','Start with the total in all equal groups.','bad');}};
    }
  }

  // ---------- FINISH ----------
  function renderFinish(){
    const practiceMastered=state.completed.practice.length,lessonDone=state.completed.lesson.length,totalPass=state.passed.warm.length+state.passed.lesson.length+state.passed.practice.length;
    $('finishSummary').innerHTML=`<div class="summary-card"><b>${practiceMastered} / 9</b><span>Independent challenges completed</span></div><div class="summary-card"><b>${lessonDone} / 8</b><span>Lesson blocks completed</span></div><div class="summary-card"><b>${totalPass}</b><span>Teacher passes (not mastery)</span></div>`;
  }

  // ---------- GLOBAL CONTROLS ----------
  $('startLesson').onclick=()=>{pushHistory();state.warmIndex=Math.min(state.warmIndex,warmCount-1);save();showScene('warmup');};
  $$('.section-menu-card').forEach(btn=>btn.onclick=()=>{const target=btn.dataset.sectionTarget;pushHistory();showScene(target);});
  $('breakContinue').onclick=()=>{pushHistory();state.lessonIndex=Math.min(state.lessonIndex,lessonCount-1);save();showScene('lesson');};
  $('backBtn').onclick=back;
  $('homeBtn').onclick=()=>{if(state.scene!=='cover'){pushHistory();showScene('cover');}};
  $('teacherPass').onclick=()=>{if(activePass)activePass();};
  $('finishMenu').onclick=()=>{pushHistory();showScene('cover');};
  $('restartSession').onclick=()=>{state=structuredClone(defaultState);try{localStorage.removeItem(KEY);}catch(e){}navHistory=[];save();showScene('cover');toast('Fresh session ready.');};

  // Restore safely.
  if(!['cover','warmup','zoomBreak','lesson','practice','finish'].includes(state.scene))state.scene='cover';
  state.warmIndex=Math.max(0,Math.min(warmCount-1,Number(state.warmIndex)||0));
  state.lessonIndex=Math.max(0,Math.min(lessonCount-1,Number(state.lessonIndex)||0));
  state.practiceIndex=Math.max(0,Math.min(practiceCount-1,Number(state.practiceIndex)||0));
  showScene(state.scene,false);
})();
