import { classifyByPattern, getCommentText } from './patternMatcher';
import { classifyByGemini } from './geminiClassifier';
import { saveToStorage, getFromStorage } from './storage';

const initializeProblemsToComments = (problems) => {
    const tempProblemsToComments = [];        
    problems.map(problem => tempProblemsToComments.push({
        code: problem.index,
        name: problem.name,
        tags: problem.tags,
        comments: []
    }));
    tempProblemsToComments.push({
        code: "",
        name: "Miscellaneous",
        tags: [],
        comments: []
    });
    console.log("Initialized problems to comments mapping with size ", tempProblemsToComments.length);
    return tempProblemsToComments;
};

const classifyComments = async (problems, comments, contestId, geminiSession) => {
    const startTime = performance.now();
    console.log("Starting classification...");
    
    const problemsList = problems.map(problem => "Problem " + problem.index + " - " + problem.name);
    console.log(problemsList);
    
    let tempProblemsToComments = initializeProblemsToComments(problems);
    let classificationStats = {
        string: 0,
        gemini: 0
    };

    // Process each comment
    for (const comment of comments) {
        let matchedProblems = [];
        
        // Try Gemini
        if ((!matchedProblems || matchedProblems.length === 0) && geminiSession) {
            matchedProblems = await classifyByGemini(comment, problems, geminiSession);
            if (matchedProblems && matchedProblems.length > 0) {
                classificationStats.gemini++;
            }
        }
        
        // Fall back to string matching if failed
        if (!matchedProblems || matchedProblems.length === 0) {
            matchedProblems = classifyByPattern(comment, problems, contestId);
            if (matchedProblems && matchedProblems.length > 0) {
                classificationStats.string++;
            }
        }

        // Create new array reference
        const updatedProblemsToComments = tempProblemsToComments.map(problem => ({
            ...problem,
            comments: [...problem.comments]
        }));

        // Add comment to matched problems or miscellaneous
        if (matchedProblems.length > 0) {
            matchedProblems.forEach(index => {
                updatedProblemsToComments[index].comments.push(comment);
            });
        } else {
            updatedProblemsToComments[problems.length].comments.push(comment);
        }

        tempProblemsToComments = updatedProblemsToComments;
        console.log("Classified a comment");
    }

    const endTime = performance.now();
    const totalTime = (endTime - startTime) / 1000;

    console.log("Classification complete");
    console.log(`Total classification time: ${totalTime.toFixed(2)} seconds`);
    console.log(`Average time per comment: ${(totalTime / comments.length).toFixed(3)} seconds`);
    console.log('Classification stats:', classificationStats);

    return tempProblemsToComments;
};

export const getClassifiedComments = async (request, geminiSession) => {
    const { tutorialId, contestId, comments } = request;
    
    // Check if data exists in storage
    const storedData = await getFromStorage(tutorialId);
    if (storedData && storedData.problemClassifications && storedData.problems && storedData.contest) {
        console.log("Loading classifications, contest and problems from storage");
        const problems = storedData.problems;
        
        // Initialize with stored problems data
        let reconstructedProblemsToComments = problems.map(problem => ({
            code: problem.index,
            name: problem.name,
            tags: problem.tags,
            comments: []
        }));
        
        // Add miscellaneous category
        reconstructedProblemsToComments.push({
            code: "",
            name: "Miscellaneous",
            tags: [],
            comments: []
        });

        // Add comments to each problem based on stored classifications
        storedData.problemClassifications.forEach(({problem, commentIds}, index) => {
            const matchingComments = commentIds
                .map(id => comments.find(comment => comment.id === id))
                .filter(comment => comment !== null);
            
            if (index < reconstructedProblemsToComments.length) {
                reconstructedProblemsToComments[index].comments = matchingComments;
            }
        });
        
        console.log("Reconstructed problems with comments:", reconstructedProblemsToComments);
        return reconstructedProblemsToComments;
    }

    // If no stored data, proceed with classification
    try {
        const response = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`);
        if (!response.ok) {
            console.error('Error while fetching contest problems');
            return null;
        }
        
        const data = await response.json();
        const problems = data.result.problems;
        
        // Check if Gemini session is available
        if (!geminiSession) {
            console.warn("Gemini Nano session is not available, will use pattern matching only");
        }

        // Classify comments
        const problemsToComments = await classifyComments(problems, comments, contestId, geminiSession);
        
        // Convert the classifications to a more meaningful structure with comment IDs
        const problemClassifications = problems.map((problem, index) => ({
            problem,
            commentIds: problemsToComments[index].comments.map(comment => comment.id)
        }));
        
        // Add miscellaneous comments
        problemClassifications.push({
            problem: { name: "Miscellaneous" },
            commentIds: problemsToComments[problems.length].comments.map(comment => comment.id)
        });

        // Save to storage (async)
        saveToStorage(tutorialId, {
            contestId,
            problemClassifications,
            contest: data.result.contest,
            problems: data.result.problems,
            timestamp: Date.now()
        });

        return problemsToComments;
    } catch (error) {
        console.error('Error in classification process:', error);
        return null;
    }
};
