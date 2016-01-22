
angular.module('indexModule').controller('balanceCtrlr', [              
    '$scope','$routeParams','balanceTotal','billList', '$cookies', 'upcomminglist',
    function balanceCtrlr($scope, $routeParams, balanceTotal, billList, $cookies, upcomminglist) { 
        $scope.balance = {};
        $scope.user = $cookies.getObject("currentUser");
        $scope.balance.showtotal = false;
        $scope.balance.showmonthtrend = false;
        $scope.balance.showupcomming = false;
        
        $scope.balance.get_total = function(){
            $scope.balance.showtotal = true;
            $scope.balance.showtrend = false;
            $scope.balance.showupcomming = false;
            balanceTotal.get({user:$scope.user.email}, '', 
                function(data){ 
                    $scope.balance.total = data;
                },function(err){
                    console.log(err);
                })    
        };
        $scope.balance.get_monthtrend = function(){
            $scope.balance.showtotal = false;
            $scope.balance.showtrend = true;
            $scope.balance.showupcomming = false;
            balanceTotal.get({user:$scope.user.email, month:true}, '', 
                function(data){ 
                    $scope.balance.monthtotal = data;
                },function(err){
                    console.log(err);
                })                  
        };
        $scope.balance.get_upcomming = function(){
            $scope.balance.showtotal = false;
            $scope.balance.showtrend = false;
            $scope.balance.showupcomming = true;
            upcomminglist.get({user:$scope.user.email}, '', 
                function(data){ 
                    $scope.balance.upcomming = data;
                },function(err){
                    console.log(err);
                })                     
        };
        
        $scope.balance.bills = [];
        $scope.balance.get_list = function(){
            billList.get({user:$scope.user.email, n:$scope.balance.bills.length},'',
                function(data){
                    for(var i=0; i<data.length; i++){
                        data[i].date *= 1000;
                    }
                    var a = $scope.balance.bills.concat(data);
                    $scope.balance.bills = a;
                },function(err){
                    console.log(err);
                }
             )
        };        
        $scope.balance.bill = {};
        $scope.balance.bill.ipayed = function(bill){
            if(bill.payed_by==$scope.user.email){
                return bill.price;
            }else{
                for(var i=0;i<bill.split_with.length;i++){
                    if(bill.split_with[i].name==$scope.user.email){
                        return bill.split_with[i].payed;
                    }
                }
            }
        }; 
        $scope.balance.bill.imowed = function(bill){
            if(bill.payed_by==$scope.user.email){
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
