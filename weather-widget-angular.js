angular.module('weatherWidget',[
  'pascalprecht.translate'])
.directive('weatherWidget', function () {
  return {
    restrict: 'E',
    scope: {
      city        : '@',
      forecast    : '@',
      language    : '@',
      size        : '@',
      appid       : '@'
    },
    controller: 'WeatherCtrl',
    templateUrl: 'bower_components/weather-widget-angular/html/weatherWidget.html'
  };
})
.factory('weatherWidgetService', ['$http', '$q', function ($http, $q) {
  return {
    getWeather: getWeather,
    getForecast: getForecast,
    getImage: getImage
  };

  function getWeather(city,appid) {
    var defer = $q.defer();
    var url = "http://api.openweathermap.org/data/2.5/find?q=" + city + "&units=metric&appid=" + appid + "&callback=JSON_CALLBACK";
    //var url = 'http://localhost:8080/weather.json?callback=JSON_CALLBACK';
    $http.jsonp(url)
    .success(function (data) {
      defer.resolve(data);
    })
    .error(function (error) {
      console.log("Error weather request: " + error);
      defer.reject(error);
    });
    return defer.promise;

  }

    function getForecast(city,appid) {
      var defer = $q.defer();
      var url = "http://api.openweathermap.org/data/2.5/forecast?q=" + city + "&units=metric&appid=" + appid + "&callback=JSON_CALLBACK";
      //var url = 'http://localhost:8080/forecast.json?callback=JSON_CALLBACK';
      $http.jsonp(url)
      .success(function (data) {
        defer.resolve(data);
      })
      .error(function (error) {
        console.log("Error forecast request: " + error);
        defer.reject(error);
      });
      return defer.promise;
    }

    function getImage(icon) {
      if (icon !== undefined)
        return 'http://openweathermap.org/img/w/' + icon + '.png';
      return null;
    }
  }])
.filter('temp', function ($filter) {
  return function (input, precision) {
    if (!precision) {
      precision = 1;
    }
    var numberFilter = $filter('number');
    return numberFilter(input, precision) + '\u00B0C';
  };
})
.controller('WeatherCtrl', [
  '$scope',
  'weatherWidgetService', 
  '$translate',
  '$location',
   function ($scope, weatherWidgetService,$translate, $location ) {
    $scope.weather = {temp: {}, icon: null, wind: {}, date: ""};
    $scope.isForecast=false;
    $scope.languages = ["English", "Français", "Español"];
    $scope.locationXLPage = $location.url() + "bower_components/weather-widget-angular/html/XLPage.html";
    $scope.locationXSPage = $location.url() + "bower_components/weather-widget-angular/html/XSPage.html";
    $scope.locationErrorPage = $location.url() + "bower_components/weather-widget-angular/html/errorPage.html";
    $scope.locationDemoAreaPage = $location.url() + "bower_components/weather-widget-angular/html/demoArea.html";
    $scope.date = new Date();
    $scope.isXL= $scope.size==='xl';
    $scope.forecastDays = [];
    
    setLanguage();
    generateWeather();
    
    function formatForecastDates(){
      for(var i = 0; i< $scope.forecastDays.length;i++){
          $scope.forecastDays[i].formattedDate = formatDate($scope.forecastDays[i].date);
      }
    }

    function generateWeather(){
      $scope.forecastDays = [];
      weatherWidgetService.getWeather($scope.city,$scope.appid).then(
        function (data) {
          if (data.list[0]) {
            fillWeatherData(data.list[0], $scope.weather);
            $scope.country = data.list[0].sys.country;
            $scope.imgurl = fillImage($scope.weather);
            $scope.date = new Date(data.list[0].dt * 1000);
            $scope.formattedDate = formatDate($scope.date);

            $scope.error = null;
          }

          if($scope.forecast!==null && $scope.forecast>0){
            $scope.isForecast=true;
           
            weatherWidgetService.getForecast($scope.city,$scope.appid).then(
              function (data) {
                if (data) {
                  for(var i=1;i<=$scope.forecast;i++){
                    var weather = {temp: {}, icon: null, wind: {}, date: "",hour: ""};

                    fillWeatherData(data.list[i], weather);
                    weather.imgurl = fillImage(weather);
                    $scope.date = new Date(data.list[i].dt * 1000);
                    weather.date = $scope.date;
                    weather.formattedDate = formatDate($scope.date);
                    weather.hour = fillHour($scope.date);
                    $scope.forecastDays.push(weather);
                  }
                  $scope.error = null;
                }
              },
              function (error) {
                fillError(error);
              });
          }
        },
        function (error) {
          fillError(error);
        });
    }

    function setLanguage(){
      $scope.selectedFlag = 'en';
      if($scope.language!==undefined){
        $translate.use($scope.language);
      }
    }

    function fillError(error){
      $scope.error = "City " + $scope.city +  " not found";
    }

    function fillWeatherData(data, weather) {
      weather.temp.current  = data.main.temp;
      weather.temp.min      = data.main.temp_min;
      weather.temp.max      = data.main.temp_max;
      weather.icon          = data.weather[0].icon ? data.weather[0].icon : undefined;
      weather.humidity      = data.main.humidity;
      weather.pressure      = data.main.pressure;
      weather.wind.speed    = data.wind.speed;
    }

    function fillImage(weather){
      return weatherWidgetService.getImage(weather.icon);
    }

    function formatDate(date){
      var days = ['main.days.sunday',
                  'main.days.monday',
                  'main.days.tuesday', 
                  'main.days.wednesday',
                  'main.days.thursday',
                  'main.days.friday',
                  'main.days.saturday'];
                  $scope.date = date;
      return $translate.instant(days[date.getDay()]) + ", " + date.getDate();
    }

    function fillHour(date){
      return addZero(date.getHours()) + ":" + addZero(date.getMinutes());
    }

    function addZero(value) {
      return value < 10 ? "0" + value : value;
    }


  }])
.config(['$translateProvider', function ($translateProvider) {
  $translateProvider.translations('en', {
    'main.weather'        : 'Weather',
    'main.today'          : 'Today',
    'main.days.saturday'  : 'Saturday',
    'main.days.sunday'    : 'Sunday',
    'main.days.monday'    : 'Monday',
    'main.days.tuesday'   : 'Tuesday',
    'main.days.wednesday' : 'Wednesday',
    'main.days.thursday'  : 'Thursday',
    'main.days.friday'    : 'Friday',
    'main.current'        : 'Current',
    'main.min'            : 'Min',
    'main.max'            : 'Max',
    'main.humidity'       : 'Humidity',
    'main.pressure'       : 'Pressure',
    'main.wind.speed'     : 'Wind Speed'
  });

  $translateProvider.translations('es', {
    'main.weather'        : 'El Tiempo en',
    'main.today'          : 'Hoy',
    'main.days.saturday'  : 'Sábado',
    'main.days.sunday'    : 'Domingo',
    'main.days.monday'    : 'Lunes',
    'main.days.tuesday'   : 'Martes',
    'main.days.wednesday' : 'Miércoles',
    'main.days.thursday'  : 'Jueves',
    'main.days.friday'    : 'Viernes',
    'main.current'        : 'Actual',
    'main.min'            : 'Min',
    'main.max'            : 'Max',
    'main.humidity'       : 'Humedad',
    'main.pressure'       : 'Presión',
    'main.wind.speed'     : 'Velocidad Viento'
  });

  $translateProvider.translations('fr', {
    'main.weather'        : 'Météo',
    'main.today'          : 'Aujourd\'hui',
    'main.days.saturday'  : 'Samedi',
    'main.days.sunday'    : 'Dimanche',
    'main.days.monday'    : 'Lundi',
    'main.days.tuesday'   : 'Mardi',
    'main.days.wednesday' : 'Mercredi',
    'main.days.thursday'  : 'Jeudi',
    'main.days.friday'    : 'Vendredi',
    'main.current'        : 'Actuel',
    'main.min'            : 'Min',
    'main.max'            : 'Max',
    'main.humidity'       : 'Humidité',
    'main.pressure'       : 'Pression',
    'main.wind.speed'     : 'Vitesse Vent'
  });

  $translateProvider.preferredLanguage('en');
  $translateProvider.useSanitizeValueStrategy('escape');
}]);
