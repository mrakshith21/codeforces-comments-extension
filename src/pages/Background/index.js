import { getClassifiedComments } from './classifier';

console.log('Background script initialized');

// Initialize Gemini Nano session
let geminiSession = null;

const initGeminiSession = async () => {
    try {
        geminiSession = await LanguageModel.create();
        if (geminiSession) {
            console.log("Gemini Nano session initialized successfully");
        } else {
            console.error("Failed to initialize Gemini Nano session");
        }
    } catch (error) {
        console.error("Error initializing Gemini Nano session:", error);
    }
};

// Initialize the session when the background script starts
initGeminiSession();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CLASSIFY_COMMENTS') {
        // Validate request payload
        if (!request.payload || !request.payload.tutorialId || !request.payload.contestId || !request.payload.comments) {
            console.error('Invalid request payload:', request.payload);
            sendResponse({ 
                success: false, 
                error: 'Invalid request payload: missing required fields' 
            });
            return true;
        }

        getClassifiedComments(request.payload, geminiSession)
            .then(result => {
                if (result === null) {
                    sendResponse({ 
                        success: false, 
                        error: 'Failed to classify comments' 
                    });
                } else {
                    sendResponse({ success: true, data: result });
                }
            })
            .catch(error => {
                console.error('Error in background script:', error);
                sendResponse({ 
                    success: false, 
                    error: error.message || 'Unknown error occurred'
                });
            });
        return true; // Will respond asynchronously
    }
});
