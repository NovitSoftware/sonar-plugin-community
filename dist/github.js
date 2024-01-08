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
exports.addCommentIssues = exports.addReview = exports.addReviewers = exports.githubInit = void 0;
require('dotenv').config();
const axios_1 = __importDefault(require("axios"));
const core_1 = require("@actions/core");
const GITHUB_REPOSITORY = (0, core_1.getInput)("repository") || 'valor_predeterminado';
const usersAlias = JSON.parse((0, core_1.getInput)("usersTeam") || 'qwe');
const GITHUB_PULL_REQUEST = (0, core_1.getInput)("pullRequest") || 'valor_predeterminado';
const GITHUB_BRANCH = (0, core_1.getInput)("branch") || 'valor_predeterminado';
const GITHUB_TOKEN = (0, core_1.getInput)("token");
const GTIHUB_USER_REVIEW = (0, core_1.getInput)("user") || 'valor_predeterminado';
const BASE_URL = "https://api.github.com";
const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json',
};
function githubInit() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const pull_request_commits_response = yield axios_1.default.get(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/commits`, { headers });
        const pull_request_reponse = yield axios_1.default.get(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}`, { headers });
        const githubData = { title: pull_request_reponse.data.title, author: pull_request_reponse.data.user.login, amount: pull_request_commits_response.data.length,
            branch: GITHUB_BRANCH, repository: GITHUB_REPOSITORY, numberPR: GITHUB_PULL_REQUEST, team: ((_a = usersAlias.find(x => x.github == pull_request_reponse.data.user.login)) === null || _a === void 0 ? void 0 : _a.team) || 'valor_predeterminado' };
        return githubData;
    });
}
exports.githubInit = githubInit;
function addReviewers() {
    return __awaiter(this, void 0, void 0, function* () {
        const requestBody = {
            reviewers: [GTIHUB_USER_REVIEW],
        };
        const review = axios_1.default.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/requested_reviewers`, requestBody, { headers })
            .then((response) => {
            console.log(`Usuario ${GTIHUB_USER_REVIEW} agregado como revisor al PR.`);
        })
            .catch((error) => {
            var _a;
            console.error('Error al agregar como revisor:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        });
    });
}
exports.addReviewers = addReviewers;
function addReview(value, message) {
    return __awaiter(this, void 0, void 0, function* () {
        const reviewBody = {
            event: "COMMENT",
            body: message,
        };
        const review = axios_1.default.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/reviews`, reviewBody, { headers })
            .then((response) => {
            console.log('Pull request aprobado con éxito y mensaje enviado.');
        })
            .catch((error) => {
            var _a;
            console.error('Error al aprobar el pull request:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        });
    });
}
exports.addReview = addReview;
function addCommentIssues(newIssues) {
    return __awaiter(this, void 0, void 0, function* () {
        newIssues.issues.forEach(element => {
            const comments = [{ path: element.component, line: element.line, body: `${serchSeverity(element.severity)} 
        > ${element.message}
        ` }];
            const commentBody = {
                body: '',
                event: "COMMENT",
                comments: comments
            };
            const review = axios_1.default.post(BASE_URL + `/repos/${GITHUB_REPOSITORY}/pulls/${GITHUB_PULL_REQUEST}/reviews`, commentBody, { headers })
                .then((response) => {
                console.log('Comentario agregado con éxito al pull request.');
            })
                .catch((error) => {
                var _a;
                console.error('Error al agregar el comentario al pull request:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            });
        });
    });
}
exports.addCommentIssues = addCommentIssues;
function serchSeverity(value) {
    if (value == "INFO")
        return "> [!TIP]";
    if (value == "MINOR")
        return "> [!TIP]";
    if (value == "MAJOR")
        return "> [!IMPORTANT]";
    if (value == "CRITICAL")
        return "> [!WARNING]";
    if (value == "BLOCKER")
        return "> [!CAUTION]";
    return "> [!TIP]";
}
