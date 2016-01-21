
angular.module('indexModule').controller("LoginController", ['$scope', '$resource', '$rootScope', '$cookies', '$location',
   function ($scope, $resource, $rootScope, $cookies, $location){
       if($rootScope.currentUser != null) $location.path('/dashboard');
       var Login = $resource("http://localhost:3000/users/login");
       $scope.login = new Login();
       $scope.logsend = function() {
           $scope.login.$save(function(result){
               if(result.error == null){
                   $rootScope.currentUser = result;
                   var dt = new Date();
                   dt.setMinutes(dt.getMinutes() + 30);   
                   $cookies.putObject("currentUser", $scope.login, {'expires': dt});
                   $location.path('#/dashboard');              
                }
            })
        }
    }
]);

angular.module('indexModule').controller("RegisterController", ['$scope', '$resource', '$cookies', '$rootScope', '$location',
  function ($scope, $resource, $cookies, $rootScope, $location){
      if($rootScope.currentUser != null) $location.path('/dashboard');
      var Register = $resource("http://localhost:3000/users/register");
      $scope.register = new Register();
      $scope.regsend = function() {
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
    }
]);

angular.module('indexModule').controller("logoutController", ['$scope', '$rootScope', '$resource', '$location', '$cookies', 
    function ($scope, $rootScope, $resource, $location, $cookies){
        $rootScope.currentUser = $cookies.getObject("currentUser");
        var Logout = $resource("http://localhost:3000/users/logout");
        $scope.deconnexion = function(){
            Logout.get();
            $cookies.remove("currentUser");
            $rootScope.currentUser = null;
            $location.path('#/');
        }
    }
]);

