angular.module('seriesNGApp', ['ngRoute', 'ngActivityIndicator', 'ngSanitize'])
    .factory('instagramSearchService', function ($http, $q) {
        return {
            search: function (queryString) {
                var deferred = $q.defer();
                $http({ cache: false, method: 'GET', url: '/instaSearch/' + queryString }).success(function (data) {
                    deferred.resolve(data);
                });
                return deferred.promise;
            }
        };
    })
    .config(['$routeProvider', '$compileProvider', function ($routeProvider, $compileProvider) {
        $routeProvider
            .when('/', { controller: 'appController', templateUrl: '../Views/series.html' })
            .when('/login', { controller: 'loginCtrl', templateUrl: '../Views/login.html' })
            .when('/profile', { controller: 'profileCtrl', templateUrl: '../Views/profile.html' })
            .when('/passRecover', { controller: 'passRecoverCtrl', templateUrl: '../Views/passRecover.html' })
            .when('/passReplace/:guid/:email', { controller: 'passReplaceCtrl', templateUrl: '../Views/passReplace.html' })
            .when('/watchlist', { controller: 'watchlistCtrl', templateUrl: '../Views/watchlist.html' })
            .when('/hotness', { controller: 'hotnessCtrl', templateUrl: '../Views/hotness.html', reloadOnSearch: false })
            .when('/hotness/:galCode', { controller: 'hotnessCtrl', templateUrl: '../Views/hotness.html', reloadOnSearch: false })
            .otherwise({ redirectTo: '/' });
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|magnet):/);
    }]).controller('appController', ['$scope', '$rootScope', '$http', '$location', '$activityIndicator', function ($scope, $rootScope, $http, $location, $activityIndicator) {

        $scope.subsDialog = $(".subtitlesPopup").dialog({
            title: "Subtitles",
            autoOpen: false,
            maxHeight: window.innerHeight,
            maxWidth: window.innerWidth,
            minHeight: window.innerHeight / 2,
            minWidth: window.innerWidth / 2,
            closeOnEscape: true,
            position: { my: "center", at: "top", of: window },
            modal: true,
            resizable: false,
            draggable: false
        });

        $scope.nextEpDialog = $(".nextEpPopUp").dialog({
            title: "Next Episode",
            autoOpen: false,
            maxHeight: window.innerHeight,
            maxWidth: window.innerWidth,
            minHeight: window.innerHeight / 2,
            minWidth: window.innerWidth / 2,
            closeOnEscape: true,
            position: { my: "center", at: "top", of: window },
            modal: true,
            resizable: false,
            draggable: false,
            onclose: function (){
                $scope.nextEpData = {};
                $scope.$apply();
            }
        });


        $scope.user = {};
        $http({ cache: false, method: 'GET', url: '/user?t=' + new Date().getTime().toString() }).success(function (data) {
            if (!data.username) {
                $location.path('/login');
            } else {
                $scope.user = data;
                $rootScope.$broadcast('loggedin');
            }
        });

        $scope.$on('loggedin', function () {

            $activityIndicator.startAnimating();
            if (!$scope.user.favorites.length) {
                $activityIndicator.stopAnimating();
                alert("You do not have any series added in your watchlist.\nPlease add some");
            } else {
                $http({ cache: true, method: 'POST', url: '/usersSeriesMoreInfo', data: { list: $scope.user.favorites } }).success(function (data) {

                    data.forEach(function (e, i) {
                        switch (e.schedule.days[0]) {
                            case 'Monday': e.airday = 'luni'; e.rank = 1; break;
                            case 'Tuesday': e.airday = 'marti'; e.rank = 2; break;
                            case 'Wednesday': e.airday = 'miercuri'; e.rank = 3; break;
                            case 'Thursday': e.airday = 'joi'; e.rank = 4; break;
                            case 'Friday': e.airday = 'vineri'; e.rank = 5; break;
                            case 'Saturday': e.airday = 'sambata'; e.rank = 6; break;
                            case 'Sunday': e.airday = 'duminica'; e.rank = 7; break;
                            case 'Weekdays': e.airday = 'L-V'; e.rank = 8; break;
                            case null: e.airday = 'unknown'; e.rank = 9; break;
                            default: e.airday = 'unknown'; e.rank = 10; break;
                        }
                    });

                    var day = "x", runningSeries = [];
                    data.sort(function (a, b) {
                        return a.rank - b.rank;
                    }).forEach(function (e, i) {
                        e.hasNextEpisode = Object.prototype.hasOwnProperty.call(e._links, "nextepisode");

                        if (day !== e.airday) {
                            day = e.airday;
                            runningSeries.push({ name: e.airday, values: [{ link: "", name: e.name, data: e }] });
                        } else {
                            runningSeries.forEach(function (el) {
                                if (el.name == e.airday) {
                                    el.values.push({ link: "", name: e.name, data: e });
                                }
                            });
                        }
                    });

                    $scope.runningSeries = runningSeries;
                    goGetFilelistSeries();
                    goGetRARBGseries();
                    $activityIndicator.stopAnimating();
                });
            }
        });

        $scope.GetFlForSerie = function (serie) {
            $scope.FLQUERIE = serie;
            $http({ cache: true, method: "POST", data: { serie: replaceSpecialChar(serie) }, url: "/GetFlForSerie" }).success(function (response) {
                $scope.flsQuery = response;
                $scope.flsQuery.forEach(function (el) {
                    el.webLink = el.webLink.split("&passkey=")[0] + "&passkey=" + $scope.user.FLpasskey;
                    el.viewableDate = moment(el.time).fromNow();
                });
            });
            $http({ cache: true, method: "POST", data: { serie: replaceSpecialChar(serie) }, url: "/GetRARBGForSerie" }).success(function (response) {
                response.forEach(function (e) {
                    e.viewableDate = moment(e.time).fromNow();
                });

                $scope.RARBGQuery = response.sort(function (a, b) {
                    return b.time - a.time;
                });
            });
        };

        $scope.logout = function () {
            $http({ cache: true, method: "GET", url: "/logout" }).success(function (data) {
                if (data) { $location.path("/login"); }
            });
        };

        $scope.subQuery = ""
        $scope.searchForSubString = function () {
            var item = {
                data: {
                    name: $scope.subQuery
                }
            }
            $scope.searchForSub(item);
        }

        $scope.searchForSub = function (item) {
            $activityIndicator.startAnimating();
            $http({ method: 'POST', url: "/subtitles", data: item.data }).success(function (response) {
                response = response.sort(function (a, b) {
                    return new Date(b.SubAddDate).getTime() - new Date(a.SubAddDate).getTime();
                });
                $scope.subtitles = response;
                $scope.subsDialog.dialog("open");
                $activityIndicator.stopAnimating();
            });
        }

        $scope.getNextEp = function (item) {
            $scope.nextEpData = {};
            $activityIndicator.startAnimating();
            $http({ method: 'GET', url: item.data._links.nextepisode.href }).success(function (smm) {
                $scope.nextEpData = smm;
                $scope.$apply();
                $scope.nextEpDialog.dialog("open");
                $activityIndicator.stopAnimating();
            });
        }

        function goGetFilelistSeries() {
            var three = function aDayAgo() {
                var now = new Date();
                var threeDaysAgo = (((1000 * 60) * 60) * 24) * 2;
                return now - threeDaysAgo;
            };
            $http({ cache: true, method: "POST", url: "/filelistSeries", data: { time: three() } }).success(function (data) {
                // var t = /S[\d]\w+/g -- gettin S04e12
                data.forEach(function (e) {
                    e.webLink = e.webLink.split("&passkey=")[0] + "&passkey=" + $scope.user.FLpasskey;
                    e.viewableDate = moment(e.time).fromNow();
                });
                $scope.fls = data.sort(function (a, b) {
                    return a.time - b.time;
                });

                var runningSeries = $scope.runningSeries;
                var reversedData = data.sort(function (a, b) {
                    return b.time - a.time;
                });
                for (var i in reversedData) {
                    for (var s in runningSeries) {
                        var rs = runningSeries[s].values;
                        for (var j in rs) {
                            var r = new RegExp("^" + rs[j].name.replace(":", ""), "i");
                            if (r.test(reversedData[i].title)) {
                                rs[j].FLlinkTitle = reversedData[i].title + " -- Added " + reversedData[i].viewableDate + " --- " + reversedData[i].descr;
                                rs[j].link = reversedData[i].webLink.split("&passkey=")[0] + "&passkey=" + $scope.user.FLpasskey;
                                rs[j].descr = reversedData[i].descr;
                            }
                        }
                    }
                }
            });
        }

        function replaceSpecialChar(string) {
            string = string.split("");

            string.forEach(function (e, i) {
                if (e == "(" || e == ")" || e == "'") {
                    string.splice(i, 1);
                }
            });
            return string.join("");
        }

        function goGetRARBGseries() {
            var three = function aDayAgo() {
                var now = new Date();
                var threeDaysAgo = (((1000 * 60) * 60) * 24) * 2;
                return now - threeDaysAgo;
            };
            $http({ cache: true, method: "POST", url: "/rarbgseries", data: { time: three() } }).success(function (data) {

                data.forEach(function (e) {
                    e.viewableDate = moment(e.time).fromNow();
                });

                $scope.rarBGs = data.sort(function (a, b) {
                    return a.time - b.time;
                });
                var runningSeries = $scope.runningSeries;

                var reversedData = data.sort(function (a, b) {
                    return b.time - a.time;
                });

                for (var i in reversedData) {
                    for (var s in runningSeries) {
                        var rs = runningSeries[s].values;
                        for (var j in rs) {
                            var r = new RegExp("^" + rs[j].name.replace(":", ""), "i");
                            if (r.test(reversedData[i].title)) {
                                rs[j].linkTitle = reversedData[i].title + " -- Added " + reversedData[i].viewableDate + " --- " + reversedData[i].descr;
                                rs[j].altLink = reversedData[i].webLink;
                            }
                        }
                    }
                }
            });
        }
    }]).controller('watchlistCtrl', ['$scope', "$rootScope", '$http', '$location', function ($scope, $rootScope, $http, $location) {
        $http({ cache: true, method: 'GET', url: "/user" }).success(function (data) {
            if (!data.username) {
                $location.path("/login");
            } else {
                $scope.user = data;
                $rootScope.$broadcast("loggedin");
            }
        });

        $http({ cache: true, method: "GET", url: "/popularWatched" }).success(function (data) {
            $scope.tenMostWatched = data;
        });

        $scope.$on("loggedin", function () {
            if (!!$scope.user.favorites.length) {
                $http({ cache: true, method: "POST", url: "/usersSeries", data: { list: $scope.user.favorites } }).success(function (data) {
                    $scope.watchlistDetailed = data.sort(function (a, b) {
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                        return 0;
                    });
                });
            }
        });

        $scope.getmoreinfo = function (arg) {
            $http({ cache: true, method: "post", url: "/moreInfo", data: { showid: arg } }).success(function (data) {
                $scope.moreInfoShow = data;
            });
        };

        $scope.logout = function () {
            $http({ cache: true, method: "GET", url: "/logout" }).success(function (data) {
                if (data) { $location.path("/login"); }
            });
        };

        $scope.addSeries = function (arg, index) {
            $http({ cache: true, method: "post", url: "/seriesAddToSet", data: { id: arg } }).success(function (data) {
                if (data) {
                    if (!$scope.watchlistDetailed) {
                        $scope.watchlistDetailed = [];
                    }
                    $scope.watchlistDetailed.push($scope.ser[index]);
                    $scope.ser.splice(index, 1);
                    $scope.apply;
                }
            });
        };
        $scope.removeSeries = function (arg, index) {
            $http({ cache: true, method: "post", url: "/seriesPull", data: { id: arg } }).success(function (data) {
                if (data) {
                    $scope.watchlistDetailed.splice(index, 1);
                    $scope.apply;
                }
            });
        };
        $scope.seriesQuery = "";

        // $scope.$watch("seriesQuery", function(newValue, oldValue){
        //     if (newValue !== oldValue) {
        //         _.debounce($scope.GetOneSeries(newValue), 2000);
        //     }
        // });
        $scope.GetOneSeries = function (param, param2) {
            $scope.ser = [];
            $http({ method: "POST", url: "/serieDB", data: { query: param, country: param2 } }).success(function (data) {

                var watchedIds = [];
                if (!!$scope.watchlistDetailed) {
                    watchedIds = $scope.watchlistDetailed.map(function (e) {
                        return e.id;
                    });
                }
                data.forEach(function (serie, index) {
                    if (serie.hasOwnProperty("premiered")) {
                        if (serie.premiered) {
                            serie.premieredYear = new Date(serie.premiered).getFullYear();
                        } else {
                            serie.premieredYear = new Date().getFullYear();
                        }
                    }
                    if (watchedIds.indexOf(serie.id) >= 0) {
                        serie.addable = false;
                    } else {
                        serie.addable = true;
                    }
                });

                data.sort(function (a, b) {
                    return b.premieredYear - a.premieredYear;
                });

                $scope.ser = data;
            });
        };

    }]).controller("passRecoverCtrl", ["$scope", "$http", function ($scope, $rootScope, $http) {
        $scope.passRecover = function (email) {
            $http({ method: "POST", url: "/passRecover", data: { email: email } }).success(function (response) {
                if (response) {
                    alert("Check your inbox in a few moments.");
                } else {
                    alert("Email not found.");
                }
            });
        }
    }]).controller("profileCtrl", ["$scope", '$rootScope', "$http", function ($scope, $rootScope, $http) {
        $http({ cache: false, method: 'GET', url: '/user?t=' + new Date().getTime().toString() }).success(function (data) {
            if (!data.username) {
                $location.path('/login');
            } else {
                $scope.user = data;
                $rootScope.$broadcast('loggedin');
            }
        });

        $scope.newPassKey = function (passKey, password) {
            // var r = new RegExp("[A-Z,./<>?:;'{}[~`!@#$%^&*()]", "g");
            // if ($scope.newFLpassKeyForm.$invalid) {
            //     alert("That does not look like a Filelist passkey\nSorry!\nTry again.");
            //     return;
            // }
            // var myArr = r.exec(passKey);
            // if ($.type(myArr) == "array" || $.type(myArr) !== "null") {
            // if (confirm("Are you sure that's a Filelist passkey?")) {
            $http({ method: "POST", url: "/newPasskey", data: { passKey: passKey, user: $scope.user, password: password } }).success(function (response) {
                if (response) {
                    $scope.user.FLpasskey = response.newPasskey;
                    alert("Filelist passkey updated.");
                } else {
                    alert("Wrong password.\nPlease try again");
                }
            });
            // }else{
            //     return;
            // }
            // }
        }
    }]).controller('passReplaceCtrl', ["$scope", "$http", "$routeParams", "$activityIndicator", "$location", function ($scope, $http, $routeParams, $activityIndicator, $location) {
        $activityIndicator.startAnimating();
        $http({ method: 'POST', url: '/passReplace', data: $routeParams }).success(function (response) {
            $activityIndicator.stopAnimating();
            if (!response) {
                alert("Something went wrong.\n\nPlease try again");
                $location.path("/login");
            }
        });

        $scope.newPass = function (pass) {
            $activityIndicator.startAnimating();
            var objToSend = {
                password: pass,
                guid: $routeParams.guid,
                email: $routeParams.email
            };
            $http({ method: "POST", data: objToSend, url: "/newPass" }).success(function (resp) {
                $activityIndicator.stopAnimating();
                if (resp) {
                    alert("Your password has been updated.\n\nYou may now login with the new password.");
                    $location.path("/login");
                } else {
                    alert("Something went wrong.\n\nPlease try again.");
                    $location.path("/login");
                }
            });
        }
    }]).controller("loginCtrl", ['$scope', '$http', '$location', "$activityIndicator", function ($scope, $http, $location, $activityIndicator) {
        $http({ method: 'GET', url: "/user?t=" + new Date().getTime().toString() }).success(function (data) {
            if (data.username) {
                $location.path("/");
            } else {
                $location.path("/login");
                $activityIndicator.stopAnimating();
            }
        });
        $scope.logIn = function (data) {
            $activityIndicator.startAnimating();
            $http({ cache: true, method: "POST", url: "/logIn", data: data }).success(function (response) {
                if (response) {
                    $activityIndicator.stopAnimating();
                    $location.path("/");
                } else {
                    $activityIndicator.stopAnimating();

                    alert("Username and/or password not correct!\nPlease try again using different credentials.\nThanks!");
                }
            });
        };
        $scope.signUpp = function (data) {
            $http({ cache: true, method: "POST", url: "/signUp", data: data }).success(function (response) {
                if (response) {
                    alert("Sign up successfull!\nYou may now login using your previously submitted credentials\nThanks!");
                } else {
                    alert("Username or email already in use.\nPlease try using another one or if you are the owner of that email try logging in with that email address.\nThanks.");
                }
            });
        };
    }]);

function aDayAgo() {
    var now = new Date();
    var threeDaysAgo = (((1000 * 60) * 60) * 24) * 3;
    return now - threeDaysAgo;
}
function toTitleCase(str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}