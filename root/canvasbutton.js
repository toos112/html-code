function CanvasButton(w, h, x, y, c, o, txt, cols) {
	var thisRef = this;
	this.w = w, this.h = h;
	this.x = x, this.y = y;
	this.c = c, this.o = o;
	this.mx = 0, this.my = 0;
	this.txt = txt, this.cols = cols;
	
	this.isHovered = function() {
		return this.mx >= this.x && this.mx < this.x + this.w
			&& this.my >= this.y && this.my < this.y + this.h;
	};
	
	this.draw = function(ctx) {
		if (ctx === undefined)
			ctx = this.c.getContext("2d");
		
		if (this.cols !== undefined) {
			if (!this.isHovered() && this.cols.color !== undefined) ctx.fillStyle = this.cols.color;
			else if (this.isHovered() && this.cols.hover !== undefined) ctx.fillStyle = this.cols.hover;
			else ctx.fillStyle = "#7f7f7f";
		} else ctx.fillStyle = "#7f7f7f";
		ctx.fillRect(this.x, this.y, this.w, this.h);
		
		if (this.txt !== undefined) {
			if (this.txt.color !== undefined) ctx.fillStyle = this.txt.color;
			else ctx.fillStyle = "#ffffff"
			if (this.txt.text !== undefined) ctx.fillText(this.txt.text, this.x, this.y + this.h);
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