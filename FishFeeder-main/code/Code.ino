#include <FirebaseESP32.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <Servo.h>

Servo servo;

#define FIREBASE_HOST "<https://fish-feeder-e45b9-default-rtdb.firebaseio.com/>"
#define FIREBASE_AUTH "<5PiPmwkAbvkZRBbeHN23lk71mR2q3BvRYiNmHOjv>"
#define WIFI_SSID "<le_loo>"
#define WIFI_PASSWORD "<72597259>"

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800);

FirebaseData timer, feed;
String stimer;
String Str[] = {"00:00", "00:00", "00:00"};
int i, feednow = 0;

void setup() {
  Serial.begin(115200); // ESP32 standard baud rate
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected: ");
  Serial.println(WiFi.localIP());

  timeClient.begin();
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  servo.attach(17); // Attach the servo to GPIO17
}

void loop() {
  Firebase.getInt(feed, "feednow");
  feednow = feed.to<int>();
  Serial.println(feednow);
  if (feednow == 1) { // Direct Feeding
    servo.writeMicroseconds(1000); // Rotate clockwise
    delay(700); // Adjust delay as needed
    servo.writeMicroseconds(1500); // Stop rotation
    feednow = 0;
    Firebase.setInt(feed, "/feednow", feednow);
    Serial.println("Fed");
  } else { // Scheduled feeding
    for (i = 0; i < 3; i++) {
      String path = "timers/timer" + String(i);
      Firebase.getString(timer, path);
      stimer = timer.to<String>();
      Str[i] = stimer.substring(9, 14);
    }
    timeClient.update();
    String currentTime = String(timeClient.getHours()) + ":" + String(timeClient.getMinutes());
    if (Str[0] == currentTime || Str[1] == currentTime || Str[2] == currentTime) {
      servo.writeMicroseconds(1000); // Rotate clockwise
      delay(700); // Adjust delay as needed
      servo.writeMicroseconds(1500); // Stop rotation
      Serial.println("Success");
      delay(60000);
    }
  }
  Str[0] = "00:00";
  Str[1] = "00:00";
  Str[2] = "00:00";
}
