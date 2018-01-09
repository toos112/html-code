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
for (let i in tows) {
	tows[i].baseimage = new Image();
	tows[i].baseimage.src = tows[i].baseimgdata;
	tows[i].gunimage = new Image();
	tows[i].gunimage.src = tows[i].gunimgdata;
}

let upgr = JSON.parse("(js:
	_.I("_scripts/std.js");
	_.I("_scripts/file.js");
	_.I("_scripts/json.js");
	var result = $json.parse($file.read("data/towdef/upgrades.txt").join(""));
	for (var i in result) {
		result[i].imgdata = "" + _.img(result[i].texture);
		if (result[i].upgrades["=texture"]) {
			if (result[i].upgrades["=texture"].base) result[i].upgrades["=texture"].baseimgdata = "" + _.img(result[i].upgrades["=texture"].base);
			if (result[i].upgrades["=texture"].gun) result[i].upgrades["=texture"].gunimgdata = "" + _.img(result[i].upgrades["=texture"].gun);
		}
	}
	$.replaceAll($json.stringify(result), "\"", "\\\"");
:js)");
for (let i in upgr) {
	upgr[i].image = new Image();
	upgr[i].image.src = upgr[i].imgdata;
	if (upgr[i].upgrades["=texture"]) {
		if (upgr[i].upgrades["=texture"].baseimgdata) {
			upgr[i].upgrades["=texture"].baseimage = new Image();
			upgr[i].upgrades["=texture"].baseimage.src = upgr[i].upgrades["=texture"].baseimgdata;
		}
		if (upgr[i].upgrades["=texture"].gunimgdata) {
			upgr[i].upgrades["=texture"].gunimage = new Image();
			upgr[i].upgrades["=texture"].gunimage.src = upgr[i].upgrades["=texture"].gunimgdata;
		}
	}
}

let qs = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
};

let t = qs("t");
let HEIGHT_PADDING = parseInt(qs("hp"));
let WIDTH_PADDING = parseInt(qs("wp"));
let FONT_FAMILY = qs("f");
let FONT_SIZE = qs("fs");
let SHOW_VALUES = qs("sv");
let SHOW_PATH = qs("sp");
let UPGR_PATH = qs("up");

if (!HEIGHT_PADDING) HEIGHT_PADDING = 64;
if (!WIDTH_PADDING) WIDTH_PADDING = 16;
if (!FONT_FAMILY) FONT_FAMILY = "Arial";
if (!FONT_SIZE) FONT_SIZE = "12px";

SHOW_VALUES = SHOW_VALUES ? SHOW_VALUES.split(",") : ["upgr", "ammo", "dmg", "as", "ra", "mode", "basepath", "gunpath"];
SHOW_PATH = SHOW_PATH ? SHOW_PATH.split(",") : [];
UPGR_PATH = UPGR_PATH ? UPGR_PATH.split(",") : [];

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

let Node = function(id, isTow, sp, spi) {
	if (!sp) sp = [];
	if (spi == undefined) spi = 0;
	
	this.id = id;
	this.connected = [];
	if ((isTow ? tows[id] : upgr[id]) == undefined) {
		this.name = "undefined";
	} else {
		this.name = isTow ? tows[id].name : upgr[id].name;
		
		if (sp.length > spi && !sp[spi].startsWith(".")) {
			this.connected.push(new Node(sp[spi], false, sp, spi + 1));
		} else {
			let c = isTow ? tows[id].upgrades : upgr[id].upgrades["+upgr"];
			if (!c) c = [];
			if (sp.length > spi && sp[spi].startsWith(".")) {
				this.connected.push(new Node(c[parseInt(sp[spi].substr(1))], false, sp, spi + 1));
			} else for (let i = 0; i < c.length; i++)
					this.connected.push(new Node(c[i]));
		}
	}
	
	this.render = function(p, c, S, H) {
		if (!S) S = {};
		if (!H) H = [];
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE);
		c.fillStyle = (S[this.id] != undefined) ? "#FF0000" : "#FFFFFF";
		c.font = FONT_SIZE + " " + FONT_FAMILY;
		c.fillText(this.name, p.x - nsize.w / 2, p.y + nsize.h * 0.75);
		if (S[this.id] != undefined) {
			H.push({ x : p.x - nsize.w / 2, y : p.y, w : nsize.w, h : nsize.h, t : S[this.id] });
			return;
		}
		let xo = -this.rsize(clone(S)).cw / 2;
		S[this.id] = { x : p.x - nsize.w / 2, y : p.y, w : nsize.w, h : nsize.h, n : this };
		for (let i = 0; i < this.connected.length; i++) {
			let child = this.connected[i];
			let cSize = child.rsize(clone(S));
			let nextP = {
				x : p.x + xo + cSize.w / 2,
				y : p.y + nsize.h + HEIGHT_PADDING
			};
			c.beginPath();
			c.moveTo(p.x, p.y + nsize.h);
			if (UPGR_PATH.indexOf(child.id) != -1 && (UPGR_PATH.indexOf(this.id) != -1 || this.id.startsWith("T"))) {
				c.strokeStyle = "#00FF00";
			} else c.strokeStyle = "#FFFFFF";
			c.lineTo(nextP.x, nextP.y);
			c.stroke();
			child.render(nextP, c, S, H);
			xo += cSize.w + WIDTH_PADDING
		}
	};
	
	this.rsize = function(S) {
		if (!S) S = {};
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE);
		if (S[this.id] != undefined)
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

let makeTower = function(t) {
	let tt = tows[t];
	let tow = { ra : tt.range, ammo : tt.ammo, shp : tt.hp, upgr : tt.upgrades.slice(0), lock : [], basepath : tt.texture.base, gunpath : tt.texture.gun,
		as : tt.attackSpeed, baseimage : tt.baseimage, gunimage : tt.gunimage, dmg : tt.damage, mode : tt.mode };
	return tow;
};

let applyEffect = function(obj, name, val) {
	if (obj[name] == -1) return obj;
	let mod = name.substring(0, 1);
	let vn = name.substring(1, name.length);
	if (vn != "texture") val = clone(val);
	if (mod == "=") {
		if (vn == "texture") {
			if (val.baseimage) {
				obj.basepath = val.base;
				obj.baseimage = val.baseimage;
			}
			if (val.gunimage) {
				obj.gunpath = val.gun;
				obj.gunimage = val.gunimage;
			}
		} else if (obj[vn] instanceof Array) obj[vn] = val.splice(0);
		else obj[vn] = val;
	} else if (mod == "%") {
		obj[vn] *= val;
	} else if (mod == "+") {
		if (obj[vn] instanceof Array) obj[vn] = obj[vn].concat(val);
		else obj[vn] += val;
	} else if (mod == "-") {
		if (obj[vn] instanceof Array) obj[vn] = obj[vn].filter(function(e) { return val.indxeOf(e) < 0; });
		else obj[vn] -= val;
	}
	return obj;
};

let upgradeTower = function(tow, u) {
	let newUpgr = upgr[u];
	for (let upgr in newUpgr.upgrades)
		applyEffect(tow, upgr, newUpgr.upgrades[upgr]);
	for (let locked in tow.lock)
		for (let i = 0; i < tow.upgr.length; i++)
			if (tow.upgr[i] == tow.lock[locked])
				tow.upgr.splice(i, 1);
};


let mx, my, lastNodeIndex = -1;
window.onload = function() {
	let div = document.getElementById("d");
	let canvas = document.getElementById("c");
	let context = canvas.getContext("2d");
	let root = new Node(t, true, SHOW_PATH);
	let S = {}, H = [], tow;
	
	let update = function() {
		tow = makeTower(t);
		for (let i = 0; i < UPGR_PATH.length; i++)
			upgradeTower(tow, UPGR_PATH[i]);
		let vals = [];
		for (let i = 0; i < SHOW_VALUES.length; i++)
			vals.push(SHOW_VALUES[i] + ": " + tow[SHOW_VALUES[i]]);
		
		div.innerHTML = vals.join("<br>");
		context.clearRect(0, 0, canvas.width, canvas.height);
		root.render({ x : 400, y : HEIGHT_PADDING }, context);
		for (let i = 0; i < H.length; i++) {
			if (mx >= H[i].x && mx < H[i].x + H[i].w && my >= H[i].y && my < H[i].y + H[i].h) {
				context.globalAlpha = 0.25;
				context.fillStyle = "#FF0000";
				context.fillRect(H[i].x, H[i].y, H[i].w, H[i].h);
				context.fillStyle = "#FFFFFF";
				context.fillRect(H[i].t.x, H[i].t.y, H[i].t.w, H[i].t.h);
				context.globalAlpha = 1;
				break;
			}
		}
		
		for (let i = 0; i < tow.upgr.length; i++) {
			context.globalAlpha = 0.25;
			context.fillStyle = "#0000FF";
			context.fillRect(S[tow.upgr[i]].x, S[tow.upgr[i]].y, S[tow.upgr[i]].w, S[tow.upgr[i]].h);
			context.globalAlpha = 1;
		}

		context.imageSmoothingEnabled = false;
		context.drawImage(tow.baseimage, 8, 8, tows[t].width * 32, tows[t].height * 32);
		context.drawImage(tow.gunimage, 8, 8, tows[t].width * 32, tows[t].height * 32);
	};

	canvas.addEventListener("mousemove", function(e) {
		let rect = canvas.getBoundingClientRect();
		mx = e.clientX - rect.left, my = e.clientY - rect.top;
		let found = false;
		for (let i = 0; i < H.length; i++) {
			if (mx >= H[i].x && mx < H[i].x + H[i].w && my >= H[i].y && my < H[i].y + H[i].h) {
				if (lastNodeIndex == i) {
					found = true;
					break;
				}
				lastNodeIndex = i;
				update();
				found = true;
				break;
			}
		}
		if (!found) {
			if (lastNodeIndex != -1)
				update();
			lastNodeIndex = -1;
		}
	}, false);
	
	canvas.addEventListener("mousedown", function(e) {
		let n = undefined;
		for (let p in S) {
			if (mx >= S[p].x && mx < S[p].x + S[p].w && my >= S[p].y && my < S[p].y + S[p].h) {
				n = S[p].n;
				break;
			}
		}
		if (!n) return;
		
		let i = UPGR_PATH.indexOf(n.id);
		if (i != -1) i++;
		if (n.id.startsWith("T")) i = 0;
		if (i != -1) {
			UPGR_PATH.splice(i, UPGR_PATH.length - i);
			update();
			return;
		}
		
		if (tow.upgr.indexOf(n.id) != -1) {
			UPGR_PATH.push(n.id);
			update();
			return;
		}
	}, false);
	
	root.render({ x : 400, y : HEIGHT_PADDING }, context, S, H);
	update();
};