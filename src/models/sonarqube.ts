export interface SonarqubeData {
    uuid_analysis : string;
    uuid_proyect : string;
    issue : boolean;
    project_status : ProjectStatus;
    quality_avg: number;
    quality: string;
    bug: string;
    vulnerabilities: string;
    security_hotspots: string;
    reviewed: string;
    added_debt: string;
    code_smells: string;
    duplications_lines: string;
    duplicated_blocks: string;
    new_lines: string;
    newIssuesResponse :NewIssuesResponse;
    measure:Measure[];
    issuesResolved : number;
}


interface MetricHistory {
    date: string;
    value?: string; // El valor puede ser opcional dependiendo de si está presente en todos los elementos
}
  
interface MetricMeasure {
    metric: string;
    history: MetricHistory[];
}



export interface MetricFacets {
    property: string;
    values: {val: string, count: number}[];
}
export interface HistoryIssuesResponse {
    measures: MetricMeasure[];

}

export interface NewIssuesResponse {
    issues: {key:string, severity:string, component:string, project: string, line:number, message:string, debt:string, author: string, creationDate:string, type:string}[];
    facets: MetricFacets[];

}

interface MeasurePeriod {
    index: number;
    value: string;
    bestValue: boolean;
}
  
export interface Measure {
    metric: string;
    value: string;
    period: MeasurePeriod;
}

interface QualityGateData {
    status: string;
    metricKey: string;
    comparator: string;
    periodIndex: number;
    errorThreshold: string;
    actualValue: string;
  }
export interface PullRequestStatisticsResponse {
    component: {measures: Measure[];};
}

export interface ProjectStatus {
    projectStatus: {status:string, conditions: QualityGateData[]};
}

