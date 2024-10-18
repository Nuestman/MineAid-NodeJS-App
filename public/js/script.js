// Pre-populate Date with Today's Date
window.onload = function() {
    getDate();
    getTime();
};

function getDate() {
    var today = new Date();
    document.getElementById("date").valueAsDate = today;
}

function getTime() {
    var now = new Date();
    var hours = now.getHours().toString().padStart(2, '0');
    var minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById("time_of_arrival").value = `${hours}:${minutes}`;
}
