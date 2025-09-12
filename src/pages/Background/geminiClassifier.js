const generateClassificationPrompt = (problems, commentText) => {
    const problemsDescription = problems.map(p => `${p.index}. ${p.name}`).join(' ');
    return `The codeforces contest has the following problems. Here the problem codes are ${problems.map(p => p.index).join(', ')}: ${problemsDescription} \n\n` +
           `Given the following comment by one of the users, return a comma separated list of which problem codes the user is talking about. Return only the problem codes.\n\n` +
           `Comment: ${commentText}`;
};

export const classifyByGemini = async (comment, problems, session) => {
    if (!comment.text || !comment.text.trim()) return [];

    try {
        const prompt = generateClassificationPrompt(problems, comment.text);
        const result = await session.prompt(prompt);
        
        const problemCodes = result.trim().split(',').map(code => code.trim());
        const matchedProblems = [];
        
        problems.forEach((problem, index) => {
            if (problemCodes.includes(problem.index)) {
                matchedProblems.push(index);
            }
        });
        
        return matchedProblems;
    } catch (error) {
        console.error('Error classifying comment with Gemini:', error);
        return null;
    }
};
