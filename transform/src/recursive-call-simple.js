function getFactorial(n) {
    if(n == 1) {
        giveSecretMessage();
        return 1;
    }
    else {
        let result = n * getFactorial(n - 1);
        return result;
    }
}

function giveSecretMessage() {
    console.log("scrambled eggs!");
}

let result = getFactorial(5);
console.log(result);
