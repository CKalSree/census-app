// login.js  –  AngularJS controller for the login page
'use strict';

angular.module('censusApp', [])
.controller('LoginController', ['$scope', '$http', '$window', function($scope, $http, $window) {

    $scope.credentials  = { username: '', password: '' };
    $scope.loading      = false;
    $scope.message      = '';
    $scope.messageType  = 'error';
    $scope.fieldErrors  = {};
    $scope.showPassword = false;
    $scope.currentYear  = new Date().getFullYear();

    // ── Redirect if already logged in ────────────────────────────────────────
    (function checkExistingSession() {
        var token = $window.sessionStorage.getItem('census_token');
        if (token) {
            $http.get('http://localhost:3000/api/auth/me', {
                headers: { Authorization: 'Bearer ' + token }
            }).then(function() {
                $window.location.href = 'index.html';
            }).catch(function() {
                $window.sessionStorage.removeItem('census_token');
                $window.sessionStorage.removeItem('census_user');
            });
        }
    })();

    // ── Login ─────────────────────────────────────────────────────────────────
    $scope.login = function() {
        $scope.message     = '';
        $scope.fieldErrors = {};

        // Client-side guard
        if ($scope.loginForm.$invalid) {
            $scope.loginForm.$setSubmitted();
            $scope.message     = 'Please fill in all required fields.';
            $scope.messageType = 'error';
            return;
        }

        $scope.loading = true;

        $http.post('http://localhost:3000/api/auth/login', {
            username: $scope.credentials.username.trim(),
            password: $scope.credentials.password,
        })
        .then(function(response) {
            var data = response.data;

            // Persist token + user info for the main app
            $window.sessionStorage.setItem('census_token', data.token);
            $window.sessionStorage.setItem('census_user',  JSON.stringify(data.user));

            $scope.message     = data.message || 'Login successful. Redirecting…';
            $scope.messageType = 'success';

            // Brief pause so the user sees the success message, then redirect
            setTimeout(function() {
                $window.location.href = 'index.html';
            }, 800);
        })
        .catch(function(rejection) {
            var data   = (rejection && rejection.data) ? rejection.data : {};
            var status = rejection ? rejection.status : 0;

            $scope.fieldErrors = {};

            // Map field errors from API
            if (Array.isArray(data.errors)) {
                data.errors.forEach(function(e) {
                    if (e.field && e.field !== '_global') {
                        $scope.fieldErrors[e.field] = e.message;
                    }
                });
            }

            // Set banner message
            var statusMessages = {
                0:   'Cannot reach the server. Please check your connection.',
                401: data.message || 'Invalid username or password.',
                403: data.message || 'Your account is deactivated. Contact an administrator.',
                422: data.message || 'Please fill in all required fields.',
                500: 'A server error occurred. Please try again later.',
            };

            $scope.message     = statusMessages[status] || data.message || 'Login failed. Please try again.';
            $scope.messageType = 'error';
        })
        .finally(function() {
            $scope.loading = false;
        });
    };

}]);
