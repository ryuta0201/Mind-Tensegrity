/* --------------------------------------------------------
   Thought-Tensegrity Viewer  (p5.js instance + WEBGL)
   – 三層 + Core  / 黄金比 strokeWeight / 距離で文字サイズ補正
---------------------------------------------------------*/
window.tensegritySketch = p => {

    /* ───── 定数 ───── */
    const N  = 12;      // Abstract¹ / Sound
    const M  = 4;       // Hub (Abstract²)
    const R1 = 1.00;    // Abstract¹ radius
    const R2 = 0.70;    // Hub radius
    const R3 = 1.25;    // Sound radius
    const SCALE = 250;  // 全体scale
    const PHI = 1.61803398875;
    const W_OUTER = 600 / SCALE;          // 0.3px 等価
    const W_ABS   = W_OUTER / PHI;
    const W_HUB   = W_ABS   / PHI;
    const W_CORE  = W_HUB   / PHI;
    
    let fontJP;
    let abstractPos = [], soundPos = [], hubPos = [], corePos;
    let rotX=0, rotY=0, dragging=false, lastX=0, lastY=0;
    
    /* ラベル配列（省略部は同じ） */
    const abstractLabels=[ /* 12 labels */ "小ささ","安定/丹田","和・伝統","先進性","保守性","軽やかさ","受容/暖かさ","鋭さ/速度","繊細さ","普遍性/正義","静寂/癒し","破壊/攻撃"];
    const soundLabels   =[ /* 12 */ "milli…","おーかー…","いみじくも…","beep beep…","おどどどん…","Humpty dumpty…","いーじゃ…","カラレッタ…","ぴゃー…","アタマンナカ…","ふー いー","ガガガン…"];
    const hubLabels     =["スケール可変性","革新的継承","内的均衡","ケアリング循環"];
    const triadMap      =[[0,8,6],[2,3,11],[1,7,10],[9,2,6]];
    
    /* ─ preload ─ */
    p.preload=()=>{
      const url="https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mplus1p/MPLUS1p-Regular.ttf";
      fontJP=p.loadFont(url);
    };
    
    /* ─ setup ─ */
    p.setup=()=>{
      p.createCanvas(p.windowWidth,p.windowHeight,p.WEBGL);
      p.textFont(fontJP);
      p.textAlign(p.CENTER,p.CENTER);
      genPos();
      p.noFill();
    };
    
    /* ─ draw ─ */
    p.draw=()=>{
      p.background(250);
      handleOrbit();
      p.scale(SCALE);
    
      /* layer lines */
      p.strokeWeight(W_OUTER); p.stroke(0,140,70);
      for(let i=0;i<N;i++) lineVec(abstractPos[i],soundPos[i]);      // strut
      p.stroke(255,170,70,80);
      for(let i=0;i<N;i++) lineVec(soundPos[i],soundPos[(i+2)%N]);   // sound ring
    
      p.strokeWeight(W_ABS); p.stroke(100,150,255,80);
      for(let i=0;i<N;i++) lineVec(abstractPos[i],abstractPos[(i+1)%N]); // abs ring
    
      /* hub */
      p.strokeWeight(W_HUB); p.stroke(180,90,250,90);
      for(let h=0;h<M;h++) triadMap[h].forEach(idx=>lineVec(hubPos[h],abstractPos[idx]));
      p.strokeWeight(W_CORE); p.stroke(120,60,220,40);
      hubPos.forEach(hv=>lineVec(corePos,hv));
    
      /* draw nodes+labels */
      p.noStroke();
      drawNode(corePos,"空/Awareness",p.color(30),0.05);
    
      hubPos.forEach((v,i)=>drawNode(v,hubLabels[i],p.color(148,0,211),0.04));
      abstractPos.forEach((v,i)=>drawNode(v,abstractLabels[i],p.color(65,105,225),0.06));
      soundPos.forEach(   (v,i)=>drawNode(v,soundLabels[i],   p.color(220,55,55) , -0.06));
    };
    
    /* ─ helpers ─ */
    function genPos(){
      // 外層
      for(let i=0;i<N;i++){
        const phi=Math.acos(1-2*(i+0.5)/N);
        const th =Math.PI*(1+Math.sqrt(5))*(i+0.5);
        const x=Math.sin(phi)*Math.cos(th), y=Math.sin(phi)*Math.sin(th), z=Math.cos(phi);
        abstractPos.push(p.createVector(x*R1,y*R1,z*R1));
        soundPos.push(   p.createVector(x*R3,y*R3,z*R3));
      }
      // hub
      for(let j=0;j<M;j++){
        const phi=Math.acos(1-2*(j+0.5)/M);
        const th =Math.PI*(1+Math.sqrt(5))*(j+0.5);
        hubPos.push(p.createVector(Math.sin(phi)*Math.cos(th)*R2, Math.sin(phi)*Math.sin(th)*R2, Math.cos(phi)*R2));
      }
      corePos=p.createVector(0,0,0);
    }
    
    function lineVec(a,b){ p.line(a.x,a.y,a.z,b.x,b.y,b.z); }
    
    /* ラベル距離補正付きビルボード */
    function drawNode(v,label,col,yOff){
      p.push();
      p.translate(v.x,v.y,v.z);
      p.fill(col); p.sphere(0.03,8,6);
    
      /* 距離→文字サイズ補正 */
      const vCam = worldToCamera(v);
      const zBase = 3;                 // 適当な基準距離
      const sz = p.constrain(14*zBase/(zBase - vCam.z),8,28); // 8〜28px
      p.textSize(sz / SCALE);          // model空間のサイズ
    
      /* ラベル */
      p.push();
      p.translate(0,yOff,0);
      p.rotateY(-rotY); p.rotateX(-rotX);
      p.fill(0); p.text(label,0,0);
      p.pop(); p.pop();
    }
    
    /* world→camera 座標変換（回転のみ） */
    function worldToCamera(vec){
      let v=p.createVector(vec.x,vec.y,vec.z);
      // Y回転
      const cosY=Math.cos(rotY), sinY=Math.sin(rotY);
      let x1= cosY*v.x + sinY*v.z;
      let z1=-sinY*v.x + cosY*v.z;
      // X回転
      const cosX=Math.cos(rotX), sinX=Math.sin(rotX);
      let y1= cosX*v.y - sinX*z1;
      let z2= sinX*v.y + cosX*z1;
      return p.createVector(x1,y1,z2);
    }
    
    /* カメラ操作 */
    function handleOrbit(){ p.rotateX(rotX); p.rotateY(rotY); }
    p.mousePressed = ()=>{dragging=true;lastX=p.mouseX;lastY=p.mouseY;};
    p.mouseDragged = ()=>{
      if(dragging){ rotY+=(p.mouseX-lastX)*0.005; rotX+=(p.mouseY-lastY)*0.005;
        lastX=p.mouseX; lastY=p.mouseY; }
    };
    p.mouseReleased=()=>dragging=false;
    p.windowResized =()=>p.resizeCanvas(p.windowWidth,p.windowHeight);
    
    }; /* instance fn end */
    
    new p5(window.tensegritySketch);    