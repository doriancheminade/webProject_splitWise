                                         
angular.module('indexModule').factory("balanceTotal",['$resource', function($resource) {
    return $resource("/api/bill/total",{},{
        get: {
            method:'GET', 
            params:{user:'@user'},
            isArray:false
        }
    });
}]);
angular.module('indexModule').controller('balanceCtrlr', [              
    '$scope','$routeParams','balanceTotal',                             
    function balanceCtrlr($scope,$routeParams,balanceTotal) { 
        $scope.balance = {};
        
        $scope.balance.get_total = function(){
            balanceTotal.get({user:$routeParams.user}, '', 
                function(data){ 
                    $scope.balance.total = data;
                },function(err){
                    console.log(err);
                })    
        }                    
    }                                           
]); 
