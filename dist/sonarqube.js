"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSonarPullRequestIdByBranch = exports.getAllSonarPullRequests = exports.getSonarPullRequestId = exports.sonarqubeInit = void 0;
const axios_1 = __importDefault(require("axios"));
require('dotenv').config();
const core_1 = require("@actions/core");
const SONAR_TOKEN = (0, core_1.getInput)("sonarToken") || 'undefined';
const SONAR_URL = (0, core_1.getInput)("sonarURL") || 'undefined';
const SONAR_KEY = (0, core_1.getInput)("sonarKey") || 'undefined';
const GITHUB_EVENT_NAME = (0, core_1.getInput)("eventName") || 'undefined';
const GITHUB_PR_NUMBER = (0, core_1.getInput)("pullRequest") || 'undefined';
const authorization = 'Basic ' + btoa(SONAR_TOKEN + ':' + '');
const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': authorization
};
function isPullRequest() {
    return GITHUB_EVENT_NAME === 'pull_request' && GITHUB_PR_NUMBER !== 'undefined';
}
function sonarqubeInit() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    return __awaiter(this, void 0, void 0, function* () {
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
        const project_analyses_response = yield axios_1.default.get(project_analyses_url, { headers });
        const project_status_response = yield axios_1.default.get(project_status_url, { headers });
        const history_issues_response = yield axios_1.default.get(history_issues_url, { headers });
        const new_issues_response = yield axios_1.default.get(new_issues_url, { headers });
        const pull_request_statistics = yield axios_1.default.get(pull_request_statistics_url, { headers });
        let [quality, qualityAVG] = qualityNumberCreate(pull_request_statistics.data);
        const sonardata = {
            uuid_analysis: project_analyses_response.data.analyses[0].key,
            uuid_proyect: SONAR_KEY,
            issue: validateIssue(history_issues_response.data),
            project_status: project_status_response.data,
            quality_avg: qualityAVG,
            quality: quality,
            bug: ((_a = pull_request_statistics.data.component.measures.find(x => x.metric === "new_bugs")) === null || _a === void 0 ? void 0 : _a.period.value) || "0",
            vulnerabilities: ((_b = pull_request_statistics.data.component.measures.find(x => x.metric === "new_vulnerabilities")) === null || _b === void 0 ? void 0 : _b.period.value) || "0",
            security_hotspots: ((_c = pull_request_statistics.data.component.measures.find(x => x.metric === "new_security_hotspots")) === null || _c === void 0 ? void 0 : _c.period.value) || "0",
            reviewed: ((_d = pull_request_statistics.data.component.measures.find(x => x.metric === "new_security_hotspots_reviewed")) === null || _d === void 0 ? void 0 : _d.period.value) || "0",
            added_debt: ((_e = pull_request_statistics.data.component.measures.find(x => x.metric === "new_technical_debt")) === null || _e === void 0 ? void 0 : _e.period.value) || "0",
            code_smells: ((_f = pull_request_statistics.data.component.measures.find(x => x.metric === "new_code_smells")) === null || _f === void 0 ? void 0 : _f.period.value) || "0",
            duplications_lines: ((_g = pull_request_statistics.data.component.measures.find(x => x.metric === "new_duplicated_lines")) === null || _g === void 0 ? void 0 : _g.period.value) || "0",
            duplicated_blocks: ((_h = pull_request_statistics.data.component.measures.find(x => x.metric === "new_duplicated_blocks")) === null || _h === void 0 ? void 0 : _h.period.value) || "0",
            new_lines: ((_j = pull_request_statistics.data.component.measures.find(x => x.metric === "new_lines")) === null || _j === void 0 ? void 0 : _j.period.value) || "0",
            measure: pull_request_statistics.data.component.measures,
            newIssuesResponse: new_issues_response.data,
            issuesResolved: issuesResolved(history_issues_response.data)
        };
        return sonardata;
    });
}
exports.sonarqubeInit = sonarqubeInit;
function validateIssue(validateIssuesResponse) {
    let codeSmells = validateIssuesResponse.measures.find(x => x.metric === "code_smells");
    let bugs = validateIssuesResponse.measures.find(x => x.metric === "bugs");
    let vulnerabilities = validateIssuesResponse.measures.find(x => x.metric === "vulnerabilities");
    if (Number(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history[(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history.length) - 1].value) < Number(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history[(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history.length) - 2].value))
        return true;
    if (Number(bugs === null || bugs === void 0 ? void 0 : bugs.history[(bugs === null || bugs === void 0 ? void 0 : bugs.history.length) - 1].value) < Number(bugs === null || bugs === void 0 ? void 0 : bugs.history[(bugs === null || bugs === void 0 ? void 0 : bugs.history.length) - 2].value))
        return true;
    if (Number(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history[(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history.length) - 1].value) < Number(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history[(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history.length) - 2].value))
        return true;
    return false;
}
function qualityNumberCreate(pullRequestStatisticsResponse) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    let newReliabilityRatingValue = ((_b = (_a = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_reliability_rating")) === null || _a === void 0 ? void 0 : _a.period) === null || _b === void 0 ? void 0 : _b.value) || "0.0";
    let newSecurityRatingValue = ((_d = (_c = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_security_rating")) === null || _c === void 0 ? void 0 : _c.period) === null || _d === void 0 ? void 0 : _d.value) || "0.0";
    let newMaintainabilityRatingValue = ((_f = (_e = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_maintainability_rating")) === null || _e === void 0 ? void 0 : _e.period) === null || _f === void 0 ? void 0 : _f.value) || "0.0";
    let newSecurityReviewRatingValue = ((_h = (_g = pullRequestStatisticsResponse.component.measures.find(x => x.metric == "new_security_review_rating")) === null || _g === void 0 ? void 0 : _g.period) === null || _h === void 0 ? void 0 : _h.value) || "0.0";
    let newAVGQualityNumber = (Number(newReliabilityRatingValue) + Number(newSecurityRatingValue) + Number(newMaintainabilityRatingValue) + Number(newSecurityReviewRatingValue)) / 4;
    let qualityCreate = `{ quality [{ name : new_reliability_rating, value: ${newReliabilityRatingValue} }, { name : new_security_rating, value: ${newSecurityRatingValue} }, { name : new_maintainability_rating, value: ${newMaintainabilityRatingValue} }, { name : new_security_review_rating, value: ${newSecurityReviewRatingValue} }] }`;
    return [qualityCreate, newAVGQualityNumber];
}
function issuesResolved(validateIssuesResponse) {
    let codeSmells = validateIssuesResponse.measures.find(x => x.metric === "code_smells");
    let bugs = validateIssuesResponse.measures.find(x => x.metric === "bugs");
    let vulnerabilities = validateIssuesResponse.measures.find(x => x.metric === "vulnerabilities");
    let cantCodeSmells = Number(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history[(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history.length) - 2].value) - Number(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history[(codeSmells === null || codeSmells === void 0 ? void 0 : codeSmells.history.length) - 1].value);
    let cantBugs = Number(bugs === null || bugs === void 0 ? void 0 : bugs.history[(bugs === null || bugs === void 0 ? void 0 : bugs.history.length) - 2].value) - Number(bugs === null || bugs === void 0 ? void 0 : bugs.history[(bugs === null || bugs === void 0 ? void 0 : bugs.history.length) - 1].value);
    let cantVulnerabilities = Number(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history[(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history.length) - 2].value) - Number(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history[(vulnerabilities === null || vulnerabilities === void 0 ? void 0 : vulnerabilities.history.length) - 1].value);
    return cantCodeSmells + cantBugs + cantVulnerabilities;
}
function getSonarPullRequestId(branchName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pull_requests_response = yield axios_1.default.get(SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, { headers });
            const pullRequests = pull_requests_response.data.pullRequests;
            console.log('Available SonarQube PRs:', pullRequests);
            console.log(`Looking for branch: ${branchName}`);
            let matchingPr;
            matchingPr = pullRequests.find(pr => pr.branch === branchName);
            if (!matchingPr) {
                matchingPr = pullRequests.find(pr => { var _a; return ((_a = pr.branch) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === branchName.toLowerCase(); });
            }
            if (!matchingPr) {
                matchingPr = pullRequests.find(pr => { var _a; return ((_a = pr.branch) === null || _a === void 0 ? void 0 : _a.includes(branchName)) || branchName.includes(pr.branch); });
            }
            if (!matchingPr) {
                matchingPr = pullRequests.find(pr => { var _a; return (_a = pr.title) === null || _a === void 0 ? void 0 : _a.includes(branchName); });
            }
            if (!matchingPr && pullRequests.length > 0) {
                matchingPr = pullRequests.sort((a, b) => new Date(b.analysisDate).getTime() - new Date(a.analysisDate).getTime())[0];
                console.log(`No exact match found for branch ${branchName}, using most recent SonarQube PR: ${matchingPr.key} (Branch: ${matchingPr.branch})`);
            }
            if (matchingPr) {
                console.log(`Found matching SonarQube PR - Key: ${matchingPr.key}, Title: ${matchingPr.title}, Branch: ${matchingPr.branch}`);
                return matchingPr.key;
            }
            console.log(`No SonarQube PR found for branch: ${branchName}`);
            return undefined;
        }
        catch (error) {
            console.log('Could not fetch SonarQube PR list:', error);
            return undefined;
        }
    });
}
exports.getSonarPullRequestId = getSonarPullRequestId;
function getAllSonarPullRequests() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pull_requests_response = yield axios_1.default.get(SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, { headers });
            return pull_requests_response.data.pullRequests;
        }
        catch (error) {
            console.log('Could not fetch SonarQube PR list:', error);
            return [];
        }
    });
}
exports.getAllSonarPullRequests = getAllSonarPullRequests;
function getSonarPullRequestIdByBranch(branchName) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pull_requests_response = yield axios_1.default.get(SONAR_URL + `/api/project_pull_requests/list?project=${SONAR_KEY}`, { headers });
            const pullRequests = pull_requests_response.data.pullRequests;
            console.log('Available SonarQube PRs:', pullRequests);
            const matchingPr = pullRequests.find(pr => pr.branch === branchName);
            if (matchingPr) {
                console.log(`Found matching SonarQube PR by branch - Key: ${matchingPr.key}, Title: ${matchingPr.title}, Branch: ${matchingPr.branch}`);
                return matchingPr.key;
            }
            console.log(`No SonarQube PR found for branch: ${branchName}`);
            return undefined;
        }
        catch (error) {
            console.log('Could not fetch SonarQube PR list:', error);
            return undefined;
        }
    });
}
exports.getSonarPullRequestIdByBranch = getSonarPullRequestIdByBranch;
