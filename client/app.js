angular.module('censusApp', [])
.controller('CensusController', function($scope, $http) {

    // ── Auth guard – redirect to login if no token ──────────────────────────
    var _token = window.sessionStorage.getItem('census_token');
    var _user  = JSON.parse(window.sessionStorage.getItem('census_user') || 'null');
    if (!_token) { window.location.href = 'login.html'; return; }

    $scope.currentUser  = _user;
    $scope.authToken    = _token;

    // Attach token to every outgoing request
    $http.defaults.headers.common['Authorization'] = 'Bearer ' + _token;

    // ── Logout ────────────────────────────────────────────────────────────────
    $scope.logout = function() {
        $http.post('http://localhost:3001/api/auth/logout').finally(function() {
            window.sessionStorage.removeItem('census_token');
            window.sessionStorage.removeItem('census_user');
            window.location.href = 'login.html';
        });
    };

    $scope.census        = {};
    $scope.censusList    = [];
    $scope.selectedCensus = null;
    $scope.showAddForm     = true;
    $scope.showDisplayForm = false;
    $scope.message       = '';
    $scope.messageType   = '';   // 'success' | 'error' | 'warning'
    $scope.loading       = false;
    $scope.fieldErrors   = {};   // { FieldName: 'error message' }

    // ── Search state ──────────────────────────────────────────────────────────
    $scope.showSearchForm  = false;
    $scope.searchQuery     = '';
    $scope.searchField     = 'all';
    $scope.searchResults   = [];
    $scope.searchPerformed = false;
    $scope.searchLoading   = false;

    // ── Helper: set a dismissable alert ──────────────────────────────────────
    $scope.setMessage = function(text, type) {
        $scope.message     = text;
        $scope.messageType = type || 'error';
    };

    $scope.clearMessage = function() {
        $scope.message     = '';
        $scope.messageType = '';
        $scope.fieldErrors = {};
    };

    // ── Helper: unpack field-level errors from API response ──────────────────
    //    Backend returns: { success, message, errors: [{ field, message }] }
    function applyFieldErrors(errorResponse) {
        $scope.fieldErrors = {};
        var data = errorResponse.data || {};

        // Field-level errors array
        if (Array.isArray(data.errors) && data.errors.length) {
            data.errors.forEach(function(e) {
                if (e.field) $scope.fieldErrors[e.field] = e.message;
            });
            $scope.setMessage(
                data.message || ('Validation failed with ' + data.errors.length + ' error(s)'),
                'error'
            );
            return;
        }

        // Plain message fallback
        var statusMessages = {
            0:   'Cannot reach the server. Please check your connection and try again.',
            400: data.message || 'Invalid request. Please check your input.',
            404: data.message || 'Record not found.',
            409: data.message || 'A duplicate record already exists.',
            422: data.message || 'Validation failed. Please correct the highlighted fields.',
            500: 'A server error occurred. Please try again later.',
            503: 'The server is temporarily unavailable. Please try again later.',
        };

        $scope.setMessage(
            statusMessages[errorResponse.status] || (data.message || 'An unexpected error occurred.'),
            'error'
        );
    }

    // ── Load all census records ───────────────────────────────────────────────
    $scope.loadCensus = function() {
        $scope.loading = true;
        $scope.clearMessage();

        $http.get('http://localhost:3000/api/getCensus')
            .then(function(response) {
                // Backend now returns { success, total, data: [...] }
                var body = response.data;
                var raw = Array.isArray(body.data) ? body.data
                          : Array.isArray(body)      ? body   // legacy fallback
                          : [];

                // Normalise to consistent camelCase so the template
                // works regardless of whether MySQL or the stored procedure
                // returns snake_case or PascalCase column names.
                $scope.censusList = raw.map(function(r) {
                    return {
                        id:        r.id        || r.Id        || r.ID,
                        FirstName: r.FirstName || r.first_name,
                        LastName:  r.LastName  || r.last_name,
                        SSN:       r.SSN       || r.ssn,
                        EmailId:   r.EmailId   || r.email     || r.Email,
                        Eid:       r.Eid       || r.eid       || r.EID,
                    };
                });

                if ($scope.censusList.length === 0) {
                    $scope.setMessage('No census records found.', 'warning');
                }
            })
            .catch(function(error) {
                console.error('[loadCensus] error:', error);
                $scope.censusList = [];
                applyFieldErrors(error);
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    // ── Display a specific census record ─────────────────────────────────────
    $scope.displayCensus = function(censusId) {
        $scope.loading = true;
        $scope.clearMessage();

        $http.get('http://localhost:3000/api/getCensus/' + censusId)
            .then(function(response) {
                // Backend returns { success, data: { ...record } }
                var body = response.data;
                var rec = body.data || body;
                // Normalise casing for the detail view
                $scope.selectedCensus = {
                    id:        rec.id        || rec.Id        || rec.ID,
                    FirstName: rec.FirstName || rec.first_name,
                    LastName:  rec.LastName  || rec.last_name,
                    SSN:       rec.SSN       || rec.ssn,
                    EmailId:   rec.EmailId   || rec.email     || rec.Email,
                    Eid:       rec.Eid       || rec.eid       || rec.EID,
                };
                $scope.showDisplayForm = true;
                $scope.showAddForm     = false;
            })
            .catch(function(error) {
                console.error('[displayCensus] error:', error);
                applyFieldErrors(error);
            })
            .finally(function() {
                $scope.loading = false;
            });
    };

    // ── Submit add-census form ────────────────────────────────────────────────
    $scope.submitForm = function() {
        $scope.clearMessage();

        // Basic client-side guard – AngularJS form validity
        if ($scope.censusForm && $scope.censusForm.$invalid) {
            $scope.censusForm.$setSubmitted();
            $scope.setMessage('Please fix the highlighted errors before submitting.', 'error');
            return;
        }

        $scope.loading = true;

        $http.post('http://localhost:3000/api/addCensus', $scope.census)
            .then(function(response) {
                var body = response.data;
                $scope.setMessage(body.message || 'Census record added successfully.', 'success');
                $scope.census = {};
                if ($scope.censusForm) $scope.censusForm.$setPristine();
                $scope.loadCensus();
            })
            .catch(function(error) {
                console.error('[submitForm] error:', error);
                applyFieldErrors(error);
            })
            .finally(function() {
                $scope.loading = false;
            });
    };


    // ── Search census records ─────────────────────────────────────────────────
    $scope.searchCensus = function() {
        var q = ($scope.searchQuery || '').trim();
        if (!q || q.length < 2) {
            $scope.setMessage('Please enter at least 2 characters to search.', 'warning');
            return;
        }
        $scope.clearMessage();
        $scope.searchLoading   = true;
        $scope.searchPerformed = false;
        $scope.searchResults   = [];

        $http.get('http://localhost:3000/api/searchCensus', {
            params: { q: q, field: $scope.searchField || 'all' }
        })
        .then(function(response) {
            var body = response.data;
            var raw  = Array.isArray(body.data) ? body.data : [];

            $scope.searchResults = raw.map(function(r) {
                return {
                    id:        r.id        || r.Id        || r.ID,
                    FirstName: r.FirstName || r.first_name,
                    LastName:  r.LastName  || r.last_name,
                    SSN:       r.SSN       || r.ssn,
                    EmailId:   r.EmailId   || r.email     || r.Email,
                    Eid:       r.Eid       || r.eid       || r.EID,
                };
            });

            $scope.searchPerformed = true;

            if ($scope.searchResults.length === 0) {
                $scope.setMessage('No records found matching "' + q + '".', 'warning');
            }
        })
        .catch(function(error) {
            console.error('[searchCensus] error:', error);
            $scope.searchResults   = [];
            $scope.searchPerformed = true;
            applyFieldErrors(error);
        })
        .finally(function() {
            $scope.searchLoading = false;
        });
    };

    // Clear search results
    $scope.clearSearch = function() {
        $scope.searchQuery     = '';
        $scope.searchField     = 'all';
        $scope.searchResults   = [];
        $scope.searchPerformed = false;
        $scope.clearMessage();
    };

    // ── Toggle to search page ─────────────────────────────────────────────────
    $scope.showSearch = function() {
        $scope.showAddForm     = false;
        $scope.showDisplayForm = false;
        $scope.showSearchForm  = true;
        $scope.clearSearch();
        $scope.clearMessage();
    };

    // ── Toggle to add form ────────────────────────────────────────────────────
    $scope.showAdd = function() {
        $scope.showAddForm     = true;
        $scope.showDisplayForm = false;
        $scope.showSearchForm  = false;
        $scope.census          = {};
        $scope.clearMessage();
    };

    // ── Toggle to display / list form ─────────────────────────────────────────
    $scope.showDisplay = function() {
        $scope.showAddForm     = false;
        $scope.showDisplayForm = true;
        $scope.showSearchForm  = false;
        $scope.loadCensus();
    };

    // ── Init ──────────────────────────────────────────────────────────────────
    $scope.loadCensus();
});
