angular.module('indexModule',['ngRoute','ngResource','ui.bootstrap', 'ngCookies']);
angular.module('indexModule').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {                        
    $routeProvider                                                                
       .when('/balance', {
            templateUrl: "templates/balance.html",                                               
            controller:'balanceCtrlr',                             
        })                                                                
       .when('/dashboard', {
            templateUrl: "templates/dashboard.html",                                               
            controller:'dashboardCtrlr',                             
        })                                                                
       .when('/recentAcivity', {
            templateUrl: "templates/recentAcivity.html",                                               
            controller:'recentAcivityCtrlr',                             
        })
        .when('/login', {
            templateUrl: 'templates/login.html', 
            controller: 'LoginController',
        })
        .when('/register', {
            templateUrl: 'templates/register.html', 
            controller: 'RegisterController',
        })
        .otherwise({                      
            template: ''
        });      
}]);
angular.module('indexModule').factory("balanceTotal",['$resource', function($resource) {
    return $resource("/api/bill/total",{},{
        get: {
            method:'GET', 
            params:{user:'@user', month:'@month'},
            isArray:true
        }
    });
}]);
angular.module('indexModule').factory("billList",['$resource', function($resource) {
    return $resource("/api/bill/list",{},{
        get: {
            method:'GET', 
            params:{user:'@user',n:'@n'},
            isArray:true
        }
    });
}]);
angular.module('indexModule').factory("currencies",['$resource', function($resource) {
    return $resource("/api/exchange-rates/",{},{
        get: {
            method:'GET',
            isArray:true
        }
    });
}]);
angular.module('indexModule').factory("owedList",['$resource', function($resource) {
    return $resource("/api/bill/owedList",{},{
        get: {
            method:'GET',
            params:{user:'@user'},
            isArray:true
        }
    });
}]);
angular.module('indexModule').factory("oweList",['$resource', function($resource) {
    return $resource("/api/bill/oweList",{},{
        get: {
            method:'GET',
            params:{user:'@user'},
            isArray:true
        }
    });
}]);
angular.module('indexModule').factory("upcomminglist",['$resource', function($resource) {
    return $resource("/api/bill/upcomming/list",{},{
        get: {
            method:'GET',
            params:{user:'@user'},
            isArray:true
        }
    });
}]);
