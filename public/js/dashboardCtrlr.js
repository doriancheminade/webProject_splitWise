
angular.module('indexModule').controller('dashboardCtrlr', [              
    '$scope','$routeParams', 'currencies', 'balanceTotal', 'oweList', 'owedList',
    function dashboardCtrlr($scope, $routeParams, currencies, balanceTotal, oweList, owedList) { 
        $scope.dashboard = {};
        $scope.dashboard.currencies = [];
        $scope.dashboard.youowe = 0;
        $scope.dashboard.youreowed = 0;
        $scope.dashboard.totalbalance = 0;
        $scope.dashboard.bills = {you: {}, others: {}};
        $scope.dashboard.graph = false;
        
        currencies.get({},
            function(data){
                $scope.dashboard.currencies = data;
                $scope.dashboard.total();
                $scope.dashboard.billlist();
            },function(err){
                console.log('ERROR'+err)
            }
        );
        
        
        $scope.dashboard.getRate = function(cur){
            for(var i=0; i<$scope.dashboard.currencies.length; i++){
                if($scope.dashboard.currencies[i].currency == cur) return $scope.dashboard.currencies[i].rate
            }
            return 1
        };
        
        $scope.dashboard.total = function(){
            balanceTotal.get({user:$routeParams.user}, '', 
                function(data){
                    var owe = 0;
                    var owed = 0;
                    for(var i=0; i<data.length; i++){
                        var rate = $scope.dashboard.getRate(data[i]._id);
                        owe += data[i].debt * rate;
                        owed += data[i].owed * rate;
                    }
                    $scope.dashboard.youowe = owe.toFixed(2);
                    $scope.dashboard.youreowed = owed.toFixed(2);
                    $scope.dashboard.totalbalance = ($scope.dashboard.youreowed - $scope.dashboard.youowe).toFixed(2);
                },function(err){
                    console.log(err);
                })    
        };
        
        $scope.dashboard.billlist = function(){
            oweList.get({user:$routeParams.user},
                function(data){
                        $scope.dashboard.bills.others = data;                
                },function(err){
                    console.log(err);
                }
            );
            owedList.get({user:$routeParams.user},
                function(data){
                    for(var i=0; i<data.length; i++){
                        $scope.dashboard.bills.you = data;
                    }
                },function(err){
                    console.log(err);
                }
            );
        }
    }]
)
