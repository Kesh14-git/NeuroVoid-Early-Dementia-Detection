"""
Comprehensive test to verify the API fix for webm/mp4 audio files
"""
import requests
import time
import sys
import os
from pathlib import Path

# Base URL
BASE_URL = "http://localhost:5000"

def create_test_wav():
    """Create a minimal valid WAV file"""
    import wave
    import struct
    import math
    
    test_file = "test_audio.wav"
    sample_rate = 16000
    duration = 2
    frequency = 440
    
    with wave.open(test_file, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for i in range(sample_rate * duration):
            sample = int(32767.0 * math.sin(2 * math.pi * frequency * i / sample_rate))
            wav_file.writeframes(struct.pack('<h', sample))
    
    return test_file

def create_test_webm():
    """Create a minimal valid WebM audio file"""
    import struct
    
    test_file = "test_audio.webm"
    
    # WebM EBML header structure (minimal valid file)
    ebml_header = bytes.fromhex(
        '1a45dfa3'  # EBML element ID
        '83'        # Element size (3 bytes)
        '010142f7'  # EBML version
    )
    
    # Create a minimal WebM file with proper structure
    with open(test_file, 'wb') as f:
        # EBML header
        f.write(bytes([0x1a, 0x45, 0xdf, 0xa3]))  # EBML element
        f.write(bytes([0x83]))  # Size
        f.write(bytes([0x01, 0x01, 0x42, 0xf7]))
        
        # Add dummy audio data to make file large enough
        dummy_data = b'\x00' * 10000
        f.write(dummy_data)
    
    return test_file

def test_file(filename, file_type):
    """Test uploading a specific file"""
    try:
        print(f"\nTesting {file_type} file: {filename}")
        
        # Check file size
        file_size = os.path.getsize(filename)
        print(f"  File size: {file_size} bytes")
        
        with open(filename, 'rb') as f:
            files = {'audio_file': f}
            response = requests.post(f"{BASE_URL}/api/predict", files=files, timeout=30)
            print(f"  Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✓ SUCCESS - Prediction: {data['prediction']}")
                print(f"             Confidence: {data['confidence']}")
                return True
            else:
                error_data = response.json()
                print(f"  ✗ FAILED - Error: {error_data.get('error', 'Unknown error')}")
                return False
        
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        return False
    finally:
        if os.path.exists(filename):
            os.remove(filename)
            print(f"  Cleaned up: {filename}")

if __name__ == "__main__":
    print("=" * 70)
    print("Comprehensive API Test - Audio Format Support")
    print("=" * 70)
    
    # Wait for server
    print("\nWaiting for server to start... (3 seconds)")
    time.sleep(3)
    
    results = {}
    
    # Test WAV file (uploaded)
    print("\n" + "=" * 70)
    print("Testing Uploaded Files (WAV)")
    print("=" * 70)
    wav_file = create_test_wav()
    results['WAV Upload'] = test_file(wav_file, "WAV")
    
    # Test WebM file (recorded)
    print("\n" + "=" * 70)
    print("Testing Recorded Files (WebM)")
    print("=" * 70)
    webm_file = create_test_webm()
    results['WebM Upload'] = test_file(webm_file, "WebM")
    
    # Summary
    print("\n" + "=" * 70)
    print("Summary")
    print("=" * 70)
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    print(f"\n{'✓ ALL TESTS PASSED!' if all_passed else '✗ SOME TESTS FAILED'}")
    print("=" * 70)

