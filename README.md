# Sonarqube-Plugin-Community-Statistics

## Characteristics
- ```Detailed Code Analysis:``` Using SonarQube Community Edition, the plugin facilitates a thorough analysis of the code present in each pull request. This includes identifying bugs, vulnerabilities, and possible code quality improvements.
- ```Statistics Stored in the Database:``` The statistics generated during the analysis are stored in a structured way in two specific tables in the SonarQube database, providing fast and efficient access to key information about code quality.
- ```Direct Comments to the User's PR:``` Para agilizar el proceso de corrección, el proyecto implementa un sistema de comentarios que notifica directamente al usuario sobre los errores detectados en su pull request. Esto permite una respuesta inmediata y una corrección más eficiente por parte del desarrollador.

## Execution process

- Perform the normal analysis for your respective project
```yml
  sonar-test:
    runs-on: windows-latest
    needs: build-test
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0 
      - name: Set up JDK 11
        uses: actions/setup-java@v1
        with:
          java-version: 17
      - name: Cache SonarQube packages
        uses: actions/cache@v1
        with:
          path: ~\sonar\cache
          key: ${{ runner.os }}-sonar
          restore-keys: ${{ runner.os }}-sonar
      - name: Cache SonarQube scanner
        id: cache-sonar-scanner
        uses: actions/cache@v1
        with:
          path: .\.sonar\scanner
          key: ${{ runner.os }}-sonar-scanner
          restore-keys: ${{ runner.os }}-sonar-scanner
      - name: Install SonarQube scanner
        if: steps.cache-sonar-scanner.outputs.cache-hit != 'true'
        shell: powershell
        run: |
          New-Item -Path .\.sonar\scanner -ItemType Directory
          dotnet tool update dotnet-sonarscanner --tool-path .\.sonar\scanner

      - name: Build and analyze
        shell: powershell
        run: |
          .\.sonar\scanner\dotnet-sonarscanner begin /k:"test-api" /d:sonar.login="${{ secrets.SONAR_TOKEN }}" /d:sonar.host.url="${{ secrets.SONAR_HOST_URL }}"
          dotnet restore
          dotnet build
          .\.sonar\scanner\dotnet-sonarscanner end /d:sonar.login="${{ secrets.SONAR_TOKEN }}"
```
- Wait a period of 2 minutes for the project background task to finish calibrating the analysis
```yml
      - name: Esperar 2 minutos
        run: sleep 120
```
- Now run the plugin so it can interact with the sonar api and github api, keep in mind that it is necessary to configure the necessary secrets (NUGET_TOKEN = github token,  NUGET_USER = the token user,  HOST_PG = the port where your postgres database is hosted, HOST_PASS = postgres database password ) other things to keep in mind (pgUser = postgres database user,  pgDB = postgres database name, pgPort = postgres database port)
```yml
     - name: Sonarqube Community Statistics  
        uses: NovitSoftware/sonar-plugin-community@v1.0.0-stable
        with:
          sonarURL: ${{ secrets.SONAR_HOST_URL }}
          sonarToken: ${{ secrets.SONAR_TOKEN }}
          sonarKey: test-api
          token: ${{ secrets.NUGET_TOKEN }}
          user: ${{ secrets.NUGET_USER }}
          pgHost: ${{ secrets.HOST_PG }}
          pgUser: sonarqube
          pgDB: sonarqube
          pgPass: ${{ secrets.HOST_PASS }}
          pgPort: 5432
          analysis: true
```
 
