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
	}
	
	this.lt = function(other) {
		if (this.ints.length != other.ints.length)
			return (this.ints.length < other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] < other.ints[i]);
		return false;
	}
	
	this.gt = function(other) {
		if (this.ints.length != other.ints.length)
			return (this.ints.length > other.ints.length);
		for (var i = this.ints.length - 1; i >= 0; i--)
			if (this.ints[i] != other.ints[i])
				return (this.ints[i] > other.ints[i]);
		return false;
	}
	
	this.lte = function(other) {
		return this.lt(other) || this.eq(other);
	}
	
	this.gte = function(other) {
		return this.gt(other) || this.eq(other);
	}
	
	this.neq = function(other) {
		return !this.eq(other);
	}
	
	this.add = function(other) {
		var result = new BigUInt(this.ints);
		if (other.ints.length > result.ints.length)
			return new BigUInt(other.ints).add(result).ints;
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
			return [];
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
		if (borrow > 0) result.ints = [];
		return result;
	};
	
	this.inc = function() {
		this.ints = this.add(new BigUInt([1])).ints;
	};
	
	this.dec = function() {
		this.ints = this.sub(new BigUInt([1])).ints;
	};
	
	this.mul = function(other) {
		var result = new BigUInt(this.ints);
		var temp = new BigUInt(this.ints);
		for (var i = new BigUInt([1]); i.lt(other); i.inc())
			result = result.add(temp);
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
	}
	
	this.mod = function(other) {
		var result = new BigUInt(this.ints);
		while (result.gte(other))
			result = result.sub(other);
		return result;
	}
}

var strToBigUInt = function(str) {
	var strs = str.split(",");
	var ints = new Array(strs.length);
	for (var i = 0; i < strs.length; i++)
		ints[i] = parseInt(strs);
	return new BigUInt(ints);
}

var bigUIntToStr = function(val) {
	var result = "";
	for (var i = 0; i < val.ints.length; i++)
		result += val.ints[i] + (i == val.ints.length - 1 ? "" : ",");
	return result;
}