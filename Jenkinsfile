node {
    def app
    env.PROJECT_NAME = 'back-core'

    try {
        if (env.CHANGE_TITLE) {
            stage('Check PR title') {
                echo "PR title: ${CHANGE_TITLE}"
                def matcher =  CHANGE_TITLE =~ /^\[((ISP|IIM)-(\d*)|Hotfix)\] (.{5,})$/
                if (matcher && matcher[0][1]) {
                    echo "PR title is valid"
                } else {
                    error("PR title is not valid")
                }
            }
        } else {
            stage('Clone repository') {
                checkout scm
            }

            stage('Build image') {
                app = docker.build("itrexio-${PROJECT_NAME}-container")
            }

            withEnv(['npm_config_cache="npm-cache"']) {
                app.inside {
                    stage('NPM install') {
                        sh 'npm install'
                    }

                    stage('Code analyse') {
                        sh 'npm run test:eslint'
                    }

                    stage('Check for copy/paste') {
                        sh 'npm run test:jsinspect'
                    }

                    stage('Unit tests') {
                        sh 'mkdir -p ./mongodb'
                        sh 'mongod --fork --dbpath ./mongodb --logpath ./mongodb.log'
                        sh 'npm run test:unit'
                        sh 'rm -rf ./mongodb'
                    }
                }
            }

        }
    }
    catch (exc) {
        echo "I failed, ${exc}"
        currentBuild.result = 'FAILURE'
    }
    finally {
        echo "One way or another, I have finished";
        deleteDir()
    }
}
