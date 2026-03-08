import serial
import time

# --- SETUP ---
# Replace this with your actual Mac port name from Step 2
MAC_PORT = '/dev/cu.usbserial-110' 
BAUD_RATE = 115200

print(f"Connecting to Arduino on {MAC_PORT}...")

try:
    # Open the serial connection
    arduino = serial.Serial(MAC_PORT, BAUD_RATE, timeout=1)
    
    # When you open a serial connection, the Arduino automatically restarts.
    # We MUST wait 2 seconds for it to wake up before sending data.
    time.sleep(2)
    print("Connected! Running light test...")

    # --- THE TEST ---
    # Let's play a quick C Major Chord Arpeggio (Notes 60, 64, 67)
    test_notes = [60, 64, 67]

    for note in test_notes:
        print(f"Turning ON note {note}")
        # Send "Note,1\n" (encoded as bytes)
        arduino.write(f"{note},1\n".encode())
        time.sleep(0.5) # Wait half a second

    print("Holding chord for 2 seconds...")
    time.sleep(2)

    for note in test_notes:
        print(f"Turning OFF note {note}")
        # Send "Note,0\n" 
        arduino.write(f"{note},0\n".encode())
        time.sleep(0.01) # Wait half a second
    
    # --- ADD THIS LINE ---
    time.sleep(0.5) # Give the Arduino time to hear the final command
    
    print("Test complete!")
    
except Exception as e:
    print(f"Error: {e}")
    print("Make sure the Arduino is plugged in and the Arduino IDE Serial Monitor is CLOSED.")
finally:
    if 'arduino' in locals() and arduino.is_open:
        arduino.close()