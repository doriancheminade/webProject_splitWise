var app = angular.module("indexModule", ['ngRoute', 'ngCookies', 'ngResource', 'ngSanitize']);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider
    .when('/register', {templateUrl: 'views/register.html', controller: 'RegisterController'})
    .when('/dashboard', {templateUrl: 'views/dashboard.html', controller: 'DashboardController'})
    .when('/bill', {templateUrl: 'views/bill.html', controller: ''})
    .when('/balance', {templateUrl: 'views/balance.html', controller:'balanceCtrlr'})
    .when('/', {templateUrl: 'views/login.html', controller: 'LoginController'})
    .otherwise({redirectTo: '/'});

}]);



app.controller("LoginController", ['$scope', '$resource', '$rootScope', '$cookies', '$location',
   function ($scope, $resource, $rootScope, $cookies, $location){

       if($rootScope.currentUser != null) $location.path('/dashboard');

       var Login = $resource("http://localhost:3000/users/login");

       $scope.login = new Login();

       $scope.envoyer = function() {

           $scope.login.$save(function(result){

               if(result.error == null){
                   $rootScope.currentUser = result;

                   var dt = new Date();
                   dt.setMinutes(dt.getMinutes() + 30);   

                   $cookies.putObject("currentUser", $scope.login, {'expires': dt});
                   $location.path('/dashboard');
              
          }
       })
      }
   }]);


app.controller("RegisterController", ['$scope', '$resource', '$cookies', '$rootScope', '$location',
  function ($scope, $resource, $cookies, $rootScope, $location){

      if($rootScope.currentUser != null) $location.path('/dashboard');

      var Register = $resource("http://localhost:3000/users/register");
      $scope.register = new Register();

      $scope.envoyer = function() {
          $scope.register.$save(function(result){

              if(result.error == null){
                  $rootScope.currentUser = result;

                  var dt = new Date();
                  dt.setMinutes(dt.getMinutes() + 30);  

                  $cookies.putObject("currentUser", $scope.register, {'expires': dt});
                  $location.path('#/dashboard');
              }
          })
      }
  }]);

app.controller("logoutController", ['$scope', '$rootScope', '$resource', '$location', '$cookies', 
 function ($scope, $rootScope, $resource, $location, $cookies){

     $rootScope.currentUser = $cookies.getObject("currentUser");

     var Logout = $resource("http://localhost:3000/users/logout");

     $scope.deconnexion = function(){
         Logout.get();
         $cookies.remove("currentUser");
         $rootScope.currentUser = null;
         $location.path('#/');
     }
 }]);


 app.controller("balanceCtrlr", [              
    '$scope','$routeParams','balanceTotal','billList','currencies',                            
    function balanceCtrlr($scope, $routeParams, balanceTotal, billList, currencies) { 
        $scope.balance = {};
        
        $scope.balance.currencies = [];
        currencies.get({},
            function(data){
                $scope.balance.currencies = data.currencies
            },function(err){
                console.log('ERROR'+err)
            }
        );
        $scope.balance.getRate = function(cur){
            for(var i=0; i<$scope.balance.currencies.length; i++){
                if(scope.balance.currencies[i].currency == cur) return scope.balance.currencies[i].rate
            }
            return 1
        };
        
        $scope.balance.get_total = function(){
            balanceTotal.get({user:$routeParams.user}, '', 
                function(data){ 
                    $scope.balance.total = data;
                },function(err){
                    console.log(err);
                })    
        };
        
        $scope.balance.bills = [];
        $scope.balance.get_list = function(){
            billList.get({user:$routeParams.user, n:$scope.balance.bills.length},'',
                function(data){
                    var a = $scope.balance.bills.concat(data);
                    $scope.balance.bills = a;
                },function(err){
                    console.log(err);
                }
             )
        };        
        $scope.balance.bill = {};
        $scope.balance.bill.ipayed = function(bill){
            if(bill.payed_by==$routeParams.user){
                return bill.price;
            }else{
                for(var i=0;i<bill.split_with.length;i++){
                    if(bill.split_with[i].name==$routeParams.user){
                        return bill.split_with[i].payed;
                    }
                }
            }
        }; 
        $scope.balance.bill.imowed = function(bill){
            if(bill.payed_by==$routeParams.user){
                var r = 0;
                for(var i=0;i<bill.split_with.length;i++){
                    r += bill.split_with[i].owe;
                }
                return r;
            }            
            return 0;
        };
        $scope.balance.get_list();
    }
]); 

app.controller("balanceTotal",['$resource', function($resource) {
    return $resource("/api/bill/total",{},{
        get: {
            method:'GET', 
            params:{user:'@user'},
            isArray:true
        }
    });
}]);

app.controller("billList",['$resource', function($resource) {
    return $resource("/api/bill/list",{},{
        get: {
            method:'GET', 
            params:{user:'@user',n:'@n'},
            isArray:true
        }
    });
}]);

app.controller("currencies",['$resource', function($resource) {
    return $resource("/api/exchange-rates/",{},{
        get: {
            method:'GET',
            isArray:true
        }
    });
}]);

                                           

