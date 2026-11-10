pipeline {
  agent any
  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }
  environment {
    AWS_REGION = 'ap-southeast-2'
    ECR_REPOSITORY = 'job-preparation-app'
    K8S_NAMESPACE = 'job-preparation'
    EKS_CLUSTER_NAME = 'job-preparation-eks'
    IMAGE_TAG = "${BUILD_NUMBER}"
  }
  stages {
    stage('Checkout') {
      steps { checkout scm }
    }
    stage('Verify AWS access and resolve ECR') {
      steps {
        script {
          env.ECR_REPOSITORY_URI = sh(
            script: "aws ecr describe-repositories --region ${env.AWS_REGION} --repository-names ${env.ECR_REPOSITORY} --query 'repositories[0].repositoryUri' --output text",
            returnStdout: true
          ).trim()
          if (!env.ECR_REPOSITORY_URI || env.ECR_REPOSITORY_URI == 'None') {
            error('ECR repository was not found. Run the infrastructure pipeline first.')
          }
          env.ECR_REGISTRY = env.ECR_REPOSITORY_URI.split('/')[0]
        }
        sh 'aws sts get-caller-identity'
        sh 'aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"'
      }
    }
    stage('Automated tests') {
      steps {
        sh '''
          docker run --rm \
            --user "$(id -u):$(id -g)" \
            -v "$WORKSPACE:/workspace" \
            -w /workspace \
            node:22-alpine \
            sh -c 'npm_config_cache=/tmp/.npm npm install --no-package-lock --no-audit --no-fund && npm_config_cache=/tmp/.npm npm run test:ci'
        '''
      }
    }
    stage('SonarQube analysis') {
      steps {
        script {
          def scannerHome = tool 'SonarScanner'
          withSonarQubeEnv('SonarQube') {
            sh "${scannerHome}/bin/sonar-scanner"
          }
        }
      }
    }
    stage('SonarQube quality gate') {
      steps {
        timeout(time: 10, unit: 'MINUTES') {
          waitForQualityGate abortPipeline: true
        }
      }
    }
    stage('Build Docker image') {
      steps {
        sh 'docker build --pull -t "$ECR_REPOSITORY_URI:$IMAGE_TAG" .'
      }
    }
    stage('Trivy image vulnerability scan') {
      steps {
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v /tmp/trivy-cache:/root/.cache/ \
            aquasec/trivy:latest \
            image --scanners vuln --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed \
            "$ECR_REPOSITORY_URI:$IMAGE_TAG"
        '''
      }
    }
    stage('Push image to Amazon ECR') {
      steps {
        sh 'docker push "$ECR_REPOSITORY_URI:$IMAGE_TAG"'
      }
    }
    stage('Update GitOps image tag') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'github-repo-token', usernameVariable: 'GITHUB_USERNAME', passwordVariable: 'GITHUB_TOKEN')]) {
          sh '''
            set -eu
            set +x
            SOURCE_COMMIT=$(git rev-parse HEAD)
            AUTH_HEADER=$(printf '%s' "${GITHUB_USERNAME}:${GITHUB_TOKEN}" | base64 -w 0)

            if git -c http.extraheader="AUTHORIZATION: basic ${AUTH_HEADER}" ls-remote --exit-code --heads origin gitops >/dev/null 2>&1; then
              git -c http.extraheader="AUTHORIZATION: basic ${AUTH_HEADER}" fetch origin gitops
              git checkout -B gitops FETCH_HEAD
              git merge --no-edit "$SOURCE_COMMIT" || {
                git checkout --theirs helm/job-preparation/values.yaml
                git add helm/job-preparation/values.yaml
                git commit --no-edit
              }
            else
              git checkout -B gitops "$SOURCE_COMMIT"
            fi

            sed -i -E "s|^  tag:.*|  tag: \"${IMAGE_TAG}\"|" helm/job-preparation/values.yaml
            git add helm/job-preparation/values.yaml
            if ! git diff --cached --quiet; then
              git commit -m "chore: deploy image ${IMAGE_TAG} [skip ci]"
            fi
            git -c http.extraheader="AUTHORIZATION: basic ${AUTH_HEADER}" push origin HEAD:gitops
          '''
        }
      }
    }
    stage('Deployment health check') {
      steps {
        sh '''
          set -eu
          aws eks update-kubeconfig --region "$AWS_REGION" --name "$EKS_CLUSTER_NAME"
          EXPECTED_IMAGE="$ECR_REPOSITORY_URI:$IMAGE_TAG"
          ACTUAL_IMAGE=""
          for attempt in $(seq 1 120); do
            ACTUAL_IMAGE=$(kubectl get deployment job-preparation-app -n "$K8S_NAMESPACE" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)
            if [ "$ACTUAL_IMAGE" = "$EXPECTED_IMAGE" ]; then
              break
            fi
            sleep 5
          done
          if [ "$ACTUAL_IMAGE" != "$EXPECTED_IMAGE" ]; then
            echo "Argo CD has not applied expected image: $EXPECTED_IMAGE (current: $ACTUAL_IMAGE)"
            exit 1
          fi
          kubectl rollout status deployment/job-preparation-app -n "$K8S_NAMESPACE" --timeout=300s
          kubectl get pods -n "$K8S_NAMESPACE" -o wide
        '''
      }
    }
  }
  post {
    always {
      sh 'docker image rm "$ECR_REPOSITORY_URI:$IMAGE_TAG" 2>/dev/null || true'
    }
    success { echo 'Application pipeline completed successfully.' }
    failure { echo 'Application pipeline failed. Review the stage logs.' }
  }
}
