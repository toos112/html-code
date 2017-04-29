/*var base = 65536;

function BigInt(ints, sign) {
	this.sign = sign;
	this.ints = new Array(ints.length);
	for (var i = 0; i < ints.length; i++)
		this.ints[i] = ints[i];
	
	this.eq = function(other) {
		other = bigInt.parse(other);
		if (this.sign != other.sign)
			return false;
		if (this.ints.length != other.ints.length)
			return false;
		for (var i = 0; i < this.ints.length; i++)
			if (this.ints[i] != other.ints[i]) return false;
		return true;
	};
	
	this.lt = function(other) {
		other = bigInt.parse(other);
		if (this.sign != other.sign)
			return (this.sign < other.sign);
		if (this.ints.length != other.ints.length)
			return (this.ints.length < other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] < other.ints[i]);
		return false;
	};
	
	this.gt = function(other) {
		other = bigInt.parse(other);
		if (this.sign != other.sign)
			return (this.sign > other.sign);
		if (this.ints.length != other.ints.length)
			return (this.ints.length > other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] > other.ints[i]);
		return false;
	};
	
	this.lte = function(other) {
		other = bigInt.parse(other);
		return this.lt(other) || this.eq(other);
	};
	
	this.gte = function(other) {
		other = bigInt.parse(other);
		return this.gt(other) || this.eq(other);
	};
	
	this.neq = function(other) {
		other = bigInt.parse(other);
		return !this.eq(other);
	};
	
	this.add = function(other) {
		other = bigInt.parse(other);
		if (this.sign != other.sign)
			return this.sub(new BigInt(other.ints, -other.sign));
		if (other.ints.length > this.ints.length)
			return other.add(this);
		var result = this.copy();
		var carry = 0, i = 0;
		for (i = 0; i < other.ints.length; i++) {
            var sum = result.ints[i] + other.ints[i] + carry;
            carry = sum >= base ? 1 : 0;
			result.ints[i] = sum - carry * base;
		}
		while (i < result.ints.length && carry > 0) {
            var sum = result.ints[i] + carry;
            carry = sum === base ? 1 : 0;
			result.ints[i++] = sum - carry * base;
		}
		if (carry > 0) result.ints.push(carry);
		return result;
	};
	
	this.sub = function(other) {
		other = bigInt.parse(other);
		if (this.sign != other.sign)
			return this.add(new BigInt(other.ints, -other.sign));
		if (other.ints.length > this.ints.length)
			return bigInt.parse(0);
		var result = this.copy();
		var borrow = 0, i = 0;
		for (i = 0; i < other.ints.length; i++) {
            var diff = result.ints[i] - other.ints[i] - borrow;
            borrow = diff < 0 ? 1 : 0;
			result.ints[i] = diff + borrow * base;
		}
		while (i < result.ints.length && borrow > 0) {
            var diff = result.ints[i] - borrow;
            borrow = diff === -1 ? 1 : 0;
			result.ints[i] = diff + borrow * base;
		}
		while (result.ints[result.ints.length - 1] == 0)
			result.ints.pop();
		if (borrow > 0) {
			result = other.sub(this);
			return new BigInt(result.ints, -result.sign);
		}
		return result;
	};
	
	this.inc = function() {
		var other = this.add(1);
		this.ints = other.ints;
		this.sign = other.sign;
		return this;
	};
	
	this.dec = function() {
		var other = this.sub(1);
		this.ints = other.ints;
		this.sign = other.sign;
		return this;
	};
	
	this.mul = function(other) {
		other = bigInt.parse(other);
		var nums = [];
		for (var i = 0; i < this.ints.length; i++) {
			nums.push(bigInt.parse(0));
			for (var ii = 0; ii < i; ii++)
				nums[i].ints.push(0);
			var carry = 0, start = nums[i].ints.length;
			for (var ii = 0; ii < other.ints.length; ii++) {
				nums[i].ints.push(this.ints[i] * other.ints[ii] + carry);
				carry = Math.floor(nums[i].ints[ii + start] / base);
				nums[i].ints[ii + start] = nums[i].ints[ii + start] % base;
			}
			if (carry > 0) nums[i].ints.push(carry);
		}
		var result = bigInt.parse(0);
		for (var i = 0; i < nums.length; i++)
			result = result.add(nums[i]);
		result.sign = this.sign == other.sign ? 1 : -1;
		return result;
	};
	
	this.div = function(other) {
		other = bigInt.parse(other);
		var result = bigInt.parse(0);
		var work = this.copy();
		var factor = bigInt.parse(100);
		while (other.lte(work)) {
			var num = bigInt.parse(1);
			var temp = other.copy();
			while (temp.mul(factor).lte(work)) {
				temp = temp.mul(factor);
				num = num.mul(factor);
			}
			while (temp.lte(work)) {
				work = work.sub(temp);
				result = result.add(num);
			}
		}
		result.sign = this.sign == other.sign ? 1 : -1;
		return result;
	};
	
	this.pow = function(other) {
		other = bigInt.parse(other);
		if (other.lt(0))
			return bigInt.parse(0);
		if (other.eq(0))
			return bigInt.parse(1);
		var result = this.copy();
		var temp = this.copy();
		for (var i = bigInt.parse(1); i.lt(other); i.inc())
			result = result.mul(temp);
		return result;
	};
	
	this.mod = function(other) {
		other = bigInt.parse(other);
		var result = new BigInt(this.ints, 1);
		var factor = bigInt.parse(100);
		while (other.lte(result)) {
			var temp = other.copy();
			while (temp.mul(factor).lte(result))
				temp = temp.mul(factor);
			while (temp.lte(result))
				result = result.sub(temp);
		}
		result.sign = this.sign;
		return result;
	};
	
	this.abs = function() {
		return new BigInt(this.ints, 1);
	};
	
	this.modInv = function(other) {
		var b = bigInt.parse(other);
		var a = this.mod(b);
		var c = bigInt.parse(0);
		for (var x = bigInt.parse(1); x.lt(b); x.inc()) {
			c = c.add(a).mod(b);
			if (c.eq(1)) return x;
		}
	};
	
	this.powMod = function(e, m) {
		e = bigInt.parse(e);
		m = bigInt.parse(m);
		var r = bigInt.parse(1), b = this.mod(m);
		while (e.gt(0)) {
			if (b.eq(0)) return bigInt.parse(0);
			if (e.mod(2).eq(1)) r = r.mul(b).mod(m);
			e = e.div(2);
			b = b.pow(2).mod(m);
		}
		return r;
	};
	
	this.copy = function() {
		return new BigInt(this.ints, this.sign);
	};
}

var bigInt = {
	parse: function(val) {
		if (typeof val == "number") {
			var result = new BigInt([], val < 0 ? -1 : 1);
			if (val < 0) val = -val;
			while (val != 0) {
				var mod = val % base;
				result.ints.push(mod);
				val = Math.floor(val / base);
			}
			return result;
		} else return val.copy();
	},
	toB64Str: function(val) {
		val = val.copy();
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
		var result = "";
		if (val.sign == -1) result += "-";
		while (val.neq(0)) {
			var mod = val.mod(64);
			result += possible.charAt(mod.ints[0]);
			val = val.div(64);
		}
		return result;
	},
	fromB64Str: function(str) {
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-";
		var result = bigInt.parse(0);
		for (var i = 0; i < str.length; i++)
			result = result.mul(64).add(possible.indexOf(str.charAt(i)));
		return result;
	},
	toString: function(val) {
		val = val.copy();
		var result = "";
		if (val.sign == -1) result += "-";
		while (val.neq(0)) {
			var mod = val.mod(256);
			result += String.fromCharCode(mod.ints[0]);
			val = val.div(256);
		}
		return result;
	},
	fromString: function(str) {
		var result = bigInt.parse(0);
		for (var i = 0; i < str.length; i++)
			result = result.mul(256).add(str.charCodeAt(i));
		return result;
	},
	rand: function(min, max) {
		min = bigInt.parse(min);
		max = bigInt.parse(max);
		var result = bigInt.parse(0);
		var range = max.sub(min);
		var restricted = true;
		for (var i = range.ints.length - 1; i >= 0; i--) {
			var top = restricted ? range.ints[i] : base;
			var digit = Math.floor(Math.random() * top);
			result.ints.unshift(digit);
			if (digit < top) restricted = false;
		}
		return result.add(min);
	},
	min: function(a, b) {
		a = bigInt.parse(a);
		b = bigInt.parse(b);
		if (a.lt(b)) return a.copy();
		else return b.copy();
	},
	max: function(a, b) {
		a = bigInt.parse(a);
		b = bigInt.parse(b);
		if (a.gt(b)) return a.copy();
		else return b.copy();
	},
	gcd: function(a, b) {
		a = bigInt.parse(a);
		b = bigInt.parse(b);
		for (var i = bigInt.min(a, b); i.gt(0); i.dec())
			if (a.mod(i).eq(0) && b.mod(i).eq(0))
				return i;
		return bigInt.parse(1);
	},
	lcm: function(a, b) {
		a = bigInt.parse(a);
		b = bigInt.parse(b);
		return a.div(bigInt.gcd(a, b)).mul(b);
	},
	dif: function(a, b) {
		a = bigInt.parse(a);
		b = bigInt.parse(b);
		return bigInt.max(a, b).sub(bigInt.min(a, b));
	}
}*/