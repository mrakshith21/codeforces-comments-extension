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
    const [comments, setComments] = useState([]);
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

    useEffect(() => {
        console.log('In use effect');
        document.addEventListener('keydown', handleKeyDown);


        const commentsDiv = document.getElementsByClassName('comments')[0];
        const allComments = commentsDiv.getElementsByClassName('comment');
        setComments(allComments);

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

        return () => { /*removes event listener on cleanup*/
            console.log("Removing..");
            window.removeEventListener("keydown", handleKeyDown);
        }
    }, []);


    const renderContent = () => {
        if (menuSelected == "All Comments") {
            return <AllComments comments={comments} />
        }
        else if (menuSelected == "Users") {
            return <Users comments={comments} />
        }
        else if (menuSelected == "Links") {
            return <Links comments={comments} />
        }
        else if(menuSelected == "Comments Classifier"){
            return <CommentsClassifier comments={comments}></CommentsClassifier> 
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
                            <option value="Links">Links</option>
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