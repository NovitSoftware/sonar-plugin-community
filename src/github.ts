require('dotenv').config()
import axios from 'axios';
import { PullRequestDataCommits, UserAlias } from './models/github'
import { NewIssuesResponse } from './models/sonarqube'
import { getInput } from '@actions/core';

const GITHUB_REPOSITORY = getInput("repository") || 'valor_predeterminado'
const usersAlias: UserAlias[] = JSON.parse(getInput("usersTeam")  || 'qwe')
const GITHUB_PULL_REQUEST = getInput("pullRequest") || 'valor_predeterminado'
const GITHUB_BRANCH: string = getInput("branch") || 'valor_predeterminado'
const GITHUB_TOKEN = getInput("token") 
const PATH_INFO = getInput("path") 
const GTIHUB_USER_REVIEW: string = getInput("user") || 'valor_predeterminado'
const BASE_URL = "https://api.github.com"
const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
  };




export async function githubInit(): Promise<PullRequestDataCommits>{
    const pull_request_commits_response = await axios.get<PullRequestDataCommits[]>(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/commits`, { headers })

    const pull_request_reponse  = await axios.get(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}`, { headers })

    const githubData : PullRequestDataCommits = { title : pull_request_reponse.data.title, author : pull_request_reponse.data.user.login, amount : pull_request_commits_response.data.length,
    branch: GITHUB_BRANCH, repository: GITHUB_REPOSITORY, numberPR: GITHUB_PULL_REQUEST, team: usersAlias.find(x => x.github == pull_request_reponse.data.user.login)?.team || 'valor_predeterminado'}

    return githubData
}


export async function addReviewers(){
    const requestBody = {
        reviewers: [GTIHUB_USER_REVIEW],
    };

    const review = axios.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/requested_reviewers`, requestBody, { headers })
    .then((response) => {
      console.log(`Usuario ${GTIHUB_USER_REVIEW} agregado como revisor al PR.`);
    })
    .catch((error) => {
      console.error('Error al agregar como revisor:', error.response?.data || error.message);
    });
}

export async function addReview(value : string, message : string){
    const reviewBody = {
        event: `${value == "OK" ? "COMMENT" : "REQUEST_CHANGES"}`,
        body: message,
    };

    const review = axios.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/reviews`, reviewBody, { headers })
    .then((response) => {
        console.log('Pull request aprobado con éxito y mensaje enviado.');
    })
      .catch((error) => {
        console.error('Error al aprobar el pull request:', error.response?.data || error.message);
    });
}

export async function addCommentIssues(newIssues: NewIssuesResponse){

    newIssues.issues.forEach(element => {
        const message = ``;
        const comments = [{path: `${PATH_INFO}` + element.component.replace(`${element.project}:`,""), line: element.line, body: `${serchSeverity(element.severity)} 
        > ${element.message}
        `}]
        const commentBody = {
            body: '',
            event: "COMMENT",
            comments: comments
        };
    
        const review = axios.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/reviews`, commentBody, { headers })
        .then((response) => {
            console.log('Comentario agregado con éxito al pull request.');
        })
        .catch((error) => {
            const messageError = addReview("OK", createMessageError(element))
            console.error('Error al agregar el comentario al pull request:', error.response?.data || error.message);
        });
    })
}


function serchSeverity (value : string) : string {

    if(value == "INFO") return "> [!TIP]"
    if(value == "MINOR") return "> [!TIP]"
    if(value == "MAJOR") return "> [!IMPORTANT]"
    if(value == "CRITICAL") return "> [!WARNING]"
    if(value == "BLOCKER") return "> [!CAUTION]"
    return "> [!TIP]"
}



function createMessageError (element : any): string{
    return `${element.severity}
    > Issue detectado no perteneciente al código agregado. Esto podría deberse a la desactualización del pull request con la rama principal. Posibles soluciones(git merge ${GITHUB_BRANCH} o arreglar el siguiente issue en el path ${element.component} line ${element.line} message ${element.message})
    `
}