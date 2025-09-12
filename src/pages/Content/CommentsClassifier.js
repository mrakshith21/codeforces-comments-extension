import React, { useEffect, useState } from 'react';
import './Common.css';
import './CommentsClassifier.scss';
import Spinner from './Spinner';

const CommentsClassifier = ({ problemsWithComments, loading }) => {

    const [selected, setSelected] = useState(null);


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
                {!loading ? problemsWithComments.map(problemWithComments => {

                    return (
                        <div>
                            <div id={`heading-${problemWithComments.code}`} className='heading'>
                                <div className='heading-text' onClick={() => toggleComments(problemWithComments.code)}>{(problemWithComments.code ? (problemWithComments.code + ". ") : "") + problemWithComments.name}</div>
                            </div>
                            <div id={`comment-preview-list-${problemWithComments.code}`} className='comment-preview-list show'>
                                {
                                    problemWithComments.comments.map((comment, index) => {
                                        // Find the original DOM element
                                        const commentElement = comment.commentElement;
                                        if (!commentElement) return null;

                                        return (
                                            <div className='comment-preview'
                                                id={`comment-${problemWithComments.code}-${index}`}
                                                onClick={(e) => changeBgOnClick(`comment-${problemWithComments.code}-${index}`, commentElement)}>
                                                {comment.text}
                                            </div>
                                        );
                                    })
                                }
                            </div>
                        </div>
                    );
                }) : <Spinner />}
            </div>
        </div>
    )
}

export default CommentsClassifier;