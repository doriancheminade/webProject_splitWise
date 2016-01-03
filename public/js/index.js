angular.module('indexModule',['ngRoute','ngResource','ui.bootstrap']);
angular.module('indexModule')
    .config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {                        
        $routeProvider                                                                
           .when('/balance', {
                templateUrl: "templates/balance.html",                                               
                controller:'balanceCtrlr',                             
            })
            .otherwise({                      
                template: 'does not exists'
            });      
    }]);

