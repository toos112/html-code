let tows = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	var result = $json.parse($file.read("data/towdef/towers.txt").join(""));
	for (var i in result) {
		result[i].baseimgdata = "" + _.img(result[i].texture.base);
		result[i].gunimgdata = "" + _.img(result[i].texture.gun);
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");

let upgr = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("_scripts/json.js");
	var result = $json.parse($file.read("data/towdef/upgrades.txt").join(""));
	for (var i in result) {
		result[i].imgdata = "" + _.img(result[i].texture);
		if (result[i].upgrades["=texture"]) {
			result[i].upgrades["=texture"].baseimgdata = "" + _.img(result[i].upgrades["=texture"].base);
			result[i].upgrades["=texture"].gunimgdata = "" + _.img(result[i].upgrades["=texture"].gun);
		}
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");

let qs = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

let u = qs("u");
let HEIGHT_PADDING = parseInt(qs("hp"));
let WIDTH_PADDING = parseInt(qs("wp"));
let FONT_FAMILY = qs("f");
let FONT_SIZE = qs("fs");

if (!HEIGHT_PADDING) HEIGHT_PADDING = 64;
if (!WIDTH_PADDING) WIDTH_PADDING = 16;
if (!FONT_FAMILY) FONT_FAMILY = "Arial";
if (!FONT_SIZE) FONT_SIZE = "12px";

let tsize = function(text, font, size) {
	let t = document.getElementById("t");
	t.innerHTML = text;
	t.style.fontFamily = font;
	t.style.fontSize = size;
	return { w : t.clientWidth, h : t.clientHeight };
};

let clone = function(obj) {
	return JSON.parse(JSON.stringify(obj));
};

let Node = function(id, isTow) {
	this.id = id;
	this.connected = [];
	if ((isTow ? tows[id] : upgr[id]) == undefined) {
		this.name = "undefined";
	} else {
		if (isTow == undefined) isTow = false;
		this.name = isTow ? tows[id].name : upgr[id].name;
		
		let c = isTow ? tows[id].upgrades : upgr[id].upgrades["+upgr"];
		if (!c) c = [];
		for (let i = 0; i < c.length; i++)
			this.connected.push(new Node(c[i]));
	}
	
	this.render = function(p, c, S, H) {
		if (!S) S = {};
		if (!H) H = [];
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE);
		c.fillStyle = (S[this.id] != undefined && this.connected.length > 0) ? "#FF0000" : "#FFFFFF", c.strokeStyle = "#FFFFFF"
		c.font = FONT_SIZE + " " + FONT_FAMILY;
		c.fillText(this.name, p.x - nsize.w / 2, p.y + nsize.h * 0.75);
		if (S[this.id] != undefined && this.connected.length > 0) {
			H.push({ x : p.x - nsize.w / 2, y : p.y, w : nsize.w, h : nsize.h, t : S[this.id] });
			return;
		}
		let xo = -this.rsize(clone(S)).cw / 2;
		S[this.id] = { x : p.x - nsize.w / 2, y : p.y, w : nsize.w, h : nsize.h };
		for (let i = 0; i < this.connected.length; i++) {
			let child = this.connected[i];
			let cSize = child.rsize(clone(S));
			let nextP = {
				x : p.x + xo + cSize.w / 2,
				y : p.y + nsize.h + HEIGHT_PADDING
			};
			c.beginPath();
			c.moveTo(p.x, p.y + nsize.h);
			c.lineTo(nextP.x, nextP.y);
			c.stroke();
			child.render(nextP, c, S, H);
			xo += cSize.w + WIDTH_PADDING
		}
	};
	
	this.rsize = function(S) {
		if (!S) S = {};
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE);
		if (S[this.id] != undefined && this.connected.length > 0)
			return { w : nsize.w, h : nsize.h, cw : nsize.w };
		S[this.id] = {};
		if (this.connected.length == 0)
			return { w : nsize.w, h : nsize.h, cw : nsize.w };
		let cSize = [];
		for (let i = 0; i < this.connected.length; i++)
			cSize.push(this.connected[i].rsize(S));
		let mh = cSize.reduce((a, b) => ({ w : 0, h : Math.max(a.h, b.h) }), { w : 0, h : 0 }).h;
		let sw = cSize.reduce((a, b) => ({ w : a.w + b.w, h : 0 }), { w : 0, h : 0 }).w;
		let cw = sw + (this.connected.length - 1) * WIDTH_PADDING;
		return {
			w : Math.max(cw, nsize.w),
			cw : cw,
			h : nsize.h + mh + HEIGHT_PADDING
		};
	};
};

window.onload = function() {
	let canvas = document.getElementById("c");
	let context = canvas.getContext("2d");
	let root = new Node(u, true);
	let S = {}, H = [];
	root.render({ x : 400, y : HEIGHT_PADDING }, context, S, H);

	canvas.addEventListener("mousemove", function(e) {
		let rect = canvas.getBoundingClientRect();
		let mx = e.clientX - rect.left, my = e.clientY - rect.top;
		let found = false;
		for (let i = 0; i < H.length; i++) {
			if (mx >= H[i].x && mx < H[i].x + H[i].w && my >= H[i].y && my < H[i].y + H[i].h) {
				context.clearRect(0, 0, canvas.width, canvas.height);
				root.render({ x : 400, y : HEIGHT_PADDING }, context);
				context.globalAlpha = 0.25;
				context.fillStyle = "#FF0000";
				context.fillRect(H[i].x, H[i].y, H[i].w, H[i].h);
				context.fillStyle = "#FFFFFF";
				context.fillRect(H[i].t.x, H[i].t.y, H[i].t.w, H[i].t.h);
				context.globalAlpha = 1;
				found = true;
				break;
			}
		}
		if (!found) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			root.render({ x : 400, y : HEIGHT_PADDING }, context);
		}
	}, false);
};