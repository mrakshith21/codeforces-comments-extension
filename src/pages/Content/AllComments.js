import React, { useState, useEffect } from "react";
import './AllComments.scss';
import './Common.css';

const AllComments = ({comments}) => {


    const [scores, setScores] = useState([]);
    const [selected, setSelected] = useState(null);


    useEffect(() => {        
        const commentsDiv = document.getElementsByClassName('comments')[0];
        const commentThreads = [...comments].filter(comment => {
            return comment.parentElement == commentsDiv
        });

        // console.log(commentThreads);
        const scoresArr = commentThreads.map(comment => [getscores(comment), comment]);
        scoresArr.sort((a, b) => a[0] - b[0]);
        scoresArr.reverse();

        // scoresArr.forEach(ele => {
        //     console.log(ele[0], ele[1]);
        // })
        setScores(scoresArr);
        console.log("Found " + scoresArr.length + " comment threads, computed usefulness");
        // console.log(scores);
    }, [comments]);


    function getscores(comment) {
        const commentRatings = comment.getElementsByClassName('commentRating')
        let sum = 0;
        for (let commentRating of commentRatings) {
            sum += parseInt(commentRating.children[0].textContent)
        }
        // console.log(sum);
        return sum
    }


    function getPreviewString(comment) {
        if (comment.getElementsByClassName('ttypography').length == 0) {
            return;
        }
        const commentText = comment.getElementsByClassName('ttypography')[0].children[0].textContent;
        return commentText;
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
        <>
            <div className="all-comments">
                <div className='heading '>
                    <div className='heading-threads'>Threads</div>
                    {/* <div className='col-2 '>Score</div> */}
                </div>
                <div className='body'>
                    {scores ? scores.map((comment, index) => {

                        return (
                            <div className='comment-preview' id={"comment-" + index} onClick={(e) => changeBgOnClick("comment-" + index, comment[1])}>
                                {getPreviewString(comment[1])}
                            </div>
                        );
                    }) : <></>}

                </div>
            </div>

        </>
    );
}

export default AllComments;
