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

let HEIGHT_PADDING = 32;
let WIDTH_PADDING = 16;
let FONT_FAMILY = "Courier";
let FONT_SIZE = "12px";

let u = function(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}("u");

let tsize = function(text, font, size, ctx) {
	let t = document.getElementById("t");
	t.innerHTML = text;
	t.style.fontFamily = font;
	t.style.fontSize = size;
	return { w : t.clientWidth, h : t.clientHeight };
};

let Node = function(id) {
	this.name = upgr[id].name;
	this.connected = [];
	
	let c = upgr[id].upgrades["+upgr"];
	if (!c) c = [];
	for (let i = 0; i < c.length; i++)
		this.connected.push(new Node(c[i]));
	
	this.render = function(p, c) {
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE, c);
		c.fillStyle = "#fff", c.strokeStyle = "#fff"
		c.font = FONT_SIZE + " " + FONT_FAMILY;
		c.fillText(this.name, p.x - nsize.w / 2, p.y + nsize.h * 0.75);
		let xo = -this.rsize().w / 2;
		for (let i = 0; i < this.connected.length; i++) {
			let child = this.connected[i];
			let cSize = child.rsize();
			let nextP = {
				x : p.x + xo + cSize.w / 2,
				y : p.y + nsize.h + HEIGHT_PADDING
			};
			c.beginPath();
			c.moveTo(p.x, p.y + nsize.h);
			c.lineTo(nextP.x, nextP.y);
			c.stroke();
			child.render(nextP, c);
			xo += cSize.w + WIDTH_PADDING
		}
	};
	
	this.rsize = function(c) {
		let nsize = tsize(this.name, FONT_FAMILY, FONT_SIZE, c);
		if (this.connected.length == 0) return nsize;
		let cSize = [];
		for (let i = 0; i < this.connected.length; i++)
			cSize.push(this.connected[i].rsize());
		let mh = cSize.reduce((a, b) => ({ w : 0, h : Math.max(a.h, b.h) }), { w : 0, h : 0 }).h;
		let sw = cSize.reduce((a, b) => ({ w : a.w + b.w, h : 0 }), { w : 0, h : 0 }).w;
		return {
			w : Math.max(sw + (this.connected.length - 1) * WIDTH_PADDING, nsize.w),
			h : nsize.h + mh + HEIGHT_PADDING
		};
	};
};

window.onload = function() {
	let canvas = document.getElementById("c");
	let context = canvas.getContext("2d");
	let root = new Node(u);
	root.render({ x : 400, y : HEIGHT_PADDING }, context);
};