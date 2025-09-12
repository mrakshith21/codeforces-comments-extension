/**
 * Saves data to chrome.storage.local
 * @param {string} key - The key under which to store the data
 * @param {any} data - The data to store
 * @returns {Promise} A promise that resolves when the data is stored
 */
export const saveToStorage = async (key, data) => {
    return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: data }, () => {
            resolve();
        });
    });
};

/**
 * Retrieves data from chrome.storage.local
 * @param {string} key - The key of the data to retrieve
 * @returns {Promise<any>} A promise that resolves with the retrieved data
 */
export const getFromStorage = async (key) => {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
            resolve(result[key]);
        });
    });
};


