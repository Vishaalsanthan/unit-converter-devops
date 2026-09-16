pipeline {
    agent any

    environment {
        APP_NAME = 'unit-converter'
        IMAGE_NAME = 'unit-converter'
        CLUSTER_NAME = 'unit-converter'
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Validate Application') {
            steps {
                sh '''
                    set -e
                    test -f app/index.html
                    test -f app/style.css
                    test -f app/script.js
                    echo "Application files validated."
                '''
            }
        }

        stage('Validate Kubernetes') {
            steps {
                sh '''
                    set -e
                    kubectl apply --dry-run=client -f k8s/deployment.yaml
                    kubectl apply --dry-run=client -f k8s/service.yaml
                    echo "Kubernetes manifests validated."
                '''
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    set -e
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    echo "Docker image built successfully."
                '''
            }
        }

        stage('Load Image into Kind') {
            steps {
                sh '''
                    set -e
                    kind load docker-image ${IMAGE_NAME}:${IMAGE_TAG} --name ${CLUSTER_NAME}
                    echo "Image loaded into Kind."
                '''
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                    set -e

                    kubectl apply -f k8s/

                    kubectl set image deployment/${APP_NAME} \
                        ${APP_NAME}=${IMAGE_NAME}:${IMAGE_TAG}

                    echo "Kubernetes deployment updated."
                '''
            }
        }

        stage('Rollout Verification') {
            steps {
                sh '''
                    set -e
                    kubectl rollout status deployment/${APP_NAME} --timeout=180s
                    echo "Rollout completed successfully."
                '''
            }
        }

        stage('Kubernetes Status') {
            steps {
                sh '''
                    echo "===== NODES ====="
                    kubectl get nodes

                    echo "===== DEPLOYMENT ====="
                    kubectl get deployment ${APP_NAME}

                    echo "===== PODS ====="
                    kubectl get pods -l app=${APP_NAME} -o wide

                    echo "===== SERVICE ====="
                    kubectl get service ${APP_NAME}-service
                '''
            }
        }
    }

    post {
        success {
            echo 'Unit Converter CI/CD pipeline completed successfully.'
        }

        failure {
            echo 'Pipeline failed. Check the stage logs.'
        }
    }
}
