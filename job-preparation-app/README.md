# Job preparation application

Node.js application repository for the **Job preparation** DevOps project.

The Jenkinsfile uses `npm install` so a lockfile is not required in this initial repository snapshot. Commit a generated `package-lock.json` later for reproducible dependency installs.\n\nIncludes Express application, Jest tests, Dockerfile, SonarQube configuration, Trivy scan stage, Helm chart, Argo CD Application manifest, and one complete Jenkins application pipeline.

## Jenkins prerequisites
- AWS credential ID `aws-credentials` with ECR push and EKS access permissions
- SonarQube installation named `SonarQube`, plus Sonar Scanner
- Trivy, Docker, AWS CLI, kubectl, and Argo CD CLI on the Jenkins agent
- Jenkins secret text credential `argocd-auth-token`
- Jenkins environment variable `ARGOCD_SERVER`
- Pipeline, Git, SonarQube Scanner, Pipeline: AWS Steps plugins

## Infrastructure contract
The matching infrastructure repository must create region `ap-southeast-2`, ECR repository `job-preparation-app`, EKS cluster `job-preparation-eks`, namespace `job-preparation`, Argo CD, and AWS Load Balancer Controller. It must configure the ECR image repository in the Helm values.

Do not run this pipeline until the infrastructure repository and Jenkins prerequisites are ready.
