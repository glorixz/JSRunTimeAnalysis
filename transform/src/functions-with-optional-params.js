students = {
    0: "Jane Doe",
    1: "Bob Jones",
    2: "Bill Lee"
};

function main(age, studentId = 0) {
    let studentName = findStudentName(studentId);
    console.log(studentName + " " + age);
}

function findStudentName(studentId) {
    for (let i = 0; i < 10000; i++) {

    }

    return students[studentId];
}

main(10);
main(25, 2);
