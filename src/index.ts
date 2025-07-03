require('dotenv').config()
import { addReviewers, addReview, githubInit,addCommentIssues } from './github'
import { sonarqubeInit, getSonarPullRequestId } from './sonarqube'
import { generateMessage } from './meesage'
import { insertInto,  postgreInit} from './postgres'
import { getInput } from '@actions/core';

const ANALYSIS = getInput("analysis") || false
const COMMENT = getInput("comment") || true

async function main() {
    console.log("start")

    const GITHUB_EVENT_NAME = getInput("eventName") || 'undefined'
    const GITHUB_PR_NUMBER = getInput("pullRequest") || 'undefined'
    const GITHUB_HEAD_REF = getInput("headRef") || 'undefined' // Branch name of the PR
    const isPR = GITHUB_EVENT_NAME === 'pull_request' && GITHUB_PR_NUMBER !== 'undefined';

    let sonarData = await sonarqubeInit();
    
    let sonarPrId: string | undefined;
    if (isPR && GITHUB_HEAD_REF !== 'undefined') {
        sonarPrId = await getSonarPullRequestId(GITHUB_HEAD_REF);
        
        console.log(`GitHub PR #${GITHUB_PR_NUMBER} (branch: ${GITHUB_HEAD_REF}) -> SonarQube PR: ${sonarPrId}`);
    }
    
    let msg = await generateMessage(sonarData, sonarPrId);

    console.log("sonarData")

    if(ANALYSIS == "true"){
        let githubData = await githubInit();
        let postgreData = await postgreInit();
        let postgreInsert = await insertInto(githubData, sonarData);
        console.log("githubData and postgreData")
    }

    if(COMMENT == "true"){
        let ghaddReviewers = await addReviewers();
        let ghaddReview = await addReview(sonarData.project_status.projectStatus.status, msg);
        let ghaddCommentIssues = await addCommentIssues(sonarData.newIssuesResponse);
        console.log("Review")
    }
    console.log("END")
    
}

main();