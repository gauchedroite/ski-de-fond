/// <reference path="soleil.ts" />

var google: any = {};
google.visualization = {};
google.visualization.Query = {};

var month_names = [ 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre' ];
var periodes = [ '', 'Ce soir', 'Cette nuit', 'Ce matin', 'Cet après-midi' ];

interface ISkiData {
    updatedDate: string
    wax: string
    p8: string
    temperature: number
    feelsLike: number
    windSpeed: number
}
let ski = <ISkiData>{};


document.addEventListener('DOMContentLoaded', function () {
    google.visualization.Query.setResponse = parseSpreadsheetData_First;
    var url = "https://spreadsheets.google.com/tq?key=0AqeNjAYIAcUedGl0SWVZZzNtQ0JNTVFuR1dRQ3psMlE&pub=1&gid=6";
    var script = document.createElement("script");        
    script.setAttribute("src", url);
    script.setAttribute("type", "text/javascript");                
    document.body.appendChild(script);

    var url2 = "https://www.meteomedia.com/dataaccess/citypage/json/caqc0177?callback=parseCitypageData&t=" + new Date().getTime();
    var script2 = document.createElement("script");        
    script2.setAttribute("src", url2);
    script2.setAttribute("type", "text/javascript");                
    document.body.appendChild(script2);

    var timezone = new Date().getTimezoneOffset() / 60;
    var sun = computeSunrise(new Date(), 45.5, 75.5);
    document.getElementById("lever-coucher-text").innerHTML = formatSunTime(sun.sunriseGMT - timezone) + " - " + formatSunTime(sun.sunsetGMT - timezone);
    document.getElementById("semaine-text").innerHTML = formatSunDelta(sun.semaine);
}, false);

function parseSpreadsheetData_First(response: any) {
    ski.updatedDate = response.table.rows[0].c[1].v;

    google.visualization.Query.setResponse = parseSpreadsheetData_Second;
    var url = "https://spreadsheets.google.com/tq?key=0AqeNjAYIAcUedGl0SWVZZzNtQ0JNTVFuR1dRQ3psMlE&pub=1&gid=4";
    var script = document.createElement("script");        
    script.setAttribute("src", url);
    script.setAttribute("type", "text/javascript");                
    document.body.appendChild(script);
}

function parseSpreadsheetData_Second(response: any) {
    var cols = response.table.cols;
    var rows = response.table.rows;
    var snow = cols[2].label;
    var wax = rows[3].c[2].v;
    var new24 = rows[4].c[2].v;
    var p8 = rows[5].c[2].v;

    ski.wax = formatWax(wax);
    ski.p8 = formatP8(p8);
    saveToLocalStorage();

    document.getElementById('updated-text').innerHTML = formatUpdated(ski.updatedDate);
    document.getElementById('updated-text-2').innerHTML = "Il y a " + formatElapsed(ski.updatedDate);
    document.getElementById('wax-text').innerHTML = ski.wax;
    document.getElementById('snow-text').innerHTML = formatSnow(snow);
    document.getElementById('p8-text').innerHTML = ski.p8;
    document.getElementById('new24-text').innerHTML = formatNew24(new24);
}

function parseCitypageData(response: any) {
    var obs = response.PACKAGE.Observation;
    ski.temperature = obs.temperature_c;
    ski.feelsLike = obs.feelsLike_c;
    ski.windSpeed = obs.windSpeed_kmh;
    saveToLocalStorage();

    document.getElementById('obs-text').innerHTML = obs.temperature_c + "&deg;C (" + obs.feelsLike_c + "&deg;C) " + obs.windSpeed_kmh + " km/h";

    var pa = response.PACKAGE.ShortTerm.Period[0];
    document.getElementById('forecast-a-text').innerHTML = 
        periodes[pa.period] + ": " +
        pa.temperature_c + ' &deg;C (' + pa.feelsLike_c + '&deg;C) ' +
        pa.windSpeed_kmh + ' km/h ' +
        pa.pop_percent + '% ' +
        (pa.rain > 0 ? pa.rain_range + ' mm pluie' : '') + (pa.rain > 0 && pa.snow > 0 ? ', ' : '') + (pa.snow > 0 ? pa.snow_range + ' cm neige' : '');

    pa = response.PACKAGE.ShortTerm.Period[1];
    document.getElementById('forecast-b-text').innerHTML =
        periodes[pa.period] + ": " +
        pa.temperature_c + ' &deg;C (' + pa.feelsLike_c + '&deg;C) ' +
        pa.windSpeed_kmh + ' km/h ' +
        pa.pop_percent + '% ' +
        (pa.rain > 0 ? pa.rain_range + ' mm pluie' : '') + (pa.rain > 0 && pa.snow > 0 ? ', ' : '') + (pa.snow > 0 ? pa.snow_range + ' cm neige' : '');
}

function formatUpdated(updated: string) {
    var date = new Date(updated);
    var yyyy = date.getFullYear();
    var mo = month_names[date.getMonth()];
    var dd = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    return dd + ' ' + mo + ' à ' + hh + 'h' + (mm < 10 ? '0' : '') + mm;
}

function formatElapsed(updated: string) {
    var diff = new Date().getTime() - new Date(updated).getTime();
    var days = Math.floor(diff / 1000 / 60 / 60 / 24);
    diff -= days * 1000 * 60 * 60 * 24;
    var hours = Math.floor(diff / 1000 / 60 / 60);
    diff -= hours * 1000 * 60 * 60;
    var mins = Math.floor(diff / 1000 / 60);
    diff -= mins * 1000 * 60;
    return (days > 0 ? days + ' jour' : '') + (days > 1 ? 's' : '') + ' ' +
        (hours > 0 ? hours + ' heure' : '') + (hours > 1 ? 's' : '') + ' ' +
        (mins + ' minute') + (mins > 1 ? 's' : '');
}

function formatSunTime(hour: number) {
    var h = Math.floor(hour);
    var m = Math.floor(60 * (hour - h));
    return h + 'h' + (m < 10 ? '0' : '') + m;
}

function formatSunDelta(hour: number) {
    var negative = (hour < 0);
    if (negative) hour = -hour;

    var h = Math.floor(hour);
    var m = Math.floor(60 * (hour - h));
    var s = Math.floor(3600 * (hour - h - m / 60));
    return (negative ? "Perte" : "Gain") + " de " + m + " minutes " + s + " secondes d'ensoleillement cette semaine";
}

function formatWax(wax: string) {
    if (wax == null) return '??';
    var parts = wax.split('/');
    return parts[0].trim();
}

function formatSnow(snow: string) {
    if (snow == null) return '??';
    if (snow == "N/A") return "";
    return "La neige est à " + snow + " &deg;C";
}

function formatP8(p8: string) {
    if (p8 == null) return "??";
    if (p8 == "N/A") return "--";
    return p8;
}

function formatNew24(new24: string) {
    if (new24 == null) return "??";
    return new24 + " de nouvelle neige dans les dernières 24 heures";
}

function saveToLocalStorage() {
    if (ski.updatedDate != undefined && ski.wax != undefined && ski.temperature != undefined) {
        let key = "K" + ski.updatedDate.replace(/[-:]/g, "");
        if (localStorage.getItem(key) == null) {
            localStorage.setItem(key, JSON.stringify(ski))
            console.log(`Added ${key} to localStorage`);
        }
    }
}