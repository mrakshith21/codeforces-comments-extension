import React, { useEffect, useState } from 'react';
import AllComments from './AllComments';
import Users from './Users';
import Links from './Links';
import './App.scss';
import './Common.css';
import CommentsClassifier from './CommentsClassifier';

function App() {

    const [width, setWidth] = useState(300);
    const [menuSelected, setMenuSelected] = useState("Comments Classifier");
    const [commentElements, setCommentElements] = useState([]);
    const [problemsWithComments, setProblemsWithComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(true);
    const BORDER_SIZE = 4;

    const handleKeyDown = (event) => {
        if (event.ctrlKey && event.key === 'b') {
            console.log("Toggling..");
            event.preventDefault();  // Prevent the default action if any
            
            // const appDiv = document.getElementById("codeforces-comment-preview");
            // appDiv.classList.toggle('hidden');

            const tmpVisible = isVisible;
            setIsVisible(!tmpVisible);
        }
    };

    
    const getCommentText = (comment) => {
        if (comment.getElementsByClassName('ttypography').length == 0) {
            return "";
        }
        try {            
            return comment.getElementsByClassName('ttypography')[0].textContent;
        } catch (error) {
            console.error('Cannot get comment text of ', comment);
            return "";   
        }
    };

    useEffect(async () => {

        const initCommentsClassifier = async () => {
            try {
                console.log("Started");
                const pathParts = window.location.pathname.split('/');
                const tutorialId = pathParts[pathParts.indexOf('entry') + 1];
                console.log("Tutorial Id = ", tutorialId);

                const content = document.getElementsByClassName('content')[0];
                const contestLink = content.parentElement.getElementsByClassName('notice')[0].href;
                const contestId = contestLink.split('/').pop();
                console.log("Contest Id = ", contestId);

                const commentsDiv = document.getElementsByClassName('comments')[0];
                const commentsData = Array.from(commentsDiv.getElementsByClassName('comment'))
                    .filter(comment => comment.parentElement === commentsDiv)
                    .map(comment => ({
                        id: comment.getAttribute('commentid'),
                        text: getCommentText(comment),
                        element: comment // Keep the DOM element for local use
                    }));
                
                console.log("Comments Data: ", commentsData);
                setCommentElements(commentsData);

                const response = await chrome.runtime.sendMessage({
                    type: 'CLASSIFY_COMMENTS',
                    payload: {
                        tutorialId,
                        contestId,
                        comments: commentsData.map(({ id, text }) => ({ id, text })) // Only send serializable data
                    }
                });

                if (response.success) {
                    let responseData = response.data;
                    let updatedProblemsWithComments = responseData.map((problemWithComments) => {
                        let updatedProblemWithComments = problemWithComments;
                        const updatedComments = updatedProblemWithComments.comments.map(comment => {
                            let updatedComment = comment;
                            let matchingCommentData = commentsData.find(commentElement => commentElement.id === comment.id)
                            updatedComment.commentElement = matchingCommentData ? matchingCommentData.element : null;
                            return updatedComment;
                        })
                        updatedProblemWithComments.comments = updatedComments;
                        return updatedProblemWithComments;
                    });
                    console.log("Received classified comments: ", updatedProblemsWithComments);
                    setProblemsWithComments(updatedProblemsWithComments);
                } else {
                    console.error('Error from background script:', response.error);
                }
            } catch (error) {
                console.error('Error in initialization:', error);
            } finally {
                console.log("Loading finished");
                setLoading(false);
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);


        const commentsDiv = document.getElementsByClassName('comments')[0];
        const allComments = commentsDiv.getElementsByClassName('comment');
        setCommentElements(allComments);

        const appDiv = document.getElementById("codeforces-comment-preview");
        setWidth(appDiv.style.width);
        function resize(e) {

            const dx = appDiv.getBoundingClientRect().left - e.x;
            const newWidth = parseInt(appDiv.style.width) + dx;
            setWidth(newWidth);
        }

        appDiv.addEventListener("mousedown", function (e) {
            if (e.offsetX < BORDER_SIZE) {
                document.addEventListener("mousemove", resize, false);
            }
        }, false);

        document.addEventListener("mouseup", function () {
            document.removeEventListener("mousemove", resize, false);
        }, false);

        await initCommentsClassifier();

        return () => { /*removes event listener on cleanup*/
            console.log("Removing..");
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, []);


    const renderContent = () => {
        if (menuSelected == "All Comments") {
            return <AllComments comments={commentElements} />
        }
        else if (menuSelected == "Users") {
            return <Users comments={commentElements} />
        }
        else if(menuSelected == "Comments Classifier"){
            return <CommentsClassifier problemsWithComments={problemsWithComments}  loading={false}></CommentsClassifier> 
        }
    }

    return (
        <>
            <div id='codeforces-comment-preview' className={`codeforces-comment-preview ${isVisible ? '' : 'hidden'}`} style={{ width: width + "px" }}>

                <div className='container'>
                    <div className='menu'>
                        <select className='menu-input' onChange={(e) => setMenuSelected(e.target.value)}>
                            <option selected value="Comments Classifier">Comments Classifier</option>
                            <option value="All Comments">All Comments</option>
                            <option value="Users">Users</option>
                        </select>
                    </div>
                    <div className=''>
                        {renderContent()}
                    </div>
                </div>

            </div>

        </>
    )
}

export default App;