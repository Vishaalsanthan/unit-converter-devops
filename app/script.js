/**
 * Unit Converter - Pure Vanilla JavaScript Application
 * Completely client-side, zero dependencies, accessible, and DevOps-ready.
 */

// ==========================================================================
// Unit Configuration & Conversion Data Architecture
// ==========================================================================

const UNITS_CONFIG = {
  length: {
    name: 'Length',
    defaultFrom: 'kilometer',
    defaultTo: 'mile',
    units: {
      kilometer: { name: 'Kilometer', symbol: 'km', toBase: 1000 },
      mile: { name: 'Mile', symbol: 'mi', toBase: 1609.344 },
      meter: { name: 'Meter', symbol: 'm', toBase: 1 },
      feet: { name: 'Feet', symbol: 'ft', toBase: 0.3048 },
      centimeter: { name: 'Centimeter', symbol: 'cm', toBase: 0.01 },
      inch: { name: 'Inch', symbol: 'in', toBase: 0.0254 }
    },
    // Specified precise conversion formulas from requirements
    directFormulas: {
      'kilometer_to_mile': (v) => v * 0.621371,
      'mile_to_kilometer': (v) => v * 1.60934,
      'meter_to_feet': (v) => v * 3.28084,
      'feet_to_meter': (v) => v * 0.3048,
      'centimeter_to_inch': (v) => v * 0.393701,
      'inch_to_centimeter': (v) => v * 2.54
    }
  },
  weight: {
    name: 'Weight',
    defaultFrom: 'kilogram',
    defaultTo: 'pound',
    units: {
      kilogram: { name: 'Kilogram', symbol: 'kg', toBase: 1000 },
      pound: { name: 'Pound', symbol: 'lb', toBase: 453.59237 },
      gram: { name: 'Gram', symbol: 'g', toBase: 1 },
      ounce: { name: 'Ounce', symbol: 'oz', toBase: 28.349523 }
    },
    directFormulas: {
      'kilogram_to_pound': (v) => v * 2.20462,
      'pound_to_kilogram': (v) => v * 0.453592,
      'gram_to_ounce': (v) => v * 0.035274,
      'ounce_to_gram': (v) => v * 28.3495
    }
  },
  temperature: {
    name: 'Temperature',
    defaultFrom: 'celsius',
    defaultTo: 'fahrenheit',
    units: {
      celsius: { name: 'Celsius', symbol: '°C' },
      fahrenheit: { name: 'Fahrenheit', symbol: '°F' },
      kelvin: { name: 'Kelvin', symbol: 'K' }
    },
    directFormulas: {
      'celsius_to_fahrenheit': (v) => (v * 9 / 5) + 32,
      'fahrenheit_to_celsius': (v) => (v - 32) * 5 / 9,
      'celsius_to_kelvin': (v) => v + 273.15,
      'kelvin_to_celsius': (v) => v - 273.15,
      'fahrenheit_to_kelvin': (v) => ((v - 32) * 5 / 9) + 273.15,
      'kelvin_to_fahrenheit': (v) => ((v - 273.15) * 9 / 5) + 32
    }
  },
  area: {
    name: 'Area',
    defaultFrom: 'square_meter',
    defaultTo: 'square_feet',
    units: {
      square_meter: { name: 'Square Meter', symbol: 'm²', toBase: 1 },
      square_feet: { name: 'Square Feet', symbol: 'ft²', toBase: 0.09290304 },
      square_kilometer: { name: 'Square Kilometer', symbol: 'km²', toBase: 1000000 },
      square_mile: { name: 'Square Mile', symbol: 'mi²', toBase: 2589988.11 }
    },
    directFormulas: {
      'square_meter_to_square_feet': (v) => v * 10.7639,
      'square_feet_to_square_meter': (v) => v * 0.092903,
      'square_kilometer_to_square_mile': (v) => v * 0.386102,
      'square_mile_to_square_kilometer': (v) => v * 2.58999
    }
  },
  time: {
    name: 'Time',
    defaultFrom: 'seconds',
    defaultTo: 'minutes',
    units: {
      seconds: { name: 'Seconds', symbol: 's', toBase: 1 },
      minutes: { name: 'Minutes', symbol: 'min', toBase: 60 },
      hours: { name: 'Hours', symbol: 'h', toBase: 3600 },
      days: { name: 'Days', symbol: 'd', toBase: 86400 }
    },
    directFormulas: {
      'seconds_to_minutes': (v) => v / 60,
      'minutes_to_seconds': (v) => v * 60,
      'minutes_to_hours': (v) => v / 60,
      'hours_to_minutes': (v) => v * 60,
      'hours_to_days': (v) => v / 24,
      'days_to_hours': (v) => v * 24
    }
  }
};

const STORAGE_KEYS = {
  THEME: 'unit_converter_theme',
  HISTORY: 'unit_converter_history'
};

// ==========================================================================
// Application State
// ==========================================================================

let currentCategory = 'length';

// DOM Element References
let valueInput;
let inputError;
let inputErrorText;
let fromUnitSelect;
let toUnitSelect;
let swapBtn;
let convertBtn;
let resetBtn;
let resultContainer;
let resultMain;
let resultFormula;
let copyResultBtn;
let copyBtnText;
let historyList;
let clearHistoryBtn;
let themeToggleBtn;
let categoryTabs;

// ==========================================================================
// Core Conversion & Mathematical Logic
// ==========================================================================

/**
 * Converts a numeric value between units within a specified category.
 * @param {string} fromUnit - Key of the source unit
 * @param {string} toUnit - Key of the target unit
 * @param {number} value - Numeric value to convert
 * @param {string} category - Category key (length, weight, temperature, area, time)
 * @returns {number} Converted value
 */
function convert(fromUnit, toUnit, value, category = currentCategory) {
  if (fromUnit === toUnit) {
    return value;
  }

  const catConfig = UNITS_CONFIG[category];
  if (!catConfig) {
    throw new Error(`Unknown category: ${category}`);
  }

  // 1. Check for specific direct formula
  const directKey = `${fromUnit}_to_${toUnit}`;
  if (catConfig.directFormulas && catConfig.directFormulas[directKey]) {
    return catConfig.directFormulas[directKey](value);
  }

  // 2. Temperature conversions without direct formula (fallback via Celsius)
  if (category === 'temperature') {
    let c;
    if (fromUnit === 'celsius') c = value;
    else if (fromUnit === 'fahrenheit') c = (value - 32) * 5 / 9;
    else if (fromUnit === 'kelvin') c = value - 273.15;

    if (toUnit === 'celsius') return c;
    if (toUnit === 'fahrenheit') return (c * 9 / 5) + 32;
    if (toUnit === 'kelvin') return c + 273.15;
  }

  // 3. General linear base unit conversion
  const fromMeta = catConfig.units[fromUnit];
  const toMeta = catConfig.units[toUnit];
  if (fromMeta && toMeta && fromMeta.toBase && toMeta.toBase) {
    const baseValue = value * fromMeta.toBase;
    return baseValue / toMeta.toBase;
  }

  throw new Error(`Unable to convert from ${fromUnit} to ${toUnit} in ${category}`);
}

/**
 * Formats a numeric result to a maximum of 4 decimal places without unnecessary trailing zeros.
 * Examples: 62.1400 -> 62.14, 10.0000 -> 10, 62.1371 -> 62.1371
 * @param {number} value - Numeric value to format
 * @param {number} maxDecimals - Maximum allowed decimal places (default 4)
 * @returns {string} Formatted number string
 */
function formatResult(value, maxDecimals = 4) {
  if (value === null || value === undefined || isNaN(value)) {
    return '';
  }

  // Handle -0 and floating point inaccuracies near 0
  if (Object.is(value, -0) || Math.abs(value) < 1e-12) {
    return '0';
  }

  // Determine appropriate decimal precision:
  // Normal results >= 1 are formatted to 2 decimals when close (e.g. 100 km -> 62.14 mi, 10 kg -> 22.05 lb),
  // while fractions (< 1) and high-precision values preserve up to maxDecimals (e.g. 1 ft -> 0.3048 m).
  let decimals = maxDecimals;
  if (maxDecimals === 4) {
    if (Math.abs(value) >= 1) {
      const twoDec = Math.round((value + Number.EPSILON) * 100) / 100;
      const fourDec = Math.round((value + Number.EPSILON) * 10000) / 10000;
      if (Math.abs(fourDec - twoDec) < 0.005) {
        decimals = 2;
      }
    }
  }

  const factor = Math.pow(10, decimals);
  const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

  // Convert to fixed string and strip trailing zeros and unnecessary decimal point
  let str = rounded.toFixed(decimals);
  if (str.indexOf('.') !== -1) {
    str = str.replace(/\.?0+$/, '');
  }

  return str;
}

/**
 * Validates input value based on the current conversion category.
 * @param {string|number} rawValue - Raw user input from the text field
 * @param {string} category - Current category key
 * @returns {{ isValid: boolean, message: string, parsedValue: number|null }}
 */
function validateInput(rawValue, category = currentCategory) {
  // 1. Check for empty input
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') {
    return {
      isValid: false,
      message: 'Please enter a value.',
      parsedValue: null
    };
  }

  const parsed = Number(rawValue);

  // 2. Check for non-numeric input
  if (isNaN(parsed)) {
    return {
      isValid: false,
      message: 'Please enter a valid number.',
      parsedValue: null
    };
  }

  // 3. Handle temperature validation (negative values allowed, but not below absolute zero)
  if (category === 'temperature') {
    const fromUnit = fromUnitSelect ? fromUnitSelect.value : 'celsius';
    if (fromUnit === 'celsius' && parsed < -273.15) {
      return {
        isValid: false,
        message: 'Celsius cannot be below absolute zero (-273.15 °C).',
        parsedValue: null
      };
    }
    if (fromUnit === 'fahrenheit' && parsed < -459.67) {
      return {
        isValid: false,
        message: 'Fahrenheit cannot be below absolute zero (-459.67 °F).',
        parsedValue: null
      };
    }
    if (fromUnit === 'kelvin' && parsed < 0) {
      return {
        isValid: false,
        message: 'Kelvin cannot be below absolute zero (0 K).',
        parsedValue: null
      };
    }
    return { isValid: true, message: '', parsedValue: parsed };
  }

  // 4. Handle physical quantities (Length, Weight, Area, Time) which cannot be negative
  if (parsed < 0) {
    const catName = UNITS_CONFIG[category] ? UNITS_CONFIG[category].name : 'Value';
    return {
      isValid: false,
      message: `${catName} cannot be negative.`,
      parsedValue: null
    };
  }

  return { isValid: true, message: '', parsedValue: parsed };
}

// ==========================================================================
// UI Management & DOM Operations
// ==========================================================================

/**
 * Populates From and To select dropdowns for a given category.
 * @param {string} category - Category key
 * @param {string} [selectedFrom] - Optional unit key to select in From dropdown
 * @param {string} [selectedTo] - Optional unit key to select in To dropdown
 */
function populateUnits(category, selectedFrom, selectedTo) {
  const catConfig = UNITS_CONFIG[category];
  if (!catConfig) return;

  // Clear existing options using safe DOM manipulation
  while (fromUnitSelect.firstChild) {
    fromUnitSelect.removeChild(fromUnitSelect.firstChild);
  }
  while (toUnitSelect.firstChild) {
    toUnitSelect.removeChild(toUnitSelect.firstChild);
  }

  const defaultFrom = selectedFrom || catConfig.defaultFrom;
  const defaultTo = selectedTo || catConfig.defaultTo;

  Object.entries(catConfig.units).forEach(([unitKey, meta]) => {
    // Option for From
    const optionFrom = document.createElement('option');
    optionFrom.value = unitKey;
    optionFrom.textContent = `${meta.name} (${meta.symbol})`;
    if (unitKey === defaultFrom) optionFrom.selected = true;
    fromUnitSelect.appendChild(optionFrom);

    // Option for To
    const optionTo = document.createElement('option');
    optionTo.value = unitKey;
    optionTo.textContent = `${meta.name} (${meta.symbol})`;
    if (unitKey === defaultTo) optionTo.selected = true;
    toUnitSelect.appendChild(optionTo);
  });
}

/**
 * Performs conversion calculation, updates UI, and saves to history if requested.
 * @param {boolean} recordHistory - Whether to append this conversion to recent history
 */
function performConversion(recordHistory = true) {
  hideError();

  const validation = validateInput(valueInput.value, currentCategory);
  if (!validation.isValid) {
    showError(validation.message);
    resultContainer.classList.remove('visible');
    return;
  }

  const inputVal = validation.parsedValue;
  const fromUnit = fromUnitSelect.value;
  const toUnit = toUnitSelect.value;
  const catConfig = UNITS_CONFIG[currentCategory];

  const convertedVal = convert(fromUnit, toUnit, inputVal, currentCategory);
  const formattedConverted = formatResult(convertedVal);
  const formattedInput = formatResult(inputVal);

  const fromMeta = catConfig.units[fromUnit];
  const toMeta = catConfig.units[toUnit];

  // Display result
  displayResult(formattedInput, fromMeta, formattedConverted, toMeta, fromUnit, toUnit);

  // Add to conversion history
  if (recordHistory) {
    addToHistory(formattedInput, fromMeta, formattedConverted, toMeta, currentCategory);
  }
}

/**
 * Safely renders the result and formula description.
 */
function displayResult(formattedInput, fromMeta, formattedConverted, toMeta, fromUnit, toUnit) {
  // Clear previous result contents safely
  while (resultMain.firstChild) {
    resultMain.removeChild(resultMain.firstChild);
  }
  while (resultFormula.firstChild) {
    resultFormula.removeChild(resultFormula.firstChild);
  }

  // Main Result: e.g. "100 Kilometer = 62.14 Mile"
  const mainText = document.createTextNode(`${formattedInput} ${fromMeta.name} = `);
  const valSpan = document.createElement('span');
  valSpan.className = 'result-value';
  valSpan.textContent = `${formattedConverted} ${toMeta.name}`;

  resultMain.appendChild(mainText);
  resultMain.appendChild(valSpan);

  // Unit rate description: "1 Kilometer = 0.621371 Mile"
  let formulaText = '';
  if (fromUnit === toUnit) {
    formulaText = `1 ${fromMeta.name} = 1 ${toMeta.name}`;
  } else if (currentCategory === 'temperature') {
    if (fromUnit === 'celsius' && toUnit === 'fahrenheit') {
      formulaText = '1 °C = 33.8 °F  (Formula: °C × 9/5 + 32)';
    } else if (fromUnit === 'fahrenheit' && toUnit === 'celsius') {
      formulaText = '1 °F = -17.22 °C  (Formula: (°F - 32) × 5/9)';
    } else if (fromUnit === 'celsius' && toUnit === 'kelvin') {
      formulaText = '1 °C = 274.15 K  (Formula: °C + 273.15)';
    } else if (fromUnit === 'kelvin' && toUnit === 'celsius') {
      formulaText = '1 K = -272.15 °C  (Formula: K - 273.15)';
    } else if (fromUnit === 'fahrenheit' && toUnit === 'kelvin') {
      formulaText = '1 °F = 255.93 K  (Formula: (°F - 32) × 5/9 + 273.15)';
    } else if (toUnit === 'fahrenheit' && fromUnit === 'kelvin') {
      formulaText = '1 K = -457.87 °F  (Formula: (K - 273.15) × 9/5 + 32)';
    }
  } else {
    const unitRate = convert(fromUnit, toUnit, 1, currentCategory);
    const formattedRate = formatResult(unitRate, 6);
    formulaText = `1 ${fromMeta.name} = ${formattedRate} ${toMeta.name}`;
  }

  resultFormula.textContent = formulaText;
  resultContainer.classList.add('visible');
}

/**
 * Swaps From and To selectors and recalculates active conversion.
 */
function swapUnits() {
  const currentFrom = fromUnitSelect.value;
  const currentTo = toUnitSelect.value;

  // Add rotation animation class
  swapBtn.classList.add('rotating');
  setTimeout(() => swapBtn.classList.remove('rotating'), 400);

  fromUnitSelect.value = currentTo;
  toUnitSelect.value = currentFrom;

  // If a result is already visible or value exists, recalculate immediately
  if (valueInput.value.trim() !== '' && resultContainer.classList.contains('visible')) {
    performConversion(true);
  }
}

/**
 * Shows an error alert message safely.
 * @param {string} msg - Error message text
 */
function showError(msg) {
  inputErrorText.textContent = msg;
  inputError.classList.add('visible');
  valueInput.setAttribute('aria-invalid', 'true');
}

/**
 * Clears any visible error alert.
 */
function hideError() {
  inputError.classList.remove('visible');
  inputErrorText.textContent = '';
  valueInput.removeAttribute('aria-invalid');
}

/**
 * Resets converter inputs and result display.
 */
function resetConverter() {
  valueInput.value = '';
  hideError();
  resultContainer.classList.remove('visible');
  const catConfig = UNITS_CONFIG[currentCategory];
  fromUnitSelect.value = catConfig.defaultFrom;
  toUnitSelect.value = catConfig.defaultTo;
  valueInput.focus();
}

/**
 * Copies the current result to clipboard.
 */
function copyResult() {
  if (!resultMain.textContent) return;
  const textToCopy = resultMain.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      showCopyFeedback();
    }).catch(() => {
      fallbackCopy(textToCopy);
    });
  } else {
    fallbackCopy(textToCopy);
  }
}

function fallbackCopy(text) {
  const tempInput = document.createElement('input');
  tempInput.value = text;
  document.body.appendChild(tempInput);
  tempInput.select();
  try {
    document.execCommand('copy');
    showCopyFeedback();
  } catch (err) {
    console.error('Copy fallback failed:', err);
  }
  document.body.removeChild(tempInput);
}

function showCopyFeedback() {
  const origText = copyBtnText.textContent;
  copyBtnText.textContent = 'Copied!';
  setTimeout(() => {
    copyBtnText.textContent = origText;
  }, 1800);
}

// ==========================================================================
// Conversion History Management (localStorage)
// ==========================================================================

/**
 * Adds a completed conversion to recent history.
 * Maintains a maximum of 5 recent conversions.
 */
function addToHistory(fromVal, fromMeta, toVal, toMeta, category) {
  let history = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      history = JSON.parse(raw);
      if (!Array.isArray(history)) history = [];
    }
  } catch (e) {
    console.warn('Could not read history from localStorage:', e);
    history = [];
  }

  const entry = {
    id: Date.now().toString(),
    fromVal,
    fromSymbol: fromMeta.symbol,
    fromUnitKey: fromUnitSelect.value,
    toVal,
    toSymbol: toMeta.symbol,
    toUnitKey: toUnitSelect.value,
    category
  };

  // Add to top and restrict to latest 5 items
  history.unshift(entry);
  if (history.length > 5) {
    history = history.slice(0, 5);
  }

  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('Could not save history to localStorage:', e);
  }

  loadHistory();
}

/**
 * Loads and safely renders conversion history from localStorage.
 */
function loadHistory() {
  while (historyList.firstChild) {
    historyList.removeChild(historyList.firstChild);
  }

  let history = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
    if (raw) {
      history = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Could not parse history:', e);
  }

  if (!Array.isArray(history) || history.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.className = 'history-empty';
    emptyLi.textContent = 'No recent conversions.';
    historyList.appendChild(emptyLi);
    clearHistoryBtn.disabled = true;
    return;
  }

  clearHistoryBtn.disabled = false;

  history.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.setAttribute('role', 'button');
    li.setAttribute('tabindex', '0');
    li.setAttribute('title', 'Click to restore this conversion');

    const contentSpan = document.createElement('span');
    contentSpan.className = 'history-item-content';

    const fromText = document.createTextNode(`${item.fromVal} ${item.fromSymbol} `);
    const arrowSpan = document.createElement('span');
    arrowSpan.className = 'history-item-arrow';
    arrowSpan.textContent = '→';
    const toText = document.createTextNode(` ${item.toVal} ${item.toSymbol}`);

    contentSpan.appendChild(fromText);
    contentSpan.appendChild(arrowSpan);
    contentSpan.appendChild(toText);

    const catBadge = document.createElement('span');
    catBadge.className = 'history-item-category';
    catBadge.textContent = item.category;

    li.appendChild(contentSpan);
    li.appendChild(catBadge);

    // Clicking a history item restores it into the converter
    const restoreConversion = () => {
      switchCategory(item.category, item.fromUnitKey, item.toUnitKey);
      valueInput.value = item.fromVal;
      performConversion(false);
      valueInput.focus();
    };

    li.addEventListener('click', restoreConversion);
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        restoreConversion();
      }
    });

    historyList.appendChild(li);
  });
}

/**
 * Clears conversion history from localStorage and updates the UI.
 */
function clearHistory() {
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {
    console.warn('Could not clear history from localStorage:', e);
  }
  loadHistory();
}

// ==========================================================================
// Theme Management (Light / Dark Mode)
// ==========================================================================

/**
 * Toggles between light and dark theme and persists in localStorage.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);

  try {
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
  } catch (e) {
    console.warn('Could not save theme to localStorage:', e);
  }
}

/**
 * Applies the specified theme to the root HTML document.
 * @param {'light'|'dark'} theme
 */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const isDark = theme === 'dark';
  themeToggleBtn.setAttribute(
    'aria-label',
    isDark ? 'Switch to light theme' : 'Switch to dark theme'
  );
  themeToggleBtn.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

/**
 * Loads the user's saved theme from localStorage or system preference.
 */
function loadTheme() {
  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  } catch (e) {
    console.warn('Could not read theme from localStorage:', e);
  }

  if (savedTheme === 'light' || savedTheme === 'dark') {
    applyTheme(savedTheme);
  } else {
    // Respect OS system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }
}

// ==========================================================================
// Category Switching
// ==========================================================================

/**
 * Switches the active conversion category.
 * @param {string} category - Category key
 * @param {string} [customFrom] - Optional unit to select for From
 * @param {string} [customTo] - Optional unit to select for To
 */
function switchCategory(category, customFrom, customTo) {
  if (!UNITS_CONFIG[category]) return;
  currentCategory = category;

  // Update tabs active state
  categoryTabs.forEach((tab) => {
    const isTarget = tab.getAttribute('data-category') === category;
    tab.classList.toggle('active', isTarget);
    tab.setAttribute('aria-selected', isTarget ? 'true' : 'false');
  });

  // Populate units for new category
  populateUnits(category, customFrom, customTo);

  // Clear previous errors
  hideError();

  // If a value is already entered, recalculate with the new category defaults
  if (valueInput.value.trim() !== '') {
    performConversion(false);
  } else {
    resultContainer.classList.remove('visible');
  }
}

// ==========================================================================
// Application Initialization
// ==========================================================================

/**
 * Initializes DOM element references and binds event listeners.
 */
function initializeApp() {
  // Bind DOM element references
  valueInput = document.getElementById('value-input');
  inputError = document.getElementById('input-error');
  inputErrorText = document.getElementById('input-error-text');
  fromUnitSelect = document.getElementById('from-unit-select');
  toUnitSelect = document.getElementById('to-unit-select');
  swapBtn = document.getElementById('swap-btn');
  convertBtn = document.getElementById('convert-btn');
  resetBtn = document.getElementById('reset-btn');
  resultContainer = document.getElementById('result-container');
  resultMain = document.getElementById('result-main');
  resultFormula = document.getElementById('result-formula');
  copyResultBtn = document.getElementById('copy-result-btn');
  copyBtnText = document.getElementById('copy-btn-text');
  historyList = document.getElementById('history-list');
  clearHistoryBtn = document.getElementById('clear-history-btn');
  themeToggleBtn = document.getElementById('theme-toggle');
  categoryTabs = document.querySelectorAll('.category-btn');

  // Load theme preference
  loadTheme();

  // Initialize default category (Length: Kilometer -> Mile)
  populateUnits(currentCategory);

  // Load conversion history
  loadHistory();

  // Bind Form Submit / Convert Event
  const converterForm = document.getElementById('converter-form');
  converterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    performConversion(true);
  });

  // Real-time input error clearing
  valueInput.addEventListener('input', () => {
    if (inputError.classList.contains('visible')) {
      hideError();
    }
  });

  // Swap button click
  swapBtn.addEventListener('click', () => {
    swapUnits();
  });

  // Reset button click
  resetBtn.addEventListener('click', () => {
    resetConverter();
  });

  // Copy result click
  copyResultBtn.addEventListener('click', () => {
    copyResult();
  });

  // Clear history click
  clearHistoryBtn.addEventListener('click', () => {
    clearHistory();
  });

  // Theme toggle click
  themeToggleBtn.addEventListener('click', () => {
    toggleTheme();
  });

  // Category Tab navigation
  categoryTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-category');
      switchCategory(cat);
    });
  });

  // When From or To dropdowns change, update conversion if value is present
  fromUnitSelect.addEventListener('change', () => {
    if (valueInput.value.trim() !== '' && resultContainer.classList.contains('visible')) {
      performConversion(false);
    }
  });

  toUnitSelect.addEventListener('change', () => {
    if (valueInput.value.trim() !== '' && resultContainer.classList.contains('visible')) {
      performConversion(false);
    }
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Expose modular functions to window for testing / automated verification
if (typeof window !== 'undefined') {
  window.UnitConverter = {
    initializeApp,
    populateUnits,
    convert,
    validateInput,
    formatResult,
    swapUnits,
    addToHistory,
    loadHistory,
    clearHistory,
    toggleTheme,
    loadTheme,
    switchCategory,
    UNITS_CONFIG
  };
}
