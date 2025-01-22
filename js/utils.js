function getRandomQuote() {
    return new Promise((resolve) => {
        chrome.storage.local.get("cachedQuotes", (result) => {
            const quotes = result.cachedQuotes || [
                { text: "Default quote - Please refresh to load new quotes.", author: "Unknown" }
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            resolve(randomQuote);
        });
    });
}

function getCurrentTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');

    // Convert 24-hour format to 12-hour format
    hours = hours % 12 || 12;

    return `${hours}:${minutes}`;
}