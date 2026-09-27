const C = 'https://github.com/iamtechartist/coastal-simulation/blob/2e95e1a3e757ca1268247417dee01606e5e3d55c/';
const S = 'https://github.com/cryptomanavan/ShoreBreak/blob/11c8c057db671628ef2dbc308ab9fe0f233f48dc/';
export const scenes = [
  {id:'coast',icon:'≈',name:'开阔海面',tag:'波形与尺度',lab:'waves',modules:['waves','optics','transport'],note:'先合成波形，再接水体光学。这里观察波的尺度、方向和叠加，不处理海岸破浪。'},
  {id:'lake',icon:'◌',name:'湖泊与泳池',tag:'透明与反光',lab:'optics',modules:['optics','waves','wetness'],note:'平静水面可先复用光学与轻微波动；封闭岸线、物体扰动和池壁需要另外接入。'},
  {id:'channel',icon:'↝',name:'浅溪与沟渠',tag:'地形与流动',lab:'flow',modules:['flow','transport','optics'],note:'实验使用沟渠岸坡与凸起障碍。水只能按地形高度移动，不能穿越实体高点；入口和出口需按真实场景设计。'},
  {id:'rain',icon:'⋮',name:'雨后地面',tag:'水膜与湿痕',lab:'wetness',modules:['wetness','material','optics'],note:'用快消退的水膜与慢消退的湿度控制颜色和粗糙度。本实验不计算雨滴撞击或地面积水流动。'},
  {id:'underwater',icon:'▽',name:'水下观察',tag:'光程与吸收',lab:'optics',modules:['optics','transport'],note:'加深水层、提高浑浊度，观察透光衰减。局部气泡云可用体积步进扩展；本实验先验证均匀介质。'},
  {id:'surf',icon:'⌁',name:'冲浪与水幕',tag:'形状与轨迹',lab:'breaker',modules:['breaker','flow','transport','optics'],note:'浪唇几何、弹道、水体冲击需要共同的时刻和位置。本实验只拆解浪唇运动与粒子，未连接完整浅水系统。'},
  {id:'tracer',icon:'∿',name:'溪流泡沫',tag:'输运与消散',lab:'transport',modules:['transport','flow','optics'],note:'白色示踪物随给定速度场移动。它不会反过来推动水；染色、泡沫、漂浮纹理可以借用这一层。'},
  {id:'rocks',icon:'◇',name:'岩石与悬崖',tag:'纹理与投影',lab:'material',modules:['material','wetness'],note:'用噪声生成多尺度纹理，按表面方向混合三向投影。几何轮廓、碰撞体和水力地形仍要另外制作。'}
];
const range = (key,label,min,max,step,value,unit,hint) => ({key,label,min,max,step,value,unit,hint});
const select = (key,label,value,options,hint) => ({key,label,value,options,hint});
export const labs = {
  waves: {
    name:'波浪合成',en:'WAVE SYNTHESIS',number:'01',summary:'把规则叠加成自然起伏',kind:'解析模型 / 频域计算',
    description:'相同的海面目标可以由少数波直接相加，也可以先分配各频率的能量，再用二维逆 FFT 生成高度场。',
    controls:[select('method','生成方法',1,[[0,'四组解析波'],[1,'二维 IFFT 教学谱']],'方法改变时，只比较形态；两种振幅的定义不同。'),range('amplitude','振幅',0,.6,.02,.24,'m','IFFT 中表示目标均方根高度；解析波中表示缩放系数。'),range('frequency','主要空间频率',1,7,.25,3,'','越大，单位范围内的波越密。'),range('direction','传播方向',0,180,5,20,'°','旋转能量分布与传播方向。')],
    metrics:[['高度 RMS','m',3],['峰谷差','m',3],['虚部残差','',6]],
    inputs:'频率、方向、振幅、种子、时间',state:'32 × 32 高度场',formula:'h(x, z, t) = IFFT₂[ H(k, t) ]',
    process:'IFFT 路径使用共轭对称频谱，确保结果为实数；按深水色散关系推进相位。另一路直接叠加四个余弦波。',
    observe:'先把 B 的振幅加倍，观察 RMS；再增大主要频率，观察波峰数量。别用单帧峰谷差代替整体波能量。',
    boundary:'这是独立的 Gaussian 方向教学谱，不是 ShoreBreak 的完整 JONSWAP、三层级联或原站画质。没有岸线、冲击、倒卷水幕。',
    reuse:'湖泊、海洋背景和景观水池可从这一层起步。改波形通常调参数；接岸线、障碍或船体需要新的耦合。',
    challenge:{values:{amplitude:.48},title:'只把振幅加倍',expected:'固定 IFFT、频谱和种子后，B 的 RMS 应为 A 的 2 倍。',measure:'RMS 比值'},
    sources:[['coastal · 解析波输入',C+'src/coast.js'],['ShoreBreak · 风浪与其他模块的分工',S+'docs/ARCHITECTURE.md']]
  },
  flow: {
    name:'浅水流动',en:'SHALLOW WATER',number:'02',summary:'让水量跨越网格边界',kind:'数值计算 / 高度场',
    description:'每个格子保存水深，相邻水面高度差推动水平流速。搬运的是水量，所以可以核对流动前后是否守恒。',
    controls:[select('display','观察字段',1,[[1,'水面偏移：观察波的传播'],[0,'水深：观察地形与覆盖']],'仅改变颜色映射。水面偏移相对初始水平面计算。'),range('slope','底面坡度',0,.08,.005,.035,'m/m','改变高程数据，进而改变哪些地方能被水覆盖。'),range('obstacle','障碍高度',0,1.2,.05,.65,'m','高于水面的格子成为阻挡；低处可被水越过。'),range('friction','速度阻尼',0,3,.1,.6,'s⁻¹','越大，波动与流动衰减越快。'),range('inflow','左侧水位驱动',0,.15,.01,0,'m','0 表示封闭边界；非零时记录边界净增减水量后再核对收支。')],
    metrics:[['水体积','m³',3],['水量收支误差','%',7],['最小水深','m',5]],
    inputs:'海床高度、水位、边界驱动、阻尼',state:'48 × 28 水深 + 面流速',formula:'新水量 = 旧水量 + 流入 − 流出',
    process:'压力梯度推动格子面上的速度，用上游水深计算通量，再限制总流出量，避免出现负水深。步长根据当前速度和水深自动细分。',
    observe:'灰褐色是裸露地形。水面偏移视图中，蓝色低于初始水面，暖色高于它；水深视图用青蓝色表示深浅。关闭边界驱动后，水可移动，但总量应保持不变。',
    boundary:'独立教学求解器省略非线性动量平流、湍流和侵蚀。每个水平位置只有一个水面高度；岸坡、边界和障碍是人为配置。',
    reuse:'适合浅溪、沟渠和薄层地表水的视觉原型。更换场景必须一起修改地形和边界；数值守恒通过不等于工程精度验证。',
    challenge:{values:{obstacle:1.1},title:'把石头抬出水面',expected:'B 的裸露障碍更大，水流绕行；两侧仍应分别满足水量收支。初始地形不同，不能直接比较总水量大小。',measure:'水量收支误差'},
    sources:[['coastal · 交错网格与流量限制',C+'src/simulation.js'],['ShoreBreak · GPU 有限体积求解',S+'src/swash/SwashSim.js']]
  },
  transport: {
    name:'泡沫与纹理输运',en:'ADVECTION',number:'03',summary:'追踪这一片白沫从哪里来',kind:'半拉格朗日平流 / 插值',
    description:'当前位置沿速度反向追踪，再从上一帧采样。水流由这里预设的速度场给定，白色示踪物只是被搬运的标量。',
    controls:[range('speed','水平速度',0,12,.5,5,'格/s','控制整体向右移动；越过边缘后从另一边进入。'),range('swirl','旋转分量',0,1.5,.1,.5,'','给速度场增加变化，让示踪团变形。'),range('decay','消散速率',0,.8,.02,.05,'s⁻¹','模拟泡沫寿命，越大消散越快。')],
    metrics:[['示踪物总量','格',2],['峰值浓度','',3],['推进时间','s',2]],
    inputs:'上一帧浓度、给定速度场、消散速率',state:'64 × 40 浓度场',formula:'c新(x) = c旧(x − uΔt) · exp(−λΔt)',
    process:'反向追踪到网格之间时，用四个邻近格子的双线性插值估算浓度。左右、上下都使用周期边界。',
    observe:'关闭消散并观察白团边缘，仍会逐渐变柔和，这是插值带来的数值耗散。复杂速度场下，总量不保证严格守恒。',
    boundary:'本实验只输运二维标量，不求解速度、不计算三维烟雾，也不让泡沫反过来改变流体。',
    reuse:'用于水面泡沫、漂浮纹理、二维染色和污染扩散的视觉表达。真实物质守恒或三维流动要采用相应模型。',
    challenge:{values:{decay:.35},title:'缩短泡沫寿命',expected:'B 的浓度和总量会比 A 更快降低；速度场保持相同，运动路径应相近。',measure:'峰值浓度'},
    sources:[['coastal · transport 与回溯采样',C+'src/simulation.js'],['ShoreBreak · foam 与输运',S+'src/swash/SwashSim.js']]
  },
  wetness: {
    name:'湿润与干燥',en:'SURFACE MEMORY',number:'04',summary:'给地面一段“湿过的记忆”',kind:'状态累积 / 指数衰减',
    description:'表面水膜和吸收湿度使用不同时间尺度。水膜控制明亮反光，湿度控制深色残痕，让退水后的地面保持连续变化。',
    controls:[range('rain','持续补水',0,.5,.02,0,'/s','为每个格子提供同等补水；这是简化输入，不是雨滴模拟。'),range('drain','水膜排水速率',.1,2,.1,1,'s⁻¹','越大，亮水膜越快消失。'),range('dry','湿度干燥速率',.01,.4,.01,.04,'s⁻¹','越大，暗湿痕越快恢复；仍可能受到水膜渗入。')],
    metrics:[['平均水膜','',3],['平均湿度','',3],['无补水时膜半衰期','s',2]],
    inputs:'局部洒水或持续补水、排水与干燥速率',state:'水膜 f 与湿度 w，范围 0–1',formula:'f(t + Δt) = f(t) · exp(−排水速率 · Δt)',
    process:'水膜按排水率衰减，水膜还会使湿度上升；湿度按另一速率恢复。浓度不代表真实毫米水深，颜色和高光由状态映射。',
    observe:'先看亮水膜退去，再看深色湿痕慢慢消退。点击“同一扰动”可同时向两侧再洒一次水。',
    boundary:'材质记忆不是浅水流动；本实验不会算积水往低处走、雨滴冲击或材质内真实渗流。',
    reuse:'雨后道路、湿岩石、脚印和水渍都可复用。替换触发来源与干湿材质，即可迁移到许多非海岸场景。',
    challenge:{values:{dry:.25},title:'只让地面更快干',expected:'两侧的水膜均值一致；B 的湿度下降更快。水膜排水和吸收湿度是独立参数。',measure:'平均湿度'},
    sources:[['coastal · film / wet 状态',C+'src/simulation.js'],['ShoreBreak · RockWetness',S+'src/beach/RockWetness.js']]
  },
  optics: {
    name:'水体光学',en:'WATER OPTICS',number:'05',summary:'把看见的颜色拆成光的路径',kind:'Schlick 近似 / 吸收 / 体积积分',
    description:'观察角度决定反光比例；折射改变光路；不同颜色沿光程按不同系数衰减。体积步进把路径分段，逐段累计透光率。',
    controls:[range('angle','入射角（相对法线）',0,85,1,45,'°','角度越接近 90°，水面反射通常越强。'),range('depth','水层深度',.2,5,.1,1.8,'m','光程更长时，红色衰减比蓝绿色更快。'),range('turbidity','吸收系数倍率',0,3,.1,1,'×','这里只调吸收，未模拟完整多次散射。'),range('ior','折射率',1.1,1.6,.01,1.33,'','影响折射角与正面反射率；1.33 接近水。')],
    metrics:[['水面反射比例','%',2],['红光透过率','%',2],['水内光程','m',2]],
    inputs:'角度、深度、折射率、吸收系数',state:'反射率、折射角、RGB 透过率',formula:'T = exp(−σ · 路径长度)，40 段累乘验证',
    process:'Schlick 近似计算菲涅耳反射，Snell 定律计算折射角，Beer–Lambert 衰减计算各颜色的透过率。画面中的亮纹仅是示意材质。',
    observe:'彩色条是实际算出的 RGB 透过率；光线箭头表达角度关系。增加水深与改变角度是两种不同原因。',
    boundary:'均匀介质的 40 段积分用于理解局部体积步进；不含原库完整反射贴图、真实焦散、气泡云密度或多次散射。',
    reuse:'湖泊、泳池和水下观察可复用这一组关系。玻璃与雾可借鉴公式，但要更换几何、介质和光照模型。',
    challenge:{values:{angle:80},title:'贴近水面观察',expected:'B 的反射率明显高于 A。水深不变，折射后的水内光程也会略有变化。',measure:'水面反射比例'},
    sources:[['coastal · Fresnel 与指数吸收',C+'src/shading.js'],['ShoreBreak · 水下体积与水面渲染的区别',S+'docs/ARCHITECTURE.md']]
  },
  breaker: {
    name:'翻卷与喷溅',en:'SHAPED BREAKER',number:'06',summary:'把受控形状与自由下落接起来',kind:'参数化水幕 / 弹道粒子',
    description:'先给出浪唇的起点与速度，再按重力计算下落。连续发射的轨迹点组成教学水幕，落水后出现独立粒子。',
    controls:[range('height','浪唇起始高度',.4,2,.1,1,'m','越高，通常越晚落水；不是自发增长的波高。'),range('speed','向前速度',.5,4,.1,2.2,'m/s','增加水幕前伸距离。'),range('lift','向上速度',0,3,.1,1.3,'m/s','增加起跳弧度和飞行时间。'),range('gravity','重力加速度',3,15,.1,9.8,'m/s²','用于做因果实验；地球附近通常取约 9.81。')],
    metrics:[['预计落水时间','s',3],['预计前伸距离','m',2],['重力加速度','m/s²',1]],
    inputs:'发射高度、水平速度、向上速度、重力',state:'水幕轨迹与独立喷溅粒子',formula:'x = vx · t，y = h + vy · t − ½gt²',
    process:'水幕按一组有序轨迹采样成带状几何。首次接触水面后，按相同重力推进喷溅粒子。背景波形只是参数化外观。',
    observe:'虚线标出预测落点，亮点是浪唇前缘。每轮固定时间重播，可暂停和单步查看落水时刻。',
    boundary:'独立二维剖面教学实现，不是直接运行 LipRibbon；没有水幕自碰撞、三维破碎，也未向浅水注入水量或动量。',
    reuse:'适合可控冲浪镜头、水幕和效果原型。瀑布、任意倒水或船体浮力不能由这些参数直接得到。',
    challenge:{values:{gravity:14},title:'只增加重力',expected:'B 的浪唇更早落水、前伸距离更短。验证面板会检查预计落水时刻的高度接近零。',measure:'预计落水时间'},
    sources:[['ShoreBreak · 独立浪唇几何',S+'src/water/LipRibbon.js'],['coastal · 接触喷溅',C+'src/spray.js']]
  },
  material: {
    name:'噪声与三向投影',en:'PROCEDURAL MATERIAL',number:'07',summary:'让表面细节不依赖一张展开图',kind:'Value noise / fBm / 三平面映射',
    description:'把多个尺度的噪声相加得到岩石纹理，再按法线方向混合来自三个平面的投影。这里使用球形载体方便检查接缝。',
    controls:[range('scale','纹理频率',1,9,.25,3,'','越大，颗粒越细。'),range('octaves','噪声层数',1,5,1,3,'层','层数越多，细尺度信息越丰富，采样也越多。'),range('sharpness','方向混合锐度',1,10,1,4,'','越高，三个投影之间的过渡越集中。'),select('projection','映射方式',1,[[0,'单平面投影'],[1,'三平面混合']],'单平面在侧面更容易拉伸。'),select('weights','显示内容',0,[[0,'岩石材质'],[1,'RGB 方向权重']],'红、绿、蓝分别代表 X、Y、Z 投影的贡献。')],
    metrics:[['噪声层数','层',0],['纹理频率','',2],['归一化权重和','',3]],
    inputs:'三维位置、法线、频率、层数、锐度',state:'三个采样值与混合权重',formula:'wi = |ni|ᵖ / Σ|n|ᵖ，颜色 = Σ wi · 纹理i',
    process:'平滑插值随机格点形成 value noise，再按半幅、倍频叠加为 fBm。三平面纹理由表面法线决定混合比例。',
    observe:'先选 RGB 方向权重，再改变混合锐度。回到材质视图，切换单平面与三平面，检查球体侧面的拉伸。',
    boundary:'使用独立教学噪声与规则几何，不生成真实岩石模型，不含原库摄影材质；法线和坐标空间不一致时仍会出现问题。',
    reuse:'适合岩石、悬崖、洞穴、地形与程序化素材。与湿度模块结合可做湿岩石；几何和碰撞仍需单独制作。',
    challenge:{values:{projection:0},title:'撤掉三平面混合',expected:'B 的侧面纹理拉伸更明显。这个实验验证的是视觉表现，权重检查只能验证混合计算。',measure:'观察投影拉伸'},
    sources:[['coastal · 三向投影与分层噪声材质',C+'src/shading.js']]
  }
};
export const defaults = id => Object.fromEntries(labs[id].controls.map(c => [c.key,c.value]));
export function sanitize(id, values = {}) { const out = defaults(id); for (const c of labs[id].controls) { const v = Number(values[c.key]); if (!Number.isFinite(v)) continue; out[c.key] = c.options ? (c.options.some(([x]) => x === v) ? v : c.value) : Math.round(Math.max(c.min,Math.min(c.max,v)) / c.step) * c.step; } return out; }
