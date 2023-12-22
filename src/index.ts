require('dotenv').config()
import { addReviewers, addReview, githubInit,addCommentIssues } from './github'
import { sonarqubeInit } from './sonarqube'
import { generateMessage } from './meesage'
import { insertInto,  postgreInit} from './postgres'
import { getInput } from '@actions/core';

const ANALYSIS = getInput("analysis") || false
const COMMENT = getInput("comment") || true

async function main() {
    console.log("start")

    let sonarData = await sonarqubeInit();
    let msg = await generateMessage(sonarData);

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