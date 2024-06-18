import React, { useEffect, useState } from "react";
import './Users.scss';
import './Common.css';
import Spinner from "./Spinner";

const Users = ({ comments }) => {

    const [inputValue, setInputValue] = useState("");
    const [searchResult, setSearchResult] = useState([]);
    const [searching, setSearching] = useState(false);
    const [userMap, setUserMap] = useState([]);
    const [usernames, setUsernames] = useState([]);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        let tempMap = {};
        [...comments].forEach(comment => {
            const aTag = comment.getElementsByClassName("rated-user")[0];
            const username = aTag.textContent;
            if (username in tempMap) {
                tempMap[username]['comments'].push(comment);
            }
            else {
                tempMap[username] = { 'rating': '', 'comments': [comment] };
            }
        });
        const usernamesArr = Object.keys(tempMap);
        setUsernames(usernamesArr);
        setUserMap(tempMap);
        console.log("Found " + Object.keys(tempMap).length + " users");
        console.log(tempMap);
    }, [comments]);

    const handleSearchUser = (searchUser) => {
        // setSearching(true);
        console.log("Searching for ", searchUser);
        setSearchResult([...searchResult, [searchUser, userMap[searchUser].comments]]);
        setUsernames(usernames.filter(username => username != searchUser));
        setInputValue("");
    }

    const handleRemoveUser = (removeUser) => {
        setSearchResult(searchResult.filter(result => result[0] != removeUser));
        setUsernames([...usernames, removeUser]);
    }

    const handleClearAllUsers = () => {
        let tempUsernames = usernames;
        searchResult.map(result => tempUsernames.push(result[0]));
        setUsernames(tempUsernames);
        setSearchResult([]);
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

        highlightTextOnScroll(comment);
        const element = document.getElementById(e);
        if (selected === null) {
        }
        else {
            selected.classList.remove('selected');
        }
        element.classList.add('selected');
        setSelected(element);
        comment.scrollIntoView({
            behavior: 'smooth'
        });
    }

    return (
        <div className="users">
            <div className="px-2">
                <input
                    className="users-input"
                    list="users-datalist"
                    value={inputValue}
                    placeholder="Enter username"
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={() => handleSearchUser(inputValue)}
                />
                <datalist id="users-datalist">
                    {
                        usernames.map(username => {
                            return (
                                <option value={username} />
                            );
                        })
                    }
                </datalist>
            </div>
            <div className="px-2 my-1">
                <button className="btn-search-user" onClick={() => handleSearchUser()}>Search</button>
                <button className="btn-clear-all" onClick={() => handleClearAllUsers()}>Clear</button>
            </div>
            <div className="search-result-list">

                {
                    searchResult ? searchResult.map(result => {
                        return (
                            <div>
                                <div className="px-2">
                                    
                                    <h5 className="comment-user">
                                        {result[0]}
                                        <span className="remove-user-icon" title="Remove User" onClick={() => handleRemoveUser(result[0])}>&times;</span>
                                    </h5>
                                </div>
                                <div className="px-2">
                                    {result[1].map((comment, index) => {
                                        return (
                                            <div className='comment-preview' id={"comment-" + result[0] + index} onClick={(e) => changeBgOnClick("comment-" + result[0] + index, comment)}>
                                                {getPreviewString(comment)}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        );
                    }) : <></>
                }
            </div>
        </div>
    );
}

export default Users;
