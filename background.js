// A persistent flag to prevent creating multiple offscreen documents
let creating; 

async function setupOffscreenDocument(path) {
    // Check all windows controlled by the extension to see if one has the offscreen URL
    const offscreenUrl = chrome.runtime.getURL(path);
    const existingContexts = await chrome.runtime.getContexts({
        contextTypes: ['OFFSCREEN_DOCUMENT'],
        documentUrls: [offscreenUrl]
    });

    if (existingContexts.length > 0) {
        return;
    }

    // create offscreen document
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

// Function to check the value on the page
async function checkValue() {
    const { monitoring, selector, audioSrc } = await chrome.storage.local.get(['monitoring', 'selector', 'audioSrc']);

    if (!monitoring || !selector || !audioSrc) {
        return; // Don't do anything if not configured or turned off
    }
    
    // Get the currently active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // Inject a script into the active tab to get the value
    try {
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (cssSelector) => {
                const element = document.querySelector(cssSelector);
                if (element) {
                    // Try to parse the number, removing commas and non-numeric chars
                    const numberStr = element.innerText.replace(/,/g, '').trim();
                    const number = parseFloat(numberStr);
                    return isNaN(number) ? null : number;
                }
                return null;
            },
            args: [selector]
        });
        
        const currentValue = injectionResults[0].result;
        if (currentValue === null) return; // Element not found or not a number

        // Compare with the last known value
        const { lastValue } = await chrome.storage.session.get('lastValue');
        
        console.log(`Current: ${currentValue}, Last: ${lastValue}`);

        if (lastValue !== undefined && currentValue > lastValue) {
            // Value has increased! Play sound.
            await setupOffscreenDocument('offscreen.html');
            await chrome.runtime.sendMessage({ 
                type: 'playSound', 
                payload: { src: audioSrc }
            });
        }
        
        // Update the last value in session storage
        await chrome.storage.session.set({ lastValue: currentValue });

    } catch (e) {
        console.error("Buzz Counter: Error injecting script or getting value.", e);
    }
}


// --- Event Listeners ---

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'setMonitoring') {
        if (message.monitoring) {
            // Start the alarm to check every 15 seconds
            chrome.alarms.create('buzzCounterAlarm', { periodInMinutes: 0.25 });
            checkValue(); // Check immediately on start
        } else {
            // Stop the alarm and clear the session value
            chrome.alarms.clear('buzzCounterAlarm');
            chrome.storage.session.remove('lastValue');
        }
    }
    // This listener is for playing the sound from the offscreen document
    if (message.type === 'playSound') {
      // This forward the message to the offscreen document
      chrome.offscreen.getActiveContexts().then(allContexts => {
          if (allContexts.length > 0) {
              chrome.runtime.sendMessage({ type: 'playSound', payload: message.payload });
          }
      });
    }
});

// Listener for the alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'buzzCounterAlarm') {
        checkValue();
    }
});

// Check on startup if monitoring was already enabled
chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get('monitoring', ({ monitoring }) => {
        if (monitoring) {
            chrome.alarms.create('buzzCounterAlarm', { periodInMinutes: 0.25 });
        }
    });
});