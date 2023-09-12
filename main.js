const form = document.querySelector("form");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const apiKey = document.querySelector("#api-key").value;
    chrome.storage.local.set({ apiKey }, () => {
        console.log("API key saved");
    });

    const model = document.querySelector("#model").value;
    chrome.storage.local.set({ model }, () => {
        console.log("model saved");
    });
});

document.getElementById("clear").addEventListener('pointerdown', () => {
    console.log("clear cache");
    chrome.storage.local.clear();

    const apiKey = document.querySelector("#api-key").value;
    chrome.storage.local.set({ apiKey }, () => {
        console.log("API key saved", apiKey);
    });

    const model = document.querySelector("#model").value;
    chrome.storage.local.set({ model }, () => {
        console.log("model saved", model);
    });    
});

chrome.storage.local.get("apiKey", (data) => {
    document.querySelector("#api-key").value = data.apiKey || "";
    console.log("API key read", data.apiKey);
});

chrome.storage.local.get("model", (data) => {
    document.querySelector("#model").value = data.model || "";
    console.log("model read", data.model);
});