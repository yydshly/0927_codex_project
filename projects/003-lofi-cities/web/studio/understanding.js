import { moments } from './moments.js';
import { scenes } from './model.js';
import { getProfile } from './music.js';

const examples = [
  { id: 'reading', name: '安静阅读', moment: 'reading', intent: '我想安静读一会儿书，声音不要抢走注意力。', environment: '暖色书房、缓慢的局部动态、轻柔钢琴与窗外细雨。', control: '觉得旋律太明显，就降低音乐音量；想更安静，可以减少雨声或暂停画面。', memory: '命名保存这套搭配，下次从收藏恢复。保存的是明确设置。' },
  { id: 'focus', name: '投入工作', moment: 'flow', intent: '我想开始一段工作，让周围有稳定的背景陪伴。', environment: '城市夜景、Lo-fi 节奏与低音量的环境声。', control: '按自己的感受选择配器和节奏，手动开启专注计时；音乐与计时各自运行。', memory: '记录完成的专注，保存自己喜欢的工作环境，下一次少做几次选择。' },
  { id: 'relax', name: '慢慢放松', moment: 'unwind', intent: '我想暂时放下手里的事，听一会儿风和炉火。', environment: '森林木屋、木吉他、松风、炉火与轻微的枝叶运动。', control: '可以降低音乐，突出自然声；也可以调暗画面，进入沉浸模式。', memory: '保留自己调好的比例，需要时再次打开；睡眠定时可让声音渐弱停止。' },
];

const roadmap = [
  ['优先打磨', '视听品质', '六个动态场景、六种合成音乐、独立环境声', '丰富音乐曲目与环境声素材，加入柔和的切换，打磨自然循环'],
  ['优先探索', '直接操作场景', '面板可分别控制动态、亮度、音乐与混音', '点击台灯调光、点击窗户开合，让场景物件连接画面与声音'],
  ['第二阶段', '随时间变化', '循环动态和场景参考时钟', '黄昏渐入夜晚、天气缓慢变化、列车经过不同风景，也允许锁定状态'],
  ['第二阶段', '专注流程联动', '专注 / 休息计时、记录与睡眠淡出', '专注开始时收起控件，休息时改变氛围，结束后恢复'],
  ['第二阶段', '个人空间与分享', '收藏、命名保存、恢复整套环境', '编辑更多场景元素，生成可以打开和继续修改的环境链接'],
  ['后续扩展', '桌面与创作工具', '全屏沉浸、画面导出、静态网页部署包', '小窗播放、离线收藏、低耗能模式、直播输出和网页嵌入'],
];

export function initUnderstanding(root, onPlayMoment) {
  root.innerHTML = `
    <div class="page-heading"><div><p class="eyebrow">THE IDEA BEHIND QUIET SPACES</p><h1 id="understanding-title">一个由你掌控的个人氛围空间。</h1><p>围绕你想进入或维持的状态，把画面、声音和交互组织成一个可以持续使用的环境。</p></div></div>
    <div class="understanding-source"><div><span class="understanding-kicker">研究来源 · Lofi Cities</span><p>Istanbul 是源站的一个城市场景。栖间是我们从这次研究出发，独立实现的桌面体验产品。</p></div><a href="https://loficities.com/istanbul/" target="_blank" rel="noopener noreferrer">Lofi Cities · Istanbul ↗</a><a href="https://github.com/yydshly/0927_codex_project/blob/main/projects/003-lofi-cities/notes/web-audit.md" target="_blank" rel="noopener noreferrer">原站能力与证据 ↗</a></div>
    <div class="understanding-summary">
      <article><h2>能力是什么？</h2><p>Lofi Cities 将程序绘制的城市动画、实时合成音乐、独立环境声和轻量计时整合在网页里。已确认的是网页产品，尚未确认可直接安装的开源库。</p></article>
      <article><h2>呈现什么效果？</h2><p>原站是像素城市夜景中的持续动态与声音陪伴。栖间把这一思路延伸为六个插画场景、局部动画、六种音乐与自由混音，参数改变后可以直接感知差异。</p></article>
      <article><h2>用在什么场景？</h2><p>阅读时降低旋律存在感，工作时保留稳定节奏，休息时突出风、雨和炉火。也可作为个人桌面的环境背景，支持保存下次继续使用。</p></article>
      <article><h2>还能扩展什么？</h2><p>优先打磨画面和声音，再让灯、窗户等物件同时影响视觉与听感；随后连接时间变化、专注阶段、个人空间编辑与分享。后文区分现有能力和设想。</p></article>
      <article class="understanding-value"><h2>对我有什么意义？</h2><p>把“图片与音乐的组合”推进到可控制、可保存、可反复使用的个人环境。用现有原型比较多种风格、验证交互是否有价值，再判断要做个人工具、场景内容产品，还是可嵌入其他网页的氛围组件。</p></article>
    </div>
    <details class="understanding-guide"><summary>查看实际网页产品引导图 · 从哪里开始使用</summary><figure><a href="#space" aria-label="从引导图进入实际空间"><img src="./assets/product-guide.png" alt="栖间实际运行截图：雪山小屋、六套组合、左侧功能入口、右上环境调节和底部播放器" loading="lazy" width="1280" height="720"></a><figcaption>独立产品“栖间”的真实网页截图。图片展示布局，动态与声音请进入空间体验。</figcaption></figure><ol><li><strong>选择组合</strong><span>画面下方选阅读、远行等氛围，开启对应音乐。</span></li><li><strong>调整环境</strong><span>右上角调节天气、画面、音乐与各类环境声。</span></li><li><strong>比较与保存</strong><span>左侧对比场景，用收藏保存喜欢的配置。</span></li><li><strong>持续使用</strong><span>按需开启专注或沉浸，底部随时控制声音。</span></li></ol></details>
    <div class="understanding-thesis"><div><span class="understanding-kicker">从个人意图出发</span><p>“我想安静读书 30 分钟。”</p><small>把感受落实为使用意图，环境就有了可以调整的方向。</small></div><div class="understanding-principle"><strong>选择权始终在你手里</strong><p>先由你表达需求，再通过预设和手动调节找到合适的搭配。你可以随时覆盖任何设置。</p></div></div>
    <div class="understanding-heading"><h2>人与环境，如何形成一轮互动？</h2><span>四个环节，反复调整</span></div>
    <ol class="understanding-loop">
      <li><span class="understanding-number">01</span><h3>个人意图</h3><p>此刻想做什么，想要什么感觉？</p><small>阅读 · 专注 · 放松 · 陪伴</small></li>
      <li><span class="understanding-number">02</span><h3>视听环境</h3><p>让视觉、声音和动态共同表达氛围。</p><small>场景 · 灯光 · 音乐 · 环境声</small></li>
      <li><span class="understanding-number">03</span><h3>交互反馈</h3><p>你改变一个设置，环境给出可感知的回应。</p><small>明暗变化 · 音量变化 · 动态变化</small></li>
      <li><span class="understanding-number">04</span><h3>持续匹配</h3><p>根据自己的感受继续调整，保存舒服的搭配。</p><small>调整 → 保存 → 下次恢复</small></li>
    </ol>
    <p class="understanding-loop-note">匹配以你的主动选择为起点。当前产品保存配置，不会自动识别情绪或推断心理状态。</p>

    <div class="understanding-heading"><div><p class="eyebrow">MAKE THE IDEA CONCRETE</p><h2>同一套能力，服务不同的意图。</h2></div><span>切换示例只改变说明</span></div>
    <div class="understanding-example-buttons" role="group" aria-label="选择意图示例">${examples.map((e, i) => `<button type="button" data-intent-example="${e.id}" aria-pressed="${i === 0}" aria-controls="intent-example">${e.name}</button>`).join('')}</div>
    <article id="intent-example" class="understanding-example" aria-live="polite"></article>

    <div class="understanding-heading"><div><p class="eyebrow">FROM CONTROLS TO A RESPONSIVE ROOM</p><h2>下一步，让场景里的物件回应你。</h2></div><span class="understanding-status planned">后续设想 · 尚未实现</span></div>
    <div class="understanding-actions">
      <article><span data-icon="sliders"></span><h3>打开一条窗缝</h3><p>窗帘轻轻摆动，室外雨声变得更清晰；关窗后，声音隔着玻璃传来。</p></article>
      <article><span data-icon="moon"></span><h3>点一下台灯</h3><p>在暖光、阅读光与关灯之间切换，灯光成为场景里可操作的物件。</p></article>
      <article><span data-icon="clock"></span><h3>开始一段阅读</h3><p>控件自动收起，留下画面和小计时；休息时环境温和变化。</p></article>
    </div>
    <p class="understanding-loop-note">目前可通过面板调整亮度、天气和声音，计时与声音独立运行。物件点击、窗户声学联动和专注阶段自动换氛围，属于下一步的增量。</p>

    <div class="understanding-heading"><h2>从现在到以后，每一步都有明确边界。</h2></div>
    <div class="understanding-levels">
      <article><span class="understanding-status available">当前可用</span><h3>主动选择与保存</h3><p>选择现有组合，手动修改参数，收藏和恢复。匹配来自用户明确表达的偏好。</p></article>
      <article><span class="understanding-status planned">下一步</span><h3>明确规则联动</h3><p>把物件操作、使用阶段与环境变化连接起来；用户可以关闭联动或随时改回。</p></article>
      <article><span class="understanding-status later">长期探索</span><h3>基于反馈的推荐</h3><p>由用户明确的喜欢、不喜欢与使用反馈提供推荐，仍保留解释和手动选择。</p></article>
    </div>
    <div class="understanding-heading"><h2>产品优化与扩展路线</h2><span>建议顺序 · 未承诺上线时间</span></div>
    <div class="understanding-table"><table><thead><tr><th scope="col">建议顺序</th><th scope="col">方向</th><th scope="col">已有基础</th><th scope="col">下一步增量</th></tr></thead><tbody>${roadmap.map(r => `<tr>${r.map((v, i) => i === 1 ? `<th scope="row">${v}</th>` : `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="understanding-conclusion"><span>先做好一个完整空间</span><p>先把书房的声音层次、物件交互和连续使用体验做好，再扩展到其他场景。重点观察用户能否顺利开始、是否反复使用自己的搭配，以及是否觉得调节负担更少。</p></div>
    <details class="understanding-references"><summary>延伸理解：可借鉴的产品路径与商业方向</summary><div><p>以下是参考思路，不表示栖间已经接入这些产品或具备同等能力。</p><ul><li><a href="https://endel.io/technology" target="_blank" rel="noopener noreferrer">Endel ↗</a>：声音随时间与情境变化，可借鉴“使用过程中的适配”。</li><li><a href="https://mynoise.net/NoiseMachines/custom.php" target="_blank" rel="noopener noreferrer">myNoise ↗</a>：自定义声音组合并保存为链接，可借鉴“创作与分享”。</li><li><a href="https://support-apps.discord.com/hc/en-us/articles/26502210208663-Lofi-FAQ" target="_blank" rel="noopener noreferrer">Discord Lofi ↗</a>：共同听歌与共享场景，可借鉴“共同陪伴”。</li></ul><p>未来可以验证精品场景与音乐包、个人空间高级编辑、直播或网站嵌入服务。现阶段优先验证日常使用价值，付费意愿仍需另行验证。</p></div></details>
  `;

  function selectExample(id) {
    const e = examples.find(item => item.id === id);
    if (!e) return;
    const moment = moments.find(m => m.id === e.moment);
    const scene = scenes.find(s => s.id === moment.scene);
    root.querySelectorAll('[data-intent-example]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.intentExample === id)));
    root.querySelector('#intent-example').innerHTML = `<div class="understanding-scene"><img src="./assets/scenes/${scene.id}-v3.png" alt="${scene.name}场景示意" loading="lazy"><div><span>场景示意</span><h3>${scene.name}</h3><p>${getProfile(moment.settings.musicProfile).name} · ${moment.note.split(' · ')[1]}</p></div></div><div class="understanding-example-copy"><span class="understanding-status available">现有能力示例</span><h3>${e.intent}</h3><dl><div><dt>环境</dt><dd>${e.environment}</dd></div><div><dt>控制</dt><dd>${e.control}</dd></div><div><dt>延续</dt><dd>${e.memory}</dd></div></dl><div class="understanding-example-footer"><button class="button primary" type="button" data-try-intent="${e.moment}">播放「${moment.name}」组合 →</button><small>只开启这套视听组合，计时由你选择开始。</small></div></div>`;
  }
  root.addEventListener('click', event => {
    const example = event.target.closest('[data-intent-example]');
    if (example) selectExample(example.dataset.intentExample);
    const play = event.target.closest('[data-try-intent]');
    if (play) void onPlayMoment(play.dataset.tryIntent);
  });
  selectExample('reading');
}
