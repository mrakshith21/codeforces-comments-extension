import React, { Component, useEffect, useState } from 'react';

import './Common.css';
import './CommentsClassifier.scss';
import nlp from 'compromise';
import Spinner from './Spinner';

const CommentsClassifier = () => {

    // Array of [problem name, array of related comments]
    const [problemsToComments, setProblemsToComments] = useState([]);
    
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log("Started");
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
        // setProblemsToComments(tempProblemsToComments);
        
        console.log(tempProblemsToComments);
        console.log("Classifying " + commentThreads.length + " comment threads");

        for(let comment of commentThreads){
            // find which problems the comment talks about
            const commentText = getCommentText(comment);

            let miscellaneous = true;
            const splits = commentText.split(/[ ,;:?!.\-']/);
            problems.map((problem, j) => {
                if(splits.includes(problem.index) || includesIgnoreCase(commentText, problem.name)){
                    tempProblemsToComments[j].comments.push(comment);   
                    miscellaneous = false;        
                }
            });

            if(miscellaneous){
                tempProblemsToComments[problems.length].comments.push(comment);
            }
        }

        console.log(tempProblemsToComments);
        console.log("Loading complete");
        setLoading(false);
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

    const toggleComments = (code) => {
        console.log("Toggling " + code + " comments");
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