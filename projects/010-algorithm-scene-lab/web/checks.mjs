import {fft, fft2, Waves, Shallow, Transport, Wetness, wetStep, fresnel, transmission, march, flight, ballistic, triWeights, fbm, rms} from './models.mjs';
import {defaults} from './catalog.mjs';
const result = (name, value, expected, tolerance, note = '') => ({name,value,expected,tolerance,pass:Number.isFinite(value) && Math.abs(value-expected) <= tolerance,note});
export function runChecks(id, p = defaults(id)) {
  const out = [];
  if (id === 'waves') {
    const a = Float64Array.from({length:16},(_,i)=>Math.sin(i*.73)+.3*Math.cos(i*1.4)), before = a.slice(), b = new Float64Array(16);
    fft(a,b); fft(a,b,true); out.push(result('FFT 往返恢复原信号',Math.max(...a.map((v,i)=>Math.abs(v-before[i]))),0,1e-10,'使用独立输入信号，检查正逆变换。'));
    const mode = new Waves({...p,method:1}); mode.update(1.75);
    out.push(result('频谱共轭对称产生实数',Math.max(...mode.imag.map(Math.abs)),0,1e-10));
    out.push(result('IFFT 高度 RMS 等于设定振幅',rms(mode.field),p.amplitude,1e-9,'仅针对 IFFT 路径的振幅定义。'));
    const re = new Float64Array(64), im = new Float64Array(64); re[0] = 64; fft2(re,im,8,true);
    out.push(result('仅直流频谱还原常量平面',Math.max(...re.map(v=>Math.abs(v-1))),0,1e-12));
  } else if (id === 'flow') {
    const sim = new Shallow({...p,inflow:0}); for(let i=0;i<90;i++)sim.step(1/30);
    out.push(result('封闭边界水量守恒误差（%）',sim.metrics()[1],0,1e-7,'推进 3 秒；误差对初始水量归一化。'));
    out.push(result('所有格子保持非负且有限',Array.from(sim.field).filter(v=>!Number.isFinite(v)||v < -1e-12).length,0,0));
    const rest = new Shallow({...p,inflow:0}); rest.field.forEach((_,i)=>rest.field[i]=Math.max(0,.55-rest.bed[i])); const before=rest.field.slice(); rest.initial=rest.volume();rest.external=0;
    for(let i=0;i<30;i++)rest.step(1/30);
    out.push(result('静水在不平底面保持静止',Math.max(...rest.field.map((v,i)=>Math.abs(v-before[i]))),0,1e-10,'不施加初始水团，水面保持水平。'));
    const driven = new Shallow({...p,inflow:.08});for(let i=0;i<60;i++)driven.step(1/30);
    out.push(result('计入边界交换后的收支误差（%）',driven.metrics()[1],0,1e-7));
  } else if (id === 'transport') {
    const sim = new Transport({speed:4,swirl:0,decay:0});const before=sim.field.slice();sim.step(.25);
    let err=0;for(let y=0;y<40;y++)for(let x=0;x<64;x++)err=Math.max(err,Math.abs(sim.field[y*64+x]-before[y*64+(x+63)%64]));
    out.push(result('整格平移与解析位置一致',err,0,1e-12));
    const constant = new Transport(p);constant.field.fill(1);constant.step(.1);
    out.push(result('常量场消散符合指数解',Math.max(...constant.field.map(v=>Math.abs(v-Math.exp(-p.decay*.1)))),0,1e-12));
    const moving = new Transport(p);for(let i=0;i<60;i++)moving.step(1/30);
    out.push(result('插值后浓度保持在 0–1',Array.from(moving.field).filter(v=>!Number.isFinite(v)||v<0||v>1+1e-12).length,0,0,'这不保证复杂速度场的总量守恒。'));
  } else if (id === 'wetness') {
    const half = Math.log(2)/p.drain; let film=1, wet=0;for(let i=0;i<60;i++)[film,wet]=wetStep(film,wet,0,p.drain,p.dry,half/60);
    out.push(result('无补水时经过半衰期剩余 0.5',film,.5,1e-10));
    const sim = new Wetness(p);for(let i=0;i<180;i++)sim.step(1/30);
    out.push(result('水膜和湿度保持在 0–1',[...sim.field,...sim.film].filter(v=>!Number.isFinite(v)||v<0||v>1).length,0,0));
    const one=wetStep(.7,.4,0,p.drain,p.dry,1)[0];let f=.7;for(let i=0;i<30;i++)f=wetStep(f,0,0,p.drain,p.dry,1/30)[0];
    out.push(result('纯排水不依赖时间步拆分',Math.abs(f-one),0,1e-12));
  } else if (id === 'optics') {
    out.push(result('正面反射符合折射率解析值',fresnel(0,p.ior),((1-p.ior)/(1+p.ior))**2,1e-12));
    out.push(result('掠射角反射接近 100%',fresnel(90,p.ior),1,1e-12));
    out.push(result('40 段积分匹配均匀介质解析解',Math.abs(march(.72*p.turbidity,p.depth)-transmission(.72*p.turbidity,p.depth)),0,1e-12,'仅验证吸收项，不验证多次散射或原站画面。'));
    out.push(result('零吸收介质完全透光',march(0,p.depth),1,1e-12));
  } else if (id === 'breaker') {
    const t=flight(p.height,p.lift,p.gravity);
    out.push(result('预测落水时刻高度为零',ballistic(t,p.height,p.speed,p.lift,p.gravity)[1],0,1e-10));
    const mid=t*.47, pos=ballistic(mid,p.height,p.speed,p.lift,p.gravity), e=.5*(p.speed**2+(p.lift-p.gravity*mid)**2)+p.gravity*pos[1], e0=.5*(p.speed**2+p.lift**2)+p.gravity*p.height;
    out.push(result('无阻力弹道机械能守恒',Math.abs(e-e0),0,1e-10));
    out.push(result('重力增加后落水时间缩短',flight(p.height,p.lift,p.gravity*1.5)<t?1:0,1,0));
  } else if (id === 'material') {
    let error=0,min=1,max=0;for(let i=0;i<31;i++){const w=triWeights([Math.sin(i),Math.cos(i*.71),Math.sin(i*.29)],p.sharpness);error=Math.max(error,Math.abs(w.reduce((a,b)=>a+b,0)-1));const n=fbm(i*.31,-i*.13,p.octaves);min=Math.min(min,n);max=Math.max(max,n);}
    out.push(result('各方向混合权重和为 1',error,0,1e-12));
    out.push(result('采样的 fBm 值保持在 0–1',min>=0&&max<=1?1:0,1,0));
    out.push(result('轴向法线只选择对应投影',triWeights([1,0,0],p.sharpness)[0],1,1e-12));
  }
  return out;
}
