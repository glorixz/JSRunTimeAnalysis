function makeCurve(curveType) {
    if (curveType === 'Bezier') {
        makeBezierCurve();
    } else if (curveType === 'Basic') {
        makeBasicCurve();
    } else {
        makeNoCurve();
    }
}

function makeBezierCurve() {
    for (let i = 0; i < 3; i++) {
        for (let a = 0; a < 3; a++) {
            if (i === 2) {
                nChooseK();
            }
        }
    }
}

function nChooseK() {
    let c = 0;
    for (let a = 0; a < 5; a++) {
        c += a;
    }

    return c;
}

function makeBasicCurve() {
    let num = Math.floor(Math.random() * 11);

    if (num === 10) {
        console.log("Something happened");
    } else {
        nChooseK();
    }
}

function makeNoCurve() {
    console.log("Oh poo");
}

makeCurve('Bezier');
makeCurve('Basic');
makeCurve('Histogram');