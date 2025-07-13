# Buzz Counter Chrome Extension

This extension monitors a numerical value on a webpage. If the number increases, it plays a sound notification. This is useful for monitoring things like support ticket queues, order counts, etc.

## How to Install

1.  Download or clone this repository to a folder on your computer.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Enable "Developer mode" using the toggle switch in the top-right corner.
4.  Click on the "Load unpacked" button that appears.
5.  Select the `buzz-counter` folder you created.
6.  The "Buzz Counter" extension should now appear in your list of extensions and in your browser's toolbar.

## How to Use

1.  Navigate to the webpage you want to monitor (e.g., your support ticket dashboard).
2.  Click on the Buzz Counter icon in your Chrome toolbar.
3.  **Find the CSS Selector:**
    *   Right-click on the number you want to track on the page and select "Inspect".
    *   The developer tools will open, highlighting the HTML for that number.
    *   Look for a unique `id` (like `id="ticket-count"`) or `class` (like `class="queue-size"`).
    *   If it's an ID, your selector is `#ticket-count`.
    *   If it's a class, your selector is `.queue-size`.
4.  **Configure the Extension:**
    *   Paste the CSS selector into the "Element CSS Selector" field.
    *   Provide a direct URL to a sound file (`.mp3`, `.wav`) in the "Audio URL" field.
    *   **Alternatively**, you can upload your own sound file. This is saved directly in the extension.
    *   Click "Save Settings".
5.  **Start Monitoring:**
    *   Click the toggle switch to turn monitoring "ON".
    *   The extension will now check the value on the active tab every 15 seconds.
    *   If the number increases compared to the last check, your chosen sound will play.

The extension will remember your settings. You only need to turn monitoring ON/OFF as needed.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Icon by Icons8

# License
Icon by Icons8