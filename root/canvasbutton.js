function CanvasButton(w, h, x, y, c, o, style) {
	var thisRef = this;
	this.w = w, this.h = h;
	this.x = x, this.y = y;
	this.c = c, this.o = o;
	this.mx = 0, this.my = 0;
	this.style = style;
	
	this.isHovered = function() {
		return this.mx >= this.x && this.mx < this.x + this.w
			&& this.my >= this.y && this.my < this.y + this.h;
	};
	
	this.draw = function(ctx) {
		if (ctx === undefined)
			ctx = this.c.getContext("2d");
		
		if (this.style.type == "text") {
			ctx.fillStyle = this.isHovered() ? this.style.hovercol : this.style.col;
			ctx.fillRect(this.x, this.y, this.w, this.h);
			ctx.fillStyle = this.style.txtcol;
			ctx.fillText(this.style.txt, this.x, this.y + this.h);
		} else if (this.style.type == "img") {
			ctx.drawImage(this.style.img, this.x, this.y, this.w, this.h);
			if (this.isHovered()) {
				ctx.globalAlpha = 0.5;
				ctx.fillStyle = "#3f7f3f";
				ctx.fillRect(this.x, this.y, this.w, this.h);
				ctx.globalAlpha = 1;
			}
		}
	};
	
	this.c.addEventListener("mousemove", function(e) {
		let rect = thisRef.c.getBoundingClientRect();
		thisRef.mx = e.clientX - rect.left, thisRef.my = e.clientY - rect.top;
	}, false);
	
	this.c.addEventListener("click", function(e) {
		if (thisRef.o !== undefined && thisRef.isHovered()) thisRef.o();
	}, false);
};