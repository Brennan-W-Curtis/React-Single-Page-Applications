import React, { useState, useEffect } from 'react';
import mockUser from './mockData/mockUser';
import mockRepos from './mockData/mockRepos';
import mockFollowers from './mockData/mockFollowers';
import axios from 'axios';

const rootUrl = 'https://api.github.com';

const GithubContext = React.createContext();

//Provider & Consumer - Github Context.Provider

const GithubProvider = ({ children }) => {
    const [ githubUser, setGithubUser ] = useState(mockUser);
    const [ githubRepos, setGithubRepos ] = useState(mockRepos);
    const [ githubFollowers, setGithubFollowers ] = useState(mockFollowers);
    //Request Upon Loading
    const [ requests, setRequests ] = useState(0);
    const [ isLoading, setIsLoading ] = useState(false);
    //Error
    const [ error, setError ] = useState({ show: false, msg: "" });
    const searchGithubUser = async user => {
        toggleError();
        setIsLoading(true)
        const response = await axios(`${rootUrl}/users/${user}`).catch(error => console.log(error));
        if (response) {
            setGithubUser(response.data);
            const { login, followers_url } = response.data;
            await Promise.allSettled([
                axios(`${rootUrl}/users/${login}/repos?per_page=100`), 
                axios(`${followers_url}?per_page=100`) 
            ]).then(results => {
                const [ repos, followers ] = results;
                const status = "fulfilled";
                if (repos.status === status) {
                    setGithubRepos(repos.value.data);
                }
                if (followers.status === status) {
                    setGithubFollowers(followers.value.data);
                }
            }).catch(error => console.log(error));
        } else {
            toggleError(true, "Sorry, there is no user with that username.");
        }
        checkRequests();
        setIsLoading(false);
    }
    //Check Rate
    const checkRequests = () => {
        axios(`${rootUrl}/rate_limit`)
            .then(({ data }) => {
                let { rate: { remaining } } = data;
                setRequests(remaining);
                if (remaining === 0) {
                    //Throw an Error
                    toggleError(true, "Sorry, you have exceeded your allotted hourly rate limit.")
                }
            })
            .catch(error => console.log(error));
    };
    const toggleError = (show = false, msg = "") => {
        setError({ show, msg })
    }
    //Error
    useEffect(checkRequests, [])
    return (
        <GithubContext.Provider value={{ githubUser, githubRepos, githubFollowers, requests, error, searchGithubUser, isLoading }}>
            { children }
        </GithubContext.Provider>
    );
};

export { GithubProvider, GithubContext };