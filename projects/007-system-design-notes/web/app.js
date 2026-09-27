const SNAPSHOT = '9d83887';
const REPO = `https://github.com/liquidslr/system-design-notes/tree/${SNAPSHOT}`;

const chapters = [
  { n: 1, folder: '01. Scaling', title: '从零到百万用户', en: 'Scaling', category: '基础方法', summary: '沿着用户增长理解负载均衡、缓存、数据库复制和分片如何逐步加入系统。', question: '服务增长后，先出现的容量瓶颈在哪里？' },
  { n: 2, folder: '02. Back Of the Envelope Estimation', title: '粗略容量估算', en: 'Back-of-the-envelope Estimation', category: '基础方法', summary: '通过明确假设估算 QPS、峰值流量、存储、带宽和可用性目标。', question: '需要多少机器、空间和网络容量，量级是否合理？' },
  { n: 3, folder: '03. System Design Framework', title: '系统设计框架', en: 'System Design Framework', category: '基础方法', summary: '用“明确范围—高层设计—深入关键点—总结改进”的顺序组织设计讨论。', question: '面对模糊题目，应该按什么顺序推进？' },
  { n: 4, folder: '04. Rate Limiter', title: '限流器', en: 'Rate Limiter', category: '核心组件', summary: '比较令牌桶、漏桶和窗口计数等办法，控制请求速率与突发流量。', question: '如何防止接口被突发请求压垮？' },
  { n: 5, folder: '05. Consistent Hashing', title: '一致性哈希', en: 'Consistent Hashing', category: '核心组件', summary: '用哈希环和虚拟节点分配数据，减少机器增减时需要迁移的键。', question: '增加或移除服务器时，怎样少搬数据？' },
  { n: 6, folder: '06. Key-Value Store', title: '分布式键值存储', en: 'Key-Value Store', category: '核心组件', summary: '从单机哈希表走向分区、副本和读写一致性，讨论可用性与正确性的取舍。', question: '怎样让键值数据在多台机器上可读、可写、可恢复？' },
  { n: 7, folder: '07. Unique-Id Generator', title: '分布式唯一 ID', en: 'Unique ID Generator', category: '核心组件', summary: '比较在多节点间生成唯一、有序或近似有序标识的方法。', question: '多个服务同时写入时，怎样避免 ID 冲突？' },
  { n: 8, folder: '08. URL Shortener', title: '短链接服务', en: 'URL Shortener', category: '产品系统', summary: '围绕长短链接映射、生成方式、重定向与读写比例组织方案。', question: '海量短链接怎样快速创建并稳定跳转？' },
  { n: 9, folder: '09. Web Crawler', title: '网络爬虫', en: 'Web Crawler', category: '产品系统', summary: '梳理网址发现、抓取、去重、调度与站点礼貌访问等环节。', question: '大量网页如何被持续抓取而不过度重复？' },
  { n: 10, folder: '10. Notification System', title: '通知系统', en: 'Notification System', category: '产品系统', summary: '理解通知生成、队列分发、多渠道投递与失败重试。', question: '如何让消息可靠地送到不同终端和渠道？' },
  { n: 11, folder: '11. News Feed System', title: '信息流', en: 'News Feed System', category: '产品系统', summary: '比较发帖时预推送和读帖时聚合，处理关注关系与热点用户。', question: '好友动态应在写入时分发，还是读取时组装？' },
  { n: 12, folder: '12. Chat System', title: '实时聊天', en: 'Chat System', category: '产品系统', summary: '讨论长连接、消息存储、在线状态、离线通知和多设备同步。', question: '消息怎样实时送达，并在离线后仍可找回？' },
  { n: 13, folder: '13. Search Autocomplete', title: '搜索自动补全', en: 'Search Autocomplete', category: '产品系统', summary: '围绕前缀检索、热词统计、排名与更新频率设计提示服务。', question: '输入几个字后，如何快速返回有用建议？' },
  { n: 14, folder: '14. Youtube', title: '视频平台', en: 'YouTube', category: '产品系统', summary: '从上传、转码、存储到播放分发梳理视频服务链路。', question: '大视频如何被处理并稳定播放给不同用户？' },
  { n: 15, folder: '15. Google Drive', title: '网盘与文件同步', en: 'Google Drive', category: '产品系统', summary: '讨论文件分块、上传下载、元数据和多设备同步。', question: '文件修改后，多个设备怎样保持一致？' },
  { n: 16, folder: '16. Proximity Service', title: '附近地点服务', en: 'Proximity Service', category: '产品系统', summary: '利用位置索引缩小查询范围，寻找一定距离内的地点。', question: '如何高效找出用户附近的商家或设施？' },
  { n: 17, folder: '17. Nearby Friends', title: '附近好友', en: 'Nearby Friends', category: '产品系统', summary: '处理位置更新、附近关系计算、实时通知与隐私边界。', question: '用户位置不断变化时，附近关系如何更新？' },
  { n: 18, folder: '18. Google Maps', title: '地图服务', en: 'Google Maps', category: '产品系统', summary: '从地图数据、瓦片呈现到导航路线理解大型地图服务。', question: '海量地理数据如何加载、检索并服务路径规划？' },
  { n: 19, folder: '19. Distributed Message Queue', title: '分布式消息队列', en: 'Distributed Message Queue', category: '平台与数据', summary: '从生产者、主题、分区、偏移量到副本，讨论顺序、持久化和批量处理。', question: '异步任务如何在高吞吐下可靠传递？' },
  { n: 20, folder: '20. Metrics Monitoring and Alerting System', title: '指标监控与告警', en: 'Metrics Monitoring and Alerting', category: '平台与数据', summary: '围绕指标采集、聚合、查询和告警构建系统可观测性。', question: '服务变慢或出错时，怎样及时发现并定位？' },
  { n: 21, folder: '21. Ad Click Event Aggregation', title: '广告点击聚合', en: 'Ad Click Event Aggregation', category: '平台与数据', summary: '处理持续涌入的点击事件，并按时间窗口与维度汇总。', question: '大量事件怎样实时统计且便于事后核对？' },
  { n: 22, folder: '22. Hotel Reservation System', title: '酒店预订', en: 'Hotel Reservation System', category: '产品系统', summary: '围绕库存、预订流程和并发竞争讨论房间分配。', question: '多人抢订时，怎样避免一间房被重复出售？' },
  { n: 23, folder: '23. Distributed Email Service', title: '分布式邮件服务', en: 'Distributed Email Service', category: '平台与数据', summary: '梳理邮件发送、接收、存储、投递与扩展。', question: '大量邮件如何排队、送达并处理失败？' },
  { n: 24, folder: '24. S3-like Object Storage', title: '对象存储', en: 'S3-like Object Storage', category: '平台与数据', summary: '区分对象数据与元数据，讨论海量文件的持久性、可用性和存储效率。', question: '怎样低成本、长期保存海量非结构化文件？' },
  { n: 25, folder: '25. Real-time Gaming Leaderboard', title: '实时游戏排行榜', en: 'Real-time Gaming Leaderboard', category: '产品系统', summary: '处理分数更新、排名查询与实时展示。', question: '分数频繁变化时，如何快速读取前列和个人名次？' },
  { n: 26, folder: '26. Payment System', title: '支付系统', en: 'Payment System', category: '交易系统', summary: '梳理收款、付款、外部支付服务、账本、失败处理与对账。', question: '支付状态不确定时，怎样避免重复扣款和账目差异？' },
  { n: 27, folder: '27. Digital Wallet', title: '数字钱包', en: 'Digital Wallet', category: '交易系统', summary: '讨论账户余额、资金流转和记录可追溯性。', question: '余额变化怎样可靠记录并可被核对？' },
  { n: 28, folder: '28. Stock Exchange', title: '股票交易所', en: 'Stock Exchange', category: '交易系统', summary: '围绕订单簿、撮合、行情、低延迟和故障恢复组织方案。', question: '海量订单怎样按规则快速撮合并保持一致？' },
];

const categories = ['全部', '基础方法', '核心组件', '产品系统', '平台与数据', '交易系统'];
const filters = document.getElementById('category-filters');
const search = document.getElementById('chapter-search');
const grid = document.getElementById('chapter-grid');
const detail = document.getElementById('chapter-detail');
const empty = document.getElementById('chapter-empty');
const count = document.getElementById('result-count');
let activeCategory = '全部';
let selected = 3;

function sourceUrl(chapter) {
  return `${REPO}/${encodeURIComponent(chapter.folder)}`;
}

function matches(chapter, query) {
  if (activeCategory !== '全部' && chapter.category !== activeCategory) return false;
  if (!query) return true;
  return [chapter.n, chapter.title, chapter.en, chapter.category, chapter.summary, chapter.question]
    .join(' ').toLocaleLowerCase().includes(query);
}

function renderFilters() {
  filters.replaceChildren();
  for (const category of categories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter-chip';
    button.textContent = `${category} ${category === '全部' ? chapters.length : chapters.filter(ch => ch.category === category).length}`;
    button.setAttribute('aria-pressed', String(category === activeCategory));
    button.addEventListener('click', () => {
      activeCategory = category;
      render();
    });
    filters.append(button);
  }
}

function renderDetail(chapter) {
  if (!chapter) {
    detail.innerHTML = '<p class="detail-placeholder">调整搜索条件后，选择一个章节查看导读。</p>';
    return;
  }
  detail.innerHTML = `
    <span class="detail-eyebrow">CHAPTER ${String(chapter.n).padStart(2, '0')} / ${chapter.category}</span>
    <h3>${chapter.title}</h3>
    <p class="detail-en">${chapter.en}</p>
    <div class="detail-rule"></div>
    <span class="detail-label">这一章主要回答</span>
    <p class="detail-question">${chapter.question}</p>
    <span class="detail-label">内容导读</span>
    <p class="detail-summary">${chapter.summary}</p>
    <a class="detail-link" href="${sourceUrl(chapter)}" target="_blank" rel="noopener noreferrer">阅读上游章节 <span aria-hidden="true">↗</span></a>
    <small>中文导读由本站整理，请以原文为准。</small>`;
}

function render() {
  renderFilters();
  const query = search.value.trim().toLocaleLowerCase();
  const visible = chapters.filter(ch => matches(ch, query));
  if (!visible.some(ch => ch.n === selected)) selected = visible[0]?.n ?? null;
  count.textContent = `${visible.length} / ${chapters.length}`;
  empty.hidden = visible.length > 0;
  grid.replaceChildren();
  for (const chapter of visible) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'chapter-card';
    button.setAttribute('aria-pressed', String(chapter.n === selected));
    button.innerHTML = `<span class="chapter-number">${String(chapter.n).padStart(2, '0')}</span><span class="chapter-card-text"><strong>${chapter.title}</strong><small>${chapter.en}</small></span><span class="chapter-arrow" aria-hidden="true">↗</span>`;
    button.addEventListener('click', () => {
      selected = chapter.n;
      render();
      if (window.matchMedia('(max-width: 760px)').matches) detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    grid.append(button);
  }
  renderDetail(chapters.find(ch => ch.n === selected));
}

search.addEventListener('input', render);
document.querySelectorAll('[data-category-jump]').forEach(link => {
  link.addEventListener('click', () => {
    activeCategory = link.dataset.categoryJump;
    search.value = '';
    render();
  });
});
render();

const caseForm = document.getElementById('case-form');
const dailyRequests = document.getElementById('daily-requests');
const peakRps = document.getElementById('peak-rps');
const modelInflight = document.getElementById('model-inflight');
const wholeNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const decimalNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });

function updateCaseEstimate() {
  const values = Object.fromEntries(new FormData(caseForm));
  const dau = Number(values.dau);
  const turns = Number(values.turns);
  const peak = Number(values.peak);
  const latency = Number(values.latency);
  if (![dau, turns, peak, latency].every(value => Number.isFinite(value) && value > 0)) {
    dailyRequests.textContent = peakRps.textContent = modelInflight.textContent = '—';
    return;
  }
  const requests = dau * turns;
  const peakPerSecond = requests / 86400 * peak;
  dailyRequests.textContent = wholeNumber.format(requests);
  peakRps.textContent = decimalNumber.format(peakPerSecond);
  modelInflight.textContent = wholeNumber.format(Math.ceil(peakPerSecond * latency));
}

caseForm.addEventListener('input', updateCaseEstimate);
caseForm.addEventListener('submit', event => event.preventDefault());
updateCaseEstimate();
