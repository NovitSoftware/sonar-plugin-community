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
exports.insertInto = exports.postgreInit = void 0;
const pg_1 = require("pg");
require('dotenv').config();
const core_1 = require("@actions/core");
function createTable(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);
            yield client.query(`
        CREATE TABLE IF NOT EXISTS quality_analysis_by_PR (
          uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          uuid_analysis character varying(40) COLLATE pg_catalog."default" NOT NULL,
          uuid_proyect character varying(40) COLLATE pg_catalog."default" NOT NULL,
          "user" character varying(255) COLLATE pg_catalog."default" NOT NULL,
          repository character varying(255) COLLATE pg_catalog."default" NOT NULL,
          branch character varying(255) COLLATE pg_catalog."default" NOT NULL,
          pull_request_number int NOT NULL,
          pull_request_name character varying(255) COLLATE pg_catalog."default" NOT NULL,
          commits_amount int NOT NULL,
          quality_avg DECIMAL(10, 2) NOT NULL,
          quality character varying(255) COLLATE pg_catalog."default" NOT NULL,
          team character varying(255) COLLATE pg_catalog."default" NOT NULL,
          issue boolean NOT NULL,
          issuesResolved int NOT NULL,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          status character varying(255) COLLATE pg_catalog."default" NOT NULL
        );
      `);
            yield client.query(`
        CREATE TABLE IF NOT EXISTS statistics_by_PR (
          uuid UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          uuid_quality_analysis_by_PR UUID NOT NULL,
          bug int NOT NULL,
          vulnerabilities int NOT NULL,
          security_hotspots int NOT NULL,
          reviewed int NOT NULL,
          added_debt int NOT NULL,
          code_smells int NOT NULL,
          duplications_lines int NOT NULL,
          duplicated_blocks int NOT NULL,
          new_lines int NOT NULL,
          created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uuid_quality_analysis_by_PR) REFERENCES quality_analysis_by_PR(uuid)
        );
      `);
            console.log('La tabla ha sido creada correctamente.');
        }
        finally {
            client.end();
        }
    });
}
function postgreInit() {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new pg_1.Client({
            host: (0, core_1.getInput)("pgHost"),
            port: Number((0, core_1.getInput)("pgPort")),
            database: (0, core_1.getInput)("pgDB"),
            user: (0, core_1.getInput)("pgUser"),
            password: (0, core_1.getInput)("pgPass"),
        });
        yield client.connect();
        try {
            yield createTable(client);
        }
        catch (error) {
            console.error('Error en la aplicación:', error);
        }
        finally {
            yield client.end();
        }
    });
}
exports.postgreInit = postgreInit;
function insertInto(pullRequestDataCommits, sonarqubeData) {
    return __awaiter(this, void 0, void 0, function* () {
        const client = new pg_1.Client({
            host: (0, core_1.getInput)("pgHost"),
            port: Number((0, core_1.getInput)("pgPort")),
            database: (0, core_1.getInput)("pgDB"),
            user: (0, core_1.getInput)("pgUser"),
            password: (0, core_1.getInput)("pgPass"),
        });
        yield client.connect();
        try {
            yield client.query('BEGIN');
            // Convertir pull_request_number a entero y quality_avg a número decimal
            const pullRequestNumberInt = parseInt(pullRequestDataCommits.numberPR, 10);
            const qualityAvgNumber = Number(sonarqubeData.quality_avg);
            console.log('Inserting quality analysis - PR Number:', pullRequestNumberInt, 'Quality Avg:', qualityAvgNumber);
            console.log('Raw SonarQube data - Bug:', sonarqubeData.bug, 'Vulnerabilities:', sonarqubeData.vulnerabilities);
            const result = yield client.query('INSERT INTO quality_analysis_by_PR (uuid_analysis, uuid_proyect, "user", repository, branch, pull_request_number, pull_request_name, commits_amount, quality_avg, quality, team, issue, issuesResolved, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING uuid', [sonarqubeData.uuid_analysis, sonarqubeData.uuid_proyect, pullRequestDataCommits.author, pullRequestDataCommits.repository, pullRequestDataCommits.branch, pullRequestNumberInt, pullRequestDataCommits.title, pullRequestDataCommits.amount, qualityAvgNumber, sonarqubeData.quality, pullRequestDataCommits.team, sonarqubeData.issue, sonarqubeData.issuesResolved, sonarqubeData.project_status.projectStatus.status]);
            const idInsertado = result.rows[0].uuid;
            // Convert all numeric strings to integers for the statistics table
            // Use parseInt with fallback to 0 for any invalid values
            const bugInt = parseInt(sonarqubeData.bug || "0", 10) || 0;
            const vulnerabilitiesInt = parseInt(sonarqubeData.vulnerabilities || "0", 10) || 0;
            const securityHotspotsInt = parseInt(sonarqubeData.security_hotspots || "0", 10) || 0;
            const reviewedInt = parseInt(sonarqubeData.reviewed || "0", 10) || 0;
            const addedDebtInt = parseInt(sonarqubeData.added_debt || "0", 10) || 0;
            const codeSmellsInt = parseInt(sonarqubeData.code_smells || "0", 10) || 0;
            const duplicationsLinesInt = parseInt(sonarqubeData.duplications_lines || "0", 10) || 0;
            const duplicatedBlocksInt = parseInt(sonarqubeData.duplicated_blocks || "0", 10) || 0;
            const newLinesInt = parseInt(sonarqubeData.new_lines || "0", 10) || 0;
            console.log('Inserting statistics - Bug:', bugInt, 'Vulnerabilities:', vulnerabilitiesInt, 'CodeSmells:', codeSmellsInt);
            const result2 = yield client.query('INSERT INTO statistics_by_PR (uuid_quality_analysis_by_PR, bug, vulnerabilities, security_hotspots, reviewed, added_debt, code_smells, duplications_lines, duplicated_blocks, new_lines) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)', [idInsertado, bugInt, vulnerabilitiesInt, securityHotspotsInt, reviewedInt, addedDebtInt, codeSmellsInt, duplicationsLinesInt, duplicatedBlocksInt, newLinesInt]);
            yield client.query('COMMIT');
            return idInsertado;
        }
        catch (error) {
            yield client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.end();
        }
    });
}
exports.insertInto = insertInto;
