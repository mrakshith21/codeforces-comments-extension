import React, { Component, useEffect, useState } from 'react';

import './Common.css';
import './CommentsClassifier.scss';
import Spinner from './Spinner';

const CommentsClassifier = () => {

    // Array of [problem name, array of related comments]
    const [problemsToComments, setProblemsToComments] = useState([]);
    
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        const content = document.getElementsByClassName('content')[0];
        const contestLink = content.parentElement.getElementsByClassName('notice')[0].href;
        const contestId = contestLink.split('/').pop();
        console.log("Contest Id = ", contestId);
        fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`)
        .then(response => {
            if(!response.ok){
                console.error('Error while fetching contest problems');
            }
            return response.json();
        })
        .then(data => {
            const problems = data.result.problems;
            classifyComments(problems);
        });
    }, []);

    function getCommentText(comment) {
        if (comment.getElementsByClassName('ttypography').length == 0) {
            return "";
        }
        const commentText = comment.getElementsByClassName('ttypography')[0].children[0].textContent;
        return commentText;
    }

    function includesIgnoreCase(a, b){
        return a.toLowerCase().includes(b.toLowerCase());
    }
    // returns a score denoting the relevance of the comment thread to a problem
    function getScore(comment, problem) {
        const problemCode = problem.index;
        const prefixWords = ["for", "problem", "prob", "question", "of", "in", "with", "solve", ];
        const phrases = [];

        // preopositions
        prefixWords.map(prefix => phrases.push(prefix + " " + problemCode));

        // problem name
        phrases.push(problem.name);

        // tags
        // problem.tags.map(tag => phrases.push(tag));

        const MAX_CHARS = 30;
        const commentText = getCommentText(comment);
        const words = commentText.split(/[ ,;:!?]/);
        for(let i=0; i < words.length - 1; i += 1){
            if(prefixWords.includes(words[i].toLowerCase()) && words[i + 1].includes(problemCode)){
                return 1;
            }
        }
        if(includesIgnoreCase(commentText, problem.name))
            return 1;
    }

    async function classifyComments(problems){
        console.log("Classifying problems");
        const problemsList = problems.map(problem => "Problem " + problem.index + " - " + problem.name);
        console.log(problemsList);
        const commentsDiv = document.getElementsByClassName('comments')[0];
        const comments = commentsDiv.getElementsByClassName('comment');
        const commentThreads = [...comments].filter(comment => {
            return comment.parentElement == commentsDiv
        });
        
        const tempProblemsToComments = [];        
        problems.map(problem => tempProblemsToComments.push([problem.index + ". " + problem.name, []]));
        tempProblemsToComments.push(["Miscellaneous", []]);
        setProblemsToComments(tempProblemsToComments);
        
        console.log(tempProblemsToComments);
        let count = 0;
        console.log("Classifying " + commentThreads.length + " comment threads");

        const THRESHOLD_SCORE = 0.5;
        for(let comment of commentThreads){
            let index = 0;
            let misc = true;
            for(let problem of problems){
                const score = getScore(comment, problem);
                if(score > 0){
                    tempProblemsToComments[index][1].push(comment);
                    misc = false;
                }
                index++;
            }
            if(misc){
                tempProblemsToComments[problems.length][1].push(comment);
            }

        }
        console.log(tempProblemsToComments);
        setProblemsToComments(tempProblemsToComments);
        console.log('Completed classification'); 
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

    return (
        <div className="comments-classifier">
            <div className='body'>
                {problemsToComments ? problemsToComments.map((problemAndComments, index) => {

                    return (
                        <div>                            
                            <div className='heading'>
                                <div className='heading-problem'>{problemAndComments[0]}</div>
                            </div>
                            <div>                                
                                {
                                    problemAndComments[1].map((comment, index) => {

                                        return (
                                            <div className='comment-preview' id={"comment-" + index} onClick={(e) => changeBgOnClick("comment-" + index, comment)}>
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