// background.js

const GITHUB_BASE_URL = "https://raw.githubusercontent.com/redwoodux/daily-wallpaper-images-2025/master/";
const TOTAL_FOLDERS = 366; // Change to 365 for production
const START_DATE = new Date("2025-1-21");
const QUOTES_URL = "https://raw.githubusercontent.com/redwoodux/daily-wallpaper-images-2025/master/quotes.json";

// Get the current folder number based on the date
function getFolderNumber() {
    const today = new Date();

    // Calculate the total days since START_DATE
    const diffInDays = Math.floor((today - START_DATE) / (1000 * 60 * 60 * 24));

    // Generate a rotation pattern for TOTAL_FOLDERS
    const rotationPattern = generateRotationPattern(TOTAL_FOLDERS);

    // Adjust index calculation to handle negative diffInDays
    let index = diffInDays % rotationPattern.length;
    if (index < 0) {
        index += rotationPattern.length;
    }

    // Use the adjusted index to get the folder number
    const folderNumber = rotationPattern[index];

    console.log(`Calculated folder number: ${folderNumber}`);
    return folderNumber;
}

// IF YOU WANT TO TRY UPDATING THE IMAGE EVERY MINUTE THEN USE THIS CODE BELOW AND COMMENT OUT ABOVE
// function getFolderNumber() {
//     const now = new Date();
//     const folderNumber = (now.getMinutes() % TOTAL_FOLDERS) + 1;
//     console.log(`Calculated folder number: ${folderNumber}`);
//     return folderNumber;
// }


// Generate a rotation pattern that avoids consecutive repetition
function generateRotationPattern(totalFolders) {
    const pattern = [];
    for (let i = 0; i < totalFolders; i++) {
        pattern.push((i % totalFolders) + 1); // Basic cyclic pattern
    }

    // Shuffle the pattern slightly to avoid simple repetition
    for (let i = 1; i < totalFolders - 1; i++) {
        if (i % 2 === 0) {
            [pattern[i], pattern[i - 1]] = [pattern[i - 1], pattern[i]];
        }
    }

    console.log(`Generated rotation pattern: ${pattern}`);
    return pattern;
}

// Fetch metadata for the given folder
async function fetchImageMetadata(folderNumber) {
    const metadataUrl = `${GITHUB_BASE_URL}${folderNumber}/metadata.json`;
    try {
        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error(`Failed to fetch metadata: ${response.status}`);
        console.log(`Fetched metadata from: ${metadataUrl}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching metadata:", error);
        return null;
    }
}

// Fetch the image and overlay text color from the metadata
async function fetchImage(folderNumber) {
    try {
        const metadata = await fetchImageMetadata(folderNumber);
        if (!metadata || !metadata.fileName) throw new Error("Invalid or missing metadata.");

        const imageUrl = `${GITHUB_BASE_URL}${folderNumber}/${metadata.fileName}`;
        console.log(`Fetched image URL: ${imageUrl}`);
        return {
            imageUrl,
            overlayTextColor: metadata.overlayTextColor || "white",
            metadata
        };
    } catch (error) {
        console.error("Error in fetchImage:", error);
        return null;
    }
}

// Convert a Blob to a Base64 string
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Cache the image locally in chrome.storage
async function cacheImageLocally() {
    const folderNumber = getFolderNumber();
    const data = await fetchImage(folderNumber);
    if (!data) {
        console.warn("Image fetch failed; no image to cache.");
        return;
    }

    try {
        const response = await fetch(data.imageUrl);
        const blob = await response.blob();
        const base64Data = await blobToBase64(blob);

        chrome.storage.local.set({
            cachedImage: base64Data,
            overlayTextColor: data.overlayTextColor,
            imageMetadata: data.metadata // Store the metadata
        });
        console.log("Image cached locally", data.imageUrl);
    } catch (error) {
        console.error("Error caching image locally:", error);
    }
}

// Cache quotes locally in chrome.storage
async function cacheQuotesLocally() {
    try {
        const response = await fetch(QUOTES_URL);
        if (!response.ok) throw new Error(`Failed to fetch quotes.json: ${response.status}`);

        const text = await response.text();
        const quotes = text.split("\n").filter(Boolean).map((line) => JSON.parse(line));

        chrome.storage.local.set({ cachedQuotes: quotes });
        console.log("Quotes cached locally.");
    } catch (error) {
        console.error("Error caching quotes locally:", error);
    }
}

// Ensure alarms persist across restarts
chrome.runtime.onStartup.addListener(async () => {
    console.log("Checking and setting alarms on startup.");
    const alarm = await chrome.alarms.get("updateImage");
    if (!alarm) {
        chrome.alarms.create("updateImage", { periodInMinutes: 720 });
    }
});

// Setup alarms on extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log("Setting up alarms on installation.");
    chrome.alarms.create("updateImage", { periodInMinutes: 720 });
    chrome.alarms.create("updateQuotes", { periodInMinutes: 10080 });

    // Cache data on installation
    cacheImageLocally();
    cacheQuotesLocally();
});

// Handle alarm triggers
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log(`Alarm triggered: ${alarm.name}`);
    if (alarm.name === "updateImage") {
        cacheImageLocally();
    }
    if (alarm.name === "updateQuotes") {
        cacheQuotesLocally();
    }
});

chrome.alarms.getAll((alarms) => {
    console.log("Currently registered alarms:", alarms);
});

// Initial setup when the extension loads
cacheImageLocally();
cacheQuotesLocally();
