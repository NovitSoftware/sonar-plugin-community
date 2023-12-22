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
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
const github_1 = require("./github");
const sonarqube_1 = require("./sonarqube");
const meesage_1 = require("./meesage");
const postgres_1 = require("./postgres");
const core_1 = require("@actions/core");
const ANALYSIS = (0, core_1.getInput)("analysis") || false;
const COMMENT = (0, core_1.getInput)("comment") || true;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("start");
        let sonarData = yield (0, sonarqube_1.sonarqubeInit)();
        let msg = yield (0, meesage_1.generateMessage)(sonarData);
        console.log("sonarData");
        if (ANALYSIS == "true") {
            let githubData = yield (0, github_1.githubInit)();
            let postgreData = yield (0, postgres_1.postgreInit)();
            let postgreInsert = yield (0, postgres_1.insertInto)(githubData, sonarData);
            console.log("githubData and postgreData");
        }
        if (COMMENT == "true") {
            let ghaddReviewers = (0, github_1.addReviewers)();
            let ghaddReview = (0, github_1.addReview)(sonarData.project_status.projectStatus.status, msg);
            let ghaddCommentIssues = (0, github_1.addCommentIssues)(sonarData.newIssuesResponse);
            console.log("Review");
        }
        console.log("END");
    });
}
main();
