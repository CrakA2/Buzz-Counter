let creating; 
async function setupOffscreenDocument(path) {
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });
    if (existingContexts.length > 0) return;
    if (creating) {
        await creating;
    } else {
        creating = chrome.offscreen.createDocument({
            url: path,
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'To play notification sounds for the Buzz Counter extension',
        });
        await creating;
        creating = null;
    }
}

// --- Monitoring Control Functions ---

async function stopMonitoring(reason) {
    console.log(`Stopping monitoring. Reason: ${reason}`);
    chrome.alarms.clear('buzzCounterAlarm');
    await chrome.storage.local.set({ monitoring: false });
    await chrome.storage.session.remove('lastValue');
}

// --- Core Logic: The Check Function ---

async function checkValue() {
    const settings = await chrome.storage.local.get(['monitoring', 'selector', 'audioSrc', 'monitoringTabId']);

    if (!settings.monitoring || !settings.selector || !settings.audioSrc || !settings.monitoringTabId) {
        return; // Exit if not fully configured
    }

    try {
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: settings.monitoringTabId }, 
            func: (cssSelector) => {
                const element = document.querySelector(cssSelector);
                if (element) {
                    const numberStr = element.innerText.replace(/,/g, '').trim();
                    const number = parseFloat(numberStr);
                    return isNaN(number) ? null : number;
                }
                return null;
            },
            args: [settings.selector]
        });

        if (chrome.runtime.lastError) {
             // This catches errors if executeScript itself fails before returning a promise
            throw new Error(chrome.runtime.lastError.message);
        }

        const currentValue = injectionResults[0].result;
        if (currentValue === null) return; // Element not on page or not a number

        const { lastValue } = await chrome.storage.session.get('lastValue');
        console.log(`Tab ${settings.monitoringTabId} - Current: ${currentValue}, Last: ${lastValue}`);

        if (lastValue !== undefined && currentValue > lastValue) {
            await setupOffscreenDocument('offscreen.html');
            await chrome.runtime.sendMessage({ 
                type: 'playSound', 
                payload: { src: settings.audioSrc }
            });
            // API call logic
            const { apiUrl } = await chrome.storage.local.get('apiUrl');
            if (apiUrl) {
                try {
                    await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
                } catch (err) {
                    console.error('Buzz Counter: API call failed', err);
                }
            }
        }

        await chrome.storage.session.set({ lastValue: currentValue });

    } catch (e) {
        if (e.message.includes("No tab with id") || e.message.includes("cannot be scripted")) {
            // The monitored tab was closed or is inaccessible. Shut down monitoring.
            stopMonitoring(`Tab ${settings.monitoringTabId} is no longer accessible.`);
        } else {
            console.error("Buzz Counter: Error during value check.", e);
        }
    }
}

// --- Event Listeners ---

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === 'setMonitoring') {
        if (message.monitoring) {
            const { interval } = await chrome.storage.local.get('interval');
            const checkInterval = interval || 10; // Default to 10s if not set
            // Alarms use minutes, so convert seconds to minutes.
            // Ensure it's at least the minimum allowed by Chrome for safety (0.1 min = 6s)
            const periodInMinutes = Math.max(0.1, checkInterval / 60);
            
            chrome.alarms.create('buzzCounterAlarm', { periodInMinutes: periodInMinutes });
            checkValue(); // Check immediately
        } else {
            stopMonitoring("User toggled off.");
        }
    }
    // Forward sound playing to offscreen document
    if (message.type === 'playSound') {
      const contexts = await chrome.offscreen.getActiveContexts();
      if (contexts.length > 0) {
        chrome.runtime.sendMessage({ type: 'playSound', payload: message.payload });
      }
    }
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'buzzCounterAlarm') {
        checkValue();
    }
});

// Re-initialize alarm on browser startup if it was left on
chrome.runtime.onStartup.addListener(async () => {
    const { monitoring } = await chrome.storage.local.get('monitoring');
    if (monitoring) {
        const { interval } = await chrome.storage.local.get('interval');
        const checkInterval = interval || 10;
        const periodInMinutes = Math.max(0.1, checkInterval / 60);
        chrome.alarms.create('buzzCounterAlarm', { periodInMinutes: periodInMinutes });
    }
});