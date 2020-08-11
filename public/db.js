// Create & declare new db request 
let db;
const request = indexedDB.open("budget", 1);

// change the db version from no database to first version 
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore("pending", {
        autoIncrement: true
    });
};

// check if app is online before reading from db
request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        checkDatabase();
    }
};
// error code 
request.onerror = function (event) {
    // console log error 
    console.log(event.target.errorCode);
};
// creates a pending transaction, accesses the objecttore
function saveRecord(record) {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    store.add(record);
}
// check db for all known records
function checkDatabase() {
    const transaction = db.transaction(["pending"], "readwrite");
    const store = transaction.objectStore("pending");
    const getAll = store.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    // delete records if successful
                    const transaction = db.transaction(["pending"], "readwrite");
                    const store = transaction.objectStore("pending");
                    store.clear();
                });
        }
    };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);