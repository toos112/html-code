let eVal = function(v) {
	if (typeof v === "function")
		return v();
	return v;
};

function CanvasButton(w, h, x, y, c, o, style) {
	var thisRef = this;
	this.w = w, this.h = h;
	this.x = x, this.y = y;
	this.c = c, this.o = o;
	this.mx = 0, this.my = 0;
	this.style = style;
	
	this.destruct = function() {
		this.c.removeEventListener("mousemove", this.mme);
		this.c.removeEventListener("click", this.ce);
	};
	
	this.isHovered = function() {
		return this.mx >= this.x && this.mx < this.x + this.w
			&& this.my >= this.y && this.my < this.y + this.h;
	};
	
	this.draw = function(ctx) {
		if (ctx === undefined)
			ctx = this.c.getContext("2d");
		
		if (eVal(this.style.type) == "text") {
			ctx.fillStyle = this.isHovered() ? eVal(this.style.hovercol) : eVal(this.style.col);
			ctx.fillRect(this.x, this.y, this.w, this.h);
			ctx.fillStyle = eVal(this.style.txtcol);
			ctx.fillText(eVal(this.style.txt), this.x, this.y + this.h);
		} else if (eVal(this.style.type) == "img") {
			ctx.drawImage(eVal(this.style.img), this.x, this.y, this.w, this.h);
			if (this.isHovered()) {
				ctx.globalAlpha = 0.5;
				ctx.fillStyle = eVal(this.style.hovercol);
				ctx.fillRect(this.x, this.y, this.w, this.h);
				ctx.globalAlpha = 1;
			}
		}
	};
	
	this.mme = function(e) {
		let rect = thisRef.c.getBoundingClientRect();
		thisRef.mx = e.clientX - rect.left, thisRef.my = e.clientY - rect.top;
	};
	this.c.addEventListener("mousemove", this.mme, false);
	
	this.ce = function(e) {
		if (thisRef.o !== undefined && thisRef.isHovered()) thisRef.o();
	};
	this.c.addEventListener("click", this.ce, false);
};