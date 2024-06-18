import React, { Component, useEffect, useState } from 'react';

import './Common.css';
import './CommentsClassifier.scss';

const CommentsClassifier = ({comments}) => {

    // Array of [problem name, array of related comments]
    const [problemsToComments, setProblemsToComments] = useState([]);

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
            const tempProblemsToComments = [];
            problems.map(problem => tempProblemsToComments.push([problem.index + ". " + problem.name, []]));
            setProblemsToComments(tempProblemsToComments);
            console.log(tempProblemsToComments);
            classifyComments(problems);
        });
    }, []);

    async function classifyComments(problems){
        console.log("Classifying problems");
        // TODO
    }

    return (
        <div className="comments-classifier">
            <div className='body'>
                {problemsToComments ? problemsToComments.map((problem, index) => {

                    return (
                        <div className='heading'>
                            <div className='heading-problem'>{problem[0]}</div>
                        </div>
                    );
                }) : <></>}

            </div>
        </div>
    )    
}

export default CommentsClassifier;