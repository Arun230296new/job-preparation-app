# Job preparation application

Node.js application used for the **Job preparation** DevOps project.

## Application endpoints
- `/` — application status
- `/health` — health probe
- `/api/info` — application information

## CI/CD flow
The app repository has one Jenkins pipeline (`Jenkinsfile`). Configure a Jenkins Pipeline job with:
- Definition: **Pipeline script from SCM**
- SCM: **Git**
- Repository: `https://github.com/Arun230296new/job-preparation-app.git`
- Credentials: `github-repo-token` (Username with password; GitHub username + fine-grained PAT)
- Branch: `*/main`
- Script path: `Jenkinsfile`

The pipeline runs Node.js tests in a Node 22 container, performs SonarQube analysis and quality-gate validation, builds the Docker image, scans it with Trivy, pushes it to ECR, updates the dedicated `gitops` branch with the new image tag in `helm/job-preparation/values.yaml`, and waits for Argo CD to roll out that image.

## Jenkins prerequisites
- Existing EC2 instance profile: `JenkinsEC2Role` with permissions to access ECR and EKS (the lab currently uses AdministratorAccess).
- Jenkins tools: Docker, AWS CLI, kubectl, Helm, Terraform (Terraform is used by the infra pipeline).
- Jenkins credential `github-repo-token`: **Username with password**, username `Arun230296new`, password is a GitHub fine-grained PAT with Contents read/write access to both private repositories.
- Jenkins SonarQube server installation named `SonarQube`, URL `http://localhost:9000`.
- Jenkins SonarQube Scanner tool named `SonarScanner`.
- SonarQube webhook URL: `http://54.252.158.57:8080/sonarqube-webhook/` (trailing slash required).

The infrastructure pipeline must be run successfully before the app pipeline, because it creates the ECR repository and EKS cluster.

## Important
The app pipeline updates its Helm values in Git. Argo CD watches the `gitops` branch of this repository and automatically syncs the changed image tag. The Jenkins job builds only `main`, so GitOps commits do not trigger a second app build. No Argo CD admin token or Argo CD CLI is required in Jenkins.
