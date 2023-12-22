export interface PullRequestDataCommits {
    amount : number;
    author: {login : string};
    title:string;
    branch:string;
    repository: string;
    numberPR : string;
    team: string;
}

export interface UserAlias {
    team:string;
    discord: string;
    github: string;
}