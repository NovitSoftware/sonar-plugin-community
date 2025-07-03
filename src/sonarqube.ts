import axios from 'axios';
import { HistoryIssuesResponse, NewIssuesResponse, PullRequestStatisticsResponse, SonarqubeData } from './models/sonarqube'
require('dotenv').config();
import {getInput } from '@actions/core';

const SONAR_TOKEN = getInput("sonarToken") || 'undefined'
const SONAR_URL = getInput("sonarURL") || 'undefined'
const SONAR_KEY = getInput("sonarKey") || 'undefined'
const GITHUB_EVENT_NAME = getInput("eventName") || 'undefined'
const GITHUB_PR_NUMBER = getInput("pullRequest") || 'undefined'

const authorization = 'Basic ' + btoa(SONAR_TOKEN + ':' + '');
const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': authorization
}

function isPullRequest(): boolean {
    return GITHUB_EVENT_NAME === 'pull_request' && GITHUB_PR_NUMBER !== 'undefined';
}


export async function sonarqubeInit() {
    const isPR = isPullRequest();
    
    console.log(`Analysis type - PR: ${isPR}`);
    console.log(`Event: ${GITHUB_EVENT_NAME}, PR: ${GITHUB_PR_NUMBER}`);

    let project_analyses_url = `${SONAR_URL}/api/project_analyses/search?project=${SONAR_KEY}`;
    let project_status_url = `${SONAR_URL}/api/qualitygates/project_status?projectKey=${SONAR_KEY}`;
    let history_issues_url = `${SONAR_URL}/api/measures/search_history?component=${SONAR_KEY}&metrics=bugs%2Cvulnerabilities%2Csqale_index%2Cduplicated_lines_density%2Cncloc%2Ccoverage%2Ccode_smells%2Creliability_rating%2Csecurity_rating%2Csqale_rating&ps=1000`;
    let new_issues_url = `${SONAR_URL}/api/issues/search?componentKeys=${SONAR_KEY}&s=FILE_LINE&resolved=false&inNewCodePeriod=true&ps=100&facets=severities%2Ctypes&additionalFields=_all`;
    let pull_request_statistics_url = `${SONAR_URL}/api/measures/component?additionalFields=period%2Cmetrics&component=${SONAR_KEY}&metricKeys=bugs%2Cnew_bugs%2Creliability_rating%2Cnew_reliability_rating%2Cvulnerabilities%2Cnew_vulnerabilities%2Csecurity_rating%2Cnew_security_rating%2Csecurity_hotspots%2Cnew_security_hotspots%2Csecurity_hotspots_reviewed%2Cnew_security_hotspots_reviewed%2Csecurity_review_rating%2Cnew_security_review_rating%2Ccode_smells%2Cnew_code_smells%2Csqale_rating%2Cnew_maintainability_rating%2Csqale_index%2Cnew_technical_debt%2Cduplicated_blocks%2Cnew_duplicated_blocks%2Clines%2Cnew_lines%2Cduplicated_lines%2Cnew_duplicated_lines%2Cnew_duplicated_lines_density`;

    if (isPR) {
        project_status_url += `&pullRequest=${GITHUB_PR_NUMBER}`;
        new_issues_url += `&pullRequest=${GITHUB_PR_NUMBER}`;
        pull_request_statistics_url += `&pullRequest=${GITHUB_PR_NUMBER}`;
        console.log(`Using PR-specific analysis for PR #${GITHUB_PR_NUMBER}`);
    }
    else {
        console.log(`Using main branch analysis`);
    }

    const project_analyses_response = await axios.get(project_analyses_url, { headers })
    const project_status_response = await axios.get(project_status_url, { headers })
    const history_issues_response  = await axios.get<HistoryIssuesResponse>(history_issues_url, { headers })
    const new_issues_response = await axios.get<NewIssuesResponse>(new_issues_url, { headers })
    const pull_request_statistics = await axios.get<PullRequestStatisticsResponse>(pull_request_statistics_url, { headers })

    let [quality, qualityAVG] : [string, number] = qualityNumberCreate(pull_request_statistics.data)

    const sonardata : SonarqubeData = {
        uuid_analysis: project_analyses_response.data.analyses[0].key,
        uuid_proyect: SONAR_KEY,
        issue: validateIssue(history_issues_response.data),
        project_status: project_status_response.data,
        quality_avg: qualityAVG,
        quality: quality,
        bug: pull_request_statistics.data.component.measures.find(x => x.metric === "new_bugs")?.period.value || "0",
        vulnerabilities: pull_request_statistics.data.component.measures.find(x => x.metric === "new_vulnerabilities")?.period.value || "0",
        security_hotspots: pull_request_statistics.data.component.measures.find(x => x.metric === "new_security_hotspots")?.period.value || "0",
        reviewed: pull_request_statistics.data.component.measures.find(x => x.metric === "new_security_hotspots_reviewed")?.period.value || "0",
        added_debt: pull_request_statistics.data.component.measures.find(x => x.metric === "new_technical_debt")?.period.value || "0",
        code_smells: pull_request_statistics.data.component.measures.find(x => x.metric === "new_code_smells")?.period.value || "0",
        duplications_lines: pull_request_statistics.data.component.measures.find(x => x.metric === "new_duplicated_lines")?.period.value || "0",
        duplicated_blocks: pull_request_statistics.data.component.measures.find(x => x.metric === "new_duplicated_blocks")?.period.value || "0",
        new_lines: pull_request_statistics.data.component.measures.find(x => x.metric === "new_lines")?.period.value || "0",
        measure: pull_request_statistics.data.component.measures,
        newIssuesResponse: new_issues_response.data,
        issuesResolved: issuesResolved(history_issues_response.data)
    }

    return sonardata
}

function validateIssue(validateIssuesResponse : HistoryIssuesResponse): boolean {

    let codeSmells = validateIssuesResponse.measures.find(x => x.metric === "code_smells")
    let bugs = validateIssuesResponse.measures.find(x => x.metric === "bugs")
    let vulnerabilities = validateIssuesResponse.measures.find(x => x.metric === "vulnerabilities")

    if( Number(codeSmells?.history[codeSmells?.history.length - 1].value) < Number(codeSmells?.history[codeSmells?.history.length - 2].value)) return true

    if( Number(bugs?.history[bugs?.history.length - 1].value) < Number(bugs?.history[bugs?.history.length - 2].value)) return true

    if( Number(vulnerabilities?.history[vulnerabilities?.history.length - 1].value) < Number(vulnerabilities?.history[vulnerabilities?.history.length - 2].value)) return true

    return false
}


function qualityNumberCreate(pullRequestStatisticsResponse : PullRequestStatisticsResponse): [ string , number ]  {

    let newReliabilityRatingValue = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_reliability_rating")?.period?.value || "0.0"
    let newSecurityRatingValue = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_security_rating")?.period?.value || "0.0"
    let newMaintainabilityRatingValue = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_maintainability_rating")?.period?.value || "0.0"
    let newSecurityReviewRatingValue = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_security_review_rating")?.period?.value|| "0.0"

    let newAVGQualityNumber = (Number(newReliabilityRatingValue) + Number(newSecurityRatingValue) + Number(newMaintainabilityRatingValue) + Number(newSecurityReviewRatingValue)) / 4

    let qualityCreate : string = `{ quality [{ name : new_reliability_rating, value: ${newReliabilityRatingValue} }, { name : new_security_rating, value: ${newSecurityRatingValue} }, { name : new_maintainability_rating, value: ${newMaintainabilityRatingValue} }, { name : new_security_review_rating, value: ${newSecurityReviewRatingValue} }] }`;

    return [qualityCreate, newAVGQualityNumber]
}

function issuesResolved(validateIssuesResponse : HistoryIssuesResponse): number {

    let codeSmells = validateIssuesResponse.measures.find(x => x.metric === "code_smells");
    let bugs = validateIssuesResponse.measures.find(x => x.metric === "bugs");
    let vulnerabilities = validateIssuesResponse.measures.find(x => x.metric === "vulnerabilities");

    let cantCodeSmells = Number(codeSmells?.history[codeSmells?.history.length - 2].value) - Number(codeSmells?.history[codeSmells?.history.length - 1].value);
    let cantBugs = Number(bugs?.history[bugs?.history.length - 2].value) - Number(bugs?.history[bugs?.history.length - 1].value);
    let cantVulnerabilities = Number(vulnerabilities?.history[vulnerabilities?.history.length - 2].value) - Number(vulnerabilities?.history[vulnerabilities?.history.length - 1].value);

    return cantCodeSmells + cantBugs + cantVulnerabilities
}

// Interface for SonarQube Pull Request
interface SonarPullRequest {
    key: string;
    title: string;
    branch: string;
    base: string;
    status: {
        qualityGateStatus: string;
    };
    analysisDate: string;
    target: string;
}

interface SonarPullRequestsResponse {
    pullRequests: SonarPullRequest[];
}

export async function getSonarPullRequestId(branchName: string): Promise<string | undefined> {
    try {
        const pull_requests_response = await axios.get<SonarPullRequestsResponse>(
            SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, 
            { headers }
        );
        
        const pullRequests = pull_requests_response.data.pullRequests;
        console.log('Available SonarQube PRs:', pullRequests);
        console.log(`Looking for branch: ${branchName}`);
        
        let matchingPr: SonarPullRequest | undefined;
        
        // 1. Exact branch name match (most accurate)
        matchingPr = pullRequests.find(pr => pr.branch === branchName);
        
        if (!matchingPr) {
            // 2. Case insensitive branch name match
            matchingPr = pullRequests.find(pr => 
                pr.branch?.toLowerCase() === branchName.toLowerCase()
            );
        }
        
        if (!matchingPr) {
            // 3. Partial branch name match (in case of prefixes/suffixes)
            matchingPr = pullRequests.find(pr => 
                pr.branch?.includes(branchName) || branchName.includes(pr.branch)
            );
        }
        
        if (!matchingPr) {
            // 4. Look for branch name in title
            matchingPr = pullRequests.find(pr => 
                pr.title?.includes(branchName)
            );
        }
        
        if (!matchingPr && pullRequests.length > 0) {
            // 5. If no match found, try to get the most recent PR (fallback)
            matchingPr = pullRequests.sort((a, b) => 
                new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime()
            )[0];
            console.log(`No exact match found for branch ${branchName}, using most recent SonarQube PR: ${matchingPr.key} (Branch: ${matchingPr.branch})`);
        }
        
        if (matchingPr) {
            console.log(`Found matching SonarQube PR - Key: ${matchingPr.key}, Title: ${matchingPr.title}, Branch: ${matchingPr.branch}`);
            return matchingPr.key;
        }
        
        console.log(`No SonarQube PR found for branch: ${branchName}`);
        return undefined;
        
    } catch (error) {
        console.log('Could not fetch SonarQube PR list:', error);
        return undefined;
    }
}

// Function to get all SonarQube Pull Requests
export async function getAllSonarPullRequests(): Promise<SonarPullRequest[]> {
    try {
        const pull_requests_response = await axios.get<SonarPullRequestsResponse>(
            SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, 
            { headers }
        );
        
        return pull_requests_response.data.pullRequests;
    } catch (error) {
        console.log('Could not fetch SonarQube PR list:', error);
        return [];
    }
}

// Function to get SonarQube PR ID by branch name (more accurate)
export async function getSonarPullRequestIdByBranch(branchName: string): Promise<string | undefined> {
    try {
        const pull_requests_response = await axios.get<SonarPullRequestsResponse>(
            SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, 
            { headers }
        );
        
        const pullRequests = pull_requests_response.data.pullRequests;
        console.log('Available SonarQube PRs:', pullRequests);
        
        // Look for exact branch name match
        const matchingPr = pullRequests.find(pr => pr.branch === branchName);
        
        if (matchingPr) {
            console.log(`Found matching SonarQube PR by branch - Key: ${matchingPr.key}, Title: ${matchingPr.title}, Branch: ${matchingPr.branch}`);
            return matchingPr.key;
        }
        
        console.log(`No SonarQube PR found for branch: ${branchName}`);
        return undefined;
        
    } catch (error) {
        console.log('Could not fetch SonarQube PR list:', error);
        return undefined;
    }
}
