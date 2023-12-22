import axios from 'axios';
import { HistoryIssuesResponse, NewIssuesResponse, PullRequestStatisticsResponse, SonarqubeData } from './models/sonarqube'
require('dotenv').config();
import {getInput } from '@actions/core';

const SONAR_TOKEN = getInput("sonarToken") || 'undefined'
const SONAR_URL = getInput("sonarURL") || 'undefined'
const SONAR_KEY = getInput("sonarKey") || 'undefined'
const authorization = 'Basic ' + btoa(SONAR_TOKEN + ':' + '');
const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': authorization
}


export async function sonarqubeInit() {
    const project_analyses_response = await axios.get(SONAR_URL + `/api/project_analyses/search?project=${SONAR_KEY}`, { headers })
    const project_status_response = await axios.get(SONAR_URL + `/api/qualitygates/project_status?projectKey=${SONAR_KEY}`, { headers })
    const history_issues_response  = await axios.get<HistoryIssuesResponse>(SONAR_URL + `/api/measures/search_history?component=${SONAR_KEY}&metrics=bugs%2Cvulnerabilities%2Csqale_index%2Cduplicated_lines_density%2Cncloc%2Ccoverage%2Ccode_smells%2Creliability_rating%2Csecurity_rating%2Csqale_rating&ps=1000`, { headers })
    const new_issues_response = await axios.get<NewIssuesResponse>(SONAR_URL + `/api/issues/search?componentKeys=${SONAR_KEY}&s=FILE_LINE&resolved=false&inNewCodePeriod=true&ps=100&facets=severities%2Ctypes&additionalFields=_all`, { headers })
    const pull_request_statistics = await axios.get<PullRequestStatisticsResponse>(SONAR_URL + `/api/measures/component?additionalFields=period%2Cmetrics&component=${SONAR_KEY}&metricKeys=bugs%2Cnew_bugs%2Creliability_rating%2Cnew_reliability_rating%2Cvulnerabilities%2Cnew_vulnerabilities%2Csecurity_rating%2Cnew_security_rating%2Csecurity_hotspots%2Cnew_security_hotspots%2Csecurity_hotspots_reviewed%2Cnew_security_hotspots_reviewed%2Csecurity_review_rating%2Cnew_security_review_rating%2Ccode_smells%2Cnew_code_smells%2Csqale_rating%2Cnew_maintainability_rating%2Csqale_index%2Cnew_technical_debt%2Cduplicated_blocks%2Cnew_duplicated_blocks%2Clines%2Cnew_lines%2Cduplicated_lines%2Cnew_duplicated_lines%2Cnew_duplicated_lines_density`, { headers })

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
