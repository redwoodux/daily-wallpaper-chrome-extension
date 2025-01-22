document.addEventListener('DOMContentLoaded', () => {
    loadCachedImage();
    displayTime();
    displayQuote();
    setInterval(displayTime, 60000); // Update time every minute
    setupInfoIcon();
});

// Listen for changes in the cached image and overlay text color
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes.cachedImage || changes.overlayTextColor)) {
        loadCachedImage();
    }
});

function setupInfoIcon() {
    const infoIcon = document.getElementById('info-icon');
    const modal = document.getElementById('info-modal');
    const closeBtn = document.getElementById('modal-close');

    // Open modal when info icon is clicked
    infoIcon.addEventListener('click', () => {
        // Ensure the modal is visible and reset opacity
        modal.style.display = "block"; // Reset display to block
        setTimeout(() => modal.classList.add('show'), 0); // Trigger fade-in
        // Retrieve metadata from storage
        chrome.storage.local.get("imageMetadata", (result) => {
            const metadata = result.imageMetadata || {};
            populateModal(metadata);
        });
    });

    // Close modal when '×' is clicked
    // closeBtn.addEventListener('click', () => {
    //     modal.classList.remove('show'); // Trigger fade-out
    //     setTimeout(() => {
    //         modal.style.display = "none"; // Hide after fade-out completes
    //     }, 300); // Match the transition duration
    // });

    // Close modal when user clicks outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.remove('show'); // Trigger fade-out
            setTimeout(() => {
                modal.style.display = "none"; // Hide after fade-out completes
            }, 300); // Match the transition duration
        }
    });
}



function populateModal(metadata) {
    const modalBody = document.getElementById('modal-body');
    modalBody.innerHTML = ''; // Clear previous content

    // Function to create metadata entries
    function createMetadataEntry(keyText, valueContent) {
        const entryElement = document.createElement('div');
        entryElement.className = 'metadata-entry'; // Wrapper for key and value

        const keyElement = document.createElement('span');
        keyElement.className = 'metadata-key';
        keyElement.textContent = keyText;

        const valueElement = document.createElement('span');
        valueElement.className = 'metadata-value';

        if (typeof valueContent === 'string' || valueContent instanceof String) {
            valueElement.textContent = valueContent;
        } else if (valueContent) {
            // Assume valueContent is an element
            valueElement.appendChild(valueContent);
        } else {
            valueElement.textContent = 'Unknown';
        }

        entryElement.appendChild(keyElement);
        entryElement.appendChild(valueElement);
        modalBody.appendChild(entryElement);
    }

    // Photographer or creator
    const photographerName = metadata.photographerCreatorName || 'Unknown';
    const photographerUrl = metadata.photographerCreatorUrl;

    let photographerContent;
    if (photographerUrl && photographerUrl.trim() !== '') {
        const photographerLink = document.createElement('a');
        photographerLink.href = photographerUrl;
        photographerLink.textContent = photographerName;
        photographerLink.target = '_blank'; // Open in new tab
        photographerLink.rel = 'noopener noreferrer';
        photographerContent = photographerLink;
    } else {
        photographerContent = photographerName;
    }

    createMetadataEntry('Photographer or creator:', photographerContent);

    // Source
    const source = metadata.source || 'Unknown';
    createMetadataEntry('Source:', source);

    // Prompt
    const prompt = metadata.prompt || 'Unknown';
    createMetadataEntry('Prompt:', prompt);

    // Link to the original image
    const originalUrl = metadata.originalUrl;

    if (originalUrl && originalUrl.trim() !== '') {
        const originalLink = document.createElement('a');
        originalLink.href = originalUrl;
        originalLink.textContent = 'Link to the original image';
        originalLink.target = '_blank'; // Open in new tab
        originalLink.rel = 'noopener noreferrer';
        originalLink.className = 'original-image-link'; // Add specific class for styling

        modalBody.appendChild(originalLink); // Append link directly without key text

        // Add "Made with love, from Redwood UX"
        const footer = document.createElement('div');
        // footer.className = 'metadata-entry';
        footer.style.marginTop = '38px';
        footer.style.fontSize = '0.88rem';
        footer.style.color = '#666';

        footer.innerHTML = `
        Made with love, from  
        <a href="https://redwoodux.com" target="_blank" style="color: #ff6f61; text-decoration: none; padding-left: 0px">
            Redwood UX
        </a>
    `;

        modalBody.appendChild(footer); // Append the footer to the modal body
    } else {
        // Optionally, display nothing or a placeholder
        // const noLink = document.createElement('div');
        // noLink.className = 'no-original-link';
        // noLink.textContent = ''; // Or 'Original image not available'
        // modalBody.appendChild(noLink);
    }
}



function loadCachedImage() {
    chrome.storage.local.get(["cachedImage", "overlayTextColor"], (result) => {
        const body = document.body;
        const layerOntop = document.getElementById("layerOntop");
        const infoIcon = document.getElementById("info-icon");

        if (result.cachedImage) {
            body.style.backgroundImage = `url(${result.cachedImage})`;

            // Set body text color and icon color based on overlayTextColor
            if (result.overlayTextColor === "black") {
                body.style.color = "#333"; // Set to off-black
                layerOntop.classList.add("layerOntopWhite");
                layerOntop.classList.remove("layerOntopBlack");
                infoIcon.classList.add("dark");
                infoIcon.classList.remove("light");
            } else if (result.overlayTextColor === "white") {
                body.style.color = "white"; // Default white
                layerOntop.classList.add("layerOntopBlack");
                layerOntop.classList.remove("layerOntopWhite");
                infoIcon.classList.add("light");
                infoIcon.classList.remove("dark");
            } else {
                body.style.color = "white"; // Fallback color
                infoIcon.classList.add("light");
                infoIcon.classList.remove("dark");
            }
        } else {
            body.style.backgroundImage = `url('https://example.com/default-image.jpg')`; // Fallback
            body.style.color = "white"; // Fallback color
            infoIcon.classList.add("light");
            infoIcon.classList.remove("dark");
        }
    });
}




function displayTime() {
    const timeElement = document.getElementById("time");
    timeElement.textContent = getCurrentTime();
}

async function displayQuote() {
    const quoteElement = document.getElementById("quote");
    const { text, author } = await getRandomQuote();

    const quoteText = document.createElement("div");
    quoteText.textContent = text;
    quoteText.style.marginTop = "-30px";

    const quoteAuthor = document.createElement("div");
    quoteAuthor.textContent = `— ${author}`;
    quoteAuthor.style.fontSize = "1.2rem";
    quoteAuthor.style.fontStyle = "italic";
    quoteAuthor.style.marginTop = "0.7rem";

    // Clear previous content
    quoteElement.innerHTML = "";
    quoteElement.appendChild(quoteText);
    quoteElement.appendChild(quoteAuthor);

    // Adjust font size based on quote length
    if (text.length > 40) {
        quoteText.style.fontSize = "1.9rem";
    } else {
        quoteText.style.fontSize = "2.5rem";
    }
}
