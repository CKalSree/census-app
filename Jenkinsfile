
pipeline { 

    agent any 

  

    tools { 

        nodejs "NodeJS-18"   // Matches the name set in Jenkins Tools 

    } 

  

    environment { 

        DB_PASSWORD  = credentials("admin") 

        JWT_SECRET   = credentials("JWT_SECRET") 

        NODE_ENV     = "test" 

        PORT         = "3001" 

        DB_HOST      = "localhost" 

        DB_PORT      = "3306" 

        DB_USER      = "root" 

        DB_NAME      = "censusdb" 

        FRONTEND_URL = "http://localhost:3000" 

    } 

  

    stages { 

  

        // ── Stage 1: Checkout ───────────────────────────── 

        stage("Checkout") { 

            steps { 

                cleanWs()   // Delete previous workspace 

                checkout scm 

                echo "Code checked out from branch: ${env.BRANCH_NAME}" 

            } 

        } 

  

        // ── Stage 2: Install Dependencies ───────────────── 

        stage("Install Dependencies") { 

            steps { 

                dir("server") { 

                    sh "npm ci"   // Clean install (faster, reproducible) 


                } 

            } 

        } 

  

        // ── Stage 3: Environment File ───────────────────── 

        stage("Create .env") { 

            steps { 

                dir("server") { 

                    sh """ 

                        cat > .env <<EOL 

                        PORT=${PORT} 

                        NODE_ENV=${NODE_ENV} 

                        DB_HOST=${DB_HOST} 

                        DB_PORT=${DB_PORT} 

                        DB_USER=${DB_USER} 

                        DB_PASSWORD=${DB_PASSWORD} 

                        DB_NAME=${DB_NAME} 

                        JWT_SECRET=${JWT_SECRET} 

                        JWT_EXPIRES=8h 

                        FRONTEND_URL=${FRONTEND_URL} 

                        EOL 

                    """ 

                } 

            } 

        } 

  

        // ── Stage 4: Database Migration ──────────────────── 

        stage("Database Setup") { 

            steps { 

                sh ""mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME}< sql/users_schema.sql""

            } 

        } 

  

        // ── Stage 5: Test ────────────────────────────────── 

        stage("Test") { 

            steps { 

                dir("server") { 

                    sh "npm test"   // Runs scripts.test in package.json 

                } 

            } 


            post { 

                always { 

                    echo "Tests complete" 

                } 

            } 

        } 

  

        // ── Stage 6: Deploy ──────────────────────────────── 

        stage("Deploy") { 

            when { branch "main" }   // Only deploy from main branch 

            steps { 

                dir("server") { 

                    // Stop old server if running, start new one 

                    sh "pm2 stop census-server || true" 

                    sh "pm2 start server.js --name census-server" 

                    sh "pm2 save" 

                } 

            } 

        } 

    } 

  

    // ── Post-build notifications ─────────────────────────── 

    post { 

        success { 

            echo "Build #${env.BUILD_NUMBER} succeeded!" 

        } 

        failure { 

            echo "Build #${env.BUILD_NUMBER} FAILED. Check console output." 

        } 

        always { 

            cleanWs()   // Clean up workspace after build 

        } 

    } 

} 

