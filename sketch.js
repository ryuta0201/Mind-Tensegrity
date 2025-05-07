/* --------------------------------------------------------
   Thought-Tensegrity Viewer  phase-1
   – tap = font POP + sound   – drag = orbit rotate
---------------------------------------------------------*/
window.tensegritySketch = p => {
    let SCALE;
    let W_OUTER, W_ABS, W_HUB, W_CORE; //線の幅

    /* ───── 定数 ───── */
    const N  = 12,  M = 4;
    const R1 = 1.00, R2 = 0.6125, R3 = 1.25;
    const PHI = 1.61803398875;

    /* For Sounds (C major) */
    const FREQ = [220,246.9,261.6,293.7,329.6,349.2,392.0,440.0];
    let synthArr = [];
    
    /* ★ POP & タップ判定用 */
    const POP_FRAMES = 50;           // 拡大が戻るまでのフレーム
    const TAP_DIST   = 8;            // 8px 未満なら“タップ”
    const TAP_TIME   = 280;          // 280ms 未満

    let hitIdx;
    
    /* 位置＆表示 */
    let absPos=[], sndPos=[], hubPos=[], corePos;
    let pops=[]
    let fontJP;
    
    /* カメラ回転 */
    let rotX=0,rotY=0, dragging=false, startPt, startT;

    let zoom = 1;            // ズーム係数 (1 = 等倍)
    let pinchStart = null;   // 2 本指の初期距離
    
    /* ラベル */
    const abstractLabels=["小ささ","安定/丹田","和・伝統","先進性","保守性","軽やかさ","受容/暖かさ","鋭さ/速度","繊細さ","普遍性/正義","静寂/癒し","破壊/攻撃"];
    const soundLabels   =["milli…","おーかー…","いみじくも…","beep beep…","おどどどん…","Humpty dumpty…","いーじゃ…","カラレッタ…","ぴゃー…","アタマンナカ…","ふー いー","ガガガン…"];
    const hubLabels     =["スケール可変性","革新的継承","内的均衡","ケアリング循環"];
    const triadMap      =[[0,8,6],[2,3,11],[1,7,10],[9,2,6]];
    
    /* ─ preload ─ */
    p.preload = ()=>{
      fontJP = p.loadFont("https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mplus1p/MPLUS1p-Regular.ttf");
    };
    
    /* ─ setup ─ */
    p.setup=()=>{
      p.createCanvas(p.windowWidth,p.windowHeight,p.WEBGL);
      addScreenPositionFunction();
      initScale();
      updateStrokeWeights();
      p.textFont(fontJP); 
      p.textAlign(p.CENTER,p.CENTER);
      genPos(); 
      p.noFill();

      const total = 1 + hubPos.length + absPos.length + sndPos.length;

      for (let i = 0; i < total; i++) {
        // 0〜7 の周波数を繰り返し割り当て
        synthArr.push(new TouchSynth(p, FREQ[i % FREQ.length]));
      }
    };
    
    /* ─ draw ─ */
    p.draw=()=>{
      p.background(250);
      handleOrbit();
      p.scale(SCALE * zoom);
    
      /* --- 線 --- (同じ) */
      p.strokeWeight(W_OUTER); p.stroke(0,140,70);
      for(let i=0;i<N;i++) lineVec(absPos[i],sndPos[i]);
      p.stroke(255,170,70,80);
      for(let i=0;i<N;i++) lineVec(sndPos[i],sndPos[(i+2)%N]);
      p.strokeWeight(W_ABS); p.stroke(100,150,255,80);
      for(let i=0;i<N;i++) lineVec(absPos[i],absPos[(i+1)%N]);
      p.strokeWeight(W_HUB); p.stroke(180,90,250,90);
      hubPos.forEach((h,hi)=>triadMap[hi].forEach(idx=>lineVec(h,absPos[idx])));
      p.strokeWeight(W_CORE); p.stroke(120,60,220,40);
      hubPos.forEach(h=>lineVec(corePos,h));
    
      /* --- ノード描画 --- */
      let idx=0;
      drawNode(corePos,"空/Awareness",p.color(30),0.05,idx++);
    
      hubPos.forEach((v,i)=>drawNode(v,hubLabels[i],p.color(148,0,211),0.04,idx++));
      absPos.forEach((v,i)=>drawNode(v,abstractLabels[i],p.color(65,105,225),0.06,idx++));
      sndPos.forEach((v,i)=>drawNode(v,soundLabels[i],p.color(220,55,55),-0.06,idx++));
    };
    
    /* ─ helpers ─ */
    function initScale() {
        // 対角の 70 % をモデル半径 1.25 (外層 R3) に合わせる
        const diag = Math.sqrt(p.width * p.width + p.height * p.height);
        SCALE = 0.40 * diag / (2 * R3);   //   2*R3 ≈ 直径
      }      
    function updateStrokeWeights() {
        W_OUTER = 0.01 * SCALE;          // 画面対角 0.3 % 相当
        W_ABS   = W_OUTER / PHI;
        W_HUB   = W_ABS   / PHI;
        W_CORE  = W_HUB   / PHI;
      }  
    
    function genPos(){
      for(let i=0;i<N;i++){
        const phi=Math.acos(1-2*(i+0.5)/N);
        const th =Math.PI*(1+Math.sqrt(5))*(i+0.5);
        const x=Math.sin(phi)*Math.cos(th), y=Math.sin(phi)*Math.sin(th), z=Math.cos(phi);
        absPos.push(p.createVector(x*R1,y*R1,z*R1));
        sndPos.push(   p.createVector(x*R3,y*R3,z*R3));
      }
      for(let j=0;j<M;j++){
        const phi=Math.acos(1-2*(j+0.5)/M);
        const th =Math.PI*(1+Math.sqrt(5))*(j+0.5);
        hubPos.push(p.createVector(Math.sin(phi)*Math.cos(th)*R2, Math.sin(phi)*Math.sin(th)*R2, Math.cos(phi)*R2));
      }
      corePos=p.createVector(0,0,0);
    }
    
    function lineVec(a,b){ p.line(a.x,a.y,a.z,b.x,b.y,b.z); }
    
    /* ★ POP アニメ対応 drawNode */
    function drawNode(v,label,col,yOff,idx){
      const isHit = (idx === hitIdx);

      p.fill(isHit ? p.color(255,0,0) : col);

      p.push(); 
      p.translate(v.x,v.y,v.z);
      p.sphere(0.03,8,6);
    
      /* POP 減衰 */
      if(pops[idx]>0) pops[idx]--;
    
      /* 文字サイズ補正（距離＋POP） */
      const vc=worldToCamera(v);
      const base= 20 * 3 / (3 + vc.z);        
      const sz = p.constrain(base*(1+0.8*pops[idx]/POP_FRAMES),8,32);
      p.textSize(sz/SCALE);
    
      /* ラベル (ビルボード) */
      p.push();
      p.translate(0,yOff,0);
      p.rotateY(-rotY); p.rotateX(-rotX);
      p.fill(0); p.text(label,0,0);
      p.pop(); p.pop();
    }
    
    /* 距離変換 */
    function worldToCamera(vec){
      let x=vec.x, y=vec.y, z=vec.z;
      const cosY=Math.cos(rotY), sinY=Math.sin(rotY);
      [x,z] = [ cosY*x + sinY*z , -sinY*x + cosY*z ];      
      const cosX=Math.cos(rotX), sinX=Math.sin(rotX);
      [y,z] = [ cosX*y - sinX*z , sinX*y + cosX*z ];
      return p.createVector(x,y,z);
    }
    
    /* ─── タップ vs ドラッグ ─── */
    p.touchStarted = ()=>{
        if (p.touches.length === 2) {
            pinchStart = p.dist(p.touches[0].x, p.touches[0].y,
                p.touches[1].x, p.touches[1].y);
        } else {
            startPt = p.createVector(p.mouseX,p.mouseY); 
            startT = p.millis(); 
            dragging=true;
        }
        return false;      
    };

    /* ── touchMoved ── */
    p.touchMoved = () => {
        if (p.touches.length === 2 && pinchStart !== null) {
        // ピンチ更新
        const d = p.dist(p.touches[0].x, p.touches[0].y,
                        p.touches[1].x, p.touches[1].y);
        const factor = d / pinchStart;
        zoom = p.constrain(zoom * factor, 0.4, 3);   // ズーム範囲 0.4〜3倍
        pinchStart = d;                              // 次フレーム用
        } else if (dragging) {
        // 1 本指ドラッグで回転
        rotY += (p.mouseX - p.pmouseX) * 0.005;
        rotX += (p.mouseY - p.pmouseY) * 0.005;
        }
        return false;
    };
    
    /* ── touchEnded ── */
    p.touchEnded = () => {
        if (p.touches.length < 2) {
        pinchStart = null;           // ピンチ終了
        }
        if (!dragging) return false;
    
        dragging = false;
        if (startPt.dist(p.createVector(p.mouseX, p.mouseY)) < TAP_DIST &&
            (p.millis() - startT) < TAP_TIME) {
        handleTap(p.mouseX, p.mouseY);
        }
        return false;
    };
      
    /* ★ タップ処理：スクリーン2D 判定 (高速) */
    function handleTap(mx,my){
        const nodes=[corePos,...hubPos,...absPos,...sndPos];
        let best=-1,dist=1e9,sp;
        nodes.forEach((pos,i)=>{
          const s=p.screenPosition(pos);
          const d=p.dist(mx,my,s.x,s.y);
          if(d<dist){dist=d;best=i;sp=s;}
        });
        // 球スクリーン半径
        const sp2=p.screenPosition(p.createVector(nodes[best].x+0.03,nodes[best].y,nodes[best].z));
        const pick=p.dist(sp.x,sp.y,sp2.x,sp2.y)+14;
        if(dist<pick){ pops[best]=POP_FRAMES; hitIdx=best; synthArr[best].trigger(); }
      }
                                  
    /* ─── ユーティリティ ─── */
    function handleOrbit(){ p.rotateX(rotX); p.rotateY(rotY); }
    p.windowResized =()=>p.resizeCanvas(p.windowWidth,p.windowHeight);

    function addScreenPositionFunction(){
        // 依存の小さな vec4 / mat4 helper を最小実装
        const vec4_multMat4 = (out, v, m)=>{
          const x=v[0],y=v[1],z=v[2],w=v[3];
          out[0]=m[0]*x+m[4]*y+m[8]*z+m[12]*w;
          out[1]=m[1]*x+m[5]*y+m[9]*z+m[13]*w;
          out[2]=m[2]*x+m[6]*y+m[10]*z+m[14]*w;
          out[3]=m[3]*x+m[7]*y+m[11]*z+m[15]*w;
          return out;
        };
        p5.prototype.screenPosition = function(x,y,z){
          if(x instanceof p5.Vector){ z=x.z; y=x.y; x=x.x; }
          const mv  = this._renderer.uMVMatrix.mat4;   // modelView 4×4
          const proj= this._renderer.uPMatrix.mat4;    // projection 4×4
          let v=[x,y,z,1], tmp=[0,0,0,0];
          vec4_multMat4(tmp,v,mv);
          vec4_multMat4(v,tmp,proj);
          const w = v[3]!==0 ? 1/v[3] :1;
          v[0]*=w; v[1]*=w; v[2]*=w;
          // NDC→screen
          return {
            x:( v[0]*0.5+0.5)*this.width,
            y:(-v[1]*0.5+0.5)*this.height,
            z: v[2]
          };
        };
      }      

    }; /* インスタンス終了 */
    
    new p5(window.tensegritySketch);
    