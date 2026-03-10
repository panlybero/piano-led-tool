#include <Adafruit_NeoPixel.h>

#define LED_PIN    6       
#define LED_COUNT  144     

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// We now only need 21 bytes of memory!
uint8_t buffer[21];

void setup() {
  Serial.begin(115200);   
  Serial.setTimeout(50);   
  strip.begin();             
  strip.clear();             
  strip.show();              
}

void loop() {
  if (Serial.available() > 0) {
    
    // Look for our Start Marker (255)
    if (Serial.read() == 255) {
      
      // Read exactly 21 compressed bytes
      int bytesRead = Serial.readBytes(buffer, 21);

      if (bytesRead == 21) {
        // Decompress the bits and update the lights
        for (int i = 0; i < LED_COUNT; i++) {
          int byteIndex = i / 7;
          int bitIndex = i % 7;
          
          // Read the specific bit for this exact LED
          bool isOn = (buffer[byteIndex] & (1 << bitIndex)) != 0;
          
          if (isOn) {
            strip.setPixelColor(i, strip.Color(50, 0, 0)); // Blue
          } else {
            strip.setPixelColor(i, strip.Color(0, 0, 0));   // Off
          }
        }
        // Update the physical lights
        strip.show(); 
      }
    }
  }
}