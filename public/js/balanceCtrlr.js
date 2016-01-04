                                         
angular.module('indexModule').factory("balanceTotal",['$resource', function($resource) {
    return $resource("/api/bill/total",{},{
        get: {
            method:'GET', 
            params:{user:'@user'},
            isArray:false
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
angular.module('indexModule').controller('balanceCtrlr', [              
    '$scope','$routeParams','balanceTotal','billList',                             
    function balanceCtrlr($scope, $routeParams, balanceTotal, billList) { 
        $scope.balance = {};
        
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
        }      
        $scope.balance.bill.imowed = function(bill){
            if(bill.payed_by==$routeParams.user){
                var r = 0;
                for(var i=0;i<bill.split_with.length;i++){
                    r += bill.split_with[i].owe;
                }
                return r;
            }            
            return 0;
        }
        $scope.balance.get_list();
                           
    }                                           
]); 
