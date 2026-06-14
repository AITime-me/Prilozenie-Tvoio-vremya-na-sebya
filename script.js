/**
 * Твоё время для себя — ежедневный дневник заботы о себе
 * Данные хранятся в localStorage
 */

(function () {
  'use strict';

  /* --- Константы --- */
  var STORAGE_KEY = 'tvse-diary';
  var THEME_KEY = 'tvse-theme';
  var VALID_THEMES = ['green', 'pink', 'gold'];
  var CONFETTI_EMOJIS = ['💗', '🤍', '🕰️', '✨'];

  var SLOGANS = {
    0: 'Пусть воскресенье будет днём без спешки, с заботой о себе и своим ритмом.',
    1: 'Начни неделю не с гонки, а с внимания к себе.',
    2: 'Сегодня тоже можно выбрать себя.',
    3: 'Маленькая пауза посреди недели уже считается.',
    4: 'Ты не обязана всё тащить. Иногда достаточно выдохнуть.',
    5: 'Пусть сегодня в списке дел будешь ты.',
    6: 'День для мягкости, тишины и маленьких радостей.'
  };

  var MONTH_NAMES = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
  ];

  /* --- DOM-элементы --- */
  var form = document.getElementById('diary-form');
  var didTodayEl = document.getElementById('did-today');
  var feelingEl = document.getElementById('feeling');
  var customFeelingWrap = document.getElementById('custom-feeling-wrap');
  var customFeelingEl = document.getElementById('custom-feeling');
  var feelingDetailsEl = document.getElementById('feeling-details');
  var tomorrowPlanEl = document.getElementById('tomorrow-plan');
  var saveMessageEl = document.getElementById('save-message');
  var todayDateEl = document.getElementById('today-date');
  var sloganEl = document.getElementById('slogan');
  var monthSelectEl = document.getElementById('month-select');
  var statsBlockEl = document.getElementById('stats-block');
  var statsSummaryEl = document.getElementById('stats-summary');
  var statsListEl = document.getElementById('stats-list');
  var archiveCardsEl = document.getElementById('archive-cards');
  var archiveEmptyEl = document.getElementById('archive-empty');
  var themeButtons = document.querySelectorAll('.theme-btn');

  /* --- Работа с localStorage (с защитой от ошибок) --- */

  /** Безопасно читает все записи дневника */
  function loadEntries() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
      }
      return parsed;
    } catch (e) {
      return {};
    }
  }

  /** Безопасно сохраняет записи */
  function saveEntries(entries) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (e) {
      return false;
    }
  }

  /** Загружает сохранённую тему (light/dark и прочие устаревшие → green) */
  function loadTheme() {
    try {
      var theme = localStorage.getItem(THEME_KEY);
      if (theme && VALID_THEMES.indexOf(theme) !== -1) {
        return theme;
      }
    } catch (e) {
      /* игнорируем */
    }
    return 'green';
  }

  /** Сохраняет тему */
  function saveTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      /* игнорируем */
    }
  }

  /* --- Утилиты даты --- */

  /** Формат YYYY-MM-DD для локальной даты */
  function formatDateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /** Ключ месяца YYYY-MM */
  function formatMonthKey(dateStr) {
    return dateStr.slice(0, 7);
  }

  /** Человекочитаемая дата: «14 июня 2026, воскресенье» */
  function formatDisplayDate(dateStr) {
    var parts = dateStr.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var weekdays = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
    var day = date.getDate();
    var month = MONTH_NAMES[date.getMonth()];
    var year = date.getFullYear();
    var weekday = weekdays[date.getDay()];
    return day + ' ' + month + ' ' + year + ', ' + weekday;
  }

  /** Название месяца для select: «Июнь 2026» */
  function formatMonthLabel(monthKey) {
    var parts = monthKey.split('-');
    var monthIndex = Number(parts[1]) - 1;
    var monthName = MONTH_NAMES[monthIndex];
    return monthName.charAt(0).toUpperCase() + monthName.slice(1) + ' ' + parts[0];
  }

  /* --- Тема --- */

  function applyTheme(theme) {
    if (VALID_THEMES.indexOf(theme) === -1) theme = 'green';
    document.body.setAttribute('data-theme', theme);

    themeButtons.forEach(function (btn) {
      var isActive = btn.getAttribute('data-theme') === theme;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });

    return theme;
  }

  function initTheme() {
    var storedTheme = null;
    try {
      storedTheme = localStorage.getItem(THEME_KEY);
    } catch (e) {
      /* игнорируем */
    }

    var theme = applyTheme(loadTheme());

    /* Миграция устаревших тем (light, dark и др.) */
    if (storedTheme && VALID_THEMES.indexOf(storedTheme) === -1) {
      saveTheme(theme);
    }

    themeButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var newTheme = btn.getAttribute('data-theme');
        var validTheme = applyTheme(newTheme);
        saveTheme(validTheme);
      });
    });
  }

  /* --- Слоган --- */

  function showSlogan() {
    var day = new Date().getDay();
    sloganEl.textContent = SLOGANS[day] || SLOGANS[0];
  }

  /* --- Форма дневника --- */

  function toggleCustomFeeling() {
    if (feelingEl.value === 'другое') {
      customFeelingWrap.classList.remove('hidden');
    } else {
      customFeelingWrap.classList.add('hidden');
      customFeelingEl.value = '';
    }
  }

  function loadTodayEntry() {
    var today = formatDateKey(new Date());
    todayDateEl.textContent = formatDisplayDate(today);

    var entries = loadEntries();
    var entry = entries[today];

    if (entry) {
      didTodayEl.value = entry.didToday || '';
      feelingEl.value = entry.feeling || '';
      customFeelingEl.value = entry.customFeeling || '';
      feelingDetailsEl.value = entry.feelingDetails || '';
      tomorrowPlanEl.value = entry.tomorrowPlan || '';
    } else {
      form.reset();
    }

    toggleCustomFeeling();
    saveMessageEl.classList.add('hidden');
  }

  function getFormData() {
    return {
      didToday: didTodayEl.value.trim(),
      feeling: feelingEl.value,
      customFeeling: customFeelingEl.value.trim(),
      feelingDetails: feelingDetailsEl.value.trim(),
      tomorrowPlan: tomorrowPlanEl.value.trim(),
      savedAt: new Date().toISOString()
    };
  }

  /** Лёгкий салютик после успешного сохранения */
  function launchSaveConfetti() {
    var btn = document.getElementById('btn-save');
    if (!btn) return;

    var container = document.createElement('div');
    container.className = 'save-confetti';
    container.setAttribute('aria-hidden', 'true');
    document.body.appendChild(container);

    var rect = btn.getBoundingClientRect();
    var originX = rect.left + rect.width / 2;
    var originY = rect.top + rect.height / 2;
    var count = 12;

    for (var i = 0; i < count; i++) {
      var particle = document.createElement('span');
      particle.className = 'save-confetti__particle';
      particle.textContent = CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length];

      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      var spread = 35 + Math.random() * 55;
      var tx = Math.cos(angle) * spread;
      var ty = -Math.abs(Math.sin(angle) * spread) - 25 - Math.random() * 35;

      particle.style.left = originX + 'px';
      particle.style.top = originY + 'px';
      particle.style.setProperty('--tx', tx + 'px');
      particle.style.setProperty('--ty', ty + 'px');
      particle.style.animationDelay = (Math.random() * 0.15) + 's';
      particle.style.fontSize = (15 + Math.random() * 8) + 'px';

      container.appendChild(particle);
    }

    setTimeout(function () {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 1800);
  }

  function handleSave(e) {
    e.preventDefault();

    var today = formatDateKey(new Date());
    var entries = loadEntries();
    entries[today] = getFormData();

    if (!saveEntries(entries)) {
      alert('Не удалось сохранить. Возможно, память браузера переполнена.');
      return;
    }

    saveMessageEl.classList.remove('hidden');
    launchSaveConfetti();
    refreshArchive();
  }

  /* --- Архив и статистика --- */

  /** Список ключей месяцев (YYYY-MM), от новых к старым */
  function getAvailableMonths(entries) {
    var months = {};
    Object.keys(entries).forEach(function (dateKey) {
      var monthKey = formatMonthKey(dateKey);
      months[monthKey] = true;
    });
    return Object.keys(months).sort(function (a, b) {
      return b.localeCompare(a);
    });
  }

  /** Записи за конкретный месяц, от новых к старым */
  function getEntriesForMonth(entries, monthKey) {
    return Object.keys(entries)
      .filter(function (dateKey) {
        return dateKey.startsWith(monthKey);
      })
      .sort(function (a, b) {
        return b.localeCompare(a);
      })
      .map(function (dateKey) {
        return { date: dateKey, data: entries[dateKey] };
      });
  }

  /** Получает итоговое чувство для записи */
  function getEffectiveFeeling(entry) {
    if (!entry || !entry.feeling) return null;
    if (entry.feeling === 'другое' && entry.customFeeling) {
      return entry.customFeeling;
    }
    if (entry.feeling === 'другое') return 'другое';
    return entry.feeling;
  }

  /** Считает статистику за месяц */
  function calculateStats(monthEntries) {
    var daysFilled = monthEntries.length;
    var totalRecords = daysFilled;
    var tomorrowPlans = 0;
    var feelingCounts = {};

    monthEntries.forEach(function (item) {
      var entry = item.data;
      if (entry.tomorrowPlan && entry.tomorrowPlan.trim()) {
        tomorrowPlans++;
      }
      var feeling = getEffectiveFeeling(entry);
      if (feeling) {
        feelingCounts[feeling] = (feelingCounts[feeling] || 0) + 1;
      }
    });

    /* Топ-3 эмоции */
    var sortedFeelings = Object.keys(feelingCounts)
      .sort(function (a, b) {
        return feelingCounts[b] - feelingCounts[a];
      })
      .slice(0, 3);

    return {
      daysFilled: daysFilled,
      totalRecords: totalRecords,
      tomorrowPlans: tomorrowPlans,
      topFeelings: sortedFeelings,
      feelingCounts: feelingCounts
    };
  }

  /** Склонение слова «день» */
  function pluralDays(n) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs >= 11 && abs <= 19) return 'дней';
    if (last === 1) return 'день';
    if (last >= 2 && last <= 4) return 'дня';
    return 'дней';
  }

  /** Склонение «раз» */
  function pluralTimes(n) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs >= 11 && abs <= 19) return 'раз';
    if (last === 1) return 'раз';
    if (last >= 2 && last <= 4) return 'раза';
    return 'раз';
  }

  function renderStats(stats, monthKey) {
    if (stats.daysFilled === 0) {
      statsBlockEl.classList.add('hidden');
      return;
    }

    statsBlockEl.classList.remove('hidden');

    var monthLabel = formatMonthLabel(monthKey).toLowerCase();
    statsSummaryEl.textContent =
      'В ' + monthLabel + ' ты выбирала себя ' +
      stats.daysFilled + ' ' + pluralDays(stats.daysFilled) + '.';

    statsListEl.innerHTML = '';

    var items = [];

    items.push('Всего записей: ' + stats.totalRecords);

    if (stats.topFeelings.length > 0) {
      var feelingsText = stats.topFeelings
        .map(function (f) {
          return f + ' (' + stats.feelingCounts[f] + ')';
        })
        .join(', ');
      items.push('Чаще всего: ' + feelingsText);
    }

    items.push(
      'План на завтра заполнен ' +
      stats.tomorrowPlans + ' ' + pluralTimes(stats.tomorrowPlans)
    );

    items.forEach(function (text) {
      var li = document.createElement('li');
      li.textContent = text;
      statsListEl.appendChild(li);
    });
  }

  function renderArchiveCard(item) {
    var entry = item.data;
    var card = document.createElement('article');
    card.className = 'archive-card';

    var dateEl = document.createElement('p');
    dateEl.className = 'archive-card__date';
    dateEl.textContent = formatDisplayDate(item.date);
    card.appendChild(dateEl);

    if (entry.didToday) {
      card.appendChild(createCardBlock('Для себя сегодня', entry.didToday));
    }

    var feeling = getEffectiveFeeling(entry);
    if (feeling) {
      var feelingText = feeling;
      if (entry.feelingDetails) {
        feelingText += '. ' + entry.feelingDetails;
      }
      card.appendChild(createCardBlock('Чувство', feelingText));
    } else if (entry.feelingDetails) {
      card.appendChild(createCardBlock('Подробнее', entry.feelingDetails));
    }

    if (entry.tomorrowPlan) {
      card.appendChild(createCardBlock('План на завтра', entry.tomorrowPlan));
    }

    return card;
  }

  function createCardBlock(label, text) {
    var block = document.createElement('div');
    block.className = 'archive-card__block';

    var labelEl = document.createElement('p');
    labelEl.className = 'archive-card__label';
    labelEl.textContent = label;

    var textEl = document.createElement('p');
    textEl.className = 'archive-card__text';
    textEl.textContent = text;

    block.appendChild(labelEl);
    block.appendChild(textEl);
    return block;
  }

  function renderMonth(monthKey) {
    var entries = loadEntries();
    var monthEntries = getEntriesForMonth(entries, monthKey);

    archiveCardsEl.innerHTML = '';

    if (monthEntries.length === 0) {
      statsBlockEl.classList.add('hidden');
      archiveEmptyEl.classList.remove('hidden');
      return;
    }

    archiveEmptyEl.classList.add('hidden');
    var stats = calculateStats(monthEntries);
    renderStats(stats, monthKey);

    monthEntries.forEach(function (item) {
      archiveCardsEl.appendChild(renderArchiveCard(item));
    });
  }

  function populateMonthSelect() {
    var entries = loadEntries();
    var months = getAvailableMonths(entries);
    var currentMonth = formatMonthKey(formatDateKey(new Date()));

    monthSelectEl.innerHTML = '';

    if (months.length === 0) {
      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.textContent = 'Нет записей';
      monthSelectEl.appendChild(emptyOpt);
      monthSelectEl.disabled = true;
      archiveEmptyEl.classList.remove('hidden');
      statsBlockEl.classList.add('hidden');
      archiveCardsEl.innerHTML = '';
      return;
    }

    monthSelectEl.disabled = false;

    months.forEach(function (monthKey) {
      var opt = document.createElement('option');
      opt.value = monthKey;
      opt.textContent = formatMonthLabel(monthKey);
      monthSelectEl.appendChild(opt);
    });

    /* Выбираем текущий месяц, если есть записи; иначе — последний */
    if (months.indexOf(currentMonth) !== -1) {
      monthSelectEl.value = currentMonth;
    } else {
      monthSelectEl.value = months[0];
    }

    renderMonth(monthSelectEl.value);
  }

  function refreshArchive() {
    populateMonthSelect();
  }

  /* --- Инициализация --- */

  function init() {
    initTheme();
    showSlogan();
    loadTodayEntry();

    feelingEl.addEventListener('change', toggleCustomFeeling);
    form.addEventListener('submit', handleSave);
    monthSelectEl.addEventListener('change', function () {
      renderMonth(monthSelectEl.value);
    });

    refreshArchive();
  }

  /* Запуск после загрузки DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
