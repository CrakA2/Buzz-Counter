document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('monitoring-toggle');
  const statusText = document.getElementById('status-text');
  const selectorInput = document.getElementById('selector');
  const audioSrcInput = document.getElementById('audio-src');
  const audioUpload = document.getElementById('audio-upload');
  const uploadStatus = document.getElementById('upload-status');
  const saveButton = document.getElementById('save-button');
  const messageArea = document.getElementById('message-area');

  // Load saved settings from storage
  chrome.storage.local.get(['monitoring', 'selector', 'audioSrc', 'uploadedAudioName'], (result) => {
    if (result.monitoring) {
      toggle.checked = true;
      statusText.textContent = 'ON';
    } else {
      toggle.checked = false;
      statusText.textContent = 'OFF';
    }
    selectorInput.value = result.selector || '';
    audioSrcInput.value = result.audioSrc || '';
    if (result.uploadedAudioName) {
        uploadStatus.textContent = `Using uploaded file: ${result.uploadedAudioName}`;
        audioSrcInput.disabled = true;
    }
  });

  // Handle toggle switch
  toggle.addEventListener('change', () => {
    const isMonitoring = toggle.checked;
    statusText.textContent = isMonitoring ? 'ON' : 'OFF';
    chrome.storage.local.set({ monitoring: isMonitoring });
    // Tell the background script to start/stop the alarm
    chrome.runtime.sendMessage({
        type: 'setMonitoring',
        monitoring: isMonitoring 
    });
  });
  
  // Handle file upload
  audioUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        // Storing the audio as a a Base64 Data URL
        const audioDataUrl = e.target.result;
        chrome.storage.local.set({ audioSrc: audioDataUrl, uploadedAudioName: file.name }, () => {
          uploadStatus.textContent = `Using uploaded file: ${file.name}`;
          audioSrcInput.value = '';
          audioSrcInput.disabled = true;
          displayMessage('Uploaded audio saved!');
        });
      };
      reader.readAsDataURL(file);
    }
  });

  // Handle Save Button click
  saveButton.addEventListener('click', () => {
    const selector = selectorInput.value;
    const audioSrc = audioSrcInput.value;
    
    const settings = { selector };
    // Only save the audio URL if a file isn't already uploaded
    if (!audioSrcInput.disabled) {
        settings.audioSrc = audioSrc;
        // Clear uploaded file info if user is switching back to URL
        settings.uploadedAudioName = '';
        settings.audioSrc = audioSrc;
        uploadStatus.textContent = '';
    }

    chrome.storage.local.set(settings, () => {
      displayMessage('Settings Saved!');
    });
  });
  
  function displayMessage(msg) {
    messageArea.textContent = msg;
    setTimeout(() => { messageArea.textContent = ''; }, 3000);
  }
});