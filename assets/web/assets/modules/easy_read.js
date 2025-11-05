// Easy-read mode with ARASAAC pictograms and OpenAI generation
import { state } from './state.js';

const ARASAAC_API_BASE = 'https://api.arasaac.org/api';
const OPENAI_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

/**
 * Initialize easy-read tab system
 */
export const initializeEasyReadTabs = () => {
  const contentContainer = document.getElementById('content');
  if (!contentContainer) return;

  // Create tab container
  const tabContainer = createTabContainer();
  contentContainer.parentElement.insertBefore(
    tabContainer,
    contentContainer
  );

  // Create easy-read content container (hidden by default)
  const easyReadContainer = createEasyReadContainer();
  contentContainer.parentElement.insertBefore(
    easyReadContainer,
    contentContainer.nextSibling
  );

  // Set up tab switching
  setupTabSwitching(contentContainer, easyReadContainer);
};

/**
 * Create tab navigation UI
 */
const createTabContainer = () => {
  const container = document.createElement('div');
  container.className =
    'container mx-auto max-w-4xl px-4 sm:px-8 pt-8';
  container.innerHTML = `
    <div class="flex gap-2 mb-4" role="tablist">
      <button
        id="original-tab"
        role="tab"
        aria-selected="true"
        aria-controls="original-content"
        class="tab-button active px-6 py-3 rounded-t-lg font-semibold transition-all duration-200 bg-white text-green-700 border-b-4 border-green-600"
      >
        📖 Texto Original
      </button>
      <button
        id="easy-read-tab"
        role="tab"
        aria-selected="false"
        aria-controls="easy-read-content"
        class="tab-button px-6 py-3 rounded-t-lg font-semibold transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200"
      >
        ✨ Leitura Fácil
      </button>
    </div>
  `;
  return container;
};

/**
 * Create easy-read content container
 */
const createEasyReadContainer = () => {
  const container = document.createElement('div');
  container.id = 'easy-read-content';
  container.role = 'tabpanel';
  container.setAttribute('aria-labelledby', 'easy-read-tab');
  container.className = 'hidden container mx-auto max-w-4xl p-4 sm:p-8';
  container.innerHTML = `
    <div class="rounded-3xl shadow-xl overflow-hidden border border-green-200 bg-white/90">
      <div class="bg-green-600 px-6 sm:px-10 py-6">
        <h2 class="text-2xl sm:text-3xl font-extrabold tracking-wide text-white">
          ✨ Versão de Leitura Fácil
        </h2>
      </div>
      <div id="easy-read-loading" class="p-10 text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p class="mt-4 text-gray-600">Gerando texto de leitura fácil...</p>
      </div>
      <div id="easy-read-sentences" class="p-6 sm:p-10 space-y-6 hidden"></div>
      <div id="easy-read-error" class="p-10 text-center text-red-600 hidden"></div>
    </div>
  `;
  return container;
};

/**
 * Set up tab switching behavior
 */
const setupTabSwitching = (originalContainer, easyReadContainer) => {
  const originalTab = document.getElementById('original-tab');
  const easyReadTab = document.getElementById('easy-read-tab');

  originalTab.addEventListener('click', () => {
    activateTab(originalTab, originalContainer);
    deactivateTab(easyReadTab, easyReadContainer);
  });

  easyReadTab.addEventListener('click', () => {
    activateTab(easyReadTab, easyReadContainer);
    deactivateTab(originalTab, originalContainer);

    // Generate easy-read content on first click
    if (!state.easyReadGenerated) {
      generateEasyReadContent();
      state.easyReadGenerated = true;
    }
  });
};

/**
 * Activate a tab
 */
const activateTab = (tab, content) => {
  tab.setAttribute('aria-selected', 'true');
  tab.className =
    'tab-button active px-6 py-3 rounded-t-lg font-semibold transition-all duration-200 bg-white text-green-700 border-b-4 border-green-600';
  content.classList.remove('hidden');
};

/**
 * Deactivate a tab
 */
const deactivateTab = (tab, content) => {
  tab.setAttribute('aria-selected', 'false');
  tab.className =
    'tab-button px-6 py-3 rounded-t-lg font-semibold transition-all duration-200 bg-gray-100 text-gray-600 hover:bg-gray-200';
  content.classList.add('hidden');
};

/**
 * Extract all text content from the page
 */
const extractPageText = () => {
  const contentEl = document.getElementById('content');
  if (!contentEl) return '';

  // Get all text elements with data-id
  const textElements = contentEl.querySelectorAll('[data-id]');
  const texts = Array.from(textElements)
    .map((el) => el.textContent.trim())
    .filter((text) => text.length > 0)
    .join('\n');

  return texts;
};

/**
 * Generate easy-read content using OpenAI API
 */
const generateEasyReadContent = async () => {
  const loadingEl = document.getElementById('easy-read-loading');
  const sentencesEl = document.getElementById('easy-read-sentences');
  const errorEl = document.getElementById('easy-read-error');

  try {
    const pageText = extractPageText();
    if (!pageText) {
      throw new Error('Não foi possível extrair o texto da página');
    }

    // Get OpenAI API key from environment or user
    const apiKey = await getOpenAIKey();
    if (!apiKey) {
      throw new Error('Chave da API OpenAI não fornecida');
    }

    // Call OpenAI API
    const easyReadData = await callOpenAI(apiKey, pageText);

    // Fetch pictograms and render
    await renderEasyReadContent(easyReadData, sentencesEl);

    loadingEl.classList.add('hidden');
    sentencesEl.classList.remove('hidden');
  } catch (error) {
    console.error('Error generating easy-read content:', error);
    loadingEl.classList.add('hidden');
    errorEl.textContent = `Erro: ${error.message}`;
    errorEl.classList.remove('hidden');
  }
};

/**
 * Get OpenAI API key (from localStorage or prompt user)
 */
const getOpenAIKey = async () => {
  let apiKey = localStorage.getItem('openai_api_key');

  if (!apiKey) {
    apiKey = prompt(
      'Por favor, insira sua chave da API OpenAI:\n\n' +
        '(Você pode obter uma em https://platform.openai.com/api-keys)\n\n' +
        'Sua chave será salva localmente neste navegador.'
    );

    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey.trim());
    }
  }

  return apiKey;
};

/**
 * Call OpenAI API to generate easy-read sentences with keywords
 */
const callOpenAI = async (apiKey, pageText) => {
  const prompt = `Transform the following Portuguese text into easy-read format following these guidelines:

EASY-READ GUIDELINES:
- Write short sentences (maximum 10-15 words)
- Use simple, everyday words
- Use active voice
- One main idea per sentence
- Be clear and direct

For each sentence, identify 1-2 keywords in Portuguese that can be illustrated with pictograms (concrete nouns work best: pessoa, documento, escola, casa, etc.)

Original text:
${pageText}

Return a JSON array where each item has:
{
  "sentence": "easy-read sentence in Portuguese",
  "keywords": ["keyword1", "keyword2"]
}

Return ONLY the JSON array, no other text.`;

  const response = await fetch(OPENAI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.error?.message || 'Erro ao chamar API OpenAI'
    );
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Resposta da API não contém JSON válido');
  }

  return JSON.parse(jsonMatch[0]);
};

/**
 * Fetch pictogram from ARASAAC
 */
const fetchPictogram = async (keyword) => {
  try {
    const searchUrl = `${ARASAAC_API_BASE}/pictograms/pt/search/${encodeURIComponent(
      keyword
    )}`;
    const response = await fetch(searchUrl);

    if (!response.ok) return null;

    const results = await response.json();
    if (results.length === 0) return null;

    // Return URL for the first result
    const pictogramId = results[0]._id;
    return `${ARASAAC_API_BASE}/pictograms/${pictogramId}?download=false`;
  } catch (error) {
    console.error(`Error fetching pictogram for "${keyword}":`, error);
    return null;
  }
};

/**
 * Render easy-read content with pictograms
 */
const renderEasyReadContent = async (easyReadData, container) => {
  container.innerHTML = '';

  for (const item of easyReadData) {
    const sentenceDiv = document.createElement('div');
    sentenceDiv.className =
      'flex gap-4 items-start p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors';

    // Fetch pictogram for first keyword
    let pictogramUrl = null;
    if (item.keywords && item.keywords.length > 0) {
      pictogramUrl = await fetchPictogram(item.keywords[0]);
    }

    // Create pictogram element
    const pictogramDiv = document.createElement('div');
    pictogramDiv.className = 'flex-shrink-0 w-16 h-16';

    if (pictogramUrl) {
      const img = document.createElement('img');
      img.src = pictogramUrl;
      img.alt = item.keywords[0];
      img.className = 'w-full h-full object-contain';
      pictogramDiv.appendChild(img);
    } else {
      pictogramDiv.innerHTML =
        '<div class="w-full h-full bg-gray-200 rounded flex items-center justify-center text-gray-400">?</div>';
    }

    // Create sentence element
    const sentenceP = document.createElement('p');
    sentenceP.className = 'text-lg text-gray-900 flex-1';
    sentenceP.textContent = item.sentence;

    sentenceDiv.appendChild(pictogramDiv);
    sentenceDiv.appendChild(sentenceP);
    container.appendChild(sentenceDiv);
  }
};

export default {
  initializeEasyReadTabs,
};
