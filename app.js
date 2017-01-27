function computeSunrise(date, latitude, longitude) {
    var sun = SunriseSunset(date, longitude, latitude);
    var sun2 = SunriseSunset(AddDaysToDate(date, 1), longitude, latitude);
    var oneday = (sun2.setTimeGMT - sun2.riseTimeGMT) - (sun.setTimeGMT - sun.riseTimeGMT);
    var sun3 = SunriseSunset(AddDaysToDate(date, 7), longitude, latitude);
    var oneweek = (sun3.setTimeGMT - sun3.riseTimeGMT) - (sun.setTimeGMT - sun.riseTimeGMT);
    return {
        sunriseGMT: sun.riseTimeGMT,
        sunsetGMT: sun.setTimeGMT,
        demain: oneday,
        semaine: oneweek
    };
}
function AddDaysToDate(date, days) {
    return new Date(date.getTime() + 24 * 60 * 60 * 1000 * days);
}
//
// This code was derived from the code appearing at
// http://www.srrb.noaa.gov/highlights/sunrise/sunrise.html
//
function isLeapYear(yr) {
    return ((yr % 4 == 0 && yr % 100 != 0) || yr % 400 == 0);
}
function radToDeg(angleRad) {
    return (180.0 * angleRad / Math.PI);
}
function degToRad(angleDeg) {
    return (Math.PI * angleDeg / 180.0);
}
function calcDayOfYear(mn, dy, lpyr) {
    var k = (lpyr ? 1 : 2);
    var doy = Math.floor((275 * mn) / 9) - k * Math.floor((mn + 9) / 12) + dy - 30;
    return doy;
}
function calcDayOfWeek(juld) {
    var A = (juld + 1.5) % 7;
    var DOW = (A == 0) ? "Sunday" : (A == 1) ? "Monday" : (A == 2) ? "Tuesday" : (A == 3) ? "Wednesday" : (A == 4) ? "Thursday" : (A == 5) ? "Friday" : "Saturday";
    return DOW;
}
function calcJD(year, month, day) {
    if (month <= 2) {
        year -= 1;
        month += 12;
    }
    var A = Math.floor(year / 100);
    var B = 2 - A + Math.floor(A / 4);
    var JD = Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
    return JD;
}
function calcTimeJulianCent(jd) {
    var T = (jd - 2451545.0) / 36525.0;
    return T;
}
function calcJDFromJulianCent(t) {
    var JD = t * 36525.0 + 2451545.0;
    return JD;
}
function calcGeomMeanLongSun(t) {
    var L0 = 280.46646 + t * (36000.76983 + 0.0003032 * t);
    while (L0 > 360.0) {
        L0 -= 360.0;
    }
    while (L0 < 0.0) {
        L0 += 360.0;
    }
    return L0; // in degrees
}
function calcGeomMeanAnomalySun(t) {
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    return M; // in degrees
}
function calcEccentricityEarthOrbit(t) {
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    return e; // unitless
}
function calcSunEqOfCenter(t) {
    var m = calcGeomMeanAnomalySun(t);
    var mrad = degToRad(m);
    var sinm = Math.sin(mrad);
    var sin2m = Math.sin(mrad + mrad);
    var sin3m = Math.sin(mrad + mrad + mrad);
    var C = sinm * (1.914602 - t * (0.004817 + 0.000014 * t)) + sin2m * (0.019993 - 0.000101 * t) + sin3m * 0.000289;
    return C; // in degrees
}
function calcSunTrueLong(t) {
    var l0 = calcGeomMeanLongSun(t);
    var c = calcSunEqOfCenter(t);
    var O = l0 + c;
    return O; // in degrees
}
function calcSunTrueAnomaly(t) {
    var m = calcGeomMeanAnomalySun(t);
    var c = calcSunEqOfCenter(t);
    var v = m + c;
    return v; // in degrees
}
function calcSunRadVector(t) {
    var v = calcSunTrueAnomaly(t);
    var e = calcEccentricityEarthOrbit(t);
    var R = (1.000001018 * (1 - e * e)) / (1 + e * Math.cos(degToRad(v)));
    return R; // in AUs
}
function calcSunApparentLong(t) {
    var o = calcSunTrueLong(t);
    var omega = 125.04 - 1934.136 * t;
    var lambda = o - 0.00569 - 0.00478 * Math.sin(degToRad(omega));
    return lambda; // in degrees
}
function calcMeanObliquityOfEcliptic(t) {
    var seconds = 21.448 - t * (46.8150 + t * (0.00059 - t * (0.001813)));
    var e0 = 23.0 + (26.0 + (seconds / 60.0)) / 60.0;
    return e0; // in degrees
}
function calcObliquityCorrection(t) {
    var e0 = calcMeanObliquityOfEcliptic(t);
    var omega = 125.04 - 1934.136 * t;
    var e = e0 + 0.00256 * Math.cos(degToRad(omega));
    return e; // in degrees
}
function calcSunRtAscension(t) {
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);
    var tananum = (Math.cos(degToRad(e)) * Math.sin(degToRad(lambda)));
    var tanadenom = (Math.cos(degToRad(lambda)));
    var alpha = radToDeg(Math.atan2(tananum, tanadenom));
    return alpha; // in degrees
}
function calcSunDeclination(t) {
    var e = calcObliquityCorrection(t);
    var lambda = calcSunApparentLong(t);
    var sint = Math.sin(degToRad(e)) * Math.sin(degToRad(lambda));
    var theta = radToDeg(Math.asin(sint));
    return theta; // in degrees
}
function calcEquationOfTime(t) {
    var epsilon = calcObliquityCorrection(t);
    var l0 = calcGeomMeanLongSun(t);
    var e = calcEccentricityEarthOrbit(t);
    var m = calcGeomMeanAnomalySun(t);
    var y = Math.tan(degToRad(epsilon) / 2.0);
    y *= y;
    var sin2l0 = Math.sin(2.0 * degToRad(l0));
    var sinm = Math.sin(degToRad(m));
    var cos2l0 = Math.cos(2.0 * degToRad(l0));
    var sin4l0 = Math.sin(4.0 * degToRad(l0));
    var sin2m = Math.sin(2.0 * degToRad(m));
    var Etime = y * sin2l0 - 2.0 * e * sinm + 4.0 * e * y * sinm * cos2l0
        - 0.5 * y * y * sin4l0 - 1.25 * e * e * sin2m;
    return radToDeg(Etime) * 4.0; // in minutes of time
}
function calcHourAngleSunrise(lat, solarDec) {
    var latRad = degToRad(lat);
    var sdRad = degToRad(solarDec);
    var HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
    var HA = (Math.acos(Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad)));
    return HA; // in radians
}
function calcHourAngleSunset(lat, solarDec) {
    var latRad = degToRad(lat);
    var sdRad = degToRad(solarDec);
    var HAarg = (Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad));
    var HA = (Math.acos(Math.cos(degToRad(90.833)) / (Math.cos(latRad) * Math.cos(sdRad)) - Math.tan(latRad) * Math.tan(sdRad)));
    return -HA; // in radians
}
function calcSunriseUTC(JD, latitude, longitude) {
    var t = calcTimeJulianCent(JD);
    // *** Find the time of solar noon at the location, and use
    // that declination. This is better than start of the
    // Julian day
    var noonmin = calcSolNoonUTC(t, longitude);
    var tnoon = calcTimeJulianCent(JD + noonmin / 1440.0);
    // *** First pass to approximate sunrise (using solar noon)
    var eqTime = calcEquationOfTime(tnoon);
    var solarDec = calcSunDeclination(tnoon);
    var hourAngle = calcHourAngleSunrise(latitude, solarDec);
    var delta = longitude - radToDeg(hourAngle);
    var timeDiff = 4 * delta; // in minutes of time
    var timeUTC = 720 + timeDiff - eqTime; // in minutes
    // alert("eqTime = " + eqTime + "\nsolarDec = " + solarDec + "\ntimeUTC = " + timeUTC);
    // *** Second pass includes fractional jday in gamma calc
    var newt = calcTimeJulianCent(calcJDFromJulianCent(t) + timeUTC / 1440.0);
    eqTime = calcEquationOfTime(newt);
    solarDec = calcSunDeclination(newt);
    hourAngle = calcHourAngleSunrise(latitude, solarDec);
    delta = longitude - radToDeg(hourAngle);
    timeDiff = 4 * delta;
    timeUTC = 720 + timeDiff - eqTime; // in minutes
    // alert("eqTime = " + eqTime + "\nsolarDec = " + solarDec + "\ntimeUTC = " + timeUTC);
    return timeUTC;
}
function calcSolNoonUTC(t, longitude) {
    var newt = calcTimeJulianCent(calcJDFromJulianCent(t) + 0.5 + longitude / 360.0);
    var eqTime = calcEquationOfTime(newt);
    var solarNoonDec = calcSunDeclination(newt);
    var solNoonUTC = 720 + (longitude * 4) - eqTime; // min
    return solNoonUTC;
}
function calcSunsetUTC(JD, latitude, longitude) {
    var t = calcTimeJulianCent(JD);
    // *** Find the time of solar noon at the location, and use
    // that declination. This is better than start of the
    // Julian day
    var noonmin = calcSolNoonUTC(t, longitude);
    var tnoon = calcTimeJulianCent(JD + noonmin / 1440.0);
    // First calculates sunrise and approx length of day
    var eqTime = calcEquationOfTime(tnoon);
    var solarDec = calcSunDeclination(tnoon);
    var hourAngle = calcHourAngleSunset(latitude, solarDec);
    var delta = longitude - radToDeg(hourAngle);
    var timeDiff = 4 * delta;
    var timeUTC = 720 + timeDiff - eqTime;
    // first pass used to include fractional day in gamma calc
    var newt = calcTimeJulianCent(calcJDFromJulianCent(t) + timeUTC / 1440.0);
    eqTime = calcEquationOfTime(newt);
    solarDec = calcSunDeclination(newt);
    hourAngle = calcHourAngleSunset(latitude, solarDec);
    delta = longitude - radToDeg(hourAngle);
    timeDiff = 4 * delta;
    timeUTC = 720 + timeDiff - eqTime; // in minutes
    return timeUTC;
}
function SunriseSunset(date, longitude, latitude) {
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var year = date.getUTCFullYear(); //NOTE: For 2008, date.getYear() will return 108 in firefox
    var JD = (calcJD(year, month, day));
    var dow = calcDayOfWeek(JD);
    var doy = calcDayOfYear(month, day, isLeapYear(year));
    var T = calcTimeJulianCent(JD);
    var rtAsc = calcSunRtAscension(T);
    var solarDec = calcSunDeclination(T);
    var eqTime = calcEquationOfTime(T);
    // Calculate sunrise, sunset and solar noon for this date (in decimal hours)
    var riseTimeGMT = calcSunriseUTC(JD, latitude, longitude) / 60.0;
    var setTimeGMT = calcSunsetUTC(JD, latitude, longitude) / 60.0;
    var solNoonGMT = calcSolNoonUTC(T, longitude) / 60.0;
    return {
        riseTimeGMT: riseTimeGMT,
        setTimeGMT: setTimeGMT,
        solNoonGMT: solNoonGMT,
        solarDec: solarDec,
        eqTime: eqTime,
        rtAsc: rtAsc
    };
}
/// <reference path="soleil.ts" />
var month_names = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
var periodes = ['', 'Ce soir', 'Cette nuit', 'Ce matin', 'Cet après-midi'];
var ski = {};
document.addEventListener('DOMContentLoaded', function () {
    var url = "https://services2.arcgis.com/WLyMuW006nKOfa5Z/arcgis/rest/services/AGOL_GP_WINTER_TRAILS_INFO/FeatureServer/0/query?where=1%3D1&returnGeometry=false&outFields=*&f=pgeojson";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && xhr.status == 200) {
            parseEsriData(JSON.parse(xhr.responseText));
        }
    };
    xhr.send();
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
function parseEsriData(data) {
    var props = data.features[0].properties;
    var snow = props.TEMP;
    var wax = props.WAX_FR;
    var new24 = props.SNOW_24HR;
    var p8 = props.BASE_P8;
    ski.updatedDate = parseToZulu(props.LAST_UPDATED_EN, props.LAST_UPDATED_FR);
    ski.wax = wax;
    ski.p8 = formatP8(p8);
    saveToLocalStorage();
    document.getElementById('updated-text').innerHTML = formatUpdated(ski.updatedDate);
    document.getElementById('updated-text-2').innerHTML = "Il y a " + formatElapsed(ski.updatedDate);
    document.getElementById('wax-text').innerHTML = ski.wax;
    document.getElementById('snow-text').innerHTML = formatSnow(snow);
    document.getElementById('p8-text').innerHTML = ski.p8;
    document.getElementById('new24-text').innerHTML = formatNew24(new24);
}
function parseCitypageData(response) {
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
function parseToZulu(en, fr) {
    var enfr = en.split(" at ")[0] + " " + fr.split(" à ")[1].replace("h", ":");
    return new Date(enfr).toISOString().replace(".000Z", "Z");
}
function formatUpdated(updated) {
    var date = new Date(updated);
    var yyyy = date.getFullYear();
    var mo = month_names[date.getMonth()];
    var dd = date.getDate();
    var hh = date.getHours();
    var mm = date.getMinutes();
    return dd + ' ' + mo + ' à ' + hh + 'h' + (mm < 10 ? '0' : '') + mm;
}
function formatElapsed(updated) {
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
function formatSunTime(hour) {
    var h = Math.floor(hour);
    var m = Math.floor(60 * (hour - h));
    return h + 'h' + (m < 10 ? '0' : '') + m;
}
function formatSunDelta(hour) {
    var negative = (hour < 0);
    if (negative)
        hour = -hour;
    var h = Math.floor(hour);
    var m = Math.floor(60 * (hour - h));
    var s = Math.floor(3600 * (hour - h - m / 60));
    return (negative ? "Perte" : "Gain") + " de " + m + " minutes " + s + " secondes d'ensoleillement cette semaine";
}
function formatSnow(snow) {
    if (snow == null)
        return '??';
    if (snow == "N/A")
        return "";
    return "La neige est à " + snow;
}
function formatP8(p8) {
    if (p8 == null)
        return "??";
    if (p8 == "N/A")
        return "--";
    return p8;
}
function formatNew24(new24) {
    if (new24 == null)
        return "??";
    return new24 + " de nouvelle neige dans les dernières 24 heures";
}
function saveToLocalStorage() {
    if (ski.updatedDate != undefined && ski.wax != undefined && ski.temperature != undefined) {
        var key = "K" + ski.updatedDate.replace(/[-:]/g, "");
        if (localStorage.getItem(key) == null) {
            localStorage.setItem(key, JSON.stringify(ski));
            console.log("Added " + key + " to localStorage");
        }
    }
}
//# sourceMappingURL=app.js.map