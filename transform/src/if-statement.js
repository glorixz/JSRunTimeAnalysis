function main(v) {
    if (v == 0) {
        vIsZero();
    } else if (v == 4) {
        vIsFour();
    } else {
        vIsNeither();
    }
}

function vIsZero() {
    console.log("v is 0");
    console.log("v is 0");
}

function vIsFour() {
    console.log("v is 4");
    console.log("v is 4");
    console.log("v is 4");
}

function vIsNeither() {
    console.log("v is not 4 or 0");
    console.log("v is not 4 or 0");
    console.log("v is not 4 or 0");
    console.log("v is not 4 or 0");
}

main(0);
main(4);
main(65);