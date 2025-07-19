document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('monitoring-toggle');
    const statusText = document.getElementById('status-text');
    const monitoringInfo = document.getElementById('monitoring-info');
    const selectorInput = document.getElementById('selector');
    const intervalInput = document.getElementById('interval');
    const audioSrcInput = document.getElementById('audio-src');
    const audioUpload = document.getElementById('audio-upload');
    const uploadStatus = document.getElementById('upload-status');
    const saveButton = document.getElementById('save-button');
    const messageArea = document.getElementById('message-area');
    const apiUrlInput = document.getElementById('api-url');

    // Load saved settings
    const result = await chrome.storage.local.get(['monitoring', 'selector', 'audioSrc', 'uploadedAudioName', 'interval', 'monitoringTabUrl', 'apiUrl']);
    
    selectorInput.value = result.selector || '';
    intervalInput.value = result.interval || 10;
    audioSrcInput.value = result.audioSrc || '';
    apiUrlInput.value = result.apiUrl || '';

    if (result.monitoring) {
        toggle.checked = true;
        statusText.textContent = 'ON';
        monitoringInfo.innerHTML = `Monitoring tab: <br><i>${result.monitoringTabUrl || 'Unknown'}</i>`;
    } else {
        toggle.checked = false;
        statusText.textContent = 'OFF';
    }

    if (result.uploadedAudioName) {
        uploadStatus.textContent = `Using uploaded file: ${result.uploadedAudioName}`;
        audioSrcInput.disabled = true;
    }

    // Handle toggle switch
    toggle.addEventListener('change', () => {
        const isMonitoring = toggle.checked;
        chrome.storage.local.set({ monitoring: isMonitoring });
        statusText.textContent = isMonitoring ? 'ON' : 'OFF';
        if (!isMonitoring) {
            monitoringInfo.innerHTML = '';
        }
        chrome.runtime.sendMessage({ type: 'setMonitoring', monitoring: isMonitoring });
    });

    // Handle file upload
    audioUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
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
    saveButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) {
            displayMessage('Error: No active tab found.', true);
            return;
        }
        
        const settings = {
            selector: selectorInput.value,
            interval: parseInt(intervalInput.value, 10),
            monitoringTabId: tab.id, // <-- THE MAGIC: Save the current tab's ID
            monitoringTabUrl: tab.url, // For display purposes
            apiUrl: apiUrlInput.value
        };

        if (!audioSrcInput.disabled) {
            settings.audioSrc = audioSrcInput.value;
            settings.uploadedAudioName = '';
            uploadStatus.textContent = '';
        } else {
            // Keep the existing Base64 audio src if a file is uploaded
            const { audioSrc } = await chrome.storage.local.get('audioSrc');
            settings.audioSrc = audioSrc;
        }

        chrome.storage.local.set(settings, () => {
            monitoringInfo.innerHTML = `Monitoring tab: <br><i>${tab.url}</i>`;
            displayMessage('Settings Saved! Monitoring this tab.');
            // Restart alarm with new settings
            if (toggle.checked) {
                chrome.runtime.sendMessage({ type: 'setMonitoring', monitoring: true });
            }
        });
    });

    function displayMessage(msg, isError = false) {
        messageArea.textContent = msg;
        messageArea.style.color = isError ? 'red' : 'green';
        setTimeout(() => { messageArea.textContent = ''; }, 3000);
    }
});