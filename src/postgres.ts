import { Client } from 'pg';
require('dotenv').config();
import { SonarqubeData } from './models/sonarqube'
import { PullRequestDataCommits } from './models/github'
import {getInput } from '@actions/core';



async function createTable(client: Client) {
    try {
      await client.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      `);

      await client.query(`
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

      await client.query(`
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
    } finally {
      client.end();
    }
  }


export async function postgreInit() {
  const client = new Client({
    host: getInput("pgHost"),
    port: Number(getInput("pgPort")),
    database: getInput("pgDB"),
    user: getInput("pgUser"),
    password: getInput("pgPass"),
  });
  
    await client.connect();
    try {
          await createTable(client);
        }catch (error) {
        console.error('Error en la aplicación:', error);
    } finally {
        await client.end();
    }
}

export async function insertInto(pullRequestDataCommits: PullRequestDataCommits, sonarqubeData: SonarqubeData) {
  const client = new Client({
    host: getInput("pgHost"),
    port: Number(getInput("pgPort")),
    database: getInput("pgDB"),
    user: getInput("pgUser"),
    password: getInput("pgPass"),
  });

  await client.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'INSERT INTO quality_analysis_by_PR (uuid_analysis, uuid_proyect, "user", repository, branch, pull_request_number, pull_request_name, commits_amount, quality_avg, quality, team, issue, issuesResolved, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING uuid',
      [sonarqubeData.uuid_analysis, sonarqubeData.uuid_proyect, pullRequestDataCommits.author, pullRequestDataCommits.repository, pullRequestDataCommits.branch, pullRequestDataCommits.numberPR, pullRequestDataCommits.title, pullRequestDataCommits.amount, sonarqubeData.quality_avg, sonarqubeData.quality, pullRequestDataCommits.team, sonarqubeData.issue, sonarqubeData.issuesResolved, sonarqubeData.project_status.projectStatus.status]
    );
    
    const idInsertado = result.rows[0].uuid;

    const result2 = await client.query(
      'INSERT INTO statistics_by_PR (uuid_quality_analysis_by_PR, bug, vulnerabilities, security_hotspots, reviewed, added_debt, code_smells, duplications_lines, duplicated_blocks, new_lines) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [idInsertado, sonarqubeData.bug, sonarqubeData.vulnerabilities, sonarqubeData.security_hotspots, sonarqubeData.reviewed, sonarqubeData.added_debt, sonarqubeData.code_smells, sonarqubeData.duplications_lines, sonarqubeData.duplicated_blocks, sonarqubeData.new_lines]
    );

    await client.query('COMMIT');

    return idInsertado;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.end();
  }
}