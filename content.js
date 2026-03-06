// content.js - Script injected into the Trade Republic page
// This script scrapes the DOM safely (no cookies, tokens or network requests)

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        scrollDelay: 1500,        // Delay between each scroll (ms)
        maxScrollAttempts: 200,   // Maximum number of scroll attempts
        checkInterval: 500,       // Interval for checking new elements
        stableScrollCount: 3      // Number of scrolls with no new elements before stopping
    };

    /**
     * Listener for messages from the popup
     */
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'startExport') {
            handleExportRequest(message.startDate, message.endDate)
                .then(result => sendResponse(result))
                .catch(error => sendResponse({ 
                    success: false, 
                    error: error.message 
                }));
            return true; // Indicates an asynchronous response
        }
    });

    /**
     * Handles the export request
     */
    async function handleExportRequest(startDateStr, endDateStr) {
        try {
            notifyProgress(5, 'Preparing export...');
            
            const startDate = new Date(startDateStr);
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999); // Include the entire end day

            notifyProgress(10, 'Loading transactions...');

            // Scroll to load all transactions
            await scrollToLoadTransactions(startDate);

            notifyProgress(50, 'Extracting data...');

            // Extract all transactions from the DOM
            const allTransactions = extractTransactionsFromDOM();

            notifyProgress(70, 'Filtering by dates...');

            // Filter by dates
            const filteredTransactions = filterTransactionsByDate(
                allTransactions, 
                startDate, 
                endDate
            );

            if (filteredTransactions.length === 0) {
                return {
                    success: false,
                    error: 'No transactions found for this period'
                };
            }

            notifyProgress(85, 'Generating CSV...');

            // Generate and download the CSV
            generateAndDownloadCSV(filteredTransactions, startDateStr, endDateStr);

            notifyProgress(100, 'Export complete!');

            return {
                success: true,
                count: filteredTransactions.length
            };

        } catch (error) {
            console.error('Error in handleExportRequest:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Notifies the popup of the current progress
     */
    function notifyProgress(percent, text) {
        browser.runtime.sendMessage({
            action: 'updateProgress',
            percent: percent,
            text: text
        }).catch(() => {
            // The popup may be closed, ignore the error
        });
    }

    /**
     * Scrolls the page to load all transactions up to the start date
     */
    async function scrollToLoadTransactions(targetDate) {
        let scrollAttempts = 0;
        let stableCount = 0;
        let previousTransactionCount = 0;

        while (scrollAttempts < CONFIG.maxScrollAttempts) {
            // Scroll to the bottom
            window.scrollTo(0, document.body.scrollHeight);
            
            // Wait for content to load
            await sleep(CONFIG.scrollDelay);

            // Extract currently visible transactions
            const currentTransactions = extractTransactionsFromDOM();
            
            // Check if new transactions have been loaded
            if (currentTransactions.length === previousTransactionCount) {
                stableCount++;
                if (stableCount >= CONFIG.stableScrollCount) {
                    console.log('No more transactions to load');
                    break;
                }
            } else {
                stableCount = 0;
                previousTransactionCount = currentTransactions.length;
            }

            // Check if the target date has been reached
            if (currentTransactions.length > 0) {
                const oldestTransaction = currentTransactions[currentTransactions.length - 1];
                if (oldestTransaction.date && oldestTransaction.date <= targetDate) {
                    console.log('Target date reached');
                    break;
                }
            }

            scrollAttempts++;
            
            // Update progress
            const progress = Math.min(10 + (scrollAttempts / CONFIG.maxScrollAttempts * 40), 50);
            notifyProgress(progress, `Loading... ${currentTransactions.length} transactions`);
        }

        // Scroll back to the top for a clean view
        window.scrollTo(0, 0);
        await sleep(500);
    }

    /**
     * Extracts all transactions from the DOM
     * Trade Republic structure:
     * <ol class="timeline__entries">
     *   <li class="timeline__entry">
     *     <div class="timelineV2Event">
     *       <h2 class="timelineV2Event__title">Title</h2>
     *       <p class="timelineV2Event__subtitle">23/02 - Sent</p>
     *       <div class="timelineV2Event__price"><p>€100.00</p></div>
     *     </div>
     *   </li>
     * </ol>
     */
    function extractTransactionsFromDOM() {
        const transactions = [];

        try {
            // Find the transaction list
            const transactionList = document.querySelector('ol.timeline__entries');
            
            if (!transactionList) {
                console.warn('Transaction list not found');
                return transactions;
            }

            // Get all transaction elements
            const transactionElements = transactionList.querySelectorAll('li.timeline__entry');
            
            console.log(`Found ${transactionElements.length} transaction elements`);

            for (const element of transactionElements) {
                // Skip month dividers
                if (element.classList.contains('-isMonthDivider')) {
                    continue;
                }

                const transaction = parseTransactionElement(element);
                if (transaction && transaction.date) {
                    transactions.push(transaction);
                }
            }

        } catch (error) {
            console.error('Error during extraction:', error);
        }

        return transactions;
    }

    /**
     * Parses an individual transaction element
     */
    function parseTransactionElement(element) {
        try {
            // Find the main event container
            const eventDiv = element.querySelector('.timelineV2Event');
            if (!eventDiv) {
                return null;
            }

            // Extract the title
            const titleElement = eventDiv.querySelector('.timelineV2Event__title');
            const title = titleElement ? titleElement.textContent.trim() : 'Transaction';

            // Extract the date and status from the subtitle
            const subtitleElement = eventDiv.querySelector('.timelineV2Event__subtitle');
            if (!subtitleElement) {
                return null;
            }

            const subtitleText = subtitleElement.textContent.trim();
            const date = extractDateFromSubtitle(subtitleText);
            
            if (!date) {
                return null;
            }

            // Extract the amount
            const priceDiv = eventDiv.querySelector('.timelineV2Event__price');
            let amount = 0;
            let currency = '€';

            if (priceDiv) {
                const priceP = priceDiv.querySelector('p:not(.timelineV2Event__canceled)');
                if (priceP) {
                    const amountData = extractAmountFromText(priceP.textContent);
                    amount = amountData.amount;
                    currency = amountData.currency;
                }
            }

            // Detect the status from the subtitle
            const status = extractStatusFromSubtitle(subtitleText);

            return {
                date: date,
                title: title,
                amount: amount,
                currency: currency,
                status: status,
                rawElement: element // For debugging if needed
            };

        } catch (error) {
            console.error('Error parsing transaction:', error);
            return null;
        }
    }

    /**
     * Extracts the date from the subtitle text (format: "DD/MM - Status" or "DD/MM")
     */
    function extractDateFromSubtitle(subtitleText) {
        // Expected format: "23/02 - Sent" or "23/02"
        const dateMatch = subtitleText.match(/(\d{1,2})\/(\d{1,2})/);
        
        if (dateMatch) {
            const day = parseInt(dateMatch[1], 10);
            const month = parseInt(dateMatch[2], 10) - 1; // JavaScript months are 0-indexed
            
            // Determine the year (current or previous year)
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            
            // If the transaction month is greater than the current month,
            // it's likely from the previous year
            const year = month > currentMonth ? currentYear - 1 : currentYear;
            
            const date = new Date(year, month, day);
            
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    }

    /**
     * Extracts the status from the subtitle
     */
    function extractStatusFromSubtitle(subtitleText) {
        // Look for known statuses after " - "
        const statusMatch = subtitleText.match(/\s-\s(.+)$/);
        return statusMatch ? statusMatch[1].trim() : '';
    }

    /**
     * Extracts the amount and currency from a text string
     * SIGN RULES:
     * - If the text contains an explicit '+' → positive transaction (credit/income)
     * - Otherwise → negative transaction by default (expense)
     * 
     * Examples:
     * "€100.00"      → -100.00 (expense)
     * "+€220.00"     → +220.00 (credit)
     * "+€1,439.18"   → +1439.18 (credit)
     */
    function extractAmountFromText(text) {
        text = text.trim();
        
        // Detect if it's a positive (credit) transaction
        const isCredit = text.includes('+');
        
        // Patterns for amounts with different formats
        // Examples: "€100.00", "+€1,439.18", "€5.80"
        const patterns = [
            /([+\-]?)([€$£])[\s\u00A0]*([\d,\.]+)/,  // €100.00 or +€1,439.18
            /([+\-]?)([\d,\.]+)[\s\u00A0]*([€$£])/   // 100.00€
        ];

        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                let amountStr, currency;
                
                if (match[2] && /[€$£]/.test(match[2])) {
                    // Format: €100.00 or +€100.00
                    currency = match[2];
                    amountStr = match[3];
                } else {
                    // Format: 100.00€
                    amountStr = match[2];
                    currency = match[3];
                }

                // Clean up the amount
                // Replace non-breaking spaces and commas
                amountStr = amountStr.replace(/[\s\u00A0]/g, '').replace(',', '');
                
                const parsedAmount = parseFloat(amountStr);
                
                if (!isNaN(parsedAmount)) {
                    // SIGN LOGIC:
                    // - If '+' is present in the original text → positive amount (credit)
                    // - Otherwise → negative amount (expense)
                    const finalAmount = isCredit ? parsedAmount : -parsedAmount;
                    
                    return {
                        amount: finalAmount,
                        currency: currency || '€'
                    };
                }
            }
        }

        return { amount: 0, currency: '€' };
    }

    /**
     * Filters transactions by date range
     */
    function filterTransactionsByDate(transactions, startDate, endDate) {
        return transactions.filter(t => {
            return t.date >= startDate && t.date <= endDate;
        });
    }

    /**
     * Generates and downloads the CSV file
     */
    function generateAndDownloadCSV(transactions, startDateStr, endDateStr) {
        // Sort by date (most recent first)
        transactions.sort((a, b) => b.date - a.date);

        // Build the CSV content
        const headers = ['Date', 'Description', 'Amount', 'Currency', 'Status'];
        const rows = transactions.map(t => [
            formatDate(t.date),
            escapeCSV(t.title),
            t.amount.toFixed(2),  // Sign is already included (+ or -)
            t.currency,
            escapeCSV(t.status)
        ]);

        const csvContent = [
            headers.join(';'),
            ...rows.map(row => row.join(';'))
        ].join('\n');

        // Create the blob with BOM for Excel compatibility
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { 
            type: 'text/csv;charset=utf-8;' 
        });

        // Create and trigger the file download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `traderepublic_${startDateStr}_${endDateStr}.csv`;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    /**
     * Formats a date as DD/MM/YYYY
     */
    function formatDate(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    /**
     * Escapes special characters for CSV
     */
    function escapeCSV(str) {
        if (typeof str !== 'string') return '';
        // Escape quotes and wrap in quotes if necessary
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    /**
     * Utility function to wait
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    console.log('Trade Republic Exporter: Content script loaded');

})();