/* Clock setup */
const hours = document.querySelector('.hours');
const minutes = document.querySelector('.minutes');
const seconds = document.querySelector('.seconds');

const clock = () => {
    let today = new Date();
    let h = today.getHours() % 12 + today.getMinutes() / 59;
    let m = today.getMinutes();
    let s = today.getSeconds();

    h *= 30; // 12 * 30 = 360deg
    m *= 6;
    s *= 6; // 60 * 6 = 360deg

    rotation(hours, h);
    rotation(minutes, m);
    rotation(seconds, s);

    // Compare current time with stored times in Firebase
    checkScheduledFeedTime(today);

    setTimeout(clock, 500);
};

const rotation = (target, val) => {
    target.style.transform = `rotate(${val}deg)`;
};

window.onload = clock;

/* Toggle UI components */
function toggleDiv() {
    $('.components').toggle();
    $('.components2').toggle();
}

/* Firebase configuration */
const firebaseConfig = {
    apiKey: "AIzaSyCibbVTw8liey30579-xKfU7i1O-TVgdAI", // Replace with your actual API key
    authDomain: "fish-feeder-e45b9.firebaseapp.com",
    databaseURL: "https://fish-feeder-e45b9-default-rtdb.firebaseio.com",
    projectId: "fish-feeder-e45b9",
    storageBucket: "fish-feeder-e45b9.appspot.com",
    messagingSenderId: "774677814206",
    appId: "1:774677814206:web:4dea066d5172091574f7ef",
    measurementId: "G-Y96JWN6BPL" // Optional: For Firebase Analytics
};

/* Initialize Firebase */
firebase.initializeApp(firebaseConfig);

// If you want to use Firebase Analytics
if (firebase.analytics) {
    firebase.analytics();
}

// Firebase Realtime Database reference
let count = 0; // Initialize count to a default value
const countRef = firebase.database().ref('count');

// Listen for changes in the 'count' node of Firebase Database
countRef.on('value', function(snapshot) {
    if (snapshot.exists()) {
        count = snapshot.val();
        console.log("Count from database:", count);
    } else {
        console.log("No count value found in database.");
    }
});

/* Set feednow value in Firebase Database */
function feednow() {
    firebase.database().ref().update({
        feednow: 1
    }).then(() => {
        console.log("Feed Now signal sent.");
    }).catch((error) => {
        console.error("Error updating feednow:", error);
    });
}

/* Initialize the time picker when page is ready */
$(document).ready(function() {
    $('#timepicker').mdtimepicker(); // Initializes the time picker
    addDiv();
});

/* Handle time change events */
$('#timepicker').mdtimepicker().on('timechanged', function(e) {
    console.log("Time selected:", e.time);  // Log the time selected by the user
    addStore(count, e);   // Store the selected time
    count += 1;           // Increment the count value
    firebase.database().ref().update({
        count: count       // Update the count in Firebase
    }).then(() => {
        console.log("Count updated to:", count);
    }).catch((error) => {
        console.error("Error updating count:", error);
    });
});

/* Store the selected time in Firebase */
function addStore(count, e) {
    firebase.database().ref('timers/timer' + count).set({
        time: e.time       // Store the time under the timers node
    }).then(() => {
        console.log("Timer added:", e.time);
        addDiv();  // Update the list of timers
    }).catch((error) => {
        console.error("Error adding timer:", error);
    });
}

/* Toggle visibility of time details */
function showShort(id) {
    const idv = $(id)[0].id;
    $("#time_" + idv).toggle();
    $("#short_" + idv).toggle();
}

/* Remove a timer from Firebase and the UI */
function removeDiv(id) {
    const idv = $(id)[0].id;
    firebase.database().ref('timers/' + idv).remove()
        .then(() => {
            console.log("Timer removed:", idv);
            if (count > 0) {
                count -= 1;  // Decrement the count
                firebase.database().ref().update({
                    count: count  // Update the count in Firebase
                }).then(() => {
                    console.log("Count decremented to:", count);
                }).catch((error) => {
                    console.error("Error decrementing count:", error);
                });
            }
            $(id).fadeOut(500);  // Fade out the removed timer element
        })
        .catch((error) => {
            console.error("Error removing timer:", error);
        });
}

/* Load timers from Firebase and display them on the page */
function addDiv() {
    const divRef = firebase.database().ref('timers');
    divRef.once('value', function(snapshot) {
        const obj = snapshot.val();
        $('#wrapper').html('');  // Clear the wrapper before appending new timers
        if (obj) {
            Object.keys(obj).forEach((key) => {
                let ts = obj[key].time;  // Get the time for the timer

                let H = parseInt(ts.substr(0, 2), 10);  // Extract the hours from the time string
                let h = (H % 12) || 12;    // Convert hours to 12-hour format
                h = h < 10 ? "0" + h : h; // Add leading zero for single-digit hours
                let ampm = H < 12 ? " AM" : " PM";  // Determine AM/PM
                ts = h + ts.substr(2, 3) + ampm;  // Format the time string

                console.log("Displaying timer:", ts);

                const timerHTML = `
                    <div id="${key}">
                        <div class="btn2 btn__secondary2" onclick="showShort('#${key}')" id="main_${key}">
                            <div id="time_${key}">
                                ${ts}
                            </div>
                            <div class="icon2" id="short_${key}" onclick="removeDiv('#${key}')">
                                <div class="icon__add">
                                    <ion-icon name="trash"></ion-icon>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                $('#wrapper').append(timerHTML);  // Append the timer to the UI
            });
        }
    }).catch((error) => {
        console.error("Error loading timers:", error);
    });
}

/* Function to compare current time with Firebase schedules */
/* Function to compare current time with Firebase schedules */
/* Function to compare current time with Firebase schedules */
/* Function to compare current time with Firebase schedules */
function checkScheduledFeedTime(currentTime) {
    console.log("Checking scheduled feed times at:", currentTime); // Debug: Log current time

    const divRef = firebase.database().ref('timers');
    divRef.once('value', function(snapshot) {
        const obj = snapshot.val();
        if (obj) {
            Object.keys(obj).forEach((key) => {
                const timer = obj[key];
                console.log(`Timer data for ${key}:`, timer); // Log the timer data

                // Extract only HH:MM part of the time
                const timeParts = timer.time ? timer.time.split(':') : []; // Split the time into hours, minutes, and seconds
                if (timeParts.length >= 2) {
                    const scheduledHour = parseInt(timeParts[0], 10); // Get the hour
                    const scheduledMinute = parseInt(timeParts[1], 10); // Get the minute

                   
                    // Check if current time matches the scheduled time
                    if (currentTime.getHours() === scheduledHour && currentTime.getMinutes() === scheduledMinute) {
                        
                        
                        // Check if feed has already been triggered for this timer
                        const feedTriggeredRef = firebase.database().ref('timers/' + key + '/feedTriggered');
                        feedTriggeredRef.once('value', function(snapshot) {
                            if (!snapshot.val()) {
                                // Trigger feednow if not already triggered
                                feednow(); 
                                // Set feedTriggered to true after triggering feed
                                firebase.database().ref('timers/' + key).update({
                                    feedTriggered: true
                                }).then(() => {
                                    console.log(`Feed triggered for ${key}`);
                                }).catch((error) => {
                                    console.error("Error updating feedTriggered:", error);
                                });
                            } else {
                                console.log("Feed already triggered for this timer.");
                            }
                        }).catch((error) => {
                            console.error("Error checking feedTriggered:", error);
                        });
                    } else {
                        console.log("Not the scheduled time yet.");
                    }
                } else {
                    console.error("Invalid time format in Firebase for timer:", key);
                    console.error("Expected HH:MM format but found:", timer.time);
                }
            });
        }
    }).catch((error) => {
        console.error("Error loading timers:", error);
    });
}


