export interface QualityAnalysisByPR {
    uuid: string;
    uuid_analysis: string;
    uuid_proyect: string;
    user: string;
    branch: string;
    pull_request_number: number;
    pull_request_name: string;
    commits_amount: number;
    quality_avg_number: number;
    quality__number: number;
    quality_avg: string;
    quality: string;
    team: string;
    issue: boolean;
    created_at: string;
  }

  export interface StatisticsByPR {
    uuid: string;
    uuid_nombreTabla2: string;
    bug: number;
    vulnerabilities: number;
    security_hotspots: number;
    reviewed: number;
    added_debt: number;
    code_smells: number;
    duplications_lines: number;
    duplicated_blocks: number;
    new_lines: number;
    created_at: string;
  }