/// <reference path="soleil.ts" />

var month_names = [ 'janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre' ];
var periodes = [ '', 'Ce soir', 'Cette nuit', 'Ce matin', 'Cet après-midi' ];

interface ISkiData {
    updatedDate: string
    wax: string
    p8: string
    keogan: string
    temperature: number
    feelsLike: number
    windSpeed: number
}
let ski = <ISkiData>{};


document.addEventListener('DOMContentLoaded', function () {
    var url = "https://services2.arcgis.com/WLyMuW006nKOfa5Z/arcgis/rest/services/Ski_Info_Pub/FeatureServer/0/query?where=1%3D1&returnGeometry=false&outFields=*&f=pgeojson";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
		if (xhr.readyState == 4 && xhr.status == 200) {
            parseEsriData(JSON.parse(xhr.responseText));
		}
	};
    xhr.send();

    // var url2 = "https://www.meteomedia.com/dataaccess/citypage/json/caqc0177?callback=parseCitypageData&t=" + new Date().getTime();
    // var script2 = document.createElement("script");        
    // script2.setAttribute("src", url2);
    // script2.setAttribute("type", "text/javascript");                
    // document.body.appendChild(script2);
    window.fetch(`https://h0th8gm47e.execute-api.us-east-1.amazonaws.com/api/data?cm=caqc0177`)
        .then(res => res.json())
        .then(json => {
            parseCitypageData(json);
        });

    var timezone = new Date().getTimezoneOffset() / 60;
    var sun = computeSunrise(new Date(), 45.5, 75.5);
    document.getElementById("lever-coucher-text")!.innerHTML = formatSunTime(sun.sunriseGMT - timezone) + " - " + formatSunTime(sun.sunsetGMT - timezone);
    document.getElementById("semaine-text")!.innerHTML = formatSunDelta(sun.semaine);
}, false);

function parseEsriData(data: any) {
    let props = data.features[0].properties;

    var snow = props.TEMP;
    var wax = props.WAX_FR;
    var new24 = props.SNOW_24HR;
    var p8 = props.BASE_P8;
    var keogan = props.BASE_LAC_FORTUNE;

    ski.updatedDate = parseToZulu(props.LAST_UPDATED_EN, props.LAST_UPDATED_FR);
    ski.wax = wax;
    ski.p8 = formatP8(p8);
    ski.keogan = formatP8(keogan);
    saveToLocalStorage();

    document.getElementById('updated-text')!.innerHTML = formatUpdated(ski.updatedDate);
    document.getElementById('updated-text-2')!.innerHTML = "Il y a " + formatElapsed(ski.updatedDate);
    document.getElementById('wax-text')!.innerHTML = ski.wax;
    document.getElementById('snow-text')!.innerHTML = formatSnow(snow);
    document.getElementById('p8-text')!.innerHTML = ski.p8;
    document.getElementById('new24-text')!.innerHTML = formatNew24(new24);
    document.getElementById('keogan-text')!.innerHTML = ski.keogan;
}

function parseCitypageData(response: any) {
    var obs = response.obs;
    ski.temperature = obs.temperature_c;
    ski.feelsLike = obs.feelsLike_c;
    ski.windSpeed = obs.windSpeed_kmh;
    saveToLocalStorage();

    document.getElementById('obs-text')!.innerHTML = obs.tc + "&deg;C (" + obs.fc + "&deg;C) " + obs.w + " km/h";

    var pa = response.sterm.periods[0];
    document.getElementById('forecast-a-text')!.innerHTML = 
        pa.tstl + ": " +
        pa.t + ' &deg;C (' + pa.f + '&deg;C) ' +
        pa.w + ' km/h ' +
        pa.pp + '% ' +
        (pa.r != "-" ? pa.r + ' pluie' : '') +
        (pa.r != "-" && pa.s != "-" ? ', ' : '') +
        (pa.s != "-" ? pa.s + ' neige' : '');

    pa = response.sterm.periods[1];
    document.getElementById('forecast-b-text')!.innerHTML = 
        pa.tstl + ": " +
        pa.t + ' &deg;C (' + pa.f + '&deg;C) ' +
        pa.w + ' km/h ' +
        pa.pp + '% ' +
        (pa.r != "-" ? pa.r + ' pluie' : '') +
        (pa.r != "-" && pa.s != "-" ? ', ' : '') +
        (pa.s != "-" ? pa.s + ' neige' : '');
}

function parseToZulu(en: string, fr: string) {
    let enfr = en.replace(/th /, " ");
    return new Date(enfr).toISOString().replace(".000Z", "Z");
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

function formatSnow(snow: string) {
    if (snow == null) return '??';
    if (snow == "N/A") return "";
    return "La neige est à " + snow;
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