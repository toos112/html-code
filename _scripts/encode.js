_.I("_scripts/bigint.js")

var _strToBits = function(str) {
	var data = new Array(str.length * 8);
	for (var i = 0; i < str.length; i++) {
		var code = str.charCodeAt(i) & 0xff;
		for (var ii = 0; ii < 8; ii++)
			data[i * 8 + ii] = (code >> (7 - ii)) & 1;
	}
	return data;
}

var _intToBits = function(v, s) {
	var data = new Array(s);
	for (var i = s - 32; i < s; i++)
		data[i] = (v >>> (s - 1 - i)) & 1;
	return data;
}

var _intFromBits = function(a, index) {
	var result = 0;
	for (var i = 0; i < 32; i++)
		result += (a[i + index] << (31 - i));
	return result;
}

var _rotright = function(v, n) {
	var data = _intToBits(v, 32);
	for (var i = 0; i < n; i++) {
		var temp = data[31];
		for (var ii = 31; ii > 0; ii--)
			data[ii] = data[ii - 1];
		data[0] = temp;
	}
	return _intFromBits(data, 0);
}

var _intToHex = function(d, p) {
    var hex = Number(d).toString(16);
    p = typeof (p) === "undefined" || p === null ? p = 2 : p;
	if (hex.length > p) hex = hex.substr(hex.length - p);
    while (hex.length < p)
        hex = "0" + hex;
    return hex;
}

var _prime = function(val) {
	for (var i = new BigUInt([2]); i.lt(val); i.inc())
		if (val.mod(i).eq(new BigUInt([])))
			return false;
	return true;
}

var _rprime = function(min, max) {
	var prime;
	do { prime = randomBigUInt(min, max);
	} while (!_prime(prime));
	return prime;
}

var $hash = {
	sha256: function(str) {
		var h = [
			0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
		var k = [
			0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
			0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
			0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
			0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
			0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
			0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
			0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
			0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
			
		str = _strToBits(str);
		var data = str.slice();
		data.push(1);
		var K = -1;
		while ((++K + str.length + 65) % 512 != 0);
		data = data.concat(new Array(K));
		data = data.concat(_intToBits(str.length, 64));
		
		for (var chunkIndex = 0; (chunkIndex * 512) < data.length; chunkIndex++) {
			var chunk = data.slice(chunkIndex * 512, chunkIndex * 512 + 512);
			var w = new Array(64);
			for (var i = 0; i < 16; i++)
				w[i] = _intFromBits(chunk, i * 32);
			
			for (var i = 16; i < 64; i++) {
				var s0 = _rotright(w[i - 15], 7) ^ _rotright(w[i - 15], 18) ^ (w[i - 15] >>> 3);
				var s1 = _rotright(w[i - 2], 17) ^ _rotright(w[i - 2], 19) ^ (w[i - 2] >>> 10);
				w[i] = w[i - 16] + s0 + w[i - 7] + s1;
			}
			
			var vars = [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7]];
			for (var i = 0; i < 64; i++) {
				var S1 = _rotright(vars[4], 6) ^ _rotright(vars[4], 11) ^ _rotright(vars[4], 25);
				var ch = (vars[4] & vars[5]) ^ ((~vars[4]) & vars[6]);
				var temp1 = vars[7] + S1 + ch + k[i] + w[i];
				var S0 = _rotright(vars[0], 2) ^ _rotright(vars[0], 13) ^ _rotright(vars[0], 22);
				var maj = (vars[0] & vars[1]) ^ (vars[0] & vars[2]) ^ (vars[1] & vars[2]);
				var temp2 = S0 + maj;
				
				vars[7] = vars[6];
				vars[6] = vars[5];
				vars[5] = vars[4];
				vars[4] = vars[3] + temp1;
				vars[3] = vars[2];
				vars[2] = vars[1];
				vars[1] = vars[0];
				vars[0] = temp1 + temp2;
			}
			
			for (var i = 0; i < 8; i++)
				h[i] = h[i] + vars[i];
		}
		var result = "";
		for (var i = 0; i < 8; i++)
			result += _intToHex(h[i], 8);
		return result;
	}
}

var $encrypt = {
	rsa: {
		key: function(len) {
			
		}
	}
}