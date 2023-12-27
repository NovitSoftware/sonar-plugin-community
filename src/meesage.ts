import {SonarqubeData, MetricFacets, Measure } from './models/sonarqube'

export function generateMessage (sonarqubeData : SonarqubeData) : string {

    return `## Quality Gate ${sonarqubeData.project_status.projectStatus.status == "OK" ? "Passed" : "Failed"}   ${searchPath(sonarqubeData.project_status.projectStatus.status == "OK" ? "approv" : "rejected")} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ![sonarqube 256x63 (1)](https://github.com/gustavo1020/-release-version-/assets/49031933/27434a7b-6a02-4686-a96a-57ecc73d5a85) &nbsp;&nbsp;  x  &nbsp;&nbsp;![c54422d50dc06739a00342935698799b (1)](https://github.com/gustavo1020/-release-version-/assets/49031933/0b02d722-ec4e-4397-b4c7-18108e8efba5)

### Additional information
*The following metrics might not affect the Quality Gate status but improving them will improve your project code quality.*
    
### Issues
    
${searchPath("bug")} ${searchPath(searchSecurity(sonarqubeData.measure, "new_reliability_rating"))} **${searchIssuesCount(sonarqubeData.newIssuesResponse.facets, "BUG")}** **Bugs**

${searchPath("vulnerability")} ${searchPath(searchSecurity(sonarqubeData.measure, "new_security_rating"))} **${searchIssuesCount(sonarqubeData.newIssuesResponse.facets, "VULNERABILITY")}** **Vulnerabilities**

${searchPath("codeSmell")} ${searchPath(searchSecurity(sonarqubeData.measure, "new_maintainability_rating"))} **${searchIssuesCount(sonarqubeData.newIssuesResponse.facets, "CODE_SMELL")}** **Code Smells**

### Coverage and Duplications

${duplicatedIcon(Number(sonarqubeData.measure.find(x => x.metric == "new_coverage")?.period.value || "0"))} **Coverage** **%${sonarqubeData.measure.find(x => x.metric == "new_coverage")?.period.value || 0}**

${coverageIcon(Number(sonarqubeData.measure.find(x => x.metric == "new_duplicated_lines_density")?.period.value || "0"))} **Duplication** **%${sonarqubeData.measure.find(x => x.metric == "new_duplicated_lines_density")?.period.value  || 0}**

   `
}

function searchPath(value : string) : string{
    return `![${value}](https://raw.githubusercontent.com/NovitSoftware/sonar-plugin-community/main/img/${value}.png)`
}

function searchSecurity(value : Measure[], search: string) : string{
    if(search == "new_reliability_rating") return "security_" + searchSecurityValue(value.find(x => x.metric == search)?.period?.value || "5.0")
    if(search == "new_maintainability_rating") return "security_" + searchSecurityValue(value.find(x => x.metric == search)?.period?.value || "5.0")
    if(search == "new_security_rating") return "security_" + searchSecurityValue(value.find(x => x.metric == search)?.period?.value || "5.0")
    if(search == "new_security_review_rating") return "security_" + searchSecurityValue(value.find(x => x.metric == search)?.period?.value || "5.0")

    return "security_E"
}


function searchSecurityValue (value : string) : string{
    if(value == "1.0") return "A"
    if(value == "2.0") return "B"
    if(value == "3.0") return "C"
    if(value == "4.0") return "D"
    if(value == "5.0") return "E"

    return "E"
}


function searchIssuesCount (value : MetricFacets[], search : string) : number{
    return value.find(x => x.property == "types")?.values.find(z => z.val == search)?.count || 0
}


function duplicatedIcon(duplicatedCode: number): string {

    if (duplicatedCode < 3) {
      return searchPath("duplication_lt_3");
    }
    if (duplicatedCode < 5) {
      return searchPath("duplication_3_5");
    }
    if (duplicatedCode < 10) {
      return searchPath("duplication_5_10");
    }
    if (duplicatedCode < 20) {
      return searchPath("duplication_10_20");
    }
    return searchPath("duplication_lt_3");
  }

function coverageIcon(coverage: number): string {
    if (coverage <= 0) {
       return searchPath("duplication_lt_3");
    }
    if (coverage < 50) {
       return searchPath("coverage_lt_50");
    }
    if (coverage < 80) {
       return searchPath("coverage_gt_50");
    }
    return searchPath("coverage_gt_80");
  }
