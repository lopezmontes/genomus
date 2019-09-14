// GENOMUS 0.8 UNIT TESTING
///////////////////////////




// DEPENDENCIES

// files handling
const fs = require('fs');
// connection with Max interface
const maxAPI = require('max-api');

// random generators with different distributions based on seedrandom
const random = require('random');
const seedrandom = require('seedrandom');




//////////// PARAMETER MAPPING
// parameters mapping functions and abbreviated versions with short names and rounded output

const PHI = (1 + Math.sqrt(5)) / 2;
// round fractional part to 6 digits
var r6d = f => Math.round(f * 1000000) / 1000000;

var norm2notevalue = p => decimal2fraction(Math.pow(2, 10 * p - 8));
var p2n = norm2notevalue;
var notevalue2norm = n => r6d((Math.log10(n) + 8 * Math.log10(2)) / (10 * Math.log10(2)));
var n2p = notevalue2norm;
var norm2duration = p => r6d(Math.pow(2, 10 * p - 6));
var p2d = norm2duration;
var duration2norm = s => r6d((Math.log10(s) + 6 * Math.log10(2)) / (10 * Math.log10(2)));
var d2p = duration2norm;
var norm2midipitch = p => r6d(100 * p + 12);
var p2m = norm2midipitch;
var midipitch2norm = m => r6d((m - 12) / 100);
var m2p = midipitch2norm;
var norm2frequency = p => p < 0.003 ? 0.000001 : r6d(20000 * Math.pow(p, 4));
var p2f = norm2frequency;
var frequency2norm = f => r6d(Math.pow((f / 20000), (1 / 4)));
var f2p = frequency2norm;
var norm2articulation = p => r6d(3 * Math.pow(p, Math.E));
var p2a = norm2articulation;
var articulation2norm = a => r6d(Math.pow((a / 3), (1 / Math.E)));
var a2p = articulation2norm;
var norm2intensity = p => r6d(127 * p);
var p2i = norm2intensity;
var intensity2norm = i => r6d(i / 127);
var i2p = intensity2norm;
var norm2quantized = p => {
    if (p > 1) { p = 1 };
    if (p < 0) { p = 0 };
    var s = r6d(-1 * Math.round(((((Math.asin(Math.pow(Math.abs((2 * p - 1)), (17 / 11)))) / Math.PI)) + 0.5) * 72 - 36));
    if (p < .5) {
        return s;
    }
    else {
        return -1 * s;
    }
}
var p2q = norm2quantized;
var quantized2norm = q => {
    if (q > 36) { q = 36 };
    if (q < -36) { q = -36 };
    return quantizedLookupTable[Math.round(q) + 36];
}
var q2p = quantized2norm;
var goldeninteger2norm = p => r6d(p * PHI % 1);
var z2p = goldeninteger2norm;
var norm2goldeninteger = z => {
    var p = 0;
    var c = 0;
    while (Math.abs(p - z) > 0.0000009 && c < 514262) {
        c++;
        p = (p + PHI) % 1;
    }
    return c;
}
var p2z = norm2goldeninteger;
var quantizedLookupTable = [0, 0.0005, 0.001, 0.003, 0.006, 0.008, 0.01, 0.015, 0.02, 0.025, 0.03, 0.04, 0.045, 0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.14, 0.15, 0.16, 0.18, 0.2, 0.21, 0.23, 0.25, 0.27, 0.3, 0.32, 0.33, 0.36, 0.4, 0.45, 0.5, 0.55, 0.6, 0.64, 0.67, 0.68, 0.7, 0.73, 0.75, 0.77, 0.79, 0.8, 0.82, 0.84, 0.85, 0.86, 0.88, 0.89, 0.9, 0.91, 0.92, 0.93, 0.94, 0.95, 0.955, 0.96, 0.97, 0.975, 0.98, 0.985, 0.99, 0.992, 0.994, 0.997, 0.999, 0.9995, 1];


// AUX FUNCTIONS

// greates common divisor, taken and adapted from https://gist.github.com/redteam-snippets/3934258. 
// Still to refine to avoid too weird numbers
var gcd = (a, b) => (b) ? gcd(b, a % b) : a;

var decimal2fraction = function (_decimal) {
    if (_decimal == parseInt(_decimal)) {
        var output = parseInt(_decimal);
        if (output.length < 7) {
            return output;
        }
        else {
            return _decimal;
        }
    }
    else {
        var top = _decimal.toString().includes(".") ? _decimal.toString().replace(/\d+[.]/, '') : 0;
        var bottom = Math.pow(10, top.toString().replace('-', '').length);
        if (_decimal >= 1) {
            top = +top + (Math.floor(_decimal) * bottom);
        }
        else if (_decimal <= -1) {
            top = +top + (Math.ceil(_decimal) * bottom);
        }

        var x = Math.abs(gcd(top, bottom));
        var output = (top / x) + '/' + (bottom / x);
        if (output.length < 7) {
            return output;
        }
        else {
            return _decimal;
        }
    }
};
var d2f = decimal2fraction;

// adapted from https://gist.github.com/drifterz28/6971440
function fraction2decimal(fraction) {
    var result, wholeNum = 0, frac, deci = 0;
    if(fraction.search('/') >= 0){
        if(fraction.search('-') >= 0){
            var wholeNum = fraction.split('-');
            frac = wholeNum[1];
            wholeNum = parseInt(wholeNum, 10);
        }else{
            frac = fraction;
        }
        if(fraction.search('/') >=0){
            frac =  frac.split('/');
            deci = parseInt(frac[0], 10) / parseInt(frac[1], 10);
        }
        result = wholeNum + deci;
    }else{
        result = +fraction;
    }
    return r6d(result);
}
var f2d = fraction2decimal;

var checkGoldenIntegerConversions = function (max) {
    var noError = true;
    var i = 0;
    do {
        i++;
        if (norm2goldeninteger(goldeninteger2norm(i)) != i) {
            noError = false;
            console.log("Error with value " + i + "\ngoldeninteger2norm -> " + goldeninteger2norm(i) + "\nnorm2goldeninteger -> " + norm2goldeninteger(goldeninteger2norm(i)));
        }
        if (i % 10000 == 0) {
            console.log("No error found until " + i);
        }
    } while (i < max);
    return ("Validity of converter: " + noError);
}

// function to test how many encoded indexes can be generated without recurrences
var testRepetitions = function (n) {
    var usedNumbers = [];
    var newValue = 0;
    for (var a = 0; a < n; a++) {
        newValue = goldeninteger2norm(a);
        for (var b = 0; b < usedNumbers.length; b++) {
            if (newValue == usedNumbers[b]) {
                console.log("Repetition of " + newValue + " found at iteration " + a + ". Founded the same number at index " + b + ".");
                return -1;
            }
        }
        if (a % 10000 == 0) {
            console.log("Tested " + b + " indexes. Recurrences not found so far.");
        }
        usedNumbers.push(newValue);
    }
    return 1;
}


///////// RANDOM HANDLING

// normal returns a normal distribution random seed with params (mu=1 and sigma=0) within interval [0, 1] and rounded to 6 decimals
const normal = random.normal(mu = 0, sigma = 0.15);
const gaussRnd = () => {
    var rndVal;
    do {
        rndVal = normal();
    } while (rndVal < -0.5 || rndVal > 0.5)
    return r6d(rndVal + 0.5);
}

gaussRnd();

// test normal distribution generator
var testRndValues = () => {
    var mini = 0.5; 
    var maxi = 0.5;
    var pos = 0;
    var neg = 0;
    var val;
    var iter = 0;
    while (mini > 0 && maxi < 1) {
        iter++;
        val = gaussRnd();
        if (val < .5) neg++;
        if (val > .5) pos++;
        
        if (val < mini) {
            mini = val;
            console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter );
        }
        if (val > maxi) {
            maxi = val;
            console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter );
        }
    }
    console.log("Min: " + mini + " | Max: " + maxi + " Negat: " + neg + " | Pos: " + pos + " | iter: " + iter );
    return -1;
}

// testRndValues();


/////////////////////
// INITIAL CONDITIONS
var phenMaxLength = 2000;

// global variable to store subexpressions
var subexpressions = [];
var initSubexpressionsArrays = () => {
    subexpressions["paramF"] = [];
    subexpressions["listF"] = [];
    subexpressions["eventF"] = [];
    subexpressions["voiceF"] = [];
    subexpressions["scoreF"] = [];
    subexpressions["notevalueF"] = [];
    subexpressions["lnotevalueF"] = [];
    subexpressions["durationF"] = [];
    subexpressions["ldurationF"] = [];
    subexpressions["midipitchF"] = [];
    subexpressions["lmidipitchF"] = [];
    subexpressions["frequencyF"] = [];
    subexpressions["lfrequencyF"] = [];
    subexpressions["articulationF"] = [];
    subexpressions["larticulationF"] = [];
    subexpressions["intensityF"] = [];
    subexpressions["lintensityF"] = [];
    subexpressions["goldenintegerF"] = [];
    subexpressions["lgoldenintegerF"] = [];
    subexpressions["quantizedF"] = [];
    subexpressions["lquantizedF"] = [];
    subexpressions["operationF"] = [];
}
initSubexpressionsArrays();

// test decoded genotypes with Terminal
var tt = decGenotype => {
    initSubexpressionsArrays();
    var output = (evalDecGen(decGenotype));
    console.log(subexpressions);
    visualizeSpecimen(output.encGen, "encGen");
    visualizeSpecimen(output.encPhen, "encPhen");
    console.log("received decoded genotype: " + decGenotype);
    console.log("manually decoded genotype: " + decodeGenotype(output.encGen));
    console.log("automat. encoded genotype: " + eval(decGenotype).encGen);
    console.log("manually encoded genotype: " + encodeGenotype(decGenotype));
    return output;
}

// test decoded genotypes in Max
var mt = decGenotype => {
    initSubexpressionsArrays();
    var output = (evalDecGen(decGenotype));
    maxAPI.post(subexpressions);
    // visualizeSpecimen(output.encGen, "encGen");
    // visualizeSpecimen(output.encPhen, "encPhen");
    maxAPI.post("received decoded genotype: " + decGenotype);
    maxAPI.post("manually decoded genotype: " + decodeGenotype(output.encGen));
    maxAPI.post("automat. encoded genotype: " + eval(decGenotype).encGen);
    maxAPI.post("manually encoded genotype: " + encodeGenotype(decGenotype));
    return output;
}


////// AUX FUNCTIONS

// flats arrays with any level of nesting
var flattenDeep = arr1 => arr1.reduce((acc, val) => Array.isArray(val) ? acc.concat(flattenDeep(val)) : acc.concat(val), []);
// wraps and unwraps elements such as voices and scores, putting 1 at the beginning and 0 at the end
var wrap = a => [1].concat(a.concat(0));
var unwrap = a => a.slice(1, -1);
// adjust a value from quantizedF to a range without rescaling
var adjustRange = (q, minQ, maxQ) => {
    if (q < minQ) { return minQ };
    if (q > maxQ) { return maxQ };
    return q;
}
// remap a value from its range to another
var remap = (v, minInitRange, maxInitRange, minNewRange, maxNewRange) => ((v - minInitRange) / (maxInitRange - minInitRange)) * (maxNewRange - minNewRange) + minNewRange;
// takes subspecimen s, indexes subexpressions and formats output data
var indexExprReturnSpecimen = s => {
    var subexpressionsIndexed = subexpressions[s.funcType].length;
    // if subexpression is founded, returns only data
    for (var a = 0; a < subexpressionsIndexed; a++) {
        subexpressionRepeated = s.decGen.localeCompare(subexpressions[s.funcType][a]);
        if (subexpressionRepeated == 0) return s;
    }
    // if subexpression is new, indexes it and returns data
    subexpressions[s.funcType].push(s.decGen);
    return s;
};


////// GENOTYPE FUNCTIONS

// parameter identity function
var p = x => indexExprReturnSpecimen({
    funcType: "paramF",
    encGen: [1, 0, 0.5, x, 0],
    decGen: "p(" + x + ")",
    encPhen: [x]
});

// returns a random normalized parameter with uniform distribution
var pRnd = () => indexExprReturnSpecimen({
    funcType: "paramF",
    encGen: [1, 0.962453, 0],
    decGen: "pRnd()",
    encPhen: [r6d(random.float())]
});

// returns a random normalized parameter with normal distribution
var pGaussRnd = () => indexExprReturnSpecimen({
    funcType: "paramF",
    encGen: [1, 0.580487, 0],
    decGen: "pGaussRnd()",
    encPhen: [gaussRnd()]
});

// notevalue identity function
var n = x => {
    eval("p(" + notevalue2norm(x) + ")");
    return indexExprReturnSpecimen({
        funcType: "notevalueF",
        encGen: [1, 0.09017, 0.51, notevalue2norm(x), 0],
        decGen: "n(" + x + ")",
        encPhen: [notevalue2norm(x)]
    });
};

// midipitch identity function
var m = x => {
    eval("p(" + midipitch2norm(x) + ")");
    return indexExprReturnSpecimen({
        funcType: "midipitchF",
        encGen: [1, 0.326238, 0.53, midipitch2norm(x), 0],
        decGen: "m(" + x + ")",
        encPhen: [midipitch2norm(x)]
    });
};

// articulation identity function
var a = x => {
    eval("p(" + articulation2norm(x) + ")");
    return indexExprReturnSpecimen({
        funcType: "articulationF",
        encGen: [1, 0.562306, 0.55, articulation2norm(x), 0],
        decGen: "a(" + x + ")",
        encPhen: [articulation2norm(x)]
    });
};

// intensity identity function
var i = x => {
    eval("p(" + intensity2norm(x) + ")");
    return indexExprReturnSpecimen({
        funcType: "intensityF",
        encGen: [1, 0.18034, 0.56, intensity2norm(x), 0],
        decGen: "i(" + x + ")",
        encPhen: [intensity2norm(x)]
    });
};

// intensity identity function
var q = x => {
    eval("p(" + quantized2norm(x) + ")");
    return indexExprReturnSpecimen({
        funcType: "intensityF",
        encGen: [1, 0.416408, 0.58, quantized2norm(x), 0],
        decGen: "q(" + x + ")",
        encPhen: [quantized2norm(x)]
    });
};

// list identity function
var l = paramList => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.618034, 0.8].concat(paramList.map(x => [0.5, x]).concat([0.2, 0]))),
    decGen: "l([" + paramList + "])",
    encPhen: paramList
});

// list of notevalues identity function
var ln = notevalueList => {
    var normalizedParams = notevalueList.map(x => notevalue2norm(x));
    eval("l([" + normalizedParams + "])");
    return indexExprReturnSpecimen({
        funcType: "lnotevalueF",
        encGen: flattenDeep([1, 0.27051, 0.8].concat(normalizedParams.map(x => [0.51, x]).concat([0.2, 0]))),
        decGen: "ln([" + notevalueList + "])",
        encPhen: normalizedParams
    });
};

// list of midipitch values identity function
var lm = midipitchList => {
    var normalizedParams = midipitchList.map(x => midipitch2norm(x));
    eval("l([" + normalizedParams + "])");
    return indexExprReturnSpecimen({
        funcType: "lmidipitchF",
        encGen: flattenDeep([1, 0.506578, 0.8].concat(normalizedParams.map(x => [0.53, x]).concat([0.2, 0]))),
        decGen: "lm([" + midipitchList + "])",
        encPhen: normalizedParams
    });
};

// piano event identity function
var e = (notevalue, midiPitch, articulation, intensity) => indexExprReturnSpecimen({
    funcType: "eventF",
    encGen: flattenDeep([1, 0.236068, notevalue.encGen, midiPitch.encGen, articulation.encGen, intensity.encGen, 0]),
    decGen: "e("
        + notevalue.decGen + ","
        + midiPitch.decGen + ","
        + articulation.decGen + ","
        + intensity.decGen + ")",
    encPhen: [notevalue.encPhen[0],
        goldeninteger2norm(1), 
        midiPitch.encPhen[0],
        articulation.encPhen[0],
        intensity.encPhen[0]],
    phenLength: 1,
    tempo: 0.6,
    harmony: {
        root: midiPitch.encPhen[0],
        chord: [0],
        mode: [0],
        chromaticism: 0
    }
});

// voice identity function
var v = e => indexExprReturnSpecimen({
    funcType: "voiceF",
    encGen: flattenDeep([1, 0.854102, e.encGen, 0]),
    decGen: "v(" + e.decGen + ")",
    encPhen: [0.618034].concat(e.encPhen),
    phenLength: 1,
    tempo: e.tempo,
    rhythm: e.rhythm,
    harmony: e.harmony,
    analysis: e.analysis
});

// score identity function
var s = v => indexExprReturnSpecimen({
    funcType: "scoreF",
    encGen: flattenDeep([1, 0.472136, v.encGen, 0]),
    decGen: "s(" + v.decGen + ")",
    encPhen: [0.618034].concat(v.encPhen),
    phenLength: v.phenLength,
    tempo: v.tempo,
    rhythm: v.rhythm,
    harmony: v.harmony,
    analysis: v.analysis
});

// creates an event with two pitches
var e2Pitches = (notevalue, midiPitch1, midiPitch2, articulation, intensity) => indexExprReturnSpecimen({
    funcType: "eventF",
    encGen: flattenDeep([1, 0.567331, notevalue.encGen, midiPitch1.encGen, midiPitch2.encGen, articulation.encGen, intensity.encGen, 0]),
    decGen: "e2Pitches("
        + notevalue.decGen + ","
        + midiPitch1.decGen + ","
        + midiPitch2.decGen + ","
        + articulation.decGen + ","
        + intensity.decGen + ")",
    encPhen: [notevalue.encPhen[0],
        0.236068, midiPitch1.encPhen[0], midiPitch2.encPhen[0],
        articulation.encPhen[0],
        intensity.encPhen[0]],
    phenLength: 1,
    tempo: 0.6,
    harmony: {
        root: Math.min(midiPitch1.encPhen[0], midiPitch2.encPhen[0]),
        chord: [midiPitch1.encPhen[0], midiPitch2.encPhen[0]],
        mode: [midiPitch1.encPhen[0], midiPitch2.encPhen[0]].sort((a, b) => a - b),
        chromaticism: 1
    }
});

// creates an event with three pitches
var e3Pitches = (notevalue, midiPitch1, midiPitch2, midiPitch3, articulation, intensity) => indexExprReturnSpecimen({
    funcType: "eventF",
    encGen: flattenDeep([1, 0.185365, notevalue.encGen, midiPitch1.encGen, midiPitch2.encGen, midiPitch3.encGen, articulation.encGen, intensity.encGen, 0]),
    decGen: "e3Pitches("
        + notevalue.decGen + ","
        + midiPitch1.decGen + ","
        + midiPitch2.decGen + ","
        + midiPitch3.decGen + ","
        + articulation.decGen + ","
        + intensity.decGen + ")",
    encPhen: [notevalue.encPhen[0],
        0.854102, midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0],
        articulation.encPhen[0],
        intensity.encPhen[0]],
    phenLength: 1,
    tempo: 0.6,
    harmony: {
        root: Math.min(midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0]),
        chord: [midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0]],
        mode: [midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0]].sort((a, b) => a - b),
        chromaticism: 1
    }
});

// creates an event with three pitches
var e4Pitches = (notevalue, midiPitch1, midiPitch2, midiPitch3, midiPitch4, articulation, intensity) => indexExprReturnSpecimen({
    funcType: "eventF",
    encGen: flattenDeep([1, 0.803399, notevalue.encGen, midiPitch1.encGen, midiPitch2.encGen, midiPitch3.encGen, midiPitch4.encGen, articulation.encGen, intensity.encGen, 0]),
    decGen: "e4Pitches("
        + notevalue.decGen + ","
        + midiPitch1.decGen + ","
        + midiPitch2.decGen + ","
        + midiPitch3.decGen + ","
        + midiPitch4.decGen + ","
        + articulation.decGen + ","
        + intensity.decGen + ")",
    encPhen: [notevalue.encPhen[0],
        0.472136, midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0], midiPitch4.encPhen[0],
        articulation.encPhen[0],
        intensity.encPhen[0]],
    phenLength: 1,
    tempo: 0.6,
    harmony: {
        root: Math.min(midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0], midiPitch4.encPhen[0]),
        chord: [midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0], midiPitch4.encPhen[0]],
        mode: [midiPitch1.encPhen[0], midiPitch2.encPhen[0], midiPitch3.encPhen[0], midiPitch4.encPhen[0]].sort((a, b) => a - b),
        chromaticism: 1
    }
});


// repeats an event a number of times between 2 and 12 (eventP, paramP)
var vRepeatE = (event, times) => {
    var numRepeats = adjustRange(Math.abs(p2q(adjustRange(times.encPhen[0], q2p(-12), q2p(12)))), 2, 12); // number of times rescaled to range [2, 12], mapped according to the deviation from the center value 0.5
    if (numRepeats > phenMaxLength) return -1;
    return indexExprReturnSpecimen({
        funcType: "voiceF",
        encGen: flattenDeep([1, 0.429563, event.encGen, times.encGen, 0]),
        decGen: "vRepeatE("
            + event.decGen + ","
            + times.decGen + ")",
        encPhen: flattenDeep([z2p(numRepeats)].concat(Array(numRepeats).fill(event.encPhen))),
        phenLength: numRepeats,
        tempo: event.tempo,
        harmony: event.harmony
    });
}

// generates a list of 2 parameters
var l2P = (p1, p2) => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.172209, p1.encGen, p2.encGen, 0]),
    decGen: "l2P(" + p1.decGen + "," + p2.decGen + ")",
    encPhen: p1.encPhen.concat(p2.encPhen)
});

// generates a list of 3 parameters
var l3P = (p1, p2, p3) => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.790243, p1.encGen, p2.encGen, p3.encGen, 0]),
    decGen: "l3P(" + p1.decGen + "," + p2.decGen + "," + p3.decGen + ")",
    encPhen: p1.encPhen.concat(p2.encPhen).concat(p3.encPhen)
});

// generates a list of 4 parameters
var l4P = (p1, p2, p3, p4) => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.408277, p1.encGen, p2.encGen, p3.encGen, p4.encGen, 0]),
    decGen: "l4P(" + p1.decGen + "," + p2.decGen + "," + p3.decGen + "," + p4.decGen + ")",
    encPhen: p1.encPhen.concat(p2.encPhen).concat(p3.encPhen).concat(p4.encPhen)
});

// generates a list of 5 parameters
var l5P = (p1, p2, p3, p4, p5) => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.026311, p1.encGen, p2.encGen, p3.encGen, p4.encGen, p5.encGen, 0]),
    decGen: "l5P(" + p1.decGen + "," + p2.decGen + "," + p3.decGen + "," + p4.decGen + "," + p5.decGen + ")",
    encPhen: p1.encPhen.concat(p2.encPhen).concat(p3.encPhen).concat(p4.encPhen).concat(p5.encPhen)
});

// random list up to 12 values with uniform distribution within interval [0, 1]
var lRnd = (numItemsSeed, seqSeed) => {
    random.use(seedrandom(numItemsSeed.encPhen));
    var numItems = random.int(1, 12);
    random.use(seedrandom(seqSeed.encPhen));
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.816554, numItemsSeed.encGen, seqSeed.encGen, 0]),
        decGen: "lRnd(" + numItemsSeed.decGen + "," + seqSeed.decGen + ")",
        encPhen: Array(numItems).fill().map(() => r6d(random.float()))
    });
};

// random list up to 12 values with normal distribution within interval [0, 1]
var lGaussRnd = (numItemsSeed, seqSeed) => {
    random.use(seedrandom(numItemsSeed.encPhen));
    var numItems = random.int(1, 12);
    random.use(seedrandom(seqSeed.encPhen));
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.434588, numItemsSeed.encGen, seqSeed.encGen, 0]),
        decGen: "lGaussRnd(" + numItemsSeed.decGen + "," + seqSeed.decGen + ")",
        encPhen: Array(numItems).fill().map(() => gaussRnd())
    });
};

// concatenates two lists sequentially
var lConcatL = (l1, l2) => indexExprReturnSpecimen({
    funcType: "listF",
    encGen: flattenDeep([1, 0.339394, , l1.encGen, l2.encGen, 0]),
    decGen: "lConcatL(" + l1.decGen + "," + l2.decGen + ")",
    encPhen: l1.encPhen.concat(l2.encPhen)
});

// concatenates two events sequentially
var vConcatE = (e1, e2) => indexExprReturnSpecimen({
    funcType: "voiceF",
    encGen: flattenDeep([1, 0.957428, e1.encGen, e2.encGen, 0]),
    decGen: "vConcatE(" + e1.decGen + "," + e2.decGen + ")",
    encPhen: [z2p(2)].concat(e1.encPhen.concat(e2.encPhen)),
    phenLength: 2,
    tempo: e1.tempo,
    harmony: {
        root: Math.min(e1.harmony.root, e2.harmony.root),
        chord: [e1.harmony.root, e2.harmony.root],
        mode: [e1.harmony.root, e2.harmony.root].sort((a, b) => a - b),
        chromaticism: 1
    }
});

// concatenates two voices sequentially
var vConcatV = (v1, v2) => indexExprReturnSpecimen({
    funcType: "voiceF",
    encGen: flattenDeep([1, 0.575462, v1.encGen, v2.encGen, 0]),
    decGen: "vConcatV(" + v1.decGen + "," + v2.decGen + ")",
    encPhen: [z2p(v1.phenLength + v2.phenLength)].concat(v1.encPhen.slice(1)).concat(v2.encPhen.slice(1)),
    phenLength: v1.phenLength + v2.phenLength,
    tempo: v1.tempo,
    rhythm: v1.rhythm,
    harmony: v1.harmony,
    analysis: v1.analysis,
});

// concatenates two scores sequentially
var sConcatS = (s1, s2) => indexExprReturnSpecimen({
    funcType: "scoreF",
    encGen: flattenDeep([1, 0.193496, s1.encGen, s2.encGen, 0]),
    decGen: "sConcatS(" + s1.decGen + "," + s2.decGen + ")",
    encPhen: s1.encPhen.concat(s2.encPhen),
    phenLength: s1.phenLength + s2.phenLength,
    tempo: s1.tempo,
    rhythm: s1.rhythm,
    harmony: s1.harmony,
    analysis: s1.analysis,
});




//////////

var mergeScores = (scoEncPhen1, scoEncPhen2) => {
    var maxVoices = p2z(Math.max(scoEncPhen1[0], scoEncPhen1[0]));
    var voice
    var eventsInVoice;
    var voiceDur, newScoreDur = 0;
    var pos = 1;
    for (var vo = 0; vo < maxVoices; vo++) {
        eventsInVoice = p2z(scoEncPhen1[pos]);
        console.log("parseo eventos = " + eventsInVoice);
        pos++;
        voiceDur = 0;
        for (var ev = 0; ev < eventsInVoice; ev++) {
            voiceDur += scoEncPhen1[pos];
            pos++;
            pos += p2z(scoEncPhen1[pos]) + 3;
        }
        if (newScoreDur < voiceDur) newScoreDur = voiceDur;
    }
    pos = 1;
    for (var vo = 0; vo < maxVoices; vo++) {
        eventsInVoice = p2z(scoEncPhen2[pos]);
        console.log("parseo eventos = " + eventsInVoice);
        pos++;
        voiceDur = 0;
        for (var ev = 0; ev < eventsInVoice; ev++) {
            voiceDur += scoEncPhen2[pos];
            pos++;
            pos += p2z(scoEncPhen2[pos]) + 3;
        }
        if (newScoreDur < voiceDur) newScoreDur = voiceDur;
    }
    console.log("new score dur = " + newScoreDur);
    return maxVoices;
}



// add two numbers
var oSum = (p1, p2) => indexExprReturnSpecimen({
    funcType: "operationF",
    encGen: flattenDeep([1, 0.601773, p1.encGen, p2.encGen, 0]),
    decGen: "oSum(" + p1.decGen + "," + p2.decGen + ")",
    encPhen: [p1.encPhen[0] + p2.encPhen[0]]
});

// repeats a parameter a number of times between 2 and 36 repetitions
var lRepeatP = (param, times) => {
    var numRepeats = adjustRange(Math.abs(p2q(times.encPhen[0])), 2, 36); // number of times rescaled to range [2, 36], mapped according to the deviation from the center value 0.5
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.970583, param.encGen, times.encGen, 0]),
        decGen: "lRepeatP(" + param.decGen + "," + times.decGen + ")",
        encPhen: Array(numRepeats).fill(param.encPhen[0])
    });
};

// repeats and concatenates as a list re-evaluations of a parameter function (2 to 36 repeats) 
var lIterP = (param, times) => {
    var numIterations = adjustRange(Math.abs(p2q(times.encPhen[0])), 2, 36); // number of times rescaled to range [2, 36], mapped according to the deviation from the center value 0.5 using the quantizedF map
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.63119, param.encGen, times.encGen, 0]),
        decGen: "lIterP(" + param.decGen + "," + times.decGen + ")",
        encPhen: flattenDeep(Array(numIterations).fill().map(() => eval(param.decGen).encPhen))
    });
};

// repeats and concatenates as a list re-evaluations of a list function (2 to 36 repeats) 
var lIterL = (list, times) => {
    var numIterations = adjustRange(Math.abs(p2q(times.encPhen[0])), 2, 36); // number of times rescaled to range [2, 36], mapped according to the deviation from the center value 0.5 using the quantizedF map
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.249224, list.encGen, times.encGen, 0]),
        decGen: "lIterL(" + list.decGen + "," + times.decGen + ")",
        encPhen: flattenDeep(Array(numIterations).fill().map(() => eval(list.decGen).encPhen))
    });
};

// repeats and concatenates as a voice re-evaluations of an event function (2 to 36 repeats) 
var vIterE = (event, times) => {
    var numIterations = adjustRange(Math.abs(p2q(times.encPhen[0])), 2, 36); // number of times rescaled to range [2, 36], mapped according to the deviation from the center value 0.5 using the quantizedF map
    if (numIterations > phenMaxLength) return -1;
    return indexExprReturnSpecimen({
        funcType: "listF",
        encGen: flattenDeep([1, 0.867258, event.encGen, times.encGen, 0]),
        decGen: "vIterE(" + event.decGen + "," + times.decGen + ")",
        encPhen: wrap(flattenDeep(Array(numIterations).fill().map(() => eval(event.decGen).encPhen))),
        phenLength: numIterations,
        tempo: event.tempo,
        rhythm: event.rhythm,
        harmony: event.harmony,
        analysis: event.analysis
    });
};

// autoreferences framework for different functionTypes
var autoref = (funcName, funcType, encodedFunctionIndex, subexprIndex, silentElement) => {
    var subexprLength = subexpressions[funcType].length;
    // if no autoreferences available, returns default, a silent element to sustain the function tree
    if (subexprLength == 0) return eval(silentElement);
    subexprIndex %= subexprLength;
    var evaluatedSubexp = eval(subexpressions[funcType][subexprIndex]);
    return indexExprReturnSpecimen({
        funcType: funcType,
        encGen: flattenDeep([1, encodedFunctionIndex, 0.57, z2p(subexprIndex), 0]),
        decGen: funcName + "(" + subexprIndex + ")",
        encPhen: evaluatedSubexp.encPhen,
        phenLength: evaluatedSubexp.phenLength,
        tempo: evaluatedSubexp.tempo,
        rhythm: evaluatedSubexp.rhythm,
        harmony: evaluatedSubexp.harmony,
        analysis: evaluatedSubexp.analysis
    });
};

// autoreferences functions for each output type
var pAutoref = subexprIndex => autoref("pAutoref", "paramF", 0.45085, subexprIndex, "p(.5)");
var lAutoref = subexprIndex => autoref("lAutoref", "listF", 0.068884, subexprIndex, "l([.5])");
var eAutoref = subexprIndex => autoref("eAutoref", "eventF", 0.686918, subexprIndex, "e(p(0),p(0),p(0),p(0))");
var vAutoref = subexprIndex => autoref("vAutoref", "voiceF", 0.304952, subexprIndex, "v(e(p(0),p(0),p(0),p(0)))");
var sAutoref = subexprIndex => autoref("sAutoref", "scoreF", 0.922986, subexprIndex, "s(v(e(p(0),p(0),p(0),p(0))))");


////////// FUNCTION LIBRARIES HANDLING

// create JSON files from data in JavaScript Object 
var createJSON = (objectData, filename) => fs.writeFileSync(filename, JSON.stringify(objectData));

// create the complet catalogue of all available functions
var createFunctionIndexesCatalogues = (library) => {
    var functionLibrary = JSON.parse(fs.readFileSync(library));
    console.log(functionLibrary);
    var functionDecodedIndexes = {};
    var functionEncodedIndexes = {};
    var functionNamesDictionary = {};
    var availableTypes = Object.keys(functionLibrary);
    var availableTypesLength = availableTypes.length;
    var availableFunctionsLength, readName, readIndex, readFuncType;
    for (var t = 0; t < availableTypesLength; t++) {
        availableFunctionsLength = Object.keys(functionLibrary[availableTypes[t]]).length;
        for (var n = 0; n < availableFunctionsLength; n++) {
            readName = Object.keys(functionLibrary[availableTypes[t]])[n];
            readIndex = Object.values(functionLibrary[availableTypes[t]])[n].functionIndex;
            readArguments = Object.values(functionLibrary[availableTypes[t]])[n].arguments;
            readFuncType = Object.values(functionLibrary[availableTypes[t]])[n].functionType;
            functionDecodedIndexes[readIndex.toString()] = readName;
            functionEncodedIndexes[z2p(readIndex).toString()] = readName;
            functionNamesDictionary[readName] = { encIndex: z2p(readIndex), intIndex: readIndex, functionType: readFuncType, arguments: readArguments };
        }
    }
    var decodedIndexesOrdered = {};
    Object.keys(functionDecodedIndexes).sort().forEach(function (key) {
        decodedIndexesOrdered[key] = functionDecodedIndexes[key];
    });
    var encodedIndexesOrdered = {};
    Object.keys(functionEncodedIndexes).sort().forEach(function (key) {
        encodedIndexesOrdered[key] = functionEncodedIndexes[key];
    });
    var functionNamesOrdered = {};
    Object.keys(functionNamesDictionary).sort().forEach(function (key) {
        functionNamesOrdered[key] = functionNamesDictionary[key];
    });
    var completCatalogue = {
        decodedIndexes: decodedIndexesOrdered,
        encodedIndexes: encodedIndexesOrdered,
        functionNames: functionNamesOrdered,
        functionLibrary: functionLibrary
    }
    return completCatalogue;
}


// create the library with eligible functions extracted from the complete library
var createEligibleFunctionLibrary = (completeLib, eligibleFunc) => {
    var allDecIndexes = JSON.parse(JSON.stringify( completeLib.decodedIndexes ));
    var allFuncNames = JSON.parse(JSON.stringify( completeLib.functionNames ));
    var allFuncLibr = JSON.parse(JSON.stringify( completeLib.functionLibrary )); 
    var includedFuncs = JSON.parse(JSON.stringify( eligibleFunc.includedFunctions ));
    if (includedFuncs.length == 0) includedFuncs = Object.keys(allDecIndexes).map(x => parseInt(x));
    var mandatoryFuncs = JSON.parse(JSON.stringify( eligibleFunc.mandatoryFunctions ));
    var excludedFuncs = JSON.parse(JSON.stringify( eligibleFunc.excludedFunctions ));
    var eligibleFuncLib = {
        initialConditions: {
            includedFunctions: eligibleFunc.includedFunctions,
            mandatoryFunctions: mandatoryFuncs,
            excludedFunctions: excludedFuncs
        },
        elegibleFunctions: {},
        decodedIndexes: {}, 
        encodedIndexes: {}, 
        functionNames: {}, 
        functionLibrary: {
            scoreF: {},
            voiceF: {},
            eventF: {},
            listF: {},
            paramF: {},
            operationF: {}
        }, 
    };
    // add mandatory functions and remove duplicates if needed
    if (includedFuncs.length > 0) includedFuncs = 
    [... new Set(includedFuncs.concat(mandatoryFuncs))];
    // remove excluded functions from the collection
    var positionsForRemove = (excludedFuncs.map(x => includedFuncs.indexOf(x))).sort((a, b) => b - a);
    positionsForRemove.map(x => { if (x > -1) includedFuncs.splice(x, 1); });
    var totalIncludedFunctions = includedFuncs.length;
    // write the elegible functions set
    var readFunc, functTyp;
    for (var i = 0; i < totalIncludedFunctions; i++) {
        readFunc = allDecIndexes[includedFuncs[i]];
        functTyp = allFuncNames[readFunc].functionType;
        eligibleFuncLib.decodedIndexes[includedFuncs[i].toString()] = readFunc;
        eligibleFuncLib.encodedIndexes[z2p(includedFuncs[i]).toString()] = readFunc;
        eligibleFuncLib.functionNames[readFunc] = allFuncNames[readFunc];
        eligibleFuncLib.functionLibrary[functTyp][readFunc] = allFuncLibr[functTyp][readFunc];
    }
    // sort lists
    var decodedIndexesOrdered = {};
    Object.keys(eligibleFuncLib.decodedIndexes).sort().forEach(function (key) {
        decodedIndexesOrdered[key] = eligibleFuncLib.decodedIndexes[key];
    });
    eligibleFuncLib.decodedIndexes = decodedIndexesOrdered;
    var encodedIndexesOrdered = {};
    Object.keys(eligibleFuncLib.encodedIndexes).sort().forEach(function (key) {
        encodedIndexesOrdered[key] = eligibleFuncLib.encodedIndexes[key];
    });
    eligibleFuncLib.encodedIndexes = encodedIndexesOrdered;
    var functionNamesOrdered = {};
    Object.keys(eligibleFuncLib.functionNames).sort().forEach(function (key) {
        functionNamesOrdered[key] = eligibleFuncLib.functionNames[key];
    });
    eligibleFuncLib.functionNames = functionNamesOrdered;
    eligibleFuncLib.elegibleFunctions = includedFuncs.sort((a, b) => a - b);
    return eligibleFuncLib;
}


////////// ENCODING, DECODING AND EVALUATING GENOTYPES

// Genotypes encoder
encodeGenotype = decGen => {
    var encodedGenotype = [];
    var leafType, leafIndex, readToken = "";
    decGen = decGen.replace(/ /g, ""); // remove blanck spaces
    var pos = 0;
    do {
        if (/^\,/.test(decGen) || /^\(/.test(decGen)) {
            // ignores commas and open parenthesis, to not be read as a number
            decGen = decGen.substr(1);
        }
        else if (/^\)/.test(decGen)) {
            encodedGenotype.push(0);
            decGen = decGen.substr(1);
        }
        else if (/^\]/.test(decGen)) {
            encodedGenotype.push(0.2);
            decGen = decGen.substr(1);
        }
        else if (/^\[/.test(decGen)) {
            encodedGenotype.push(0.8);
            decGen = decGen.substr(1);
        }
        else if (/^[a-zA-Z]/.test(decGen)) {
            do {
                readToken += decGen[0];
                decGen = decGen.substr(1);
            } while (decGen[pos] != "(");
            if (GenoMusPianoFunctionLibrary.functionNames[readToken] == undefined) {
                console.log("Error: invalid function name. Not found in the library.");
                return [-1];
            }
            else {
                leafType = GenoMusPianoFunctionLibrary.functionNames[readToken].arguments[0];
                encodedGenotype.push(1, GenoMusPianoFunctionLibrary.functionNames[readToken].encIndex);
            }
            readToken = "";
            decGen = decGen.substr(1);
        }
        else if ((/^\d/.test(decGen) || /^./.test(decGen) || /^\//.test(decGen)) && /^\,/.test(decGen) == false && /^\)/.test(decGen) == false && /^\]/.test(decGen) == false) {
            while ((/^\d/.test(decGen) || /^./.test(decGen) || /^\//.test(decGen)) && /^\,/.test(decGen) == false && /^\)/.test(decGen) == false && /^\]/.test(decGen) == false) {
                readToken += decGen[0];
                decGen = decGen.substr(1);
            };
            switch (leafType) {
                case "leaf":
                    encodedGenotype.push(0.5, parseFloat(readToken)); break;
                case "notevalueLeaf":
                    encodedGenotype.push(0.51, n2p(fraction2decimal(readToken))); break;
                case "durationLeaf":
                    encodedGenotype.push(0.52, d2p(parseFloat(readToken))); break;
                case "midipitchLeaf":
                    encodedGenotype.push(0.53, m2p(parseFloat(readToken))); break;
                case "frequencyLeaf":
                    encodedGenotype.push(0.54, f2p(parseFloat(readToken))); break;
                case "articulationLeaf":
                    encodedGenotype.push(0.55, a2p(parseFloat(readToken))); break;
                case "intensityLeaf":
                    encodedGenotype.push(0.56, i2p(parseFloat(readToken))); break;
                case "goldenintegerLeaf":
                    encodedGenotype.push(0.57, z2p(parseFloat(readToken))); break;
                case "quantizedLeaf":
                    encodedGenotype.push(0.58, q2p(parseFloat(readToken))); break;
                default:
                    console.log("Error: leaf type not found.");
                    return [-1];
            }
            readToken = "";
        }
        else {
            decGen = decGen.substr(1);
        }
    } while (decGen.length > 0);
    return encodedGenotype;
}

// Genotypes decoder
var decodeGenotype = encGen => {
    var encGenLength = encGen.length;
    var decodedGenotype = "";
    var pos = 0;
    while (pos < encGenLength) {
        switch (encGen[pos]) {
            case 0:
                decodedGenotype += "),"; break;
            case 0.2:
                decodedGenotype += "],"; break;
            case 0.5:
                pos++; decodedGenotype += encGen[pos] + ","; break;
            case 0.51:
                pos++; decodedGenotype += p2n(encGen[pos]) + ","; break;
            case 0.52:
                pos++; decodedGenotype += p2d(encGen[pos]) + ","; break;
            case 0.53:
                pos++; decodedGenotype += p2m(encGen[pos]) + ","; break;
            case 0.54:
                pos++; decodedGenotype += p2f(encGen[pos]) + ","; break;
            case 0.55:
                pos++; decodedGenotype += p2a(encGen[pos]) + ","; break;
            case 0.56:
                pos++; decodedGenotype += p2i(encGen[pos]) + ","; break;
            case 0.57:
                pos++; decodedGenotype += p2z(encGen[pos]) + ","; break;
            case 0.58:
                pos++; decodedGenotype += p2q(encGen[pos]) + ","; break;
            case 0.8:
                decodedGenotype += "["; break;
            case 1:
                pos++; decodedGenotype += GenoMusPianoFunctionLibrary.encodedIndexes[encGen[pos]] + "("; break;
            default:
                console.log("Error: not recognized token reading input decoded genotype.");
                console.log("Readed value:" + encGen[pos]);
                return decodedGenotype;
        }
        pos++;
    }
    return decodedGenotype.replace(/\,\)/g, ")").replace(/\,\]/g, "]").slice(0, -1);
}

// encodes and decodes a genotype to filter bad or dangerous expressions before being evaluated
var evalDecGen = decGen => {
    var encodedGenotype = encodeGenotype(decGen);
    if (encodedGenotype[0] == -1) {
        console.log("Error: not a valid decoded genotype.");
        return -1;
    }
    else {
        return eval(decodeGenotype(encodedGenotype));
    }
}

////// VISUALIZATION

var visualizeSpecimen = (normArray, filename) => {
    var maxLinesPerRow = 130, graphWidth, graphHeight;
    var lineColor, lineMaxHeight = 140, lineWidth = 10, lineOffset = 1, rowOffset = 15, lineColor;
    var roundedCornerRadius = lineWidth * 0.5;
    var specimenLength = normArray.length;
    var totalRows = Math.ceil(specimenLength / maxLinesPerRow);
    if (specimenLength > maxLinesPerRow) {
        graphWidth = maxLinesPerRow * (lineWidth + lineOffset);
    } else {
        graphWidth = specimenLength * (lineWidth + 1);
    }
    graphHeight = lineMaxHeight * totalRows + rowOffset * (totalRows - 1);
    var lines = "";
    var SVGheader = "<svg version='1.1'\n    baseProfile='full'\n    width='" +
        graphWidth + "' height='" + graphHeight +
        "'\n    xmlns='http://www.w3.org/2000/svg'>\n    <rect x='0' y='0' width=';" +
        graphWidth + "' height='" + graphHeight +
        "' style='fill:white;' />\n";
    for (var i = 0; i < specimenLength; i++) {
        lineHeight = normArray[i] * (lineMaxHeight - lineWidth) + lineWidth;
        if (normArray[i] == 0 || normArray[i] == 1) {
            lineColor = "black";
        } else
            if (normArray[i] == 0.2 || normArray[i] == 0.5 || normArray[i] == 0.8) {
                lineColor = "dimgray";
            } else {
                lineColor = "hsl(" + (norm2goldeninteger(normArray[i]) % 360) + "," + 93 + "%," + 50 + "%)";
            }
        lines = lines +
            "    <rect x='" + (i * (lineWidth + lineOffset) - Math.floor(i / maxLinesPerRow) * maxLinesPerRow * (lineWidth + lineOffset)) +
            "' y='" + (Math.floor(i / maxLinesPerRow) * (lineMaxHeight + rowOffset) + lineMaxHeight - lineHeight) +
            "' rx='" + roundedCornerRadius + "' ry='" + roundedCornerRadius + "' width='" + lineWidth + "' height='" + lineHeight +
            "' style='fill:" + lineColor + "' />\n";
    }
    var SVGcode = SVGheader + lines + "</svg>";
    fs.writeFileSync(filename + '.svg', SVGcode);
};









// EXPRESSIONS PROCESSING

// compress an expanded expression
var compressExpr = expandedFormExpr => {
    var temporaryExpr = "";
    for (var charIndx = 0; charIndx < expandedFormExpr.length; charIndx++) {
        if (expandedFormExpr.charAt(charIndx) != " " && expandedFormExpr.charAt(charIndx) != "\n") {
            temporaryExpr = temporaryExpr + expandedFormExpr.charAt(charIndx);
        }
    }
    temporaryExpr = temporaryExpr.replace(/,/g, ", ");
    expandedFormExpr = temporaryExpr;
    return expandedFormExpr;
}

// expand and indent a compressed expression in a human readable format
var expandExpr = compressedFormExpr => {
    //compressedFormExpr = compressedFormExpr.toString();
    compressedFormExpr = compressExpr(compressedFormExpr);

    compressExpr(compressedFormExpr);
    var expandedExpression = "";
    // compressedFormExpr = compressedFormExpr.replace(/\s+/g," ");
    // compressedFormExpr = compressedFormExpr.replace(/(\r\n|\n|\r|)/gm,"");
    compressedFormExpr = compressedFormExpr.replace(/\(/g, "(\n");
    compressedFormExpr = compressedFormExpr.replace(/, /g, ",\n");
    compressedFormExpr = compressedFormExpr.replace(/\n\)/g, ")");
    compressedFormExpr = compressedFormExpr.replace(/\bp\(\n/g, "p(");
    compressedFormExpr = compressedFormExpr.replace(/AutoRef\(\n/g, "AutoRef(");    
    var parenthCount = 0;
    for (var charIndx = 0; charIndx < compressedFormExpr.length; charIndx++) {
        expandedExpression = expandedExpression + compressedFormExpr.charAt(charIndx);
        if (compressedFormExpr.charAt(charIndx) == "(") {
            parenthCount++
        }
        if (compressedFormExpr.charAt(charIndx) == ")") {
            parenthCount--
        }
        if (compressedFormExpr.charAt(charIndx) == "\n") {
            var tabulation = "    ";
            for (n = 0; n < parenthCount; n++) {
                expandedExpression = expandedExpression + tabulation;
            }
        }
    }
    // rewrite expandedExpr maintaining matrices in a single line
    var matrixCompactExpr = "";
    var matrixOpen = 0;
    for (charIndx = 0; charIndx < expandedExpression.length; charIndx++) {
        if (expandedExpression.charAt(charIndx) == "[") {
            matrixOpen++
        };
        if (expandedExpression.charAt(charIndx) == "]") {
            matrixOpen--
        };
        if (matrixOpen > 0) {
            if (expandedExpression.charAt(charIndx) != "\n" && expandedExpression.charAt(charIndx) != " ") {
                matrixCompactExpr = matrixCompactExpr + expandedExpression.charAt(charIndx);
            }
        } else {
            matrixCompactExpr = matrixCompactExpr + expandedExpression.charAt(charIndx);
        }
    }
    compressedFormExpr = matrixCompactExpr;
    //compressedFormExpr = compressedFormExpr.substring(1,compressedFormExpr.length-1);
    return compressedFormExpr;
    // outlet(0, compressedFormExpr);
    // outlet(1, eval(compressedFormExpr)[0]);
}


   
////////////////////
// PHENOTYPE DECODER

// bach roll converter
var encPhen2bachRoll = encPhen => {
    var wholeNoteDur = 4000; // default value for tempo, 1/4 note = 1 seg 
    var roll = [];
    var arrLength = encPhen.length;
    var numVoices, numEvents, numPitches, pos = 0;
    var eventDur, totalVoiceDeltaTime;
    var pitchSet, articul, intens;
    // write voices within a score
    numVoices = p2z(encPhen[pos]);
    pos++;
    for (var v = 0; v < numVoices; v++) {
        numEvents = p2z(encPhen[pos]);
        roll.push("(");
        pos++;
        // write events within a voice
        totalVoiceDeltaTime = 0;
        for (var e = 0; e < numEvents; e++) {
            // write event
            roll.push("(");
            // writes start time
            roll.push(totalVoiceDeltaTime);
            eventDur = wholeNoteDur * eval(p2n(encPhen[pos]));
            pos++;
            // loads number of pitches within an event
            numPitches = p2z(encPhen[pos]);
            pos++;
            // read the pitches;
            pitchSet = [];
            for (var pit = 0; pit < numPitches; pit++ ) {
                pitchSet.push(p2m(encPhen[pos]) * 100);
                pos++;
            }
            console.log("leidos pitches " + pitchSet);
            // read articulation
            articul = eventDur * p2a(encPhen[pos]);
            pos++;
            // read intensity
            intens = p2i(encPhen[pos]);
            pos++;
            // writes individual notes parameters
            for (var pit = 0; pit < numPitches; pit++) {
                roll.push("(");
                // adds a pitch of the chord
                roll.push(pitchSet[pit]);
                // adds duration of sound according to articulation % value
                roll.push(articul);
                // adds dynamics (converts from 0-1 to 127 standard MIDI velocity)
                roll.push(intens);
                roll.push(")");
            }
            totalVoiceDeltaTime = totalVoiceDeltaTime + eventDur;
            roll.push(")");        
        }
    roll.push(")");
    }
    return roll;
}

// encPhen2bachRoll([ 0.618034, 0.618034, 0.6, 0.618034, 0.48, 1, 1 ]);


// WRITE SPECIMEN JSON FILES

var specimenDataStructure = (specimen) => ({
    encodedGenotype: specimen.encGen,
    decodedGenotype: specimen.decGen,
    formattedGenotype: expandExpr(specimen.decGen),
    encodedPhenotype: specimen.encPhen,
    roll: encPhen2bachRoll(specimen.encPhen)
});



// generates the catalogues of function indexes
var GenoMusPianoFunctionLibrary = createFunctionIndexesCatalogues('piano_functions.json');
// exports the catalogues of function indexes, ordered by function name, encoded indexes and integer indexes
/*
createJSON(GenoMusPianoFunctionLibrary, 'GenoMus_piano_function_library.json');
*/

// eligible functions (all functions available)
var eligibleFunctions = {
    includedFunctions: [],
    mandatoryFunctions: [],
    excludedFunctions: []
};

// generates the catalogues of elegible functions to be used for genotype generation
var eligibleFunctionsLibrary = createEligibleFunctionLibrary(GenoMusPianoFunctionLibrary, eligibleFunctions);
// exports the catalogues of elegible function indexes, ordered by function name, encoded indexes and integer indexes, and containing the initial conditions of the subset
/*
createJSON(eligibleFunctionsLibrary, 'eligible_functions_library.json');
*/




// MAX COMMUNICATION

// gets data from manual text input from max patch
maxAPI.addHandler("text", (...args) => {
    // make a string from params array
    var receivedText = "";
    for (var i = 0; i < args.length; i++) {
        receivedText += args[i];
    } 
    var evaluation = evalDecGen(receivedText);
    maxAPI.post(mt(receivedText));
    maxAPI.post(evaluation);

    // write JSON file   
    createJSON(specimenDataStructure(evaluation), 'genotipo.json');
});