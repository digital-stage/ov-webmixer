var __spreadArray = (this && this.__spreadArray) || function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
};
var url;
console.log("Using url: " + url);
var socket = new WebSocket(url);
function emit(event, payload) {
    var additionalPayloads = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        additionalPayloads[_i - 2] = arguments[_i];
    }
    var msg = JSON.stringify({ e: event, d: __spreadArray([payload ? payload : null], additionalPayloads) });
    socket.send(msg);
}
function str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
}
function sec2minsec(t) {
    var minutes = Math.floor(t / 60);
    var seconds = Math.floor(t - 60 * minutes);
    var sec10 = Math.floor(10 * (t - Math.floor(t)));
    return str_pad_left(minutes, '0', 2) + ':' + str_pad_left(seconds, '0', 2) + '.' + sec10;
}
function recerror(e) {
    var el = document.getElementById("recerr");
    if (el.childNodes.length > 0)
        el.replaceChild(document.createTextNode(e), el.childNodes[0]);
    else
        el.appendChild(document.createTextNode(e));
}
var form = document.getElementById("mixer");
form.oninput = handleChange;
function handleChange(e) {
    if (e.target.id.substr(0, 3) == "txt") {
        emit("msg", { path: e.target.id.substr(3), value: e.target.valueAsNumber });
        var fad = document.getElementById(e.target.id.substr(3));
        if (fad != null) {
            //fad.value = val;
        }
    }
    else {
        emit("msg", { path: e.target.id, value: e.target.valueAsNumber });
        var fadt = document.getElementById(e.target.id);
        if (fadt != null) {
            //fadt.value = val.toFixed(1);
        }
    }
}
function jackrec_start() {
    emit("msg", { path: '/jackrec/clear', value: null });
    var el = document.getElementById("portlist");
    var ports = el.getElementsByClassName('jackport');
    for (var k = 0; k < ports.length; k++) {
        if (ports[k].checked) {
            emit("msg", { path: '/jackrec/addport', value: ports[k].getAttribute('value') });
        }
    }
    recerror('');
    emit("msg", { path: '/jackrec/start', value: null });
}
function jackrec_delete() {
    var el = document.getElementById("filelist");
    var ports = el.getElementsByClassName('filename');
    for (var k = 0; k < ports.length; k++) {
        if (ports[k].checked) {
            emit("msg", { path: '/jackrec/rmfile', value: ports[k].getAttribute('value') });
        }
    }
    emit('msg', { path: '/jackrec/listfiles', value: null });
    document.getElementById("selectallfiles").checked = false;
}
function jackrec_stop() {
    recerror('');
    emit("msg", { path: '/jackrec/stop', value: null });
    emit('msg', { path: '/jackrec/listfiles', value: null });
}
function jackrec_selectallfiles() {
    var ischecked = document.getElementById("selectallfiles").checked;
    var el = document.getElementById("filelist");
    var ports = el.getElementsByClassName('filename');
    for (var k = 0; k < ports.length; k++) {
        ports[k].checked = ischecked;
    }
}
socket.onopen = function () {
    emit("config", {});
};
socket.onmessage = function (m) {
    var _a = JSON.parse(m.data), e = _a.e, d = _a.d;
    switch (e) {
        case "scene": {
            var scene = d[0];
            var el = document.getElementById("mixer");
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            var elheader = document.createElement("h2");
            elheader.setAttribute("class", "scene");
            el.append(scene, elheader);
            var elgainstore = document.createElement("p");
            elgainstore.setAttribute("class", "gainstore");
            el.appendChild(elgainstore);
            break;
        }
        case "newfader": {
            var faderno = d[0];
            var val = d[1];
            var fader = "/touchosc/fader" + faderno;
            var levelid = "/touchosc/level" + faderno;
            var el_div = document.createElement("div");
            var el_mixer = document.getElementById("mixer");
            var classname = "mixerstrip";
            if (val == "ego")
                classname = classname + " mixerego";
            if ((val == "master") || (val == "reverb"))
                classname = classname + " mixerother";
            el_div.setAttribute("class", classname);
            var el_lab = document.createElement("label");
            el_lab.setAttribute("for", fader);
            el_lab.append(val);
            var el_fader = document.createElement("input");
            el_fader.setAttribute("class", "fader");
            el_fader.setAttribute("type", "range");
            el_fader.setAttribute("min", "-20");
            el_fader.setAttribute("max", "10");
            el_fader.setAttribute("value", val);
            el_fader.setAttribute("step", "0.1");
            el_fader.setAttribute("id", fader);
            var el_gaintext = document.createElement("input");
            el_gaintext.setAttribute("type", "number");
            el_gaintext.setAttribute("class", "gaintxtfader");
            el_gaintext.setAttribute("min", "-20");
            el_gaintext.setAttribute("max", "10");
            el_gaintext.setAttribute("value", val);
            el_gaintext.setAttribute("step", "0.1");
            el_gaintext.setAttribute("id", "txt" + fader);
            var el_meter = document.createElement("meter");
            el_meter.setAttribute("class", "level");
            el_meter.setAttribute("min", "0");
            el_meter.setAttribute("max", "94");
            el_meter.setAttribute("low", "71");
            el_meter.setAttribute("high", "84");
            el_meter.setAttribute("optimum", "54");
            el_meter.setAttribute("value", val);
            el_meter.setAttribute("id", levelid);
            var el_metertext = document.createElement("input");
            el_metertext.setAttribute("type", "text");
            el_metertext.setAttribute("readonly", "true");
            el_metertext.setAttribute("class", "gaintxtfader");
            el_metertext.setAttribute("value", val);
            el_metertext.setAttribute("id", "txt" + levelid);
            el_mixer.appendChild(el_div);
            el_div.appendChild(el_lab);
            el_div.appendChild(document.createElement("br"));
            el_div.appendChild(el_fader);
            el_div.appendChild(el_gaintext);
            el_div.appendChild(document.createElement("br"));
            el_div.appendChild(el_meter);
            el_div.appendChild(el_metertext);
            break;
        }
        case "updatefader": {
            var fader = d[0];
            var val = d[1];
            var fad = document.getElementById(fader);
            if (fad != null) {
                fad.value = val;
            }
            var fadt = document.getElementById("txt" + fader);
            if (fadt != null) {
                fadt.value = val.toFixed(1);
            }
            break;
        }
        case "jackrecerr": {
            recerror(d[0]);
            break;
        }
        case "jackrectime": {
            var el = document.getElementById("rectime");
            el.setAttribute("value", sec2minsec(d[0]));
            break;
        }
        case "jackrecportlist": {
            var el = document.getElementById("portlist");
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            break;
        }
        case "jackrecaddport": {
            var p = d[0];
            var el = document.getElementById("portlist");
            var div = el.appendChild(document.createElement('div'));
            var inp = div.appendChild(document.createElement('input'));
            inp.setAttribute('type', 'checkbox');
            inp.setAttribute('value', p);
            inp.setAttribute('id', p);
            inp.setAttribute('class', 'jackport checkbox');
            var lab = div.appendChild(document.createElement('label'));
            lab.setAttribute('for', p);
            lab.appendChild(document.createTextNode(p));
            break;
        }
        case "jackrecfilelist": {
            var el = document.getElementById("filelist");
            while (el.firstChild) {
                el.removeChild(el.firstChild);
            }
            break;
        }
        case "jackrecaddfile": {
            var p = d[0];
            var el = document.getElementById("filelist");
            var div = el.appendChild(document.createElement('div'));
            var inp = div.appendChild(document.createElement('input'));
            inp.setAttribute('type', 'checkbox');
            inp.setAttribute('value', p);
            inp.setAttribute('class', 'filename');
            var lab = div.appendChild(document.createElement('a'));
            lab.setAttribute('href', p);
            lab.appendChild(document.createTextNode(p));
            break;
        }
        case "jackrecstart": {
            var el = document.getElementById("recindicator");
            el.style.display = 'inline-block'; // = 'display: inline-block;';
            break;
        }
        case "jackrecstop": {
            var el = document.getElementById("recindicator");
            el.style.display = 'none'; // = 'display: inline-block;';
            break;
        }
    }
};
