import React, { Component, useEffect, useState } from 'react';
import './Common.css';
import './CommentsClassifier.scss';
import Spinner from './Spinner';

const CommentsClassifier = () => {

    // Array of [problem name, array of related comments]
    const [problemsToComments, setProblemsToComments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getTutorialId = () => {
            const pathParts = window.location.pathname.split('/');
            return pathParts[pathParts.indexOf('entry') + 1];
        };

        const loadFromStorage = async (tutorialId) => {
            return new Promise((resolve) => {
                chrome.storage.local.get(tutorialId, (result) => {
                    resolve(result[tutorialId]);
                });
            });
        };

        const saveToStorage = async (tutorialId, data) => {
            return new Promise((resolve) => {
                chrome.storage.local.set({ [tutorialId]: data }, resolve);
            });
        };

        const init = async () => {
            console.log("Started");
            const tutorialId = getTutorialId();
            console.log("Tutorial Id = ", tutorialId);

            // Check if data exists in storage
            const storedData = await loadFromStorage(tutorialId);
            if (storedData && storedData.problemClassifications && storedData.problems && storedData.contest) {
                console.log("Loading classifications, contest and problems from storage");
                const commentsDiv = document.getElementsByClassName('comments')[0];
                const problems = storedData.problems;  // Now directly accessing problems array
                
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
                    const comments = commentIds
                        .map(id => commentsDiv.querySelector(`[commentid="${id}"]`))
                        .filter(comment => comment !== null); // Filter out any comments that no longer exist
                    
                    if (index < reconstructedProblemsToComments.length) {
                        reconstructedProblemsToComments[index].comments = comments;
                    }
                });
                
                console.log("Reconstructed problems with comments:", reconstructedProblemsToComments);
                setProblemsToComments(reconstructedProblemsToComments);
                setLoading(false);
                return;
            }

            // If no stored data, proceed with classification
            const content = document.getElementsByClassName('content')[0];
            const contestLink = content.parentElement.getElementsByClassName('notice')[0].href;
            const contestId = contestLink.split('/').pop();
            console.log("Contest Id = ", contestId);
            
            const response = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`);
            if (!response.ok) {
                console.error('Error while fetching contest problems');
                return;
            }
            
            const data = await response.json();
            const problems = data.result.problems;
            
            // Classify comments and store the results
            const classifications = await classifyComments(problems, contestId);
            
            // Convert the classifications to a more meaningful structure with comment IDs
            const problemClassifications = problems.map((problem, index) => ({
                problem,
                commentIds: classifications[index].comments.map(comment => comment.getAttribute('commentid'))
            }));
            
            // Add miscellaneous comments
            problemClassifications.push({
                problem: { name: "Miscellaneous" },
                commentIds: classifications[problems.length].comments.map(comment => comment.getAttribute('commentid'))
            });

            // Save to storage
            await saveToStorage(tutorialId, {
                contestId,
                problemClassifications,
                contest: data.result.contest,    // Store contest info
                problems: data.result.problems,  // Store problems list
                timestamp: Date.now()
            });
            console.log("Saved problem classifications, contest and problems data to storage");
        };

        init();
    }, []);

    function getCommentText(comment) {
        if (comment.getElementsByClassName('ttypography').length == 0) {
            return "";
        }
        try {            
            return comment.getElementsByClassName('ttypography')[0].textContent;
        } catch (error) {
            console.error('Cannot get comment text of ', comment);
            return "";   
        }
    }

    function includesIgnoreCase(a, b){
        return a.toLowerCase().includes(b.toLowerCase());
    }

    async function classifySingleCommentByString(comment, problems, contestId) {
        const commentText = getCommentText(comment);
        const matchedProblems = [];
        const splits = commentText.split(/[^A-Za-z0-9]/);
        
        problems.forEach((problem, index) => {
            if(splits.includes(problem.index) || includesIgnoreCase(commentText, problem.name)
              || commentText.includes('https://codeforces.com/contest/' + contestId + '/problem/' + problem.index)
              || commentText.includes('https://codeforces.com/problemset/problem/' + contestId + '/' + problem.index)) {
                matchedProblems.push(index);
            }
        });
        
        return matchedProblems;
    }

    async function classifySingleCommentByGemini(comment, problems, session) {
        const commentText = getCommentText(comment);
        if (!commentText.trim()) return [];

        try {
            const prompt = generateClassificationPrompt(problems, commentText);
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
    }

    function generateClassificationPrompt(problems, commentText) {
        const problemsDescription = problems.map(p => `${p.index}. ${p.name}`).join(' ');
        return `The codeforces contest has the following problems. Here the problem codes are ${problems.map(p => p.index).join(', ')}: ${problemsDescription} \n\n` +
               `Given the following comment by one of the users, return a comma separated list of which problem codes the user is talking about. Return only the problem codes.\n\n` +
               `Comment: ${commentText}`;
    }

    function initializeProblemsToComments(problems) {
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
    }

    async function classifyComments(problems, contestId) {
        const startTime = performance.now();
        console.log("Starting classification...");
        
        const problemsList = problems.map(problem => "Problem " + problem.index + " - " + problem.name);
        console.log(problemsList);
        
        const commentsDiv = document.getElementsByClassName('comments')[0];
        const comments = commentsDiv.getElementsByClassName('comment');
        const commentThreads = [...comments].filter(comment => {
            return comment.parentElement == commentsDiv
        });

        console.log(`Classifying ${commentThreads.length} comment threads`);
        let tempProblemsToComments = initializeProblemsToComments(problems);
        setProblemsToComments(tempProblemsToComments);

        let classificationStats = {
            string: 0,
            gemini: 0
        };

        const geminiSession = await LanguageModel.create();
        if(geminiSession == null){
            console.error("Gemini Nano session is null. Nano may not be available");
        } else {
            console.log("Gemini Nano session initialized");
        }
        

        // Process each comment
        for (const comment of commentThreads) {
            let matchedProblems = [];
            
            // Try Gemini
            // if ((!matchedProblems || matchedProblems.length === 0) && geminiSession) {
            //     matchedProblems = await classifySingleCommentByGemini(comment, problems, geminiSession);
            //     if (matchedProblems && matchedProblems.length > 0) {
            //         classificationStats.gemini++;
            //     }
            // }
            
            // Fall back to string matching if failed
            if (!matchedProblems || matchedProblems.length === 0) {
                matchedProblems = await classifySingleCommentByString(comment, problems, contestId);
                if (matchedProblems && matchedProblems.length > 0) {
                    classificationStats.string++;
                }
            }

            // Create new array reference for React state update
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
            setProblemsToComments(updatedProblemsToComments);
            console.log("Classified a comment");
        }

        const endTime = performance.now();
        const totalTime = (endTime - startTime) / 1000; // Convert to seconds

        console.log("Classification complete");
        console.log(`Total classification time: ${totalTime.toFixed(2)} seconds`);
        console.log(`Average time per comment: ${(totalTime / commentThreads.length).toFixed(3)} seconds`);
        console.log('Classification stats:', classificationStats);

        setLoading(false);
        return tempProblemsToComments; // Return the classifications
    }

    function highlightTextOnScroll(element) {
        const viewportHeight = window.innerHeight;
        const highlighter = () => {

            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < viewportHeight * 0.3 && elementTop > 0) {
                element.style.backgroundColor = 'yellow';
                setTimeout(() => {
                    element.style.backgroundColor = 'inherit';
                }, 300);
            }
        };
        window.addEventListener('scroll', highlighter, false);
        setTimeout(() => {
            window.removeEventListener('scroll', highlighter, false);
        }, 1000);
    }

    function changeBgOnClick(e, comment) {

        const element = document.getElementById(e);
        if (selected === null) {
        }
        else {
            selected.classList.remove('selected');
        }
        element.classList.add('selected');
        setSelected(element);
        highlightTextOnScroll(comment);
        comment.scrollIntoView({
            behavior: 'smooth'
        });
    }

    const toggleComments = (code) => {
        document.getElementById('comment-preview-list-' + code).classList.toggle('show');
        document.getElementById('heading-' + code).classList.toggle('close');
    }

    return (
        <div className="comments-classifier">
            <div className='body'>
                {!loading ? problemsToComments.map(problemAndComments => {

                    return (
                        <div>                            
                            <div id={`heading-${problemAndComments.code}`} className='heading'>
                                <div className='heading-text'  onClick={() => toggleComments(problemAndComments.code)}>{(problemAndComments.code ? (problemAndComments.code + ". "): "") + problemAndComments.name}</div>
                            </div>
                            <div id={`comment-preview-list-${problemAndComments.code}`} className='comment-preview-list show'>                                
                                {
                                    problemAndComments.comments.map((comment, index) => {
                                        return (
                                            <div className='comment-preview' id={`comment-${problemAndComments.code}-${index}`} onClick={(e) => changeBgOnClick(`comment-${problemAndComments.code}-${index}`, comment)}>
                                                {getCommentText(comment)}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    );
                }) : <Spinner/>}
            </div>
        </div>
    )    
}

export default CommentsClassifier;