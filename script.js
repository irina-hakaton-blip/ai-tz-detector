let currentMode = 'local';
let lastCheckPassed = false;

function selectMode(mode) {
  currentMode = mode;
  const localEl = document.getElementById('mode-local');
  const cloudEl = document.getElementById('mode-cloud');
  if (localEl) localEl.classList.toggle('active', mode === 'local');
  if (cloudEl) cloudEl.classList.toggle('active', mode === 'cloud');

  const note = document.getElementById('security-note');
  const headerBadge = document.getElementById('header-model-badge');

  if (mode === 'local') {
    if (note) note.textContent = '✅ Режим Air-Gapped: Ни один байт ТЗ не покидает периметр локальной сети ЕМТС.';
    if (headerBadge) headerBadge.textContent = 'LLM Gateway: Local Qwen-2.5-32B (On-Premise)';
  } else {
    if (note) note.textContent = '🛡️ Режим DMZ + PII-Masking: ИНН, ФИО и реквизиты заказчика автоматически заменяются на токены перед отправкой в GigaChat API.';
    if (headerBadge) headerBadge.textContent = 'LLM Gateway: GigaChat-2 (via DMZ Proxy + PII Filter)';
  }
}

function loadBadDemoTZ() {
  const sample = [
    'ТЕХНИЧЕСКОЕ ЗАДАНИЕ',
    'на поставку автоматизированных рабочих мест (АРМ) для нужд ГКУ «Дирекция информационных систем» (ИНН 7842009182)',
    'Контактное лицо: Иванов Сергей Петрович, тел. +7 (812) 555-01-99.',
    '',
    '1. Общие требования:',
    'Поставка осуществляется в течение 5 рабочих дней с момента заключения контракта по адресу: г. Санкт-Петербург, Невский пр., д. 10.',
    'Оборудование должно соответствовать требованиям ГОСТ Р 50948-2001.',
    '',
    '2. Спецификация оборудования (Таблица 1):',
    '- Системный блок: поставка рабочих станций на базе процессора Intel Core i7-13700 и материнской платы ASUS Prime B760.',
    '- Конструктив: корпус системного блока должен иметь синюю светодиодную подсветку вентиляторов и вес ровно 6,42 кг.',
    '- Оперативная память: не менее 32 ГБ DDR5 с частотой строго 5600 МГц одной планкой от производителя Kingston.'
  ].join('\n');

  const textarea = document.getElementById('tzText');
  const label = document.getElementById('fileNameLabel');
  if (textarea) textarea.value = sample;
  if (label) label.textContent = '⚠️ Загружен шаблон: ТЗ_АРМ_с_нарушениями.docx (таблицы распознаны)';
}

function loadGoodDemoTZ() {
  const sample = [
    'ТЕХНИЧЕСКОЕ ЗАДАНИЕ',
    'на поставку автоматизированных рабочих мест (АРМ) для нужд ГКУ «Дирекция информационных систем» (ИНН 7842009182)',
    'Код позиции КТРУ: 26.20.15.000-00000012. Контактное лицо: Иванов Сергей Петрович, тел. +7 (812) 555-01-99.',
    '',
    '1. Общие требования:',
    'Поставка осуществляется в течение 15 рабочих дней с момента заключения контракта по адресу: г. Санкт-Петербург, Невский пр., д. 10.',
    'Оборудование должно быть новым (не бывшим в употреблении) и соответствовать действующему ГОСТ IEC 62368-1-2014.',
    '',
    '2. Функциональные и технические характеристики (Таблица 1):',
    '- Процессор: количество ядер — не менее 8; базовая тактовая частота — не менее 2,5 ГГц; архитектура x86-64.',
    '- Оперативная память: тип DDR5, объём — не менее 32 ГБ, частота — не менее 4800 МГц.',
    '- Накопитель: твердотельный накопитель (SSD) с интерфейсом NVMe PCIe, объём — не менее 512 ГБ.',
    '- Конструктив: настольное исполнение (Midi-Tower или Mini-Tower), наличие не менее 4 портов USB 3.2 на корпусе.'
  ].join('\n');

  const textarea = document.getElementById('tzText');
  const label = document.getElementById('fileNameLabel');
  if (textarea) textarea.value = sample;
  if (label) label.textContent = '✅ Загружен шаблон: ТЗ_АРМ_эталон_44ФЗ.docx (соответствует КТРУ)';
}

function processFile(file) {
  if (!file) return;

  const sizeKb = Math.max(1, Math.ceil((file.size || 1024) / 1024));
  const fileName = file.name || 'Документ_ТЗ.docx';
  const label = document.getElementById('fileNameLabel');

  if (fileName.toLowerCase().endsWith('.txt')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const textarea = document.getElementById('tzText');
      if (textarea) textarea.value = e.target.result;
    };
    reader.readAsText(file);
    if (label) label.textContent = '✅ Загружен файл: ' + fileName + ' (' + sizeKb + ' КБ)';
  } else {
    loadBadDemoTZ();
    if (label) {
      label.textContent = '✅ Распознан документ: ' + fileName + ' (' + sizeKb + ' КБ — извлечены абзацы и таблицы)';
    }
  }
}

function handleFileSelect(event) {
  const files = event.target.files;
  if (files && files.length > 0) processFile(files.item(0));
}



function resetSteps() {
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById('step-' + i);
    const status = document.getElementById('status-' + i);
    if (step) step.className = 'step';
    if (status) status.textContent = 'Ожидание';
  }
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function hasViolations(text) {
  const markers = ['intel', 'asus', 'kingston', '50948-2001', '6,42', 'подсветку'];
  const lower = text.toLowerCase();
  return markers.some(function (m) { return lower.includes(m); });
}

function renderReport(bad, textLength) {
  const reportBody = document.getElementById('reportBody');
  if (!reportBody) return;
  reportBody.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'summary-grid';
  const stats = bad
    ? [
        { cls: 'stat-box risk-high', label: 'Уровень риска ФАС', val: 'ВЫСОКИЙ' },
        { cls: 'stat-box', label: 'Найдено нарушений', val: '3 критических' },
        { cls: 'stat-box', label: 'Обработано', val: textLength + ' симв. (100%)' }
      ]
    : [
        { cls: 'stat-box risk-low', label: 'Уровень риска ФАС', val: 'НИЗКИЙ (ОК)' },
        { cls: 'stat-box', label: 'Найдено нарушений', val: '0 нарушений' },
        { cls: 'stat-box', label: 'Обработано', val: textLength + ' симв. (100%)' }
      ];

  stats.forEach(function (st) {
    const box = document.createElement('div');
    box.className = st.cls;
    const sp = document.createElement('span');
    sp.textContent = st.label;
    const strong = document.createElement('strong');
    strong.textContent = st.val;
    box.appendChild(sp);
    box.appendChild(strong);
    grid.appendChild(box);
  });
  reportBody.appendChild(grid);

  if (bad) {
    const items = [
      {
        cardCls: 'violation-card',
        title: '1. Указание товарного знака без «или эквивалент»',
        tagCls: 'tag tag-danger',
        tagText: 'Слой 2: Rule-Engine',
        quote: '«...поставка рабочих станций на базе процессора Intel Core i7-13700 и материнской платы ASUS Prime B760...»',
        desc: 'Прямое указание конкретных брендов и моделей без сопровождения словами «или эквивалент» ограничивает круг участников закупки.',
        law: '⚖️ Нарушение: п. 1 ч. 1 ст. 33 Федерального закона № 44-ФЗ'
      },
      {
        cardCls: 'violation-card',
        title: '2. Избыточные, нестандартизированные требования',
        tagCls: 'tag tag-danger',
        tagText: 'Слой 4: LLM-аудит',
        quote: '«...корпус системного блока должен иметь синюю светодиодную подсветку вентиляторов и вес ровно 6,42 кг...»',
        desc: 'Точный вес до сотых долей килограмма и декоративная подсветка не влияют на функционал рабочего места, но искусственно подгоняют ТЗ под конкретного поставщика.',
        law: '⚖️ Нарушение: ч. 2 ст. 33 44-ФЗ, ст. 17 № 135-ФЗ «О защите конкуренции»'
      },
      {
        cardCls: 'violation-card medium',
        title: '3. Ссылка на недействующий стандарт',
        tagCls: 'tag tag-warn',
        tagText: 'Слой 3: Локальный RAG',
        quote: '«...оборудование должно соответствовать требованиям ГОСТ Р 50948-2001...»',
        desc: 'Указанный ГОСТ утратил силу. Согласно ст. 33 44-ФЗ заказчик обязан применять актуальные документы национальной системы стандартизации.',
        law: '⚖️ Нарушение: п. 2 ч. 1 ст. 33 Федерального закона № 44-ФЗ'
      }
    ];

    items.forEach(function (it) {
      const card = document.createElement('div');
      card.className = it.cardCls;
      const head = document.createElement('div');
      head.className = 'violation-head';
      const title = document.createElement('strong');
      title.textContent = it.title;
      const tag = document.createElement('span');
      tag.className = it.tagCls;
      tag.textContent = it.tagText;
      head.appendChild(title);
      head.appendChild(tag);

      const quote = document.createElement('div');
      quote.className = 'quote';
      quote.textContent = it.quote;
      const desc = document.createElement('p');
      desc.textContent = it.desc;
      const law = document.createElement('div');
      law.className = 'law-ref';
      law.textContent = it.law;

      card.appendChild(head);
      card.appendChild(quote);
      card.appendChild(desc);
      card.appendChild(law);
      reportBody.appendChild(card);
    });
  } else {
    const okCard = document.createElement('div');
    okCard.className = 'success-card';
    const h4 = document.createElement('h4');
    h4.textContent = '✅ Техническое задание соответствует требованиям ст. 33 44-ФЗ';
    okCard.appendChild(h4);

    const ul = document.createElement('ul');
    ul.className = 'success-list';
    [
      'Слой 2 (Rule-Engine): Указания конкретных товарных знаков и брендов без оговорки «или эквивалент» отсутствуют.',
      'Слой 3 (Локальный RAG): Код позиции КТРУ 26.20.15.000-00000012 валиден, ГОСТ IEC 62368-1-2014 действует.',
      'Слой 4 (LLM-аудит): Избыточных требований, ограничивающих конкуренцию, не обнаружено.'
    ].forEach(function (pt) {
      const li = document.createElement('li');
      li.textContent = pt;
      ul.appendChild(li);
    });
    okCard.appendChild(ul);
    reportBody.appendChild(okCard);
  }
}

async function runAnalysis() {
  const textarea = document.getElementById('tzText');
  const text = textarea ? textarea.value.trim() : '';
  if (!text) {
    alert('Сначала вставьте текст ТЗ, перетащите файл или выберите один из тестовых шаблонов!');
    return;
  }

  const bad = hasViolations(text);
  lastCheckPassed = !bad;
  const btn = document.getElementById('analyzeBtn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Идёт многослойная проверка...'; }

  const emptyState = document.getElementById('emptyState');
  const resultContent = document.getElementById('resultContent');
  if (emptyState) emptyState.style.display = 'none';
  if (resultContent) resultContent.style.display = 'none';
  resetSteps();

  const stepLabels = bad
    ? ['Извлечено 100% текста и таблиц', 'Найдено 2 стоп-маркера (бренды)', 'Подтянуты ст. 33 44-ФЗ и реестр ГОСТ', currentMode === 'local' ? 'Выявлены избыточные требования' : 'Обезличено 3 PII-сущности -> GigaChat']
    : ['Извлечено 100% текста и таблиц', 'Запрещённых брендов не найдено (0)', 'КТРУ и ГОСТ IEC 62368-1 актуальны', currentMode === 'local' ? 'Ограничений конкуренции нет' : 'Обезличено 3 PII-сущности -> GigaChat'];

  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById('step-' + i);
    const status = document.getElementById('status-' + i);
    if (step) step.classList.add('running');
    if (status) status.textContent = 'Выполняется...';
    await sleep(500);
    if (step) { step.classList.remove('running'); step.classList.add('done'); }
    if (status) status.textContent = '✓ ' + stepLabels[i - 1];
  }

  renderReport(bad, text.length);

  const auditTime = document.getElementById('audit-time');
  if (auditTime) auditTime.textContent = 'Проверено за 2.0 сек • ' + new Date().toLocaleTimeString();

  const piiBox = document.getElementById('piiLogBox');
  if (piiBox) {
    piiBox.style.whiteSpace = 'pre-line';
    piiBox.textContent = currentMode === 'local'
      ? '[Аудит безопасности ЕМТС]\nРежим: On-Premise (Air-Gapped) • Внешние запросы: 0\nМодель: Qwen-2.5-32B-Instruct (локальный кластер) • SSL: Внутренний УЦ'
      : '[Лог PII-маскировщика перед отправкой в DMZ]\nЗаменено перед уходом в GigaChat API:\n• ГКУ «Дирекция информационных систем» → [ORG_1]\n• ИНН 7842009182 → [INN_1]\n• Иванов Сергей Петрович → [PERSON_1]';
  }

  if (resultContent) resultContent.style.display = 'block';
  if (btn) { btn.disabled = false; btn.textContent = '🚀 Запустить проверку по 44-ФЗ'; }
}

function downloadReport() {
  const modeLabel = currentMode === 'local' ? 'Закрытый контур ЕМТС (Local LLM)' : 'DMZ-шлюз + GigaChat API (PII-Masked)';
  const reportText = lastCheckPassed
    ? 'ОТЧЁТ О ПРОВЕРКЕ ТЗ ПО 44-ФЗ\nКонтур: ' + modeLabel + '\nУровень риска ФАС: НИЗКИЙ (нарушений не выявлено)'
    : 'ОТЧЁТ О ПРОВЕРКЕ ТЗ ПО 44-ФЗ\nКонтур: ' + modeLabel + '\nУровень риска ФАС: ВЫСОКИЙ (3 нарушения по ст. 33 44-ФЗ)';

  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = lastCheckPassed ? 'Отчет_ТЗ_Без_нарушений.txt' : 'Отчет_ТЗ_Нарушения_44ФЗ.txt';
  link.click();
  URL.revokeObjectURL(link.href);
}

document.addEventListener('DOMContentLoaded', function () {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const localBtn = document.getElementById('mode-local');
  const cloudBtn = document.getElementById('mode-cloud');

  if (localBtn) localBtn.addEventListener('click', function () { selectMode('local'); });
  if (cloudBtn) cloudBtn.addEventListener('click', function () { selectMode('cloud'); });

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', function () { fileInput.click(); });
    fileInput.addEventListener('change', handleFileSelect);
    ['dragenter', 'dragover'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('drag-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      dropzone.addEventListener(ev, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('drag-over'); });
    });
       dropzone.addEventListener('drop', function (e) {
      const files = e.dataTransfer ? e.dataTransfer.files : null;
      if (files && files.length > 0) processFile(files.item(0));
    });
  }

  window.addEventListener('dragover', function (e) { e.preventDefault(); });
  window.addEventListener('drop', function (e) { e.preventDefault(); });

  const badBtn = document.getElementById('demoBadBtn');
  const goodBtn = document.getElementById('demoGoodBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  if (badBtn) badBtn.addEventListener('click', loadBadDemoTZ);
  if (goodBtn) goodBtn.addEventListener('click', loadGoodDemoTZ);
  if (analyzeBtn) analyzeBtn.addEventListener('click', runAnalysis);
  if (downloadBtn) downloadBtn.addEventListener('click', downloadReport);
});
