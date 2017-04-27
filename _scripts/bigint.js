var base = 65536;

function BigUInt(ints) {
	this.ints = new Array(ints.length);
	for (var i = 0; i < ints.length; i++)
		this.ints[i] = ints[i];
	
	this.eq = function(other) {
		if (this.ints.length != other.ints.length)
			return false;
		for (var i = 0; i < this.ints.length; i++)
			if (this.ints[i] != other.ints[i]) return false;
		return true;
	};
	
	this.lt = function(other) {
		if (this.ints.length != other.ints.length)
			return (this.ints.length < other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] < other.ints[i]);
		return false;
	};
	
	this.gt = function(other) {
		if (this.ints.length != other.ints.length)
			return (this.ints.length > other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] > other.ints[i]);
		return false;
	};
	
	this.lte = function(other) {
		return this.lt(other) || this.eq(other);
	};
	
	this.gte = function(other) {
		return this.gt(other) || this.eq(other);
	};
	
	this.neq = function(other) {
		return !this.eq(other);
	};
	
	this.add = function(other) {
		if (other.ints.length > this.ints.length)
			return other.add(this);
		var result = new BigUInt(this.ints);
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
		var result = new BigUInt(this.ints);
		if (other.ints.length > result.ints.length)
			return new BigUInt([]);
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
		if (borrow > 0) result.ints = new BigUInt([]);
		return result;
	};
	
	this.inc = function() {
		this.ints = this.add(new BigUInt([1])).ints;
		return this;
	};
	
	this.dec = function() {
		this.ints = this.sub(new BigUInt([1])).ints;
		return this;
	};
	
	this.mul = function(other) {
		var nums = [];
		for (var i = 0; i < this.ints.length; i++) {
			nums.push(new BigUInt([]));
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
		var result = new BigUInt([]);
		for (var i = 0; i < nums.length; i++)
			result = result.add(nums[i]);
		return result;
	};
	
	this.div = function(other) {
		var result = new BigUInt([0]);
		var temp = new BigUInt(this.ints);
		while (temp.gte(other)) {
			temp = temp.sub(other);
			result.inc();
		}
		return result;
	};
	
	this.pow = function(other) {
		var result = new BigUInt(this.ints);
		var temp = new BigUInt(this.ints);
		for (var i = new BigUInt([1]); i.lt(other); i.inc())
			result = result.mul(temp);
		return result;
	};
	
	this.xrt = function(other) {
		for (var i = new BigUInt([1]); true; i.inc())
			if (this.lt(other.pow(i))) return i.dec();
	};
	
	this.mod = function(other) {
		var result = new BigUInt(this.ints);
		var factor = new BigUInt([256])
		while (other.lte(result)) {
			var temp = new BigUInt(other.ints);
			while (temp.mul(factor).lt(result))
				temp = temp.mul(factor);
			result = result.sub(temp);
		}
		return result;
	};
	
	this.modInv = function(other) {
		return this.mod(other);
	};
}

var bigUInt = {
	toBigUInt: function(str) {
		var strs = str.split(",");
		var ints = new Array(strs.length);
		for (var i = 0; i < strs.length; i++)
			ints[i] = parseInt(strs);
		return new BigUInt(ints);
	},
	fromStr: function(val) {
		var result = "";
		for (var i = 0; i < val.ints.length; i++)
			result += val.ints[i] + (i == val.ints.length - 1 ? "" : ",");
		return result;
	},
	rand: function(min, max) {
		var result = new BigUInt([]);
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
		if (a.lt(b)) return new BigUInt(a.ints);
		else return new BigUInt(b.ints);
	},
	max: function(a, b) {
		if (a.gt(b)) return new BigUInt(a.ints);
		else return new BigUInt(b.ints);
	},
	gcd: function(a, b) {
		for (var i = bigUInt.min(a, b); i.gt(new BigUInt([])); i.dec())
			if (a.mod(i).eq(new BigUInt([])) && b.mod(i).eq(new BigUInt([]))) return i;
		return new BigUInt([1]);
	},
	lcm: function(a, b) {
		return a.div(bigUInt.gcd(a, b)).mul(b);
	},
	dif: function(a, b) {
		return bigUInt.max(a, b).sub(bigUInt.min(a, b));
	}
}