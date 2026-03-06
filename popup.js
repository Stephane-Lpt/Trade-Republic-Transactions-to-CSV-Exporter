// popup.js - Extension user interface management

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('export-form');
    const exportBtn = document.getElementById('export-btn');
    const btnText = exportBtn.querySelector('.btn-text');
    const loader = exportBtn.querySelector('.loader');
    const errorZone = document.getElementById('error-zone');
    const successZone = document.getElementById('success-zone');
    const progressZone = document.getElementById('progress-zone');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // Initialise default dates (20th of last month to 19th of current month)
    initializeDefaultDates();

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await startExport();
    });

    /**
     * Initialises the default dates in the form fields
     */
    function initializeDefaultDates() {
        const today = new Date();
        const currentDay = today.getDate();

        let startDate, endDate;

        if (currentDay >= 20) {
            startDate = new Date(today.getFullYear(), today.getMonth(), 20);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 19);
        } else {
            startDate = new Date(today.getFullYear(), today.getMonth() - 1, 20);
            endDate = new Date(today.getFullYear(), today.getMonth(), 19);
        }

        document.getElementById('date-start').valueAsDate = startDate;
        document.getElementById('date-end').valueAsDate = endDate;
    }

    /**
     * Shows an error message (disappears after 7 s)
     */
    function showError(message) {
        errorZone.textContent = `❌ ${message}`;
        errorZone.classList.remove('hidden');
        successZone.classList.add('hidden');
        setTimeout(() => errorZone.classList.add('hidden'), 7000);
    }

    /**
     * Shows a success message
     */
    function showSuccess(message) {
        successZone.textContent = `✅ ${message}`;
        successZone.classList.remove('hidden');
        errorZone.classList.add('hidden');
    }

    /**
     * Shows a warning (orange background) without hiding the success message
     */
    function showWarning(message) {
        const warnZone = document.getElementById('warning-zone');
        if (!warnZone) return; // Guard if the element is absent
        warnZone.textContent = `⚠️ ${message}`;
        warnZone.classList.remove('hidden');
    }

    /**
     * Updates the loading state
     */
    function setLoading(isLoading) {
        exportBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            loader.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    }

    /**
     * Updates the progress bar
     */
    function updateProgress(percent, text) {
        progressZone.classList.remove('hidden');
        progressFill.style.width = `${percent}%`;
        progressText.textContent = text;
    }

    /**
     * FIX #6: Wraps sendMessage with a configurable timeout (ms).
     * If the content script does not respond within the timeout,
     * the promise is rejected with an explicit message rather than blocking indefinitely.
     */
    function sendMessageWithTimeout(tabId, message, timeoutMs = 360000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(
                    `Timeout: the script did not respond after ${timeoutMs / 1000} s. ` +
                    'Please reload the Trade Republic page and try again.'
                ));
            }, timeoutMs);

            browser.tabs.sendMessage(tabId, message)
                .then(result => {
                    clearTimeout(timer);
                    resolve(result);
                })
                .catch(err => {
                    clearTimeout(timer);
                    reject(err);
                });
        });
    }

    /**
     * Starts the export process
     */
    async function startExport() {
        const startDate = document.getElementById('date-start').value;
        const endDate = document.getElementById('date-end').value;

        if (!startDate || !endDate) {
            showError('Please select both dates');
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            showError('The start date must be earlier than the end date');
            return;
        }

        const [tab] = await browser.tabs.query({ active: true, currentWindow: true });

        if (!tab.url || !tab.url.includes('app.traderepublic.com/profile/transactions')) {
            showError('Please open the Trade Republic transactions page');
            return;
        }

        setLoading(true);
        progressZone.classList.add('hidden');
        errorZone.classList.add('hidden');

        // Hide the warning from the previous session
        const warnZone = document.getElementById('warning-zone');
        if (warnZone) warnZone.classList.add('hidden');

        try {
            // FIX #6: use sendMessageWithTimeout instead of raw sendMessage.
            // Timeout generously set to 6 min for large accounts
            // (200 scrolls × 1.5 s + margin).
            const result = await sendMessageWithTimeout(tab.id, {
                action: 'startExport',
                startDate,
                endDate
            }, 360000);

            if (result.success) {
                showSuccess(`Export successful! ${result.count} transactions exported.`);
                progressZone.classList.add('hidden');

                // FIX #8: warn if the scroll limit has been reached
                if (result.limitReached) {
                    showWarning(
                        'The scroll limit has been reached. ' +
                        'Transactions prior to the requested period may be missing.'
                    );
                }
            } else {
                showError(result.error || 'Error during export');
            }
        } catch (error) {
            console.error('Popup error:', error);
            showError(error.message || 'Communication error. Please reload the Trade Republic page.');
        } finally {
            setLoading(false);
        }
    }

    // Listen for progress messages from the content script
    browser.runtime.onMessage.addListener((message) => {
        if (message.action === 'updateProgress') {
            updateProgress(message.percent, message.text);
        }
    });
});