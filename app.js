const textInput = document.querySelector('#text-input');
const readButton = document.querySelector('#read-button');
const stopButton = document.querySelector('#stop-button');
const status = document.querySelector('#status');

const synthesis = window.speechSynthesis;
let currentUtterance = null;
let availableVoices = [];

const updateControls = () => {
  const hasText = textInput.value.trim().length > 0;
  readButton.disabled = !hasText;
  stopButton.disabled = !(currentUtterance || synthesis.speaking || synthesis.pending);
};

const updateStatus = (message) => {
  status.textContent = message;
};

const selectVoice = () => {
  if (!availableVoices.length) {
    return null;
  }

  return (
    availableVoices.find((voice) => voice.lang?.toLowerCase().startsWith('es')) ||
    availableVoices.find((voice) => voice.default) ||
    availableVoices[0]
  );
};

const loadVoices = () => {
  availableVoices = synthesis.getVoices();
};

const stopReading = ({ silent = false } = {}) => {
  synthesis.cancel();
  currentUtterance = null;
  updateControls();

  if (!silent) {
    updateStatus('Lectura detenida.');
  }
};

if (!synthesis || typeof window.SpeechSynthesisUtterance !== 'function') {
  updateStatus('Tu navegador no es compatible con la lectura en voz alta.');
  textInput.disabled = true;
  readButton.disabled = true;
  stopButton.disabled = true;
} else {
  loadVoices();

  if ('onvoiceschanged' in synthesis) {
    synthesis.addEventListener('voiceschanged', loadVoices);
  }

  textInput.addEventListener('input', () => {
    updateControls();

    if (textInput.value.trim().length === 0) {
      updateStatus('Introduce un texto para comenzar.');
    }
  });

  readButton.addEventListener('click', () => {
    const text = textInput.value.trim();

    if (!text) {
      updateControls();
      updateStatus('Pega o escribe un texto antes de iniciar la lectura.');
      return;
    }

    stopReading({ silent: true });

    const utterance = new window.SpeechSynthesisUtterance(text);
    const voice = selectVoice();

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = 'es-ES';
    }

    utterance.onstart = () => {
      currentUtterance = utterance;
      updateControls();
      updateStatus('Leyendo el texto...');
    };

    utterance.onend = () => {
      currentUtterance = null;
      updateControls();
      updateStatus('Lectura finalizada.');
    };

    utterance.onerror = () => {
      currentUtterance = null;
      updateControls();
      updateStatus('No se pudo completar la lectura.');
    };

    currentUtterance = utterance;
    updateControls();
    synthesis.speak(utterance);
  });

  stopButton.addEventListener('click', () => {
    stopReading();
  });

  updateControls();
}
