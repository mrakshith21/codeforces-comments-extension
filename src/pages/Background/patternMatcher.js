const includesIgnoreCase = (a, b) => {
    return a.toLowerCase().includes(b.toLowerCase());
};

export const classifyByPattern = (comment, problems, contestId) => {
    const matchedProblems = [];
    if (!comment.text) return matchedProblems;

    const splits = comment.text.split(/[^A-Za-z0-9]/);
    
    problems.forEach((problem, index) => {
        if(splits.includes(problem.index) || includesIgnoreCase(comment.text, problem.name)
          || comment.text.includes('https://codeforces.com/contest/' + contestId + '/problem/' + problem.index)
          || comment.text.includes('https://codeforces.com/problemset/problem/' + contestId + '/' + problem.index)) {
            matchedProblems.push(index);
        }
    });
    
    return matchedProblems;
};
