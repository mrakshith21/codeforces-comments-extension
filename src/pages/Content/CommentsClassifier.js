import React, { Component, useEffect, useState } from 'react';

import './Common.css';
import './CommentsClassifier.scss';
import nlp from 'compromise';
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
        console.log("Classifying " + commentThreads.length + " comment threads");

        for(let comment of commentThreads){
            let doesTalk = new Array(problems.length).fill(false); // does the comment talk about the ith problem

            const commentText = getCommentText(comment);
            const doc = nlp(commentText);
            const nouns = doc.nouns().json();

            /* 
                Find out if problem code acts as a noun or problem name appears in comment text. 
                Splits have to be made by chars such as space, commas, and so on.
                Classified as miscellaneous if no problem is found relevant
            */
            for(let i = 0; i < nouns.length; i++){
                const splits = nouns[i].text.split(/[ ,;:?!.\-']/);
                problems.map((problem, j) => {
                    if(splits.includes(problem.index) || includesIgnoreCase(nouns[i].text, problem.name)){
                        doesTalk[j] = true; 
                        tempProblemsToComments[j][1].push(comment);                    
                    }
                });
            }
            if(!doesTalk.includes(true)){
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