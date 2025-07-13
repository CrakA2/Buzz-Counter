chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'playSound' && msg.payload.src) {
    const audioPlayer = document.getElementById('audio-player');
    audioPlayer.src = msg.payload.src;
    audioPlayer.play().catch(e => console.error("Audio playback failed:", e));
  }
});